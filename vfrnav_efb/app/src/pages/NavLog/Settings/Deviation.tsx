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
import { SettingsTabs } from "../Settings";
import { Datasets, Graph } from "./Graph/Graph";

export const Deviation = ({ curentPage }: {
   curentPage: SettingsTabs
}) => {
   const { deviations, setDeviations } = useContext(MapContext)!;

   const setDataset = useCallback((value: SetStateAction<Datasets>) => {
      if (typeof value === 'function') {
         setDeviations(old => value([
            old.map(elem => ([
               elem.x,
               elem.y,
               false
            ]))
         ])[0].map(elem => ({
            x: elem[0],
            y: elem[1]
         })))
      } else {
         setDeviations(
            value[0].map(elem => ({
               x: elem[0],
               y: elem[1]
            }))
         )
      }
   }, [setDeviations])

   const dataset = useMemo(() => ([
      deviations.map(elem => [elem.x, elem.y, false] as [number, number, boolean])
   ]), [deviations]);

   const legend = useCallback(() => 'Dev', [])

   return <div className={'flex flex-col text-sm [grid-row:1] [grid-column:1] overflow-hidden max-h-full'
      + (('Deviation' === curentPage) ? '' : ' opacity-0 select-none pointer-events-none max-h-0')
   }>
      <div className="flex w-full justify-center text-xl pb-2">Compass Deviation</div>
      <Graph bounds={[[0, 360], [-10, 10]]} datasets={dataset} fullCoverMode={true} setDatasets={setDataset}
         step={[5, 1]} active={curentPage === 'Deviation'} datasetStr={legend}
         xLegend='MH' yLegend='Dev' xValuesStr={elem => elem.toFixed(0) + '\u00b0'} yValuesStr={elem => elem.toFixed(0) + '\u00b0'} />
   </div>
}