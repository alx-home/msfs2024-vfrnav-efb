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


export type PlanePos = {
  __PLANE_POS__: true,

  date: number,
  lat: number,
  lon: number,
  altitude: number,
  ground: number,
  heading: number,
  verticalSpeed: number,
  windVelocity: number,
  windDirection: number
}

export type PlanePoses = {
  __PLANE_POSES__: true,

  id: number,
  value: PlanePos[]
};

export const PlanePosRecord = GenRecord<PlanePos>({
  __PLANE_POS__: true,

  date: -1,
  lat: -1,
  lon: -1,
  altitude: -1,
  ground: -1,
  heading: -1,
  verticalSpeed: -1,
  windVelocity: -1,
  windDirection: -1
}, {});


export const PlanePosesRecord = GenRecord<PlanePoses>({
  __PLANE_POSES__: true,

  id: 0,
  value: []
}, {
  value: { array: true, record: PlanePosRecord }
})

export type PlaneRecord = {
  name: string,
  id: number,
  active: boolean,
  touchdown: number
}

export const PlaneRecordRecord = GenRecord<PlaneRecord>({
  name: 'undef',
  id: -1,
  active: false,
  touchdown: -1
}, {})

export type PlaneRecords = {
  __RECORDS__: true,

  value: PlaneRecord[]
};

export const PlaneRecordsRecord = GenRecord<PlaneRecords>({
  __RECORDS__: true,

  value: []
}, {
  value: { array: true, record: PlaneRecordRecord }
});


export type RemoveRecord = {
  __REMOVE_RECORD__: true

  id: number
}

export type GetRecord = {
  __GET_RECORD__: true

  id: number
}

export type EditRecord = {
  __EDIT_RECORD__: true

  id: number
  name: string
}

export const GetRecordRecord = GenRecord<GetRecord>({
  __GET_RECORD__: true,

  id: -1
}, {});

export const RemoveRecordRecord = GenRecord<RemoveRecord>({
  __REMOVE_RECORD__: true,

  id: -1
}, {})

export const EditRecordRecord = GenRecord<EditRecord>({
  __EDIT_RECORD__: true,

  id: -1,
  name: "undef"
}, {})