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
   plane: LayerSetting,
   airports: LayerSetting & AirportLayerOptions,
   OACI: LayerSetting,
   germany: LayerSetting,
   openflightmaps: LayerSetting,
   openflightmapsBase: LayerSetting,
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
   plane: LayerRecord,
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
   openflightmaps: LayerRecord,
   openflightmapsBase: LayerRecord,
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

export const SharedSettingsDefault: SharedSettings = {
   speed: 95,
   adjustHeading: true,
   adjustTime: true,
   SIAAuth: __SIA_AUTH__,
   SIAAddr: __SIA_ADDR__,
   SIAAZBAAddr: __SIA_AZBA_ADDR__,
   SIAAZBADateAddr: __SIA_AZBA_DATE_ADDR__,

   airports: {
      helipads: false,
      waterRunway: true,
      hardRunway: true,
      softRunway: true,
      private: false,
      enabled: true,
      active: true,
      minZoom: 8
   },
   azba: {
      enabled: true,
      active: true,
      minZoom: 0,
      maxZoom: 12
   },
   plane: {
      enabled: false,
      active: false,
   },
   OACI: {
      enabled: true,
      active: true,
      minZoom: 0,
      maxZoom: 12
   },
   germany: {
      enabled: true,
      active: false,
   },
   openflightmaps: {
      enabled: true,
      active: true,
   },
   openflightmapsBase: {
      enabled: true,
      active: true,
   },
   USSectional: {
      enabled: true,
      active: false
   },
   USIFRHigh: {
      enabled: false,
      active: false
   },
   USIFRLow: {
      enabled: false,
      active: false
   },
   opentopo: {
      enabled: false,
      active: false
   },
   mapforfree: {
      enabled: true,
      active: false
   },
   googlemap: {
      enabled: true,
      active: true
   },
   openstreet: {
      enabled: false,
      active: false
   },

   map: {
      azba: {
         inactiveHighColor: {
            red: 0,
            green: 180,
            blue: 255,
            alpha: 0.1
         },
         inactiveLowColor: {
            red: 0,
            green: 180,
            blue: 255,
            alpha: 0.2
         },
         activeHighColor: {
            red: 255,
            green: 0,
            blue: 0,
            alpha: 0.1
         },
         activeLowColor: {
            red: 255,
            green: 0,
            blue: 0,
            alpha: 0.2
         },
         range: 20
      },
      text: {
         maxSize: 22,
         minSize: 10,
         borderSize: 10,
         color: {
            red: 31,
            green: 41,
            blue: 55,
            alpha: 0.8
         },
         borderColor: {
            red: 255,
            green: 255,
            blue: 255,
            alpha: 0.8
         },
      },
      markerSize: 50
   }
};