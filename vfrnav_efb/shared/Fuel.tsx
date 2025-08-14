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

export type Tank = {
  capacity: number
  value: number
}

export type Fuel = {
  __FUEL__: true,

  tanks: Tank[],
}

export type SetFuelCurve = {
  __FUEL_CURVE__: true,

  name: string,
  date: number,
  curve: {
    thrust: number,
    points: {
      temp: number,
      alt: number,
      conso: number
    }[][]
  }[],
}

export type GetFuelCurve = {
  __GET_FUEL_CURVE__: true,

  name: string,
}

export type GetFuelPresets = {
  __GET_FUEL_PRESETS__: true,
}

export type FuelPresets = {
  __FUEL_PRESETS__: true,

  data: {
    name: string,
    date: number,
    remove: boolean
  }[]
}

export type DeleteFuelPreset = {
  __DELETE_FUEL_PRESET__: true,

  name: string,
  date: number
}

export type GetFuel = {
  __GET_FUEL__: true,
};

export const DeleteFuelPresetRecord = GenRecord<DeleteFuelPreset>({
  __DELETE_FUEL_PRESET__: true,

  name: '',
  date: 0
}, {});

export const GetFuelPresetsRecord = GenRecord<GetFuelPresets>({
  __GET_FUEL_PRESETS__: true,
}, {});

export const FuelPresetsRecord = GenRecord<FuelPresets>({
  __FUEL_PRESETS__: true,

  data: []
}, {
  data: {
    array: true,
    record: GenRecord<{
      name: string,
      date: number,
      remove: boolean
    }>({
      name: '',
      date: 0,
      remove: false
    }, {})
  }
});

export const GetFuelCurveRecord = GenRecord<GetFuelCurve>({
  __GET_FUEL_CURVE__: true,

  name: ""
}, {});

export const SetFuelCurveRecord = GenRecord<SetFuelCurve>({
  __FUEL_CURVE__: true,

  name: "",
  date: 0,
  curve: []
}, {
  curve: {
    array: true,
    record: GenRecord<{
      thrust: number,
      points: {
        temp: number,
        alt: number,
        conso: number
      }[][]
    }>({
      thrust: 100,
      points: []
    }, {
      points: {
        array: true,
        record: {
          array: true,
          record: GenRecord<{
            temp: number,
            alt: number,
            conso: number
          }>({
            temp: 0,
            alt: 0,
            conso: 0
          }, {})
        }
      }
    })
  }
});

export const TankRecord = GenRecord<Tank>({
  capacity: 0,
  value: 0
}, {});

export const FuelRecord = GenRecord<Fuel>({
  __FUEL__: true,

  tanks: []
}, {
  tanks: { array: true, record: TankRecord }
});


export const GetFuelRecord = GenRecord<GetFuel>({
  __GET_FUEL__: true,
}, {})
