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
export type FuelPoint = [Alt, [Temp, Fuel][]]

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
      [0, [[-40, 177], [17, 189], [30, 179], [40, 165], [50, 151]]],
      [2000, [[-40, 173], [7, 184], [25, 170], [50, 139]]],
      [4000, [[-40, 173], [-4, 180], [22, 160], [50, 126]]],
      [6000, [[-40, 173], [-15, 177], [17, 151], [50, 122]]],
      [8000, [[-40, 173], [-30, 177], [-10, 158], [15, 142], [50, 111]]],
      [10000, [[-40, 173], [-15, 151], [10, 134], [50, 103]]],
      [12000, [[-40, 158], [-20, 142], [5, 126], [50, 92]]],
      [14000, [[-40, 146], [-20, 132], [0, 120], [50, 84]]],
      [16000, [[-40, 135], [-25, 123], [-10, 116], [2, 110], [50, 75]]],
      [25000, [[-40, 135], [-25, 123], [-10, 116], [2, 110], [50, 75]]],
   ]],
]


export const getDatasets = ({ fuelCurve, oat }: {
   fuelCurve: [number, FuelPoint[]][]
   oat: Temp
}) => {
   return fuelCurve.map(elem => {
      const [, curve] = elem;

      return curve.map((points): [Alt, Fuel, boolean] => {
         const [alt, point] = points;
         const maxTempIndex = point.findIndex(elem => elem[0] >= oat);

         if (maxTempIndex === -1) {
            return [alt, point[point.length - 1][1], true]
         } else {
            const maxTemp = point[maxTempIndex]

            if (maxTemp[0] === oat) {
               return [alt, maxTemp[1], false]
            } else if (maxTempIndex === 0) {
               return [alt, maxTemp[1], true]
            } else {
               const minTemp = point[maxTempIndex - 1]
               const ratio = (oat - minTemp[0]) / (maxTemp[0] - minTemp[0]);

               return [alt, minTemp[1] + (maxTemp[1] - minTemp[1]) * ratio, true]
            }
         }
      })
   })
}

export const getFuelConsumption = ({ fuelCurve, oat, altitude }: {
   fuelCurve: [number, FuelPoint[]][]
   oat: Temp,
   altitude: number
}): number => {

   const maxAltIndex = fuelCurve[0][1].findIndex(elem => elem[0] >= altitude);


   const interpolate = (data: [Temp, Fuel][]) => {
      const maxOatIndex = data.findIndex(elem => elem[0] >= oat)

      if (maxOatIndex === -1) {
         return data[data.length - 1][1];
      } else {
         const maxOat = data[maxOatIndex];

         if (maxOat[0] === oat) {
            return maxOat[1]
         } else if (maxOatIndex === 0) {
            return maxOat[1]
         } else {
            const minOat = data[maxOatIndex - 1];

            return minOat[1] + (maxOat[1] - minOat[1]) * (oat - minOat[0]) / (maxOat[0] - minOat[0]);
         }
      }
   }

   if (maxAltIndex === -1) {
      const minAlt = fuelCurve[0][1][fuelCurve[0][1].length - 1];

      const maxOatIndex = minAlt[1].findIndex(elem => elem[0] >= oat)

      if (maxOatIndex === -1) {
         return minAlt[1][minAlt[1].length - 1][1];
      } else {
         const maxOat = minAlt[1][maxOatIndex];

         if (maxOat[0] === oat) {
            return maxOat[1]
         } else if (maxOatIndex === 0) {
            return maxOat[1]
         } else {
            const minOat = minAlt[1][maxOatIndex - 1];

            return minOat[1] + (maxOat[1] - minOat[1]) * (oat - minOat[0]) / (maxOat[0] - minOat[0]);
         }
      }

   } else {
      const maxAlt = fuelCurve[0][1][maxAltIndex];

      if (maxAltIndex === 0 || (altitude === maxAlt[0])) {

         return interpolate(maxAlt[1])
      } else {
         const minAlt = fuelCurve[0][1][maxAltIndex - 1];
         const min = interpolate(minAlt[1])
         const max = interpolate(maxAlt[1])

         return min + max * (altitude - minAlt[0]) / (maxAlt[0] - minAlt[0])
      }
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

