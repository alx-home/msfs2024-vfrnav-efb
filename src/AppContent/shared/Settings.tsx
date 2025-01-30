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

   typeUUID: "SharedSettings"
};
