
/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If
 * not, see <https://www.gnu.org/licenses/>.
 */

import { Dispatch, RefObject, SetStateAction, useCallback, useMemo, useRef } from "react";
import { Point } from "./Point";

export const Line = ({
   dataset_index, setSelector, from, to, bounds, parentRef, setSelectorCount, setPointCount,
   addPoint, editPoint, removePoint, editIndex, index, graphWidth, graphHeight
}: {
   dataset_index: number,
   setSelector: (_value: { dataset: number, pos: [number, number] }) => void,
   setSelectorCount: Dispatch<SetStateAction<number>>
   setPointCount: Dispatch<SetStateAction<number>>
   from: [number, number, boolean],
   to: [number, number, boolean],
   bounds: [[number, number], [number, number]],
   index: number,
   parentRef: RefObject<HTMLDivElement | null>,
   addPoint: (_dataset_index: number, _index: number) => void,
   removePoint: (_dataset_index: number, _index: number) => void,
   editPoint: (_dataset_index: number, _index: number) => void,
   editIndex: [number, number] | undefined,
   graphWidth: number,
   graphHeight: number
}) => {
   const divRef = useRef<HTMLDivElement>(null);

   const span = useMemo(() => ([bounds[0][1] - bounds[0][0], bounds[1][1] - bounds[1][0]]), [bounds])
   const graphRatio = useMemo(() => graphHeight / graphWidth, [graphHeight, graphWidth])

   const [width, height] = useMemo(() => ([
      (to[0] - from[0]) * 100 / span[0],
      (to[1] - from[1]) * 100 / span[1]
   ]), [from, span, to])
   const vertical = useMemo(() => from[0] === to[0], [from, to])
   const horizontal = useMemo(() => Math.abs(height) < 1e-2, [height])
   const angle = useMemo(() => Math.atan(height * graphRatio / width), [graphRatio, height, width]);
   const wdiag = useMemo(() => Math.sqrt(Math.pow(width, 2) + Math.pow(height * graphRatio, 2)), [graphRatio, height, width]);
   const hdiag = useMemo(() => Math.sqrt(Math.pow(width / graphRatio, 2) + Math.pow(height, 2)), [graphRatio, height, width]);

   const [bottom, left] = useMemo(() => ([
      ((height > 0 ? from[1] : to[1]) - bounds[1][0]) * 100 / span[1],
      (from[0] - bounds[0][0]) * 100 / span[0]
   ]), [height, from, to, bounds, span])

   const getOffsetFromPixel = useCallback((coords: [number, number]) => {
      const svg = divRef.current!.getBoundingClientRect();

      const vec = [coords[0] - svg.left, coords[1] - (height > 0 ? svg.bottom : svg.top)]
      const nrm = Math.sqrt(Math.pow(svg.width, 2) + Math.pow(svg.height, 2))

      return Math.max(0, Math.min(1, (vec[0] * svg.width + (Math.abs(vec[1] * svg.height))) / Math.pow(nrm, 2)))
   }, [height])

   return <>
      <Point pos={[left, bottom - (height > 0 ? 0 : height)]} dataset_index={dataset_index} interpolated={from[2]}
         editIndex={editIndex} editPoint={editPoint} removePoint={removePoint} index={index} setPointCount={setPointCount}
         parentRef={parentRef} setSelector={setSelector} />
      <Point pos={[left + width, bottom + (height > 0 ? height : 0)]} dataset_index={dataset_index} interpolated={to[2]}
         editIndex={editIndex} editPoint={editPoint} removePoint={removePoint} index={index + 1} setPointCount={setPointCount}
         parentRef={parentRef} setSelector={setSelector} />
      <div className="absolute flex pointer-events-none overflow-visible"
         ref={divRef}
         style={{
            left: left + '%',
            bottom: bottom + '%',
            width: Math.abs(width) + '%',
            height: Math.abs(height) + '%'
         }} >
         <div className='absolute h-4 w-4'
            style={{
               ...(height > 0 ? { bottom: '0' } : {}),
               ...(Math.abs(width) > Math.abs(height)
                  ? {
                     width: Math.abs(wdiag * 100 / width) + '%',
                     transformOrigin: 'left',
                     transform: `translate(0, ${height > 0 ? '' : '-'}50%) rotate(${-angle}rad)`
                  }
                  : {
                     height: Math.abs(hdiag * 100 / height) + '%',
                     transformOrigin: height > 0 ? 'bottom' : 'top',
                     transform: `translate(-50%, 0) rotate(${((height > 0 ? Math.PI : -Math.PI) * 0.5) - angle}rad)`
                  })
            }}>
            <div className={"absolute flex rounded-lg w-full h-full cursor-pointer pointer-events-auto"
               + (Math.abs(width) > Math.abs(height) ? ' -ml-[0.5rem] w-[calc(100%+1rem)]' : ' -mt-[0.5rem] h-[calc(100%+1rem)]')
            }
               onPointerMove={e => {
                  const bounds = parentRef.current!.getBoundingClientRect();
                  const svg = divRef.current!.getBoundingClientRect();

                  const t = getOffsetFromPixel([e.clientX, e.clientY])

                  const coords = [
                     vertical
                        ? svg.left
                        : svg.left + t * svg.width,
                     horizontal
                        ? svg.bottom
                        : height > 0
                           ? svg.bottom - t * svg.height
                           : svg.top + t * svg.height
                  ]

                  setSelector({ dataset: dataset_index, pos: [coords[0] - bounds.left, coords[1] - bounds.top] })
               }}
               onPointerLeave={() => {
                  setSelectorCount(0)
               }}
               onPointerEnter={() => {
                  setSelectorCount(1)
               }}
               onPointerDown={() => {
                  addPoint(dataset_index, index + 1)
               }}
            />
            <div className="relative flex w-full h-full">
               <div className={"flex rounded-lg bg-msfs m-auto"
                  + (Math.abs(width) > Math.abs(height)
                     ? ' w-full h-1' : ' h-full w-1')
               } />
            </div>
         </div>
      </div>
   </>
}