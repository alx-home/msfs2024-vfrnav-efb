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

export type Deviation = {
   x: number;
   y: number;
};

export type Properties = {
   name: string,
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

   coords: number[][],
   deviations: Deviation[]

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
      properties: Properties[]
   }[]
};

export const PropertiesRecord = GenRecord<Properties>({
   name: "",
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

   coords: [],
   deviations: [],

   GS: 0,
   tas: 0,

   ata: -1,

   conso: 0,
   curFuel: 0,

   magVar: 0,
   remark: "",
}, {
   coords: {
      array: true,
      record: {
         array: true, record: "number"
      }
   },
   deviations: {
      array: true,
      record: {
         x: "number",
         y: "number"
      }
   }
});

export const ExportNavRecord = GenRecord<ExportNav>({
   __EXPORT_NAV__: true,

   data: []
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
         }
      }
   }
})


export type ImportNav = {
   __IMPORT_NAV__: true,
};

export const ImportNavRecord = GenRecord<ImportNav>({
   __IMPORT_NAV__: true,
}, {})

