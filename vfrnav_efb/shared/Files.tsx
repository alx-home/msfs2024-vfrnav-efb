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

import { GenRecord } from "./Types";

export type FileExist = {
   __FILE_EXISTS__: true

   id: number,
   path: string
};

export type FileExistResponse = {
   __FILE_EXISTS_RESPONSE__: true

   id: number,
   result: boolean
};

export type OpenFile = {
   __OPEN_FILE__: true

   id: number

   path: string
   filters: {
      name: string,
      value: string[]
   }[]
};

export type OpenFileResponse = {
   __OPEN_FILE_RESPONSE__: true

   id: number,
   path: string
};

export type GetFile = {
   __GET_FILE__: true

   id: number,
   path: string
};

export type GetFileResponse = {
   __GET_FILE_RESPONSE__: true

   id: number,
   data: string
};

export const FileExistRecord = GenRecord<FileExist>({
   "__FILE_EXISTS__": true,

   path: "undef",
   id: -1
}, {});

export const FileExistResponseRecord = GenRecord<FileExistResponse>({
   "__FILE_EXISTS_RESPONSE__": true,

   id: -1,
   result: false,
}, {});

export const OpenFileRecord = GenRecord<OpenFile>({
   "__OPEN_FILE__": true,

   id: -1,

   path: "undef",
   filters: []
}, {
   filters: {
      array: true,
      record: {
         name: "string",
         value: { array: true, record: "string" }
      }
   }
});

export const OpenFileResponseRecord = GenRecord<OpenFileResponse>({
   "__OPEN_FILE_RESPONSE__": true,

   id: -1,
   path: "undef",
}, {});

export const GetFileRecord = GenRecord<GetFile>({
   "__GET_FILE__": true,

   id: -1,
   path: "undef"
}, {});

export const GetFileResponseRecord = GenRecord<GetFileResponse>({
   "__GET_FILE_RESPONSE__": true,

   id: -1,
   data: "undef",
}, {});