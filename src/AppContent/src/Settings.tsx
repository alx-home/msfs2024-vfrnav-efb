import { sha512 } from "js-sha512";
import { createContext, Dispatch, JSXElementConstructor, PropsWithChildren, ReactElement, SetStateAction, useCallback, useMemo, useState } from "react";

export type Settings = {
   emptyPopup: ReactElement,
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

   setSpeed: (_speed: number) => void,
   setSIAAddr: (_addr: string) => void,
   setSIAAuth: (_token: string) => void,
   setAdjustHeading: (_enable: boolean) => void,
   setAdjustTime: (_enable: boolean) => void,

   getSIAPDF: (_icao: string) => Promise<Uint8Array>,
   setPopup: Dispatch<SetStateAction<ReactElement<unknown, string | JSXElementConstructor<unknown>>>>

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


const getSIAAuth = async (SIAAuth: string, SIAAddr: string) => {
   return btoa(JSON.stringify({ tokenUri: sha512(SIAAuth + "/api/" + SIAAddr.split('/api/')[1]) }));
}

const SIACache = new Map<string, Promise<Uint8Array>>();

const SettingsContextProvider = ({ children, setPopup, emptyPopup }: PropsWithChildren<{
   setPopup: Dispatch<SetStateAction<ReactElement<unknown, string | JSXElementConstructor<unknown>>>>,
   emptyPopup: ReactElement
}>) => {
   const [speed, setSpeed] = useState(95);
   const [SIAAuth, setSIAAuth] = useState(__SIA_AUTH__);
   const [SIAAddr, setSIAAddr] = useState(__SIA_ADDR__);
   const [adjustHeading, setAdjustHeading] = useState(true);
   const [adjustTime, setAdjustTime] = useState(true);
   const getSIAPDF = useCallback(async (icao: string) => {
      {
         const cached = SIACache.get(icao);
         if (!cached) {
            const addr = SIAAddr.replace('{icao}', icao);

            SIACache.set(icao, fetch(addr, {
               method: 'GET',
               headers: {
                  'Auth': await getSIAAuth(SIAAuth, addr)
               }
            }).then(async (response) => {
               if (response.ok) {
                  return new Uint8Array(await response.arrayBuffer())
               } else {
                  throw new Error('SIA fetch ' + icao + ' error: ' + response.statusText);
               }
            }));
         }
      }

      return SIACache.get(icao)!;
   }, [SIAAddr, SIAAuth]);

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
      emptyPopup: emptyPopup,
      speed: speed,
      SIAAuth: SIAAuth,
      SIAAddr: SIAAddr,
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
      setSIAAuth: setSIAAuth,
      setSIAAddr: setSIAAddr,
      setPopup: setPopup,
      getSIAPDF: getSIAPDF
   }), [speed, adjustHeading, adjustTime, OACIEnabled, germanyEnabled, USSectionalEnabled,
      USIFRHighEnabled, USIFRLowEnabled, openTopoEnabled, mapForFreeEnabled, googleMapEnabled,
      openStreetEnabled, emptyPopup, SIAAuth, SIAAddr, setPopup, getSIAPDF]);

   return (
      <SettingsContext.Provider
         value={provider}
      >
         {children}
      </SettingsContext.Provider>
   );
};

export default SettingsContextProvider;