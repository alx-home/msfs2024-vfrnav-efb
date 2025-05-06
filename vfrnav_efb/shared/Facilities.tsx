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

/* eslint-disable no-unused-vars */
import { GenRecord } from "./Types"

export const enum FrequencyType {
  None = 0,
  ATIS = 1,
  Multicom = 2,
  Unicom = 3,
  CTAF = 4,
  Ground = 5,
  Tower = 6,
  Clearance = 7,
  Approach = 8,
  Departure = 9,
  Center = 10,
  FSS = 11,
  AWOS = 12,
  ASOS = 13,
  /** Clearance Pre-Taxi*/
  CPT = 14,
  /** Remote Clearance Delivery */
  GCO = 15
};

export const FrequencyTypeStr = [
  'Other',
  'ATIS',
  'Multicom',
  'Unicom',
  'CTAF',
  'Ground',
  'Tower',
  'Clearance',
  'Approach',
  'Departure',
  'Center',
  'FSS',
  'AWOS',
  'ASOS',
  'CPT',
  'GCO',
];

export declare enum RunwaySurfaceType {
  Concrete = 0,
  Grass = 1,
  WaterFSX = 2,
  GrassBumpy = 3,
  Asphalt = 4,
  ShortGrass = 5,
  LongGrass = 6,
  HardTurf = 7,
  Snow = 8,
  Ice = 9,
  Urban = 10,
  Forest = 11,
  Dirt = 12,
  Coral = 13,
  Gravel = 14,
  OilTreated = 15,
  SteelMats = 16,
  Bituminous = 17,
  Brick = 18,
  Macadam = 19,
  Planks = 20,
  Sand = 21,
  Shale = 22,
  Tarmac = 23,
  WrightFlyerTrack = 24,
  Ocean = 26,
  Water = 27,
  Pond = 28,
  Lake = 29,
  River = 30,
  WasteWater = 31,
  Paint = 32
};

export const RunwaySurfaceTypeStr = [
  'Concrete',
  'Grass',
  'WaterFSX',
  'GrassBumpy',
  'Asphalt',
  'ShortGrass',
  'LongGrass',
  'HardTurf',
  'Snow',
  'Ice',
  'Urban',
  'Forest',
  'Dirt',
  'Coral',
  'Gravel',
  'OilTreated',
  'SteelMats',
  'Bituminous',
  'Brick',
  'Macadam',
  'Planks',
  'Sand',
  'Shale',
  'Tarmac',
  'WrightFlyerTrack',
  'Ocean',
  'Water',
  'Pond',
  'Lake',
  'River',
  'WasteWater',
  'Paint',
];

export enum AirportPrivateType {
  Uknown = 0,
  Public = 1,
  Military = 2,
  Private = 3
}

export type Frequency = {
  name: string
  icao: string
  value: number
  type: FrequencyType
};

export const FrequencyRecord = GenRecord<Frequency>({
  name: "undef",
  icao: "undef",
  value: -1,
  type: FrequencyType.ASOS
}, {});

export type Runway = {
  designation: string

  length: number
  width: number
  direction: number
  elevation: number
  surface: RunwaySurfaceType

  latitude: number
  longitude: number
};

export const RunwayRecord = GenRecord<Runway>({
  designation: "undef",

  length: -1,
  width: -1,
  direction: -1,
  elevation: -1,
  surface: 0,

  latitude: -1,
  longitude: -1,
}, {});

export type AirportFacility = {
  icao: string
  lat: number
  lon: number
  towered: boolean

  airportClass: number
  airspaceType: number

  bestApproach: string

  fuel1: string
  fuel2: string

  airportPrivateType: AirportPrivateType

  frequencies: Frequency[]

  runways: Runway[]

  transitionAlt: number
  transitionLevel: number
};

export const AirportFacilityRecord = GenRecord<AirportFacility>({
  icao: "undef",
  lat: -1,
  lon: -1,
  towered: false,

  airportClass: -1,
  airspaceType: -1,

  bestApproach: "undef",

  fuel1: "undef",
  fuel2: "undef",

  airportPrivateType: 0,

  frequencies: [],

  runways: [],

  transitionAlt: -1,
  transitionLevel: -1
}, {
  // todo shall be mandatory...
  frequencies: { array: true, record: FrequencyRecord },
  runways: { array: true, record: RunwayRecord }
});

export type Facilities = {
  __FACILITIES__: true,

  facilities: AirportFacility[]
}

export const FacilitiesRecord = GenRecord<Facilities>({
  __FACILITIES__: true,

  facilities: []
}, {
  facilities: { array: true, record: AirportFacilityRecord }
})

export type Metar = {
  __METAR__: true,

  metar?: string,
  taf?: string,
  localMetar?: string,
  localTaf?: string,
  cavok?: boolean,
  icao: string
}

export const MetarRecord = GenRecord<Metar>({
  __METAR__: true,

  icao: "undef"
}, {
  metar: { optional: true, record: 'string' },
  taf: { optional: true, record: 'string' },
  localMetar: { optional: true, record: 'string' },
  localTaf: { optional: true, record: 'string' },
  cavok: { optional: true, record: 'boolean' },
})

export type GetFacilities = {
  __GET_FACILITIES__: true,

  lat: number
  lon: number
};

export const GetFacilitiesRecord = GenRecord<GetFacilities>({
  __GET_FACILITIES__: true,

  lat: -1,
  lon: -1
}, {})


export type GetMetar = {
  __GET_METAR__: true,

  icao: string,
  lat: number,
  lon: number
};

export const GetMetarRecord = GenRecord<GetMetar>({
  __GET_METAR__: true,

  icao: "undef",
  lat: -1,
  lon: -1
}, {})