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

import { Input, Select, SelectOption } from "@alx-home/Utils";
import { FuelUnit, MapContext } from "@pages/Map/MapContext";
import { Point } from "@polyfills/drag-events";
import { Chart, ChartOptions } from "chart.js";
import { getRelativePosition } from "chart.js/helpers";
import { ChartJSOrUndefined } from "node_modules/react-chartjs-2/dist/types";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";

export const Settings = () => {
   const { deviations, setDeviations, fuelConsumption, setFuelConsumption, fuelUnit, setFuelUnit } = useContext(MapContext)!;
   const fuelUnitStr = useMemo(() => fuelUnit === 'gal' ? 'gal' : 'l', [fuelUnit])
   const toUnit = useCallback((value: number) =>
      fuelUnit === 'gal' ? value : value / 3.785411784
      , [fuelUnit])
   const fromUnit = useCallback((value: number) =>
      fuelUnit === 'gal' ? value : value * 3.785411784
      , [fuelUnit])

   const fuelConsumptionStr = useMemo(() => toUnit(fuelConsumption).toString(), [fuelConsumption, toUnit])

   const [reload, setReload] = useState(false);

   useEffect(() => {
      setReload(true)
   }, [fuelUnit])

   useEffect(() => {
      if (reload) {
         setReload(false)
      }
   }, [reload])

   const chartRef = useRef<ChartJSOrUndefined<"line", Point[], unknown>>(undefined);


   const { minX, maxX, minY, maxY, hitRadius, hoverRadius } = useMemo(() => ({
      minX: 0,
      maxX: 360,
      minY: -10,
      maxY: 10,
      hitRadius: 4,
      hoverRadius: 10,
   }), [])


   const options = useMemo<ChartOptions<"line">>(() => ({
      responsive: true,
      maintainAspectRatio: false,
      onHover: (event, chartElement) => {
         (event.native!.target as HTMLCanvasElement).style.cursor = chartElement[0] ? 'pointer' : 'default';
      },
      elements: {
         point: {
            radius: 4,
            hoverRadius: hoverRadius,
            hoverBackgroundColor: 'white',
            hitRadius: hitRadius
         },
      },
      scales: {
         x: {
            type: 'linear',
            dragData: true,
            ticks: {
               color: 'white',
               display: true,
            },
            border: {
               dash: (context) => {
                  if (context.tick.value === 0) {
                     return []
                  } else {
                     return [5, 8]
                  }
               },
            },
            grid: {
               drawTicks: true,
               color: (context) => {
                  if (context.tick.value === 0) {
                     return 'white'
                  } else {
                     return 'rgba(255,255,255,0.5)'
                  }
               },
               lineWidth: (context) => {
                  if (context.tick.value === 0) {
                     return 2
                  } else {
                     return 1
                  }
               },
            },
            min: minX,
            max: maxX
         },
         y: {
            ticks: {
               color: 'white',
               display: true,
            },
            border: {
               dash: (context) => {
                  if (context.tick.value === 0) {
                     return []
                  } else {
                     return [5, 8]
                  }
               },
            },
            grid: {
               color: (context) => {
                  if (context.tick.value === 0) {
                     return 'white'
                  } else {
                     return 'rgba(255,255,255,0.5)'
                  }
               },
               lineWidth: (context) => {
                  if (context.tick.value === 0) {
                     return 2
                  } else {
                     return 1
                  }
               },
            },
            min: minY,
            max: maxY
         }
      },
      plugins: {
         corsair: {
            color: 'black'
         },
         tooltip: {
            enabled: true,
            mode: "point",
            callbacks: {
               title: () => {
                  return '';
               },
               label: (context) => {
                  return Math.round(context.parsed.x) + ' -> ' + Math.round(context.parsed.y);
               }
            }
         },
         legend: {
            display: false
         },
         title: {
            display: true,
            text: 'Compass Deviation',
            color: 'white',
            padding: {
               bottom: 20
            },
            font: {
               size: 20
            }
         },
         dragData: {
            onDrag(_event, _di, index, value) {
               if (index === 0) {
                  (value as Point).x = 0
               } else if (index === deviations.length - 1) {
                  (value as Point).x = 360
               }
            },

            onDragEnd() {
               setDeviations([...deviations])
            },
         }
      },
   }), [deviations, hitRadius, hoverRadius, maxX, maxY, minX, minY, setDeviations]);

   const data = useMemo(() => ({
      datasets: [
         {
            data: deviations,
            borderColor: 'rgb(0, 174, 255)',
            backgroundColor: 'transparent',
         },
      ],
   }), [deviations]);

   useEffect(() => {
      if (chartRef.current) {
         const chart = chartRef.current;

         const onClick = (event: MouseEvent) => {
            if (!chart) return;


            const canvasPosition = getRelativePosition(event, chart as Chart);

            const x = chart.scales.x.getValueForPixel(canvasPosition.x)!;
            const y = chart.scales.y.getValueForPixel(canvasPosition.y)!;

            if (x < 0 || x > 360 || y < -10 || y > 10) {
               return;
            }

            setDeviations(prev => {
               let index = 0;

               if (prev.find((elem, current_index) => {
                  const dist = Math.pow(chart.scales.x.getPixelForValue(elem.x) - canvasPosition.x, 2) + Math.pow(chart.scales.y.getPixelForValue(elem.y) - canvasPosition.y, 2)

                  if (dist <= Math.pow(2 * hitRadius, 2)) {
                     if (current_index === 0 || current_index === prev.length - 1) {
                        return false;
                     } else {
                        index = current_index
                        return true;
                     }
                  }
               })) {
                  return prev.toSpliced(index, 1)
               }

               let minDist = chart.canvas.width;
               let offset = 0;

               prev.forEach((elem, current_index) => {
                  if (current_index === prev.length - 1) {
                     return;
                  }

                  const dist = canvasPosition.x - chart.scales.x.getPixelForValue(elem.x)
                  const adist = Math.abs(dist)

                  if (adist < minDist) {
                     minDist = adist
                     index = current_index;
                     offset = dist < 0 ? 0 : 1
                  }
               })

               return prev.toSpliced(index + offset, 0, { x: x, y: y })
            });
         };

         chart.canvas.addEventListener('dblclick', onClick);

         return () => chart.canvas.removeEventListener('dblclick', onClick);
      }
   }, [chartRef, hitRadius, hoverRadius, setDeviations])

   return <div className="flex flex-col grow h-full">
      <div className="flex w-full grow justify-center overflow-hidden min-h-0">
         <Line ref={chartRef} options={options} data={data} />
      </div>
      <div className="flex flex-col shrink text-xl justify-center m-auto pt-10 mb-8">
         <div className="flex flex-row text-xl justify-center">
            <div className="flex mr-4 m-auto grow">Unit : </div>
            <div className="flex flex-row w-36">
               <Select active={true} value={fuelUnit} onChange={(value) => {
                  setFuelUnit(value)
               }}>
                  <SelectOption<FuelUnit> id={'gal'}>Galon</SelectOption>
                  <SelectOption<FuelUnit> id={'liter'}>Liter</SelectOption>
               </Select>
            </div>
            <div className="flex ml-4 m-auto w-12 shrink"></div>
         </div>
         <div className="flex flex-row text-xl justify-center">
            <div className="flex mr-4 m-auto grow">Fuel Consumption : </div>
            <div className="flex flex-row [&_.invalid]:text-red-500 w-36">
               <Input active={true} className="my-1 w-full" value={fuelConsumptionStr} reload={reload} inputMode="decimal"
                  onChange={(value) => {
                     setFuelConsumption(fromUnit(+value));
                  }} validate={async (value) => {
                     return /^\d*(\.\d*)?$/.test(value);
                  }} >
               </Input>
            </div>
            <div className="flex ml-4 m-auto w-12 shrink">{fuelUnitStr}/h</div>
         </div>
      </div>
   </div>

}
