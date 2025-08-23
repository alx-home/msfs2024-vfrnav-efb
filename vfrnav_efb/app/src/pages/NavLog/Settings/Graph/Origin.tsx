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

import { memo } from "react"

const OriginComp = ({ bounds, xValuesStr, yValuesStr }: {
   bounds: [[number, number], [number, number]],
   xValuesStr?: (_value: number) => string,
   yValuesStr?: (_value: number) => string,
}) => {
   return <div className="grid w-3">
      <div className={
         (bounds[0][0] === 0 ? " border-r-2 border-r-white" : " border-r-[1px] border-r-slate-600")
         + (bounds[1][0] === 0 ? " border-t-2 border-t-white" : " border-t-[1px] border-t-slate-600")
      }></div>
      <div className={"absolute flex w-9 justify-end -translate-y-2 -translate-x-full origin-top-right rotate-45"}>
         <div className="flex">
            {yValuesStr?.(bounds[1][0]) ?? bounds[1][0]}
         </div>
      </div>
      <div className={"absolute flex w-3 justify-end"}>
         <div className="flex w-full">
            <div className={"absolute h-10 w-full translate-x-2"}>
               <div className="flex translate-y-2 translate-x-full origin-top-left rotate-45">
                  {xValuesStr?.(bounds[0][0]) ?? bounds[0][0]}
               </div>
            </div>
         </div>
      </div>
   </div>
}

export const Origin = memo(OriginComp)