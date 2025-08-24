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

import { Slider } from "@alx-home/Utils";
import { MapContext } from "@pages/Map/MapContext";
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SettingsTabs } from "../../Settings";
import { Datasets, Graph } from "../Graph/Graph";
import { useDataset } from "./Dataset";
import { Settings } from "./Settings";


export const Fuel = ({ curentPage, active: parentActive }: {
   curentPage: SettingsTabs,
   active: boolean
}) => {
   const { fuelUnit, updateFuelPreset: updatePreset, fuelSettingsOat: oat, setFuelSettingsOat: setOat } = useContext(MapContext)!;
   const fuelUnitStr = useMemo(() => fuelUnit === 'gal' ? 'gph' : 'l/h', [fuelUnit])
   const xUnit = useCallback((val: number) => val < 10000 ? 'ft' : '', [])
   const toUnit = useCallback((value: number) =>
      fuelUnit === 'gal' ? value * 3.785411784 : value
      , [fuelUnit])

   const [datasets, updateDataset, speeds] = useDataset({ oat: oat });
   const updateOat = useCallback((oat: number) => setOat(Math.round(oat)), [setOat])

   const bounds = useMemo((): [[number, number], [number, number]] => ([[0, 25000], [0, 500]]), [])
   const step = useMemo((): [number, number] => [1000, 10], [])
   const active = useMemo(() => (curentPage === 'Fuel') && parentActive, [parentActive, curentPage])
   const [reload, setReload] = useState(false);

   const xValuesStr = useCallback((elem: number) => elem < 10000 ? elem.toFixed(0) : 'FL' + (elem / 100).toFixed(0), [])
   const yValuesStr = useCallback((elem: number) => toUnit(elem).toFixed(0), [toUnit])
   const datasetStr = useCallback((elem: number) => speeds[elem].toFixed(0), [speeds])

   const setDatasetsWeak = useCallback((value: (Datasets | ((_value: Datasets) => Datasets))) => {
      const newDataset = ((typeof value === 'function')
         ? value(datasets)
         : value);

      updatePreset('custom')
      updateDataset(newDataset, true);
   }, [datasets, updatePreset, updateDataset])
   const setDataset = useCallback((value: (Datasets | ((_value: Datasets) => Datasets))) => {
      const newDataset = ((typeof value === 'function')
         ? value(datasets)
         : value);

      updatePreset('custom')
      updateDataset(newDataset, false);
   }, [datasets, updatePreset, updateDataset]);

   useEffect(() => {
      setReload(true)
   }, [fuelUnit])

   useEffect(() => {
      if (reload) {
         setReload(false)
      }
   }, [reload])

   return <div className={'absolute flex flex-col text-sm overflow-hidden h-full w-full'
      + (('Fuel' === curentPage) ? '' : ' opacity-0 select-none pointer-events-none max-h-0')
   }>
      <div className="relative flex flex-col w-full h-full">
         <div className="flex w-full justify-center text-xl pb-2">Fuel Consumption</div>
         <Settings active={'Fuel' === curentPage} />
         {
            ('Fuel' === curentPage)
               ? <>
                  <Graph bounds={bounds} datasets={datasets} fullCoverMode={'Weak'} setDatasets={setDataset}
                     setDatasetsWeak={setDatasetsWeak} step={step} active={active}
                     xValuesStr={xValuesStr} yValuesStr={yValuesStr}
                     datasetLegend='Thrust' showDatasetLegend={true} xLegend='Alt' yLegend='Fuel' datasetStr={datasetStr}
                     xUnit={xUnit} yUnit={fuelUnitStr} datasetUnit='%' />
                  <div className="flex flex-row w-full px-10 pb-4">
                     <div className="flex min-w-20">OAT {oat.toFixed(0) + '\u00b0'} :</div>
                     <Slider active={curentPage === 'Fuel'}
                        defaultValue={20} value={oat} range={{ min: -40, max: 50 }} onChange={updateOat} />
                  </div>
               </>
               : <></>
         }

      </div>
   </div>
}
