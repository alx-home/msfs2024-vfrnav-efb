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

export type GetDate = {
   __GET_DATE__: true
};

export const GetDateRecord = GenRecord<GetDate>({
   __GET_DATE__: true
}, {});

export type DateResponse = {
   __DATE_RESPONSE__: true,

   date: number,
   timezone: number
};

export const DateResponseRecord = GenRecord<DateResponse>({
   __DATE_RESPONSE__: true,

   date: 0,
   timezone: 0
}, {})