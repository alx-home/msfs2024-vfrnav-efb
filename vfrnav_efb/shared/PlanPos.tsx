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

import { TypeRecord } from './Types';


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

export const PlanePosRecord: TypeRecord<PlanePos> = {
  __PLANE_POS__: 'boolean',

  date: 'number',
  lat: 'number',
  lon: 'number',
  altitude: 'number',
  ground: 'number',
  heading: 'number',
  verticalSpeed: 'number',
  windVelocity: 'number',
  windDirection: 'number',


  defaultValues: {
    __PLANE_POS__: true,

    date: 0,
    lat: 0,
    lon: 0,
    altitude: 0,
    ground: 0,
    heading: 0,
    verticalSpeed: 0,
    windVelocity: 0,
    windDirection: 0
  }
}

export const PlanePosesRecord: TypeRecord<PlanePoses> = {
  __PLANE_POSES__: 'boolean',

  id: 'number',
  value: [
    PlanePosRecord
  ],

  defaultValues: {
    __PLANE_POSES__: true,

    id: 0,
    value: []
  }
}

export type PlaneRecord = {
  name: string,
  id: number,
  active: boolean,
  touchdown: number
}

export const PlaneRecordRecord: TypeRecord<PlaneRecord> = {
  name: 'string',
  id: 'number',
  active: 'boolean',
  touchdown: 'number',

  defaultValues: {
    name: '',
    id: 0,
    active: false,
    touchdown: 0
  }
}

export type PlaneRecords = {
  __RECORDS__: true,

  value: PlaneRecord[]
};

export const PlaneRecordsRecord: TypeRecord<PlaneRecords> = {
  __RECORDS__: 'boolean',

  value: [PlaneRecordRecord],

  defaultValues: {
    __RECORDS__: true,

    value: [{
      name: 'undef',
      id: -1,
      active: true,
      // record: [
      //    {
      //       date: 0,
      //       lat: 0,
      //       lon: 0,
      //       ground: 0,
      //       altitude: 0,
      //       heading: 0,
      //       verticalSpeed: 0,
      //       windDirection: 0,
      //       windVelocity: 0
      //    }
      // ],
      touchdown: 0
    }]
  }
};


export type RemoveRecord = {
  __REMOVE_RECORD__: true

  id: number
}

export type GetRecord = {
  __GET_RECORD__: true

  id: number
}

export type ActiveRecord = {
  __ACTIVE_RECORD__: true

  id: number,
  active: boolean
}

export type EditRecord = {
  __EDIT_RECORD__: true

  id: number
  name: string
}

export const GetRecordRecord: TypeRecord<GetRecord> = {
  __GET_RECORD__: 'boolean',

  id: 'number',

  defaultValues: {
    __GET_RECORD__: true,

    id: 0
  }
}

export const RemoveRecordRecord: TypeRecord<RemoveRecord> = {
  __REMOVE_RECORD__: 'boolean',

  id: 'number',

  defaultValues: {
    __REMOVE_RECORD__: true,

    id: 0
  }
}

export const ActiveRecordRecord: TypeRecord<ActiveRecord> = {
  __ACTIVE_RECORD__: 'boolean',

  id: 'number',
  active: 'boolean',

  defaultValues: {
    __ACTIVE_RECORD__: true,

    id: 0,
    active: false
  }
}

export const EditRecordRecord: TypeRecord<EditRecord> = {
  __EDIT_RECORD__: 'boolean',

  id: 'number',
  name: 'string',

  defaultValues: {
    __EDIT_RECORD__: true,

    id: 0,
    name: ""
  }
}