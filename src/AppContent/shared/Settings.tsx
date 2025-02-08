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
