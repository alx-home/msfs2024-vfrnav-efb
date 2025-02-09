import { Color, LayerSetting, SharedSettings, SharedSettingsRecord } from "@shared/Settings";
import { deepEquals, reduce } from "@shared/Types";
import { createContext, Dispatch, JSXElementConstructor, PropsWithChildren, ReactElement, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { LayerSettingSetter, Settings } from "./Settings";
import { SharedSettingsDefault } from "./Default";
import { useSIAZBA } from "./SIAAZBA";
import { useSIAPDF } from "./SiaPDF";
import { MessageHandler } from "@shared/MessageHandler";

export const messageHandler = new MessageHandler();
export const SettingsContext = createContext<Settings | undefined>(undefined);

const useLayerSetting = (defaultValue: LayerSetting): [(LayerSetting & LayerSettingSetter), (_value: LayerSetting) => void] => {
   const [enabled, setEnabled] = useState<boolean>(defaultValue.enabled);
   const [active, setActive] = useState<boolean>(defaultValue.active);
   const [minZoom, setMinZoom] = useState<number | undefined>(defaultValue.minZoom);
   const [maxZoom, setMaxZoom] = useState<number | undefined>(defaultValue.maxZoom);

   const setAll = useCallback((value: LayerSetting) => {
      setEnabled(value.enabled)
      setActive(value.active)
      setMinZoom(value.minZoom)
      setMaxZoom(value.maxZoom)
   }, [])

   return [{ active: active, enabled: enabled, minZoom: minZoom, maxZoom: maxZoom, setActive: setActive, setEnabled: setEnabled, setMaxZoom: setMaxZoom, setMinZoom: setMinZoom }, setAll]
}


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
   const getSIAPDF = useSIAPDF(SIAAddr, SIAAuth)
   const getSIAAZBA = useSIAZBA(SIAAZBAAddr, SIAAZBADateAddr, SIAAuth);

   const [AZBASettings, setAZBASettings] = useLayerSetting(SharedSettingsDefault.azba);
   const [OACISettings, setOACISettings] = useLayerSetting(SharedSettingsDefault.OACI);
   const [germanySettings, setGermanySettings] = useLayerSetting(SharedSettingsDefault.germany);
   const [USSectionalSettings, setUSSectionalSettings] = useLayerSetting(SharedSettingsDefault.USSectional);
   const [mapForFreeSettings, setMapForFreeSettings] = useLayerSetting(SharedSettingsDefault.mapforfree);
   const [googleMapSettings, setGoogleMapSettings] = useLayerSetting(SharedSettingsDefault.googlemap);
   const [USIFRHighSettings, setUSIFRHighSettings] = useLayerSetting(SharedSettingsDefault.USIFR.high);
   const [USIFRLowSettings, setUSIFRLowSettings] = useLayerSetting(SharedSettingsDefault.USIFR.low);
   const [openTopoSettings, setOpenTopoSettings] = useLayerSetting(SharedSettingsDefault.opentopo);
   const [openStreetSettings, setOpenStreetSettings] = useLayerSetting(SharedSettingsDefault.openstreet);

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

   const provider = useMemo((): Settings => ({
      emptyPopup: emptyPopup,
      speed: speed,
      SIAAuth: SIAAuth,
      SIAAddr: SIAAddr,
      SIAAZBAAddr: SIAAZBAAddr,
      SIAAZBADateAddr: SIAAZBADateAddr,
      adjustHeading: adjustHeading,
      adjustTime: adjustTime,

      azba: AZBASettings,
      OACI: OACISettings,
      germany: germanySettings,
      USSectional: USSectionalSettings,
      USIFR: { high: USIFRHighSettings, low: USIFRLowSettings },
      opentopo: openTopoSettings,
      mapforfree: mapForFreeSettings,
      googlemap: googleMapSettings,
      openstreet: openStreetSettings,

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
   }), [emptyPopup, speed, SIAAuth, SIAAddr, SIAAZBAAddr, SIAAZBADateAddr, adjustHeading, adjustTime, AZBASettings, OACISettings, germanySettings, USSectionalSettings, USIFRHighSettings, USIFRLowSettings, openTopoSettings, mapForFreeSettings, googleMapSettings, openStreetSettings, setPopup, getSIAPDF, getSIAAZBA, mapTextMinSize, mapTextMaxSize, mapTextBorderSize, mapTextColor, mapTextBorderColor, mapAZBAActiveHighColor, mapAZBAActiveLowColor, mapAZBAInactiveHighColor, mapAZBAInactiveLowColor, mapAZBARange, mapMarkerSize]);

   const [lastSent, setLastSent] = useState(reduce(provider, SharedSettingsRecord));

   useEffect(() => {
      const rprovider = reduce(provider, SharedSettingsRecord);

      if (!deepEquals(rprovider, lastSent)) {
         messageHandler.send(rprovider);
         setLastSent(rprovider);
      }
   }, [lastSent, provider]);

   useEffect(() => {
      const callback = (settings: SharedSettings) => {
         setAZBASettings(settings.azba);
         setOACISettings(settings.OACI);
         setGermanySettings(settings.germany);
         setUSSectionalSettings(settings.USSectional);
         setUSIFRHighSettings(settings.USIFR.high);
         setUSIFRLowSettings(settings.USIFR.low);
         setOpenTopoSettings(settings.opentopo);
         setMapForFreeSettings(settings.mapforfree);
         setGoogleMapSettings(settings.googlemap);
         setOpenStreetSettings(settings.openstreet);

         setSpeed(settings.speed);
         setAdjustHeading(settings.adjustHeading);
         setAdjustTime(settings.adjustTime);
         setSIAAuth(settings.SIAAuth);
         setSIAAddr(settings.SIAAddr);
         setSIAAZBAAddr(settings.SIAAZBAAddr);
         setSIAAZBADateAddr(settings.SIAAZBADateAddr);

         setMapAZBARange(settings.map.azba.range);
         setMapAZBAActiveHighColor(settings.map.azba.activeHighColor);
         setMapAZBAActiveLowColor(settings.map.azba.activeLowColor);
         setMapAZBAInactiveHighColor(settings.map.azba.inactiveHighColor);
         setMapAZBAInactiveLowColor(settings.map.azba.inactiveLowColor);

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
   }, [setAZBASettings, setGermanySettings, setGoogleMapSettings, setMapForFreeSettings, setOACISettings, setOpenStreetSettings, setOpenTopoSettings, setUSIFRHighSettings, setUSIFRLowSettings, setUSSectionalSettings]);

   return (
      <SettingsContext.Provider
         value={provider}
      >
         {children}
      </SettingsContext.Provider>
   );
};

export default SettingsContextProvider;