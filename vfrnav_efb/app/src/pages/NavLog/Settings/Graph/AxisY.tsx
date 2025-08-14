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

export const AxisY = ({ yValues, yValuesStr, bounds, lastRatio }: {
   yValues: number[],
   yValuesStr?: (_value: number) => string,
   bounds: [[number, number], [number, number]],
   lastRatio: [number, number]
}) => {
   return <div className="flex flex-col h-full">
      <div className='flex flex-col h-full'>
         {yValues.toSpliced(yValues.length - 1).map((rowValue, row) =>
            <div key={"yAxis-" + rowValue}
               className={'w-3 grow'
                  + (rowValue === 0 ? " border-t-2 border-t-white" : " border-t-[1px] border-t-slate-600")
                  + (bounds[0][0] === 0 ? " border-r-2 border-r-white" : " border-r-[1px] border-r-slate-600")
               }
               style={
                  (row === 0)
                     ? { flexGrow: lastRatio[1] }
                     : {}
               }>
               <div className={"absolute flex w-9 justify-end -translate-y-2 -translate-x-full origin-top-right rotate-45"}>
                  <div className="flex">
                     {yValuesStr?.(rowValue) ?? rowValue}
                  </div>
               </div>
            </div>
         )}
      </div>
   </div>
}
