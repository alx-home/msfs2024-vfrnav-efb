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

import { Dispatch, RefObject, SetStateAction, useState } from "react"

export const Point = ({ pos, index, editIndex, editPoint, removePoint, interpolated, dataset_index, setPointCount, setSelector, parentRef }: {
   dataset_index: number
   pos: [number, number],
   index: number,
   editIndex: [number, number] | undefined,
   editPoint: (_dataset_index: number, _index: number) => void,
   removePoint: (_dataset_index: number, _index: number) => void,
   setPointCount: Dispatch<SetStateAction<number>>
   interpolated: boolean
   setSelector: (_value: { dataset: number, pos: [number, number] }) => void,
   parentRef: RefObject<HTMLDivElement | null>,
}) => {
   const [lastDown, setLastDown] = useState(new Date())

   return <div className="absolute -translate-x-1/2 translate-y-1/2 z-10"
      style={{
         bottom: pos[1] + '%',
         left: pos[0] + '%'
      }}
   >
      <div className="group flex w-5 h-5 rounded-xl cursor-pointer"
         onPointerEnter={() => {
            const bounds = parentRef.current!.getBoundingClientRect();
            setPointCount(1)
            setSelector({ dataset: dataset_index, pos: [pos[0] * bounds.width * 0.01, (1 - pos[1] * 0.01) * bounds.height] })
         }}

         onPointerLeave={() => setPointCount(0)}
         onPointerDownCapture={(e) => {
            const now = new Date()

            if ((now.getTime() - lastDown.getTime() < 300) || ((e.button === 1) || e.button === 2)) {
               setPointCount(0)
               removePoint(dataset_index, index)
            } else {
               setLastDown(now)
               editPoint(dataset_index, index)
            }
         }}
      >
         <div className={"group-hover:opacity-100 transition-all border-2 rounded-xl m-auto w-3 h-3 group-hover:w-4 group-hover:h-4"
            + ((editIndex?.[1] === index) && (editIndex?.[0] === dataset_index)
               ? ' bg-white border-msfs opacity-100'
               : (interpolated
                  ? ' border-slate-700 group-hover:border-white bg-slate-800 opacity-80'
                  : ' border-white bg-msfs opacity-60'
               )
            )} />
      </div>
   </div>
}