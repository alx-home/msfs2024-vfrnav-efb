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

export const Grid = ({ xValues, yValues, lastRatio }: {
   xValues: number[],
   yValues: number[],
   lastRatio: [number, number]
}) => {
   return yValues.toSpliced(yValues.length - 1).map((rowValue, row) =>
      <div key={'row-' + row} className='flex flex-row w-full grow'
         style={
            (row === 0)
               ? { flexGrow: lastRatio[1] }
               : {}
         }>
         {
            xValues.toSpliced(0, 1).map((colValue, col) =>
               <div key={"content-" + col + '-' + row} className={
                  "flex flex-col grow"
                  + ((rowValue === 0)
                     ? " [border-top-style:solid] border-t-2 border-t-white"
                     : ((row === 0)
                        ? " [border-top-style:solid]"
                        : " [border-top-style:dashed]")
                     + " border-t-[1px] border-t-slate-600")
                  + (colValue === 0
                     ? " border-r-2 border-r-white"
                     : ((col === xValues.length - 2)
                        ? " [border-right-style:solid]"
                        : " [border-right-style:dashed]")
                     + " border-r-[1px] border-r-slate-600")
               }
                  style={
                     (col === xValues.length - 2)
                        ? { flexGrow: lastRatio[0] }
                        : {}
                  }
               >
               </div>
            )
         }
      </div>
   )
}