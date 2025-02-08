import { sha512 } from "js-sha512";
import { createContext, Dispatch, JSXElementConstructor, PropsWithChildren, ReactElement, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { SharedSettings, SharedSettingsRecord } from '@shared/Settings';
import { messageHandler } from "./main";
import { reduce, deepEquals } from "@shared/Types";


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

export type Settings = {
   emptyPopup: ReactElement,

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

   map: {
      text: {
         setMaxSize: (_size: number) => void
         setMinSize: (_size: number) => void
         setBorderSize: (_size: number) => void,
         setColor: Dispatch<SetStateAction<{
            red: number;
            green: number;
            blue: number;
            alpha: number;
         }>>,
         setBorderColor: Dispatch<SetStateAction<{
            red: number;
            green: number;
            blue: number;
            alpha: number;
         }>>
      }
      setMarkerSize: (_size: number) => void
   }
} & SharedSettings;

export const SettingsContext = createContext<Settings | undefined>(undefined);


const getSIAAuth = async (SIAAuth: string, SIAAddr: string) => {
   return btoa(JSON.stringify({ tokenUri: sha512(SIAAuth + "/api/" + SIAAddr.split('/api/')[1]) }));
}

const SIACache = new Map<string, Promise<Uint8Array>>();

const SettingsContextProvider = ({ children, setPopup, emptyPopup }: PropsWithChildren<{
   setPopup: Dispatch<SetStateAction<ReactElement<unknown, string | JSXElementConstructor<unknown>>>>,
   emptyPopup: ReactElement
}>) => {
   const [speed, setSpeed] = useState(SharedSettingsDefault.speed);
   const [SIAAuth, setSIAAuth] = useState(SharedSettingsDefault.SIAAuth);
   const [SIAAddr, setSIAAddr] = useState(SharedSettingsDefault.SIAAddr);
   const [adjustHeading, setAdjustHeading] = useState(SharedSettingsDefault.adjustHeading);
   const [adjustTime, setAdjustTime] = useState(SharedSettingsDefault.adjustTime);
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

   const [OACIEnabled, setOACIEnabled] = useState(SharedSettingsDefault.OACIEnabled);
   const [germanyEnabled, setGermanyEnabled] = useState(SharedSettingsDefault.germanyEnabled);
   const [USSectionalEnabled, setUSSectionalEnabled] = useState(SharedSettingsDefault.USSectionalEnabled);
   const [mapForFreeEnabled, setMapForFreeEnabled] = useState(SharedSettingsDefault.mapForFreeEnabled);
   const [googleMapEnabled, setGoogleMapEnabled] = useState(SharedSettingsDefault.googleMapEnabled);
   const [USIFRHighEnabled, setUSIFRHighEnabled] = useState(SharedSettingsDefault.USIFRHighEnabled);
   const [USIFRLowEnabled, setUSIFRLowEnabled] = useState(SharedSettingsDefault.USIFRLowEnabled);
   const [openTopoEnabled, setOpenTopoEnabled] = useState(SharedSettingsDefault.openTopoEnabled);
   const [openStreetEnabled, setOpenStreetEnabled] = useState(SharedSettingsDefault.openStreetEnabled);

   const [mapTextMaxSize, setMapTextMaxSize] = useState(SharedSettingsDefault.map.text.maxSize);
   const [mapTextMinSize, setMapTextMinSize] = useState(SharedSettingsDefault.map.text.minSize);
   const [mapTextBorderSize, setMapTextBorderSize] = useState(SharedSettingsDefault.map.text.borderSize);
   const [mapTextColor, setMapTextColor] = useState(SharedSettingsDefault.map.text.color);
   const [mapTextBorderColor, setMapTextBorderColor] = useState(SharedSettingsDefault.map.text.borderColor);


   const [mapMarkerSize, setMapMarkerSize] = useState(SharedSettingsDefault.map.markerSize);

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
      getSIAPDF: getSIAPDF,

      map: {
         text: {
            minSize: mapTextMinSize,
            maxSize: mapTextMaxSize,
            borderSize: mapTextBorderSize,
            color: mapTextColor,
            borderColor: mapTextBorderColor,

            setMinSize: setMapTextMinSize,
            setMaxSize: setMapTextMaxSize,
            setBorderSize: setMapTextBorderSize,
            setColor: setMapTextColor,
            setBorderColor: setMapTextBorderColor,
         },
         markerSize: mapMarkerSize,
         setMarkerSize: setMapMarkerSize
      }
   }), [emptyPopup, speed, SIAAuth, SIAAddr, adjustHeading, adjustTime, OACIEnabled, germanyEnabled, USSectionalEnabled, USIFRHighEnabled, USIFRLowEnabled, openTopoEnabled, mapForFreeEnabled, googleMapEnabled, openStreetEnabled, setPopup, getSIAPDF, mapTextMinSize, mapTextMaxSize, mapTextBorderSize, mapTextColor, mapTextBorderColor, mapMarkerSize]);

   const [lastSent, setLastSent] = useState(reduce<SharedSettings>(provider, SharedSettingsRecord));

   useEffect(() => {
      const rprovider = reduce<SharedSettings>(provider, SharedSettingsRecord);
      if (!deepEquals(rprovider, lastSent)) {
         messageHandler.send(rprovider);
         setLastSent(rprovider);
      }
   }, [lastSent, provider]);

   useEffect(() => {
      const callback = (settings: SharedSettings) => {
         setOACIEnabled(settings.OACIEnabled);
         setGermanyEnabled(settings.germanyEnabled);
         setUSSectionalEnabled(settings.USSectionalEnabled);
         setUSIFRHighEnabled(settings.USIFRHighEnabled);
         setUSIFRLowEnabled(settings.USIFRLowEnabled);
         setOpenTopoEnabled(settings.openTopoEnabled);
         setMapForFreeEnabled(settings.mapForFreeEnabled);
         setGoogleMapEnabled(settings.googleMapEnabled);
         setOpenStreetEnabled(settings.openStreetEnabled);

         setSpeed(settings.speed);
         setAdjustHeading(settings.adjustHeading);
         setAdjustTime(settings.adjustTime);
         setSIAAuth(settings.SIAAuth);
         setSIAAddr(settings.SIAAddr);

         setMapMarkerSize(settings.map.markerSize);

         setMapTextBorderColor(settings.map.text.borderColor);
         setMapTextBorderSize(settings.map.text.borderSize);
         setMapTextMaxSize(settings.map.text.maxSize);
         setMapTextMinSize(settings.map.text.minSize);
         setMapTextColor(settings.map.text.color);
      };

      messageHandler.subscribe("SharedSettings", callback)
      messageHandler.send("GetSettings");
      return () => messageHandler.unsubscribe("SharedSettings", callback);
   }, []);

   return (
      <SettingsContext.Provider
         value={provider}
      >
         {children}
      </SettingsContext.Provider>
   );
};

export default SettingsContextProvider;