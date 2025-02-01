import { Type } from "./Types";

export type SharedSettings = {
   speed: number,
   adjustHeading: boolean,
   adjustTime: boolean,
   SIAAuth: string,
   SIAAddr: string,

   OACIEnabled: boolean,
   germanyEnabled: boolean,
   USSectionalEnabled: boolean,
   USIFRHighEnabled: boolean,
   USIFRLowEnabled: boolean,
   openTopoEnabled: boolean,
   mapForFreeEnabled: boolean,
   googleMapEnabled: boolean,
   openStreetEnabled: boolean,

   map: {
      text: {
         maxSize: number,
         minSize: number,
         borderSize: number,
         color: {
            red: number,
            green: number,
            blue: number,
            alpha: number,
         },
         borderColor: {
            red: number,
            green: number,
            blue: number,
            alpha: number,
         },
      },
      markerSize: number
   }
};

export const SharedSettingsDefault = {
   speed: 95,
   adjustHeading: true,
   adjustTime: true,
   SIAAuth: __SIA_AUTH__,
   SIAAddr: __SIA_ADDR__,

   OACIEnabled: true,
   germanyEnabled: true,
   USSectionalEnabled: true,
   USIFRHighEnabled: false,
   USIFRLowEnabled: false,
   openTopoEnabled: false,
   mapForFreeEnabled: true,
   googleMapEnabled: true,
   openStreetEnabled: false,

   map: {
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

export const SharedSettingsRecord: Type<SharedSettings> = {
   speed: true,
   adjustHeading: true,
   adjustTime: true,
   SIAAuth: true,
   SIAAddr: true,

   OACIEnabled: true,
   germanyEnabled: true,
   USSectionalEnabled: true,
   USIFRHighEnabled: true,
   USIFRLowEnabled: true,
   openTopoEnabled: true,
   mapForFreeEnabled: true,
   googleMapEnabled: true,
   openStreetEnabled: true,

   map: true,

   typeUUID: "SharedSettings"
};
