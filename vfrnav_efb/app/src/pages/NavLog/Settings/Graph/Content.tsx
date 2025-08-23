
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

import { useMouseMove, useMouseRelease } from "@alx-home/Events";
import { Dispatch, SetStateAction, useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Datasets, FullCoverMode } from "./Graph";
import { Selector } from "./Selector";
import { Line } from "./Line";
import { Legend } from "./Legend";

export const Content = ({ baseDatasets, bounds, span, showLegend, datasetLegend, datasetStr,
   xLegend, xValuesStr, xUnit, yLegend, yValuesStr, yUnit, datasetUnit, fullCoverMode, active,
   setBaseDatasets, setBaseDatasetsWeak, xMargin, graphWidth, graphHeight
}: {
   active?: boolean,
   showLegend?: boolean,
   fullCoverMode: FullCoverMode,
   baseDatasets: Datasets,
   setBaseDatasets: Dispatch<SetStateAction<Datasets>>,
   setBaseDatasetsWeak?: Dispatch<SetStateAction<Datasets>>,
   bounds: [[number, number], [number, number]],
   xValuesStr?: (_value: number) => string,
   yValuesStr?: (_value: number) => string,
   datasetStr?: (_value: number) => string,
   datasetLegend?: string,
   xLegend?: string,
   yLegend?: string,
   xMargin?: number,
   xUnit?: string | ((_value: number) => string),
   yUnit?: string | ((_value: number) => string),
   graphWidth: number,
   graphHeight: number,
   datasetUnit?: string | ((_value: number) => string),
   span: [number, number],
}) => {
   const graphRef = useRef<HTMLDivElement>(null);

   const [selectorPos_, setSelectorPos] = useState<{ dataset: number, pos: [number, number] }>({ dataset: 0, pos: [0, 0] })
   const [selectorPos, selectorDataset] = useMemo(() => [selectorPos_.pos, selectorPos_.dataset], [selectorPos_])
   const [selectorCount, setSelectorCount] = useState(0)
   const [pointCount, setPointCount] = useState(0)

   const [editIndex, setEditIndex] = useState<[number, number] | undefined>(undefined);
   const [editCursor, setEditCursor] = useState<[number, number, boolean] | undefined>(undefined)
   const [editMode, setEditMode] = useState<boolean>(false)

   const mouse = useMouseMove((active ?? true) && (editIndex !== undefined));
   const mousePos = useRef<[number, number]>([0, 0]);
   const mouseUp = useMouseRelease((active ?? true) && (editIndex !== undefined));

   const getPixelsFromPoint = useCallback((coords: [number, number]): [number, number] => {
      const cbounds = graphRef.current?.getBoundingClientRect();

      if (!cbounds) {
         return [0, 0]
      }

      return [(coords[0] - bounds[0][0]) * cbounds.width / span[0], cbounds.height - (coords[1] - bounds[1][0]) * cbounds.height / span[1]]
   }, [bounds, span])
   const getPointFromPixels = useCallback((coords: [number, number], inside?: boolean): [number, number] => {
      const cbounds = graphRef.current?.getBoundingClientRect();

      if (!cbounds || (cbounds.width === 0) || (cbounds.height === 0)) {
         return [0, 0]
      }

      const pos = (inside ?? false) ? [coords[0], cbounds.height - coords[1]] : [coords[0] - cbounds.left, cbounds.height - (coords[1] - cbounds.top)];

      return [bounds[0][0] + pos[0] * span[0] / cbounds.width, bounds[1][0] + pos[1] * span[1] / cbounds.height]
   }, [bounds, span])


   const hoverValue = useMemo((): [number, number] =>
      editIndex
         ? [editCursor![0], editCursor![1]]
         : getPointFromPixels(selectorPos, true)
      , [editCursor, editIndex, getPointFromPixels, selectorPos])
   const hoverPos = useMemo(() => getPixelsFromPoint(hoverValue), [getPixelsFromPoint, hoverValue])

   const toBounds = useCallback((dataset_index: number, index: number, coords: [number, number]): [number, number] => {
      const dataset = editMode ? baseDatasets[dataset_index].toSpliced(index, 1) : baseDatasets[dataset_index];
      const min: [number, number] = [
         ((index === dataset.length) && (fullCoverMode !== 'None'))
            ? bounds[0][1]
            : index === 0
               ? bounds[0][0]
               : dataset[index - 1][0] + (xMargin ?? 0),
         bounds[1][0]
      ]
      const max: [number, number] = [
         ((index === 0) && (fullCoverMode !== 'None'))
            ? bounds[0][0]
            : index === dataset.length
               ? bounds[0][1]
               : dataset[index][0] - (xMargin ?? 0),
         bounds[1][1]
      ]

      return [
         Math.min(max[0], Math.max(min[0], coords[0])),
         Math.min(max[1], Math.max(min[1], coords[1]))
      ]
   }, [baseDatasets, bounds, editMode, fullCoverMode, xMargin])


   const addPoint = useCallback((dataset_index: number, index: number, mouse_pos: [number, number]) => {
      const cbounds = graphRef.current!.getBoundingClientRect();
      const pos = [mouse_pos[0] - cbounds.left, cbounds.height - (mouse_pos[1] - cbounds.top)];

      setEditCursor([...toBounds(dataset_index, index, [bounds[0][0] + pos[0] * span[0] / cbounds.width, bounds[1][0] + pos[1] * span[1] / cbounds.height]), false])
      setEditIndex([dataset_index, index])
      setPointCount(1)
   }, [toBounds, span, bounds])

   const editPoint = useCallback((dataset_index: number, index: number, mouse_pos: [number, number]) => {
      setEditMode(true)
      addPoint(dataset_index, index, mouse_pos)
   }, [addPoint, setEditMode])

   const removePoint = useCallback((dataset_index: number, index: number) => {
      if ((fullCoverMode !== 'None') && (index === 0 || (index >= (baseDatasets[dataset_index].length - 1)))) {
         setEditIndex(undefined)

         if (fullCoverMode === 'Weak') {
            setBaseDatasetsWeak?.(value => value.toSpliced(dataset_index, 1, value[dataset_index].toSpliced(index, 1)))
         }
         return
      }
      setBaseDatasets(value => value.toSpliced(dataset_index, 1, value[dataset_index].toSpliced(index, 1)))
   }, [baseDatasets, fullCoverMode, setBaseDatasets, setBaseDatasetsWeak])


   const getBoundedPointFromPixels = useCallback((dataset_index: number, index: number, coords: [number, number]): [number, number] => {
      return toBounds(dataset_index, index, getPointFromPixels(coords));
   }, [getPointFromPixels, toBounds])


   const datasets = useMemo(() => baseDatasets.map((dataset, dataset_index) =>
      ((editIndex !== undefined) && (editIndex[0] === dataset_index))
         ? dataset.toSpliced(editIndex[1], editMode ? 1 : 0, editCursor!)
         : dataset
   ), [baseDatasets, editIndex, editMode, editCursor]);

   const lines = useMemo(() => datasets.map((dataset, dataset_index) => dataset.filter((_, index) => index !== 0).map((elem, index) =>
      <Line key={JSON.stringify(dataset[index]) + '-' + JSON.stringify(elem)} index={index} parentRef={graphRef} graphWidth={graphWidth} graphHeight={graphHeight}
         addPoint={addPoint} editIndex={editIndex} editPoint={editPoint} removePoint={removePoint}
         setSelectorCount={setSelectorCount} setSelector={setSelectorPos} setPointCount={setPointCount}
         dataset_index={dataset_index} from={dataset[index]} to={elem} bounds={bounds} />
   )), [addPoint, bounds, datasets, editIndex, editPoint, graphHeight, graphWidth, removePoint])

   useEffect(() => {
      if ((editIndex !== undefined) && mouse) {
         setEditCursor([...getBoundedPointFromPixels(editIndex[0], editIndex[1], [mouse!.x, mouse!.y]), false])
      }
   }, [editIndex, getBoundedPointFromPixels, mouse])

   useEffect(() => {
      if (mouseUp && (editIndex !== undefined)) {
         setEditIndex(undefined)
         setBaseDatasets(values => values.toSpliced(editIndex[0], 1, values[editIndex[0]].toSpliced(editIndex[1], editMode ? 1 : 0, [...getBoundedPointFromPixels(editIndex[0], editIndex[1], mousePos.current), false])))
         setEditMode(false)
      }
   }, [editIndex, editMode, getBoundedPointFromPixels, mousePos, mouseUp, setBaseDatasets])

   useEffect(() => {
      if (mouse) {
         mousePos.current = [mouse.x, mouse.y]
      }
   }, [mouse])


   return <div className="absolute flex w-full h-full">
      <div className="relative flex w-full h-full" ref={graphRef}>
         {lines}
         <Selector editIndex={editIndex} hoverPos={hoverPos} selectorCount={selectorCount} />
         <Legend bounds={bounds} editIndex={editIndex} hoverPos={hoverPos} hoverValue={hoverValue} pointCount={pointCount}
            selectorCount={selectorCount} selectorDataset={selectorDataset} span={span} datasetLegend={datasetLegend} datasetStr={datasetStr}
            showLegend={showLegend} datasetUnit={datasetUnit}
            xLegend={xLegend} xUnit={xUnit} xValuesStr={xValuesStr}
            yLegend={yLegend} yUnit={yUnit} yValuesStr={yValuesStr} />
      </div>
   </div>
}