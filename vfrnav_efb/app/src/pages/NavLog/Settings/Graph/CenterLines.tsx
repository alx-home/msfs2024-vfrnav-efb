
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

export const CenterLines = ({ bounds, xValues, yValues, span }: {
   xValues: number[],
   yValues: number[],
   bounds: [[number, number], [number, number]],
   span: [number, number]
}) => {
   return <>{
      ((bounds[0][0] < 0) && (xValues.find(value => value === 0) === undefined))
         ? <div className='absolute h-full w-0 border-r-2 bg-white'
            style={{
               left: (-bounds[0][0] * 100 / span[0]) + '%'
            }}
         />
         : <></>
   }
      {
         ((bounds[1][0] < 0) && (yValues.find(value => value === 0) === undefined))
            ? <div className='absolute w-full h-0 border-t-2 bg-white'
               style={{
                  bottom: (-bounds[1][0] * 100 / span[1]) + '%'
               }}
            />
            : <></>
      }
   </>
}