
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

const LegendComp = ({ showLegend, datasetLegend, datasetStr, hoverValue, bounds, span,
   hoverPos, pointCount, editIndex, selectorDataset, selectorCount,
   xLegend, xValuesStr, xUnit, yLegend, yValuesStr, yUnit, datasetUnit }: {
      showLegend?: boolean,
      xValuesStr?: (_value: number) => string,
      yValuesStr?: (_value: number) => string,
      datasetStr?: (_value: number) => string,
      datasetLegend?: string,
      xLegend?: string,
      yLegend?: string,
      xUnit?: string | ((_value: number) => string),
      yUnit?: string | ((_value: number) => string),
      datasetUnit?: string | ((_value: number) => string),
      bounds: [[number, number], [number, number]],
      span: [number, number],
      hoverPos: [number, number],
      hoverValue: [number, number],
      pointCount: number,
      editIndex: [number, number] | undefined,
      selectorDataset: number,
      selectorCount: number,
   }) => {
   return <div className={"absolute pointer-events-none z-30 min-w-0"
      + (hoverValue[0] > bounds[0][0] + span[0] * 0.5 ? '' : " min-w-full")
   }
      style={{
         top: hoverPos[1],
         paddingLeft: hoverPos[0],
      }}
   >
      <div className={'absolute flex flex-col bg-slate-800 m-1 py-2 px-4 border-white border-2 transition-all'
         + (hoverValue[0] > bounds[0][0] + span[0] * 0.5
            ? ' right-2'
            : ' ml-2'
         ) + (hoverValue[1] > bounds[1][0] + span[1] * 0.5
            ? ' mt-2'
            : ' -translate-y-full -mt-2'
         )
         + ((selectorCount || pointCount || (editIndex !== undefined)) ? '' : ' opacity-0 scale-0')}>
         {
            (showLegend ?? false) ?
               <div className='flex'>
                  <div className="justify-start mr-4">
                     {(datasetLegend ?? 'data')}
                  </div>
                  <div className="flex justify-end grow">
                     {
                        (datasetStr?.(selectorDataset) ?? selectorDataset)
                        + (datasetUnit
                           ? ' ' + (typeof datasetUnit === 'function'
                              ? datasetUnit(selectorDataset)
                              : datasetUnit)
                           : '')
                     }
                  </div>
               </div>
               : <></>
         }
         <div className='flex'>
            <div className="justify-start mr-2">
               {(xLegend ?? 'x')}
            </div>
            <div className="flex justify-end grow">
               {
                  (xValuesStr?.(hoverValue[0]) ?? hoverValue[0].toFixed(0))
                  + (xUnit
                     ? ' ' + (typeof xUnit === 'function'
                        ? xUnit(hoverValue[0])
                        : xUnit)
                     : '')
               }
            </div>
         </div>
         <div className='flex'>
            <div className="justify-start mr-2">
               {(yLegend ?? 'y')}
            </div>
            <div className="flex justify-end grow">
               {
                  (yValuesStr?.(hoverValue[1]) ?? hoverValue[1].toFixed(0))
                  + (yUnit
                     ? ' ' + (typeof yUnit === 'function'
                        ? yUnit(hoverValue[1])
                        : yUnit)
                     : '')
               }
            </div>
         </div>
      </div>
   </div>
}

export const Legend = memo(LegendComp)
