import { SharedSettings } from "@shared/Settings";

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