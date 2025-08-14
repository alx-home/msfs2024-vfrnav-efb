import { useMemo } from 'react';
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

export const AxisX = ({ xValues, xValuesStr, bounds, lastRatio, graphWidth }: {
   xValues: number[],
   graphWidth: number,
   xValuesStr?: (_value: number) => string,
   bounds: [[number, number], [number, number]],
   lastRatio: [number, number]
}) => {
   const elems = useMemo(() => xValues.toSpliced(0, 1).map((colValue, col) =>
      <div key={"xAxis-" + col} className={
         'grow'
         + (bounds[1][0] === 0 ? " border-t-2 border-t-white" : " border-t-[1px] border-t-slate-600")
         + (colValue === 0 ? " border-r-2 border-r-white" : " border-r-[1px] border-r-slate-600")
      }
         style={
            (col === xValues.length - 2)
               ? { flexGrow: lastRatio[0] }
               : {}
         }
      >
         <div className='translate-x-2 w-full'>
            <div className="flex translate-x-full translate-y-2 origin-top-left rotate-45 w-full h-3">
               <div className={"absolute w-full h-full"}>
                  <div className="flex">
                     {xValuesStr?.(colValue) ?? colValue}
                  </div>
               </div>
            </div>
         </div>
      </div>
   ), [bounds, lastRatio, xValues, xValuesStr])

   return <div className="flex flex-row w-full h-3"
      style={{
         maxWidth: graphWidth,
      }}>
      {elems}
   </div>
}