import { Dispatch, JSXElementConstructor, ReactElement, SetStateAction } from "react";
import { SharedSettings, Color, LayerSetting } from '@shared/Settings';
import { Azba } from "./SIAAZBA";

export type LayerSettingSetter = {
   setActive: (_value: boolean) => void,
   setEnabled: (_value: boolean) => void,
   setMinZoom: (_value: number) => void,
   setMaxZoom: (_value: number) => void
}

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

   azba: LayerSetting & LayerSettingSetter,
   OACI: LayerSetting & LayerSettingSetter,
   germany: LayerSetting & LayerSettingSetter,
   USSectional: LayerSetting & LayerSettingSetter,
   USIFR: {
      high: LayerSetting & LayerSettingSetter,
      low: LayerSetting & LayerSettingSetter
   },
   opentopo: LayerSetting & LayerSettingSetter,
   mapforfree: LayerSetting & LayerSettingSetter,
   googlemap: LayerSetting & LayerSettingSetter,
   openstreet: LayerSetting & LayerSettingSetter,

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
