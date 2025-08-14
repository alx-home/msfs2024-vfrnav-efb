/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

import { Select, SelectOption, Slider } from "@alx-home/Utils";
import { MapContext } from "@pages/Map/MapContext";
import { FuelUnit } from "@shared/NavData";
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SettingsTabs } from "../Settings";
import { Datasets, Graph } from "./Graph/Graph";

export const Fuel = ({ curentPage }: {
   curentPage: SettingsTabs
}) => {
   const { fuelConsumption, setFuelConsumption, fuelUnit, setFuelUnit } = useContext(MapContext)!;
   const fuelUnitStr = useMemo(() => fuelUnit === 'gal' ? 'gph' : 'l/h', [fuelUnit])
   const toUnit = useCallback((value: number) =>
      fuelUnit === 'gal' ? value * 3.785411784 : value
      , [fuelUnit])

   type Temp = number;
   type Alt = number;
   type Fuel = number;
   type Speed = number;
   type Point = [Temp, Alt, Fuel][]

   const [curves, setCurves] = useState<[Speed, Point[]][]>([
      [160, [[[-40, 0, 130]], [[50, 25000, 100]]]],
      [170, [[[-40, 0, 150]], [[50, 25000, 170]]]],
      [180, [[[-40, 0, 160]], [[50, 25000, 190]]]],
      [190, [[[-40, 0, 170]], [[50, 25000, 220]]]],
      [200, [[[-40, 0, 180]], [[50, 25000, 300]]]],
      [220, [[[-40, 0, 400]], [[50, 25000, 350]]]],
   ])


   const speeds = useMemo(() => curves.map(curve => curve[0]), [curves])
   const [oat, setOat] = useState(20)
   const updateOat = useCallback((oat: number) => setOat(Math.floor(oat / 5) * 5), [])

   const datasets = useMemo((): Datasets => curves.map(elem => {
      const [, curve] = elem;

      return curve.map((point): [number, number, boolean] => {
         const maxTempIndex = point.findIndex(elem => elem[0] >= oat);

         if (maxTempIndex === -1) {
            return [point[point.length - 1][1], point[point.length - 1][2], true]
         } else {
            const maxTemp = point[maxTempIndex]

            if (maxTemp[0] === oat) {
               return [maxTemp[1], maxTemp[2], false]
            } else if (maxTempIndex === 0) {
               return [maxTemp[1], maxTemp[2], true]
            } else {
               const minTemp = point[maxTempIndex - 1]
               const ratio = (oat - minTemp[0]) / (maxTemp[0] - minTemp[0]);

               const interpolated = Array.from({ length: 2 }, (_, i) => minTemp[i + 1] + (maxTemp[i + 1] - minTemp[i + 1]) * ratio);
               return [interpolated[0], interpolated[1], true]
            }
         }
      })
   }), [curves, oat])


   const [reload, setReload] = useState(false);

   const xValuesStr = useCallback((elem: number) => elem < 10000 ? elem.toFixed(0) : 'FL' + (elem / 100).toFixed(0), [])
   const yValuesStr = useCallback((elem: number) => toUnit(elem).toFixed(0), [toUnit])
   const datasetStr = useCallback((elem: number) => speeds[elem].toFixed(0), [speeds])

   const updateDataset = useCallback((newDatasets: Datasets, weak: boolean) => {
      setCurves(curves => newDatasets.map((dataset, index) => {
         const [speed, oldcurve] = curves[index]
         const oldDataset = datasets[index];
         console.assert(oldDataset.length === oldcurve.length);

         return [speed, (() => {
            if (dataset.length > oldcurve.length) {
               // Added point

               const index = oldDataset.findIndex((elem, index) => elem !== dataset[index])
               console.assert(index !== -1);

               console.assert(index !== 0)
               console.assert(index !== oldDataset.length - 1)

               const pos = [dataset[index][0], dataset[index][1]]
               const newpoint: Point = [[oat, pos[0], pos[1]]]


               // Adjust Neighborhood to avoid cross move over xAxis

               const prevpointInd = oldcurve[index - 1].findIndex(elem => elem[0] > oat);
               if ((prevpointInd !== -1) && (prevpointInd > 0)) {
                  const from = oldcurve[index - 1][prevpointInd - 1]
                  const to = oldcurve[index - 1][prevpointInd]

                  if (to[1] > pos[0]) {
                     console.assert(from[0] < pos[0]);

                     const deleted = oldcurve[index - 1].splice(prevpointInd, oldcurve[index - 1].length, [oat, dataset[index - 1][0], dataset[index - 1][1]])
                     newpoint.splice(newpoint.length, 0, ...deleted)
                  }
               }

               const nextpointInd = oldcurve[index].findLastIndex(elem => elem[0] < oat);
               if ((nextpointInd !== -1) && (nextpointInd < oldcurve[index].length - 1)) {
                  const from = oldcurve[index][nextpointInd]
                  const to = oldcurve[index][nextpointInd + 1]

                  if (from[1] < pos[0]) {
                     console.assert(to[0] > pos[0]);

                     const deleted = oldcurve[index].splice(0, nextpointInd + 1, [oat, dataset[index + 1][0], dataset[index + 1][1]])
                     newpoint.splice(0, 0, ...deleted)
                  }
               }

               return oldcurve.toSpliced(index, 0, newpoint);

            } else if (dataset.length < oldcurve.length) {
               // Removed point

               const index = dataset.findIndex((elem, index) => elem !== oldDataset[index])
               console.assert(index !== -1);

               if (oldcurve[index].length > 1) {
                  const oindex = oldcurve[index].findIndex(elem => elem[0] === oat)

                  if (oindex !== -1) {
                     return oldcurve.toSpliced(index, 1, oldcurve[index].toSpliced(oindex, 1));
                  }
               }
               return weak ? oldcurve : oldcurve.toSpliced(index, 1);
            }

            const index = dataset.findIndex((elem, index) => elem !== oldDataset[index])

            if (index !== -1) {
               // Modified point
               const old = oldDataset[index]
               const point = dataset[index];

               if (old[2]) {
                  // The point was interpolated ==> New Value
                  const oindex = oldcurve[index].findIndex(elem => elem[0] > oat)

                  if (oindex === -1) {
                     return oldcurve.toSpliced(index, 1, oldcurve[index].toSpliced(oldcurve[index].length, 0, [oat, point[0], point[1]]));
                  } else {
                     return oldcurve.toSpliced(index, 1, oldcurve[index].toSpliced(oindex, 0, [oat, point[0], point[1]]));
                  }
               } else {
                  // Modified Point
                  const oindex = oldcurve[index].findIndex(elem => elem[0] === oat)
                  console.assert(oindex !== -1);

                  return oldcurve.toSpliced(index, 1, oldcurve[index].toSpliced(oindex, 1, [oat, point[0], point[1]]));
               }
            }

            return oldcurve
         })()]
      }))
   }, [datasets, oat])

   const setDatasetsWeak = useCallback((value: (Datasets | ((_value: Datasets) => Datasets))) => {
      const newDataset = ((typeof value === 'function')
         ? value(datasets)
         : value);

      updateDataset(newDataset, true);
   }, [datasets, updateDataset])
   const setDataset = useCallback((value: (Datasets | ((_value: Datasets) => Datasets))) => {
      const newDataset = ((typeof value === 'function')
         ? value(datasets)
         : value);

      updateDataset(newDataset, false);
   }, [datasets, updateDataset]);

   useEffect(() => {
      setReload(true)
   }, [fuelUnit])

   useEffect(() => {
      if (reload) {
         setReload(false)
      }
   }, [reload])

   return <div className={'flex flex-col text-sm [grid-row:1] [grid-column:1] overflow-hidden max-h-full'
      + (('Fuel' === curentPage) ? '' : ' opacity-0 select-none pointer-events-none max-h-0')
   }>
      <div className="flex w-full justify-center text-xl pb-2">Fuel Consumption</div>
      <div className="flex flex-col shrink text-sm justify-center m-auto mb-4 pt-2">
         <div className="flex flex-row text-sm justify-center">
            <div className="flex m-auto grow pr-2">Unit :</div>
            <div className="flex flex-row">
               <Select active={true} value={fuelUnit} onChange={(value) => {
                  setFuelUnit(value)
               }}>
                  <SelectOption<FuelUnit> id={'gal'}>Galon</SelectOption>
                  <SelectOption<FuelUnit> id={'liter'}>Liter</SelectOption>
               </Select>
            </div>
            <div className="flex ml-1 m-auto w-12 shrink"></div>
         </div>
      </div>
      <Graph bounds={[[0, 25000], [0, 500]]} datasets={datasets} fullCoverMode={'Weak'} setDatasets={setDataset}
         setDatasetsWeak={setDatasetsWeak} step={[1000, 10]} active={curentPage === 'Fuel'}
         xValuesStr={xValuesStr} yValuesStr={yValuesStr}
         datasetLegend='TAS' showDatasetLegend={true} xLegend='Alt' yLegend='Fuel' datasetStr={datasetStr}
         xUnit={val => val < 10000 ? 'ft' : ''} yUnit={fuelUnitStr} datasetUnit='kts' />
      <div className="flex flex-row w-full px-10 pb-4">
         <div className="flex min-w-20">OAT {oat.toFixed(0) + '\u00b0'} :</div>
         <Slider active={curentPage === 'Fuel'}
            defaultValue={20} value={oat} range={{ min: -40, max: 50 }} onChange={updateOat} />
      </div>
   </div>
}
