/* eslint-disable jsx-a11y/no-static-element-interactions */
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
      <div className={"transition-all hover:w-4 hover:h-4 hover:opacity-100 rounded-lg border-2 cursor-pointer"
         + ((editIndex?.[1] === index) && (editIndex?.[0] === dataset_index)
            ? ' bg-white border-msfs'
            + ' w-4 h-4 opacity-100'
            : (interpolated ? ' border-slate-700 hover:border-white bg-slate-800 opacity-80' : ' border-white bg-msfs opacity-60')
            + ' w-3 h-3'
         )
      }
         onPointerEnter={() => {
            const bounds = parentRef.current!.getBoundingClientRect();
            setPointCount(count => ++count)
            setSelector({ dataset: dataset_index, pos: [pos[0] * bounds.width * 0.01, (1 - pos[1] * 0.01) * bounds.height] })
         }}

         onPointerLeave={() => setPointCount(count => Math.max(0, --count))}
         onPointerDownCapture={(e) => {
            const now = new Date()

            if ((now.getTime() - lastDown.getTime() < 200) || ((e.button === 1) || e.button === 2)) {
               setPointCount(count => Math.max(0, --count))
               removePoint(dataset_index, index)
            } else {
               setLastDown(now)
               editPoint(dataset_index, index)
            }
         }}
      >
      </div>
   </div>
}