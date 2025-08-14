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

import { FuelPoint, getDatasets } from "@shared/NavData";
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
         const newcurve = oldcurve.map(point => point.toSpliced(0, 0));
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
               const newpoint: FuelPoint = [[oat, pos[0], pos[1]]]


               // Adjust Neighborhood to avoid cross move over xAxis

               const prevpointInd = oldcurve[index - 1].findIndex(elem => elem[0] > oat);
               if ((prevpointInd !== -1) && (prevpointInd > 0)) {
                  const from = oldcurve[index - 1][prevpointInd - 1]
                  const to = oldcurve[index - 1][prevpointInd]

                  if (to[1] > pos[0]) {
                     console.assert(from[0] < pos[0]);

                     const deleted = newcurve[index - 1].splice(prevpointInd, oldcurve[index - 1].length, [oat, dataset[index - 1][0], dataset[index - 1][1]])
                     newpoint.splice(newpoint.length, 0, ...deleted)
                  }
               }

               const nextpointInd = oldcurve[index].findLastIndex(elem => elem[0] < oat);
               if ((nextpointInd !== -1) && (nextpointInd < oldcurve[index].length - 1)) {
                  const from = oldcurve[index][nextpointInd]
                  const to = oldcurve[index][nextpointInd + 1]

                  if (from[1] < pos[0]) {
                     console.assert(to[0] > pos[0]);

                     const deleted = newcurve[index].splice(0, nextpointInd + 1, [oat, dataset[index + 1][0], dataset[index + 1][1]])
                     newpoint.splice(0, 0, ...deleted)
                  }
               }

               return newcurve.toSpliced(index, 0, newpoint);

            } else if (dataset.length < oldcurve.length) {
               // Removed point

               const index = dataset.findIndex((elem, index) => elem !== oldDataset[index])
               console.assert(index !== -1);

               if (index === 0 || index === oldcurve.length - 1) {
                  // Bounding point keeps at least one value
                  if (newcurve[index].length !== 1) {
                     const rindex = newcurve[index].findIndex(elem => elem[0] === oat)

                     if (rindex !== -1) {
                        newcurve[index].splice(rindex, 1);
                     }
                  }

                  return newcurve;
               } else {
                  if (oldcurve[index].length > 1) {
                     const endIndex = oldcurve[index].findIndex(elem => elem[0] >= oat)

                     if (oldcurve[index][endIndex][0] === oat) {
                        // Set point => remove only curent value

                        if ((endIndex === 0) || (endIndex < oldcurve[index].length - 1) || (oldcurve[index][endIndex - 1][1] > oldDataset[index - 1][0])) {
                           newcurve[index].splice(endIndex, 1);
                        } else {
                           // Order change remove all sequence
                           newcurve.splice(index, 1);
                        }

                        return newcurve
                     }
                     // Interpolated point
                  }
                  // Interpolated point or single value => remove all sequence

                  // Remove all oat values for this point (Interpolated point or fixed point)
                  return weak ? newcurve : newcurve.toSpliced(index, 1);
               }
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
   }, [datasets, oat, setFuelCurve])

   return [datasets, updateDataset, speeds]
}