/* eslint-disable no-unused-vars */
import { TypeRecord } from "./Types"

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

export type Facilities = {
   facilities: AirportFacility[]
}

export const FacilitiesRecord: TypeRecord<Facilities> = {
   facilities: [{
      icao: 'string',
      lat: 'number',
      lon: 'number',
      towered: 'boolean',
      airportClass: 'number',
      airspaceType: 'number',
      bestApproach: 'string',
      fuel1: 'string',
      fuel2: 'string',
      airportPrivateType: 'number',
      frequencies: [
         {
            name: 'string',
            icao: 'string',
            value: 'number',
            type: 'number',
         }
      ],
      runways: [{
         designation: 'string',
         length: 'number',
         width: 'number',
         direction: 'number',
         elevation: 'number',
         surface: 'number',
         latitude: 'number',
         longitude: 'number',
      }],
      transitionAlt: 'number',
      transitionLevel: 'number',
   }]
}

export type Metar = {
   metar?: string,
   taf?: string,
   localMetar?: string,
   localTaf?: string,
   cavok?: boolean,
   icao: string
}

export const MetarRecord: TypeRecord<Metar> = {
   metar: { optional: true, record: 'string' },
   taf: { optional: true, record: 'string' },
   localMetar: { optional: true, record: 'string' },
   localTaf: { optional: true, record: 'string' },
   cavok: { optional: true, record: 'boolean' },
   icao: 'string'
}

export type GetFacilities = {
   __getfacilities__: true
   lat: number
   lon: number
};

export const GetFacilitiesRecord: TypeRecord<GetFacilities> = {
   __getfacilities__: 'boolean',
   lat: 'number',
   lon: 'number',
}


export type GetMetar = {
   __getmetar__: true
   icao: string,
   lat: number,
   lon: number
};

export const GetMetarRecord: TypeRecord<GetMetar> = {
   __getmetar__: 'boolean',
   icao: 'string',
   lat: 'number',
   lon: 'number'
}