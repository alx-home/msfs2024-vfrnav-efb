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

import { GenRecord } from './Types';

export type Temp = number;
export type Alt = number;
export type Fuel = number;
export type Speed = number;
export type FuelPoint = [Temp, Alt, Fuel][]

export type FuelUnit = 'gal' | 'liter';
export type Deviation = [
   Alt,
   number
];

export type Properties = {
   active: boolean
   altitude: number
   vor: {
      ident: string,
      freq: number,
      obs: number
   },
   wind: {
      direction: number,
      speed: number
   },
   ias: number,
   oat: number

   dist: number
   dur: {
      days: number
      hours: number
      minutes: number
      seconds: number

      full: number
   }

   TC: number
   CH: number,
   dev: number,
   MH: number,

   GS: number
   tas: number

   conso: number,
   curFuel: number,

   ata: number,

   magVar: number,
   remark: string,
};

export type ExportNav = {
   __EXPORT_NAV__: true,

   data: {
      name: string,
      shortName: string,
      order: number,
      coords: number[][],
      properties: Properties[],
      waypoints: string[],
      loadedFuel: number,
      departureTime: number,
   }[]
   deviationCurve: Deviation[],
   fuelUnit: FuelUnit,
   fuelCurve: [number, FuelPoint[]][],
};

export const PropertiesRecord = GenRecord<Properties>({
   active: true,
   altitude: 1000,
   vor: {
      ident: "",
      freq: 0,
      obs: 0
   },
   wind: {
      direction: 0,
      speed: 0
   },
   ias: 90,
   oat: 20,

   dist: 0,
   dur: {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      full: 0
   },

   TC: 0,
   CH: 0,
   MH: 0,
   dev: 0,

   GS: 0,
   tas: 0,

   ata: -1,

   conso: 0,
   curFuel: 0,

   magVar: 0,
   remark: "",
}, {
});

export const h125Curve: [number, FuelPoint[]][] = [
   [100, [
      [[-40, 0, 177], [17, 0, 189], [30, 0, 179], [40, 0, 165], [50, 0, 151]],
      [[-40, 2000, 173], [7, 2000, 184], [25, 2000, 170], [50, 2000, 139]],
      [[-40, 4000, 173], [-4, 4000, 180], [22, 4000, 160], [50, 4000, 126]],
      [[-40, 6000, 173], [-15, 6000, 177], [17, 6000, 151], [50, 6000, 122]],
      [[-40, 8000, 173], [-30, 8000, 177], [-10, 8000, 158], [15, 8000, 142], [50, 8000, 111]],
      [[-40, 10000, 173], [-15, 10000, 151], [10, 10000, 134], [50, 10000, 103]],
      [[-40, 12000, 158], [-20, 12000, 142], [5, 12000, 126], [50, 12000, 92]],
      [[-40, 14000, 146], [-20, 14000, 132], [0, 14000, 120], [50, 14000, 84]],
      [[-40, 16000, 135], [-25, 16000, 123], [-10, 16000, 116], [2, 16000, 110], [50, 16000, 75]],
      [[-40, 25000, 135], [-25, 25000, 123], [-10, 25000, 116], [2, 25000, 110], [50, 25000, 75]],
   ]],
]


export const getDatasets = ({ fuelCurve, oat }: {
   fuelCurve: [number, FuelPoint[]][]
   oat: Temp
}) => {
   return fuelCurve.map(elem => {
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
   })
}

export const getFuelConsumption = ({ fuelCurve, oat, altitude }: {
   fuelCurve: [number, FuelPoint[]][]
   oat: Temp,
   altitude: number
}) => {
   const dataset = getDatasets({ fuelCurve, oat })[0]

   const index = dataset.findIndex(elem => elem[0] >= altitude)

   if (index === -1) {
      return dataset[dataset.length - 1][1]
   } else if ((dataset[index][0] === altitude) || (index === 0)) {
      return dataset[index][1]
   } else {
      return dataset[index - 1][1] + (dataset[index][1] - dataset[index - 1][1]) * (oat - dataset[index - 1][0]) / (dataset[index][0] - dataset[index - 1][0])
   }
}

export const ExportNavRecord = GenRecord<ExportNav>({
   __EXPORT_NAV__: true,

   data: [],
   deviationCurve: [[0, 0], [360, 0]],
   fuelCurve: h125Curve,
   fuelUnit: 'liter'
}, {
   data: {
      array: true, record: {
         name: "string",
         shortName: "string",
         order: "number",
         coords: {
            array: true, record: {
               array: true, record: "number"
            }
         },
         properties: {
            array: true, record: PropertiesRecord
         },
         waypoints: {
            array: true, record: "string"
         },
         loadedFuel: 'number',
         departureTime: 'number',
      }
   },
   deviationCurve: {
      array: true,
      record: {
         array: true,
         record: 'number'
      }
   },
   fuelConsumption: 'number',
   fuelUnit: 'string'
})


export type ImportNav = {
   __IMPORT_NAV__: true,
};

export const ImportNavRecord = GenRecord<ImportNav>({
   __IMPORT_NAV__: true,
}, {})

