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

export type ExportNav = {
   __EXPORT_NAV__: true,

   data: { name: string, shortName: string, order: number, data: string }[]
};

export const ExportNavRecord = GenRecord<ExportNav>({
   __EXPORT_NAV__: true,

   data: []
}, {
   data: {
      array: true, record: {
         name: "string",
         shortName: "string",
         order: "number",
         data: "string"
      }
   }
})


export type ImportNav = {
   __IMPORT_NAV__: true,
};

export const ImportNavRecord = GenRecord<ImportNav>({
   __IMPORT_NAV__: true,
}, {})

