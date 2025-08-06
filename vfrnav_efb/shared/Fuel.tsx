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

export type GetFuel = {
  __GET_FUEL__: true,
};

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
