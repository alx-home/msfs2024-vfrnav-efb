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

import { useMemo, SetStateAction, Dispatch } from 'react';
import { useResize } from "@alx-home/Events";
import { Origin } from './Origin';
import { AxisX } from './AxisX';
import { CenterLines } from './CenterLines';
import { Content } from './Content';
import { Grid } from './Grid';
import { AxisY } from './AxisY';

export type Datasets = [number, number, boolean][][];
export type FullCoverMode = 'None' | 'Full' | 'Weak'

export const Graph = ({ datasets: baseDatasets, datasetLegend, xUnit, yUnit, xMargin, datasetUnit, xLegend, yLegend,
   showDatasetLegend: showLegend, setDatasets: setBaseDatasets, setDatasetsWeak: setBaseDatasetsWeak, bounds,
   step: baseStep, fullCoverMode, active, xValuesStr, yValuesStr, datasetStr }: {
      datasets: Datasets,
      setDatasets: Dispatch<SetStateAction<Datasets>>,
      setDatasetsWeak?: Dispatch<SetStateAction<Datasets>>,
      bounds: [[number, number], [number, number]],
      step: [number, number],
      fullCoverMode: FullCoverMode,
      active?: boolean,
      xMargin?: number,
      xValuesStr?: (_value: number) => string,
      yValuesStr?: (_value: number) => string,
      datasetStr?: (_value: number) => string,
      datasetLegend?: string,
      xLegend?: string,
      yLegend?: string,
      xUnit?: string | ((_value: number) => string),
      yUnit?: string | ((_value: number) => string),
      datasetUnit?: string | ((_value: number) => string),
      showDatasetLegend?: boolean
   }) => {
   const [drawResize, setDrawResizeRef] = useResize()
   const [graphResize, setGraphResizeRef] = useResize()

   const [drawWidth, drawHeight] = useMemo(() => [(drawResize?.width ?? 0), (drawResize?.height ?? 0)], [drawResize])
   const [graphWidth, graphHeight] = useMemo(() => [(graphResize?.width ?? 0), (graphResize?.height ?? 0)], [graphResize])
   const [divs, step] = useMemo(() => {
      const base = [Math.ceil((bounds[0][1] - bounds[0][0]) / baseStep[0]), Math.ceil((bounds[1][1] - bounds[1][0]) / baseStep[1])]
      const divs = [...base]
      const step = [...baseStep]

      for (let i = 2; (drawWidth / divs[0] < 40) && (divs[0] > 1); ++i) {
         const div = Math.ceil(base[0] / i);

         if (div != divs[0]) {
            divs[0] = div
            step[0] = baseStep[0] * i;
         }
      }

      for (let i = 1; (drawHeight / divs[1] < 40) && (divs[1] > 1); ++i) {
         const div = Math.ceil(base[1] / i);

         if (div != divs[1]) {
            divs[1] = div
            step[1] = baseStep[1] * i;
         }
      }

      return [divs, step]
   }, [bounds, baseStep, drawWidth, drawHeight])

   const lastRatio = useMemo((): [number, number] => {
      const delta = [
         bounds[0][0] + divs[0] * step[0] - bounds[0][1],
         bounds[1][0] + divs[1] * step[1] - bounds[1][1]
      ]

      return [
         1 - delta[0] / step[0],
         1 - delta[1] / step[1],
      ]
   }, [bounds, divs, step]);
   const span = useMemo((): [number, number] => ([bounds[0][1] - bounds[0][0], bounds[1][1] - bounds[1][0]]), [bounds])

   const xValues = useMemo(() => Array.from({ length: divs[0] }, (_, index) => bounds[0][0] + step[0] * index).toSpliced(divs[0], 0, bounds[0][1]), [bounds, divs, step])
   const yValues = useMemo(() => Array.from({ length: divs[1] }, (_, index) => bounds[1][0] + step[1] * index).toSpliced(divs[1], 0, bounds[1][1]).reverse(), [bounds, divs, step])


   return <div className="flex flex-col w-full h-full mb-12 pr-10 pl-10 mt-2 select-none" inert={!(active ?? true)}>
      <div className="flex flex-col w-full h-full" ref={setDrawResizeRef}>
         <div className="flex flex-row w-full h-full"
            style={{
               maxHeight: drawHeight
            }}>
            <AxisY bounds={bounds} lastRatio={lastRatio} yValues={yValues} yValuesStr={yValuesStr} />
            <div className="relative flex w-full h-full">
               <div className="relative flex flex-col w-full h-full"
                  ref={setGraphResizeRef}
                  style={{
                     maxWidth: drawWidth,
                     maxHeight: drawHeight
                  }}>
                  <Grid lastRatio={lastRatio} xValues={xValues} yValues={yValues} />
                  <CenterLines bounds={bounds} span={span} xValues={xValues} yValues={yValues} />
                  <Content active={active} baseDatasets={baseDatasets} bounds={bounds} fullCoverMode={fullCoverMode}
                     setBaseDatasets={setBaseDatasets} setBaseDatasetsWeak={setBaseDatasetsWeak} graphHeight={graphHeight}
                     showLegend={showLegend} span={span} datasetLegend={datasetLegend} datasetStr={datasetStr}
                     xValuesStr={xValuesStr} yValuesStr={yValuesStr} xMargin={xMargin} graphWidth={graphWidth}
                     xLegend={xLegend} xUnit={xUnit} yLegend={yLegend} yUnit={yUnit} datasetUnit={datasetUnit} />
               </div>
            </div>
         </div>
         <div className="flex flex-row w-full">
            <Origin bounds={bounds} xValuesStr={xValuesStr} yValuesStr={yValuesStr} />
            <AxisX bounds={bounds} graphWidth={drawWidth} lastRatio={lastRatio} xValues={xValues} xValuesStr={xValuesStr} />
         </div>
      </div>
   </div>
}
