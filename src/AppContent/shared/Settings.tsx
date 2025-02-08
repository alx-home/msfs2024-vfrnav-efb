import { Type } from "./Types";

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

export const SharedSettingsRecord: Type<SharedSettings> = {
   speed: true,
   adjustHeading: true,
   adjustTime: true,
   SIAAuth: true,
   SIAAddr: true,
   SIAAZBAAddr: true,
   SIAAZBADateAddr: true,

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
