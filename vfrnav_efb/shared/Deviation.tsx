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


export type SetDeviationCurve = {
  __DEVIATION_CURVE__: true,

  name: string,
  date: number,
  curve: [number, number][],
}

export type GetDeviationCurve = {
  __GET_DEVIATION_CURVE__: true,

  name: string,
}

export type GetDeviationPresets = {
  __GET_DEVIATION_PRESETS__: true,
}

export type DeviationPresets = {
  __DEVIATION_PRESETS__: true,

  data: {
    name: string,
    date: number,
    remove: boolean
  }[]
}

export type DeleteDeviationPreset = {
  __DELETE_DEVIATION_PRESET__: true,

  name: string,
  date: number
}


export type DefaultDeviationPreset = {
  __DEFAULT_DEVIATION_PRESET__: true,

  name: string
  date: number
}

export const DefaultDeviationPresetRecord = GenRecord<DefaultDeviationPreset>({
  __DEFAULT_DEVIATION_PRESET__: true,

  name: '',
  date: 0
}, {});

export const DeleteDeviationPresetRecord = GenRecord<DeleteDeviationPreset>({
  __DELETE_DEVIATION_PRESET__: true,

  name: '',
  date: 0
}, {});

export const GetDeviationPresetsRecord = GenRecord<GetDeviationPresets>({
  __GET_DEVIATION_PRESETS__: true,
}, {});

export const DeviationPresetsRecord = GenRecord<DeviationPresets>({
  __DEVIATION_PRESETS__: true,

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

export const GetDeviationCurveRecord = GenRecord<GetDeviationCurve>({
  __GET_DEVIATION_CURVE__: true,

  name: ""
}, {});

export const SetDeviationCurveRecord = GenRecord<SetDeviationCurve>({
  __DEVIATION_CURVE__: true,

  name: "",
  date: 0,
  curve: []
}, {
  curve: {
    array: true,
    record: {
      array: true,
      record: 'number'
    }
  }
});
