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

import { MapContext } from "@pages/Map/MapContext";
import { useContext, useMemo, useCallback, SetStateAction } from 'react';
import { SettingsTabs } from "../../Settings";
import { Datasets, Graph } from "../Graph/Graph";
import { useSettings } from "./Settings";

export const Deviation = ({ curentPage, active: parentActive }: {
   curentPage: SettingsTabs,
   active: boolean
}) => {
   const { Settings, setPreset } = useSettings()
   const { deviationCurve, setDeviationCurve } = useContext(MapContext)!;
   const bounds = useMemo(() => ([[0, 360], [-10, 10]] as [[number, number], [number, number]]), [])
   const step = useMemo(() => ([5, 1] as [number, number]), [])
   const active = useMemo(() => (curentPage === 'Deviation') && parentActive, [curentPage, parentActive])
   const valueStr = useCallback((elem: number) => elem.toFixed(0) + '\u00b0', [])

   const dataset = useMemo(() => ([
      deviationCurve.map(elem => [elem[0], elem[1], false] as [number, number, boolean])
   ]), [deviationCurve]);

   const setDataset = useCallback((value: SetStateAction<Datasets>) => {
      const newDataset = ((typeof value === 'function')
         ? value(dataset)
         : value);

      setPreset('custom')
      setDeviationCurve(
         newDataset[0].map(elem => ([
            elem[0],
            elem[1]
         ]))
      )
   }, [dataset, setDeviationCurve, setPreset])


   const legend = useCallback(() => 'Dev', [])

   return <div className={'absolute flex flex-col text-sm overflow-hidden h-full w-full'
      + (('Deviation' === curentPage) ? '' : ' opacity-0 select-none pointer-events-none max-h-0')
   }>
      <div className="flex w-full justify-center text-xl pb-2">Compass Deviation</div>
      {Settings}
      <Graph bounds={bounds} datasets={dataset} fullCoverMode={'Full'} setDatasets={setDataset}
         step={step} active={active} datasetStr={legend}
         xLegend='MH' yLegend='Dev' xValuesStr={valueStr} yValuesStr={valueStr} />
   </div>
}