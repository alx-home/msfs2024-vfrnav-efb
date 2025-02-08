import { sha512 } from "js-sha512";
import { createContext, Dispatch, JSXElementConstructor, PropsWithChildren, ReactElement, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { SharedSettings, SharedSettingsRecord, Color } from '@shared/Settings';
import { messageHandler } from "./main";
import { reduce, deepEquals } from "@shared/Types";

export type Azba = {
   id: string,
   remark: string,
   name: string,
   upper: number,
   lower: number,
   coordinates:
   {
      latitude: number,
      longitude: number,
   }[],
   timeslots:
   {
      startTime: Date,
      endTime: Date
   }[]
};

export const SharedSettingsDefault = {
   speed: 95,
   adjustHeading: true,
   adjustTime: true,
   SIAAuth: __SIA_AUTH__,
   SIAAddr: __SIA_ADDR__,
   SIAAZBAAddr: __SIA_AZBA_ADDR__,
   SIAAZBADateAddr: __SIA_AZBA_DATE_ADDR__,

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

export type Settings = {
   emptyPopup: ReactElement,

   setSpeed: (_speed: number) => void,
   setSIAAddr: (_addr: string) => void,
   setSIAAZBAAddr: (_addr: string) => void,
   setSIAAZBADateAddr: (_addr: string) => void,
   setSIAAuth: (_token: string) => void,
   setAdjustHeading: (_enable: boolean) => void,
   setAdjustTime: (_enable: boolean) => void,

   getSIAPDF: (_icao: string) => Promise<Uint8Array>,
   getSIAAZBA: () => Promise<Azba[]>,
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
         setBorderSize: (_size: number) => void
         setColor: Dispatch<SetStateAction<Color>>
         setBorderColor: Dispatch<SetStateAction<Color>>
      },
      azba: {
         setActiveHighColor: Dispatch<SetStateAction<Color>>
         setActiveLowColor: Dispatch<SetStateAction<Color>>
         setInactiveHighColor: Dispatch<SetStateAction<Color>>
         setInactiveLowColor: Dispatch<SetStateAction<Color>>
         setRange: Dispatch<SetStateAction<number>>
      },
      setMarkerSize: (_size: number) => void
   }
} & SharedSettings;

export const SettingsContext = createContext<Settings | undefined>(undefined);


const getSIAAuth = (SIAAuth: string, SIAAddr: string) => {
   return btoa(JSON.stringify({ tokenUri: sha512(SIAAuth + "/api/" + SIAAddr.split('/api/')[1]) }));
}

const dmsToDD = (value: string) => {
   const float = value.slice(value.length - 4, value.length - 3) === '.';
   const pos = float ? 3 : 0;

   const direction = value.slice(value.length - 1)
   const degrees = +value.slice(0, value.length - (5 + pos))
   const minutes = +value.slice(value.length - (5 + pos), value.length - (3 + pos))
   const seconds = +value.slice(value.length - (3 + pos), value.length - 1)

   return ((direction === 'S' || direction === 'W') ? -1 : 1) * (degrees + minutes / 60 + seconds / 3600)
}

const SIACache = new Map<string, Promise<Uint8Array>>();
let SIAAZBACache: Promise<Azba[]> | undefined = undefined;

const SettingsContextProvider = ({ children, setPopup, emptyPopup }: PropsWithChildren<{
   setPopup: Dispatch<SetStateAction<ReactElement<unknown, string | JSXElementConstructor<unknown>>>>,
   emptyPopup: ReactElement
}>) => {
   const [speed, setSpeed] = useState(SharedSettingsDefault.speed);
   const [SIAAuth, setSIAAuth] = useState(SharedSettingsDefault.SIAAuth);
   const [SIAAddr, setSIAAddr] = useState(SharedSettingsDefault.SIAAddr);
   const [SIAAZBAAddr, setSIAAZBAAddr] = useState(SharedSettingsDefault.SIAAZBAAddr);
   const [SIAAZBADateAddr, setSIAAZBADateAddr] = useState(SharedSettingsDefault.SIAAZBADateAddr);

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
                  'Auth': getSIAAuth(SIAAuth, addr)
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

   const getSIAAZBA = useCallback(async (): Promise<Azba[]> => {
      if (SIAAZBACache) {
         return SIAAZBACache;
      }

      return fetch(SIAAZBADateAddr, {
         method: 'GET',
         headers: {
            'Auth': getSIAAuth(SIAAuth, SIAAZBADateAddr)
         }
      }).then(async (response): Promise<Azba[]> => {
         if (response.ok) {
            return response.json().then(json => {
               const addr = SIAAZBAAddr
                  .replace('{date}', json.rtba)
                  .replace('{start_date}', (json.endDate as string).replaceAll(':', '%3A').replace('+', '%2B'))
                  .replace('{end_date}', (json.startDate as string).replaceAll(':', '%3A').replace('+', '%2B'));


               SIAAZBACache = fetch(addr, {
                  method: 'GET',
                  headers: {
                     'Auth': getSIAAuth(SIAAuth, addr)
                  }
               }).then(async (response) => {
                  if (response.ok) {
                     return response.json().then(json => {
                        const result: Azba[] = [];

                        json["hydra:member"].forEach((elem: {
                           codeId: string,
                           txtRmk: string,
                           name: string,
                           initialCodeType: string,
                           valDistVerUpper: number,
                           valDistVerLower: number,
                           coordinates: {
                              longitude: string,
                              latitude: string
                           }[],
                           timeSlots: {
                              startTime: string,
                              endTime: string,
                           }[]
                        }) => {
                           result.push({
                              id: elem.codeId,
                              remark: elem.txtRmk,
                              name: elem.initialCodeType + ' ' + elem.name,
                              upper: elem.valDistVerUpper,
                              lower: elem.valDistVerLower,
                              coordinates: elem.coordinates.map(coord => {
                                 return {
                                    longitude: dmsToDD(coord.longitude),
                                    latitude: dmsToDD(coord.latitude)
                                 }
                              }),
                              timeslots: elem.timeSlots.map(slot => ({
                                 startTime: __MSFS_EMBEDED__ ? new Date(new Date(slot.startTime.substring(0, slot.startTime.length - 6)).getTime() - 3600000) : new Date(slot.startTime.substring(0, slot.startTime.length - 6)),
                                 endTime: __MSFS_EMBEDED__ ? new Date(new Date(slot.endTime.substring(0, slot.endTime.length - 6)).getTime() - 3600000) : new Date(slot.endTime.substring(0, slot.endTime.length - 6)),
                              }))
                           });
                        });

                        return result;
                     });
                  } else {
                     throw new Error('SIA AZBA fetch error: ' + response.statusText);
                  }
               });

               return SIAAZBACache;
            });
         } else {
            throw new Error('SIA AZBA date fetch error: ' + response.statusText);
         }
      });

   }, [SIAAZBAAddr, SIAAZBADateAddr, SIAAuth]);

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
   const [mapTextColor, setMapTextColor] = useState<Color>(SharedSettingsDefault.map.text.color);
   const [mapAZBAActiveHighColor, setMapAZBAActiveHighColor] = useState<Color>(SharedSettingsDefault.map.azba.activeHighColor);
   const [mapAZBAActiveLowColor, setMapAZBAActiveLowColor] = useState<Color>(SharedSettingsDefault.map.azba.activeLowColor);
   const [mapAZBAInactiveHighColor, setMapAZBAInactiveHighColor] = useState<Color>(SharedSettingsDefault.map.azba.inactiveHighColor);
   const [mapAZBAInactiveLowColor, setMapAZBAInactiveLowColor] = useState<Color>(SharedSettingsDefault.map.azba.inactiveLowColor);
   const [mapAZBARange, setMapAZBARange] = useState(SharedSettingsDefault.map.azba.range);
   const [mapTextBorderColor, setMapTextBorderColor] = useState<Color>(SharedSettingsDefault.map.text.borderColor);


   const [mapMarkerSize, setMapMarkerSize] = useState(SharedSettingsDefault.map.markerSize);

   const provider = useMemo(() => ({
      emptyPopup: emptyPopup,
      speed: speed,
      SIAAuth: SIAAuth,
      SIAAddr: SIAAddr,
      SIAAZBAAddr: SIAAZBAAddr,
      SIAAZBADateAddr: SIAAZBADateAddr,
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
      setSIAAZBAAddr: setSIAAZBAAddr,
      setSIAAZBADateAddr: setSIAAZBADateAddr,
      setPopup: setPopup,
      getSIAPDF: getSIAPDF,
      getSIAAZBA: getSIAAZBA,

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
         azba: {
            activeHighColor: mapAZBAActiveHighColor,
            activeLowColor: mapAZBAActiveLowColor,
            inactiveHighColor: mapAZBAInactiveHighColor,
            inactiveLowColor: mapAZBAInactiveLowColor,
            range: mapAZBARange,

            setActiveHighColor: setMapAZBAActiveHighColor,
            setActiveLowColor: setMapAZBAActiveLowColor,
            setInactiveHighColor: setMapAZBAInactiveHighColor,
            setInactiveLowColor: setMapAZBAInactiveLowColor,
            setRange: setMapAZBARange
         },
         markerSize: mapMarkerSize,
         setMarkerSize: setMapMarkerSize
      }
   }), [emptyPopup, speed, SIAAuth, SIAAddr, SIAAZBAAddr, SIAAZBADateAddr, adjustHeading, adjustTime, OACIEnabled, germanyEnabled, USSectionalEnabled, USIFRHighEnabled, USIFRLowEnabled, openTopoEnabled, mapForFreeEnabled, googleMapEnabled, openStreetEnabled, setPopup, getSIAPDF, getSIAAZBA, mapTextMinSize, mapTextMaxSize, mapTextBorderSize, mapTextColor, mapTextBorderColor, mapAZBAActiveHighColor, mapAZBAActiveLowColor, mapAZBAInactiveHighColor, mapAZBAInactiveLowColor, mapAZBARange, mapMarkerSize]);

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
         setSIAAZBAAddr(settings.SIAAZBAAddr);
         setSIAAZBADateAddr(settings.SIAAZBADateAddr);

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