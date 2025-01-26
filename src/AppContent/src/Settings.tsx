import { createContext, PropsWithChildren, useMemo, useState } from "react";

export type Settings = {
   speed: number,
   adjustHeading: boolean,
   adjustTime: boolean,

   OACIEnabled: boolean,
   germanyEnabled: boolean,
   USSectionalEnabled: boolean,
   USIFRHighEnabled: boolean,
   USIFRLowEnabled: boolean,
   openTopoEnabled: boolean,
   mapForFreeEnabled: boolean,
   googleMapEnabled: boolean,
   openStreetEnabled: boolean,

   setSpeed: (_speed: number) => void,
   setAdjustHeading: (_enable: boolean) => void,
   setAdjustTime: (_enable: boolean) => void,

   setOACIEnabled: (_enable: boolean) => void
   setGermanyEnabled: (_enable: boolean) => void
   setUSSectionalEnabled: (_enable: boolean) => void
   setUSIFRHighEnabled: (_enable: boolean) => void
   setUSIFRLowEnabled: (_enable: boolean) => void
   setOpenTopoEnabled: (_enable: boolean) => void
   setMapForFreeEnabled: (_enable: boolean) => void
   setGoogleMapEnabled: (_enable: boolean) => void
   setOpenStreetEnabled: (_enable: boolean) => void
};

export const SettingsContext = createContext<Settings | undefined>(undefined);

const SettingsContextProvider = ({ children }: PropsWithChildren) => {
   const [speed, setSpeed] = useState(95);
   const [adjustHeading, setAdjustHeading] = useState(true);
   const [adjustTime, setAdjustTime] = useState(true);

   const [OACIEnabled, setOACIEnabled] = useState(true);
   const [germanyEnabled, setGermanyEnabled] = useState(true);
   const [USSectionalEnabled, setUSSectionalEnabled] = useState(true);
   const [mapForFreeEnabled, setMapForFreeEnabled] = useState(true);
   const [googleMapEnabled, setGoogleMapEnabled] = useState(true);
   const [USIFRHighEnabled, setUSIFRHighEnabled] = useState(false);
   const [USIFRLowEnabled, setUSIFRLowEnabled] = useState(false);
   const [openTopoEnabled, setOpenTopoEnabled] = useState(false);
   const [openStreetEnabled, setOpenStreetEnabled] = useState(false);

   const provider = useMemo(() => ({
      speed: speed,
      adjustHeading: adjustHeading,
      adjustTime: adjustTime,

      OACIEnabled: OACIEnabled,
      germanyEnabled: germanyEnabled,
      USSectionalEnabled: USSectionalEnabled,
      USIFRHighEnabled: USIFRHighEnabled,
      USIFRLowEnabled: USIFRLowEnabled,
      openTopoEnabled: openTopoEnabled,
      mapForFreeEnabled: mapForFreeEnabled,
      googleMapEnabled: googleMapEnabled,
      openStreetEnabled: openStreetEnabled,

      setOACIEnabled: setOACIEnabled,
      setGermanyEnabled: setGermanyEnabled,
      setUSSectionalEnabled: setUSSectionalEnabled,
      setUSIFRHighEnabled: setUSIFRHighEnabled,
      setUSIFRLowEnabled: setUSIFRLowEnabled,
      setOpenTopoEnabled: setOpenTopoEnabled,
      setMapForFreeEnabled: setMapForFreeEnabled,
      setGoogleMapEnabled: setGoogleMapEnabled,
      setOpenStreetEnabled: setOpenStreetEnabled,

      setSpeed: setSpeed,
      setAdjustHeading: setAdjustHeading,
      setAdjustTime: setAdjustTime,
   }), [speed, adjustHeading, adjustTime, OACIEnabled, germanyEnabled, USSectionalEnabled, USIFRHighEnabled, USIFRLowEnabled, openTopoEnabled, mapForFreeEnabled, googleMapEnabled, openStreetEnabled]);

   return (
      <SettingsContext.Provider
         value={provider}
      >
         {children}
      </SettingsContext.Provider>
   );
};

export default SettingsContextProvider;