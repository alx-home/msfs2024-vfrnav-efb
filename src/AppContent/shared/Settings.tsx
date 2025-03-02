import { TypeRecord } from "./Types";

export type LayerSetting = {
   active: boolean,
   enabled: boolean,
   minZoom?: number,
   maxZoom?: number
}

export type AirportLayerOptions = {
   hardRunway: boolean
   softRunway: boolean
   waterRunway: boolean
   private: boolean
   helipads: boolean
}

export type Color = {
   red: number
   green: number
   blue: number
   alpha: number
};

export type SharedSettings = {
   speed: number,
   adjustHeading: boolean,
   adjustTime: boolean,
   SIAAuth: string,
   SIAAddr: string,
   SIAAZBAAddr: string,
   SIAAZBADateAddr: string,

   azba: LayerSetting,
   airports: LayerSetting & AirportLayerOptions,
   OACI: LayerSetting,
   germany: LayerSetting,
   USSectional: LayerSetting,
   USIFRHigh: LayerSetting,
   USIFRLow: LayerSetting,
   opentopo: LayerSetting,
   mapforfree: LayerSetting,
   googlemap: LayerSetting,
   openstreet: LayerSetting,

   map: {
      text: {
         maxSize: number,
         minSize: number,
         borderSize: number,
         color: Color,
         borderColor: Color,
      },
      azba: {
         inactiveHighColor: Color,
         inactiveLowColor: Color,
         activeHighColor: Color,
         activeLowColor: Color,
         range: number
      },
      markerSize: number
   }
};

const LayerRecord: TypeRecord<LayerSetting> = {
   active: 'boolean',
   enabled: 'boolean',
   maxZoom: { optional: true, record: 'number' },
   minZoom: { optional: true, record: 'number' },
};

const ColorRecord: TypeRecord<Color> = {
   red: 'number',
   green: 'number',
   blue: 'number',
   alpha: 'number'
}

export const SharedSettingsRecord: TypeRecord<SharedSettings> = {
   speed: 'number',
   adjustHeading: 'boolean',
   adjustTime: 'boolean',
   SIAAuth: 'string',
   SIAAddr: 'string',
   SIAAZBAAddr: 'string',
   SIAAZBADateAddr: 'string',

   azba: LayerRecord,
   airports: {
      ...LayerRecord, ...{
         hardRunway: 'boolean',
         softRunway: 'boolean',
         waterRunway: 'boolean',
         private: 'boolean',
         helipads: 'boolean'
      }
   },
   OACI: LayerRecord,
   germany: LayerRecord,
   USSectional: LayerRecord,
   USIFRHigh: LayerRecord,
   USIFRLow: LayerRecord,
   opentopo: LayerRecord,
   mapforfree: LayerRecord,
   googlemap: LayerRecord,
   openstreet: LayerRecord,

   map: {
      text: {
         maxSize: 'number',
         minSize: 'number',
         borderSize: 'number',
         color: ColorRecord,
         borderColor: ColorRecord
      },
      azba: {
         inactiveHighColor: ColorRecord,
         inactiveLowColor: ColorRecord,
         activeHighColor: ColorRecord,
         activeLowColor: ColorRecord,
         range: 'number'
      },
      markerSize: 'number'
   }
};
