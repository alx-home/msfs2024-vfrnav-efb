
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

export const Line = ({ dataset_index, setSelector, coords, bounds, parentRef, setSelectorCount, setPointCount, addPoint, editPoint, removePoint, editIndex, index }: {
   dataset_index: number,
   setSelector: (_value: { dataset: number, pos: [number, number] }) => void,
   setSelectorCount: Dispatch<SetStateAction<number>>
   setPointCount: Dispatch<SetStateAction<number>>
   coords: [[number, number, boolean], [number, number, boolean]],
   bounds: [[number, number], [number, number]],
   index: number,
   parentRef: RefObject<HTMLDivElement | null>,
   addPoint: (_dataset_index: number, _index: number) => void,
   removePoint: (_dataset_index: number, _index: number) => void,
   editPoint: (_dataset_index: number, _index: number) => void,
   editIndex: [number, number] | undefined
}) => {
   const svgRef = useRef<SVGSVGElement>(null);

   const span = useMemo(() => ([bounds[0][1] - bounds[0][0], bounds[1][1] - bounds[1][0]]), [bounds])

   const [width, height] = useMemo(() => ([
      (coords[1][0] - coords[0][0]) * 100 / span[0],
      (coords[1][1] - coords[0][1]) * 100 / span[1]
   ]), [coords, span])

   const [bottom, left] = useMemo(() => ([
      ((height > 0 ? coords[0][1] : coords[1][1]) - bounds[1][0]) * 100 / span[1],
      (coords[0][0] - bounds[0][0]) * 100 / span[0]
   ]), [bounds, height, coords, span])


   const vertical = useMemo(() => coords[0][0] === coords[1][0], [coords])
   const horizontal = useMemo(() => height === 0, [height])
   const getOffsetFromPixel = useCallback((coords: [number, number]) => {
      const svg = svgRef.current!.getBoundingClientRect();

      const vec = [coords[0] - svg.left, coords[1] - (height > 0 ? svg.bottom : svg.top)]
      const nrm = Math.sqrt(Math.pow(svg.width, 2) + Math.pow(svg.height, 2))

      return Math.max(0, Math.min(1, (vec[0] * svg.width + (Math.abs(vec[1] * svg.height))) / Math.pow(nrm, 2)))
   }, [height])


   return <>
      <Point pos={[left, bottom - (height > 0 ? 0 : height)]} dataset_index={dataset_index} interpolated={coords[0][2]}
         editIndex={editIndex} editPoint={editPoint} removePoint={removePoint} index={index} setPointCount={setPointCount}
         parentRef={parentRef} setSelector={setSelector} />
      <Point pos={[left + width, bottom + (height > 0 ? height : 0)]} dataset_index={dataset_index} interpolated={coords[1][2]}
         editIndex={editIndex} editPoint={editPoint} removePoint={removePoint} index={index + 1} setPointCount={setPointCount}
         parentRef={parentRef} setSelector={setSelector} />
      <svg className="absolute bottom-0 pointer-events-none"
         ref={svgRef}
         xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 100 100"
         preserveAspectRatio="none"
         overflow="visible"
         width={(vertical ? '1rem' : Math.abs(width) + '%')}
         height={(horizontal ? '1rem' : Math.abs(height) + '%')}
         style={{
            bottom: bottom + '%',
            left: left + '%'
         }}
      >
         <line x1="0" y1={horizontal ? "100" : height > 0 ? "100" : "0"} x2={vertical ? "0" : "100"} y2={horizontal ? "100" : height > 0 ? "0" : "100"}
            stroke="var(--border-msfs)"
            strokeWidth="4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke" />
         <line x1="0" y1={horizontal ? "100" : height > 0 ? "100" : "0"} x2={vertical ? "0" : "100"} y2={horizontal ? "100" : height > 0 ? "0" : "100"}
            stroke="transparent"
            strokeWidth="20"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="cursor-pointer pointer-events-auto"
            onPointerMove={e => {
               const bounds = parentRef.current!.getBoundingClientRect();
               const svg = svgRef.current!.getBoundingClientRect();

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
               setSelectorCount(count => --count)
            }}
            onPointerEnter={() => {
               setSelectorCount(count => ++count)
            }}
            onPointerDown={() => {
               addPoint(dataset_index, index + 1)
            }}
         />
      </svg>
   </>
}