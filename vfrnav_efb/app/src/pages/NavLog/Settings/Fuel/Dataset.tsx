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

import { getDatasets } from "@shared/NavData";
import { useMemo, useContext, useCallback } from 'react';
import { Datasets } from "../Graph/Graph";
import { MapContext } from "@pages/Map/MapContext";

export const useDataset = ({ oat }: {
   oat: number
}): [Datasets, (_newDatasets: Datasets, _weak: boolean) => void, number[]] => {
   const { setFuelCurve, fuelCurve } = useContext(MapContext)!;

   const speeds = useMemo(() => fuelCurve.map(curve => curve[0]), [fuelCurve])
   const datasets = useMemo((): Datasets => getDatasets({ fuelCurve, oat }), [fuelCurve, oat])

   const updateDataset = useCallback((newDatasets: Datasets, weak: boolean) => {
      setFuelCurve(curves => newDatasets.map((dataset, index) => {
         const [speed, oldcurve] = curves[index]
         const oldDataset = datasets[index];
         console.assert(oldDataset.length === oldcurve.length);

         return [speed, (() => {
            if (dataset.length > oldcurve.length) {
               // Added point

               const index = oldDataset.findIndex((elem, index) => elem !== dataset[index])
               console.assert(index !== -1);
               console.assert(index > 0)
               console.assert(index < oldDataset.length)

               const pos = [dataset[index][0], dataset[index][1]]


               return oldcurve.toSpliced(index, 0, [pos[0], [[oat, pos[1]]]])
            } else if (dataset.length < oldcurve.length) {
               // Removed point

               const index = dataset.findIndex((elem, index) => elem !== oldDataset[index])
               console.assert(index !== -1);

               if (index === 0 || index === oldcurve.length - 1) {
                  // Bounding point keeps at least one value
                  if (oldcurve[index][1].length !== 1) {
                     const rindex = oldcurve[index][1].findIndex(elem => elem[0] === oat)

                     if (rindex !== -1) {
                        return oldcurve.toSpliced(index, 1, [oldcurve[index][0], oldcurve[index][1].toSpliced(rindex, 1)]);
                     }
                  }

                  return oldcurve;
               } else {
                  if (oldcurve[index][1].length > 1) {
                     const endIndex = oldcurve[index][1].findIndex(elem => elem[0] >= oat)

                     if (oldcurve[index][1][endIndex][0] === oat) {
                        // Set point => remove only curent value

                        return oldcurve.toSpliced(index, 1, [oldcurve[index][0], oldcurve[index][1].toSpliced(endIndex, 1)]);
                     }
                  }
                  // Interpolated point or single value => remove all sequence
                  return weak ? oldcurve : oldcurve.toSpliced(index, 1);
               }
            }

            const index = dataset.findIndex((elem, index) => elem !== oldDataset[index])

            if (index !== -1) {
               // Modified point
               const old = oldDataset[index]
               const point = dataset[index];

               if (old[2]) {
                  // The point was interpolated ==> New Value
                  const oindex = oldcurve[index][1].findIndex(elem => elem[0] > oat)

                  if (oindex === -1) {
                     return oldcurve.toSpliced(index, 1, [point[0], [...oldcurve[index][1], [oat, point[1]]]])
                  } else {
                     return oldcurve.toSpliced(index, 1, [point[0], oldcurve[index][1].toSpliced(oindex, 0, [oat, point[1]])]);
                  }
               } else {
                  // Modified Point
                  const oindex = oldcurve[index][1].findIndex(elem => elem[0] === oat)
                  console.assert(oindex !== -1);

                  return oldcurve.toSpliced(index, 1, [point[0], oldcurve[index][1].toSpliced(oindex, 1, [oat, point[1]])]
                  );
               }
            }

            return oldcurve
         })()]
      }))
   }, [datasets, oat, setFuelCurve])

   return [datasets, updateDataset, speeds]
}