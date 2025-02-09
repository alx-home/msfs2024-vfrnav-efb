import { Type } from "./Types";

export type LayerSetting = {
   active: boolean,
   enabled: boolean,
   minZoom?: number,
   maxZoom?: number
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
   OACI: LayerSetting,
   germany: LayerSetting,
   USSectional: LayerSetting,
   USIFR: {
      high: LayerSetting,
      low: LayerSetting
   },
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

const LayerRecord = {
   active: true,
   enabled: true,
   maxZoom: false,
   minZoom: false,
};

const ColorRecord = {
   red: true,
   green: true,
   blue: true,
   alpha: true
}

export const SharedSettingsRecord: Type<SharedSettings> = {
   speed: true,
   adjustHeading: true,
   adjustTime: true,
   SIAAuth: true,
   SIAAddr: true,
   SIAAZBAAddr: true,
   SIAAZBADateAddr: true,

   azba: LayerRecord,
   OACI: LayerRecord,
   germany: LayerRecord,
   USSectional: LayerRecord,
   USIFR: {
      high: LayerRecord,
      low: LayerRecord
   },
   opentopo: LayerRecord,
   mapforfree: LayerRecord,
   googlemap: LayerRecord,
   openstreet: LayerRecord,

   map: {
      text: {
         maxSize: true,
         minSize: true,
         borderSize: true,
         color: ColorRecord,
         borderColor: ColorRecord
      },
      azba: {
         inactiveHighColor: ColorRecord,
         inactiveLowColor: ColorRecord,
         activeHighColor: ColorRecord,
         activeLowColor: ColorRecord,
         range: true
      },
      markerSize: true
   },

   typeUUID: "SharedSettings"
};
