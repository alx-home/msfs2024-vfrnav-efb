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


export type ExportPdfs = {
   __EXPORT_PDFS__: true

   id?: number
   pdfs: {
      name: string
      id: string
      num_blobs: number
   }[]
};

export const ExportPdfsRecord = GenRecord<ExportPdfs>({
   "__EXPORT_PDFS__": true,

   pdfs: []
}, {
   id: { optional: true, record: 'number' },
   pdfs: {
      array: true,
      record: {
         name: 'string',
         id: 'string',
         num_blobs: 'number'
      }
   }
});

export type PdfBlob = {
   __PDF_BLOB__: true

   pdf_id?: number
   document: number
   id: number
   data: string
};

export const PdfBlobRecord = GenRecord<PdfBlob>({
   "__PDF_BLOB__": true,

   document: -1,
   id: -1,
   data: ''
}, {
   pdf_id: { optional: true, record: 'number' },
});

export type PdfProcessed = {
   __PDF_PROCESSED__: true

   id: number
};

export const PdfProcessedRecord = GenRecord<PdfProcessed>({
   "__PDF_PROCESSED__": true,

   id: 0
}, {});
