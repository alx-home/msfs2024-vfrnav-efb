/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If
 * not, see <https://www.gnu.org/licenses/>.
 */

import { createContext, Dispatch, JSXElementConstructor, PropsWithChildren, ReactElement, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { GlobalSettings, Settings } from "./Settings";
import { useSIAZBA } from "./SIAAZBA";
import { useSIAPDF } from "./SiaPDF";

import { AirportLayerOptions, Color, LayerSetting, SharedSettings, SharedSettingsRecord } from "@shared/Settings";
import { deepEquals } from "@shared/Types";
import { MessageHandler } from "@shared/MessageHandler";

export const messageHandler = new MessageHandler();
export const SettingsContext = createContext<GlobalSettings | undefined>(undefined);

const useLayer = (layer: keyof SharedSettings, sharedSettings: SharedSettings, setSharedSettings: Dispatch<SetStateAction<SharedSettings>>) => {
  const setActive = useCallback((value: boolean) => setSharedSettings(settings => ({ ...settings, [layer]: { ...(settings[layer] as object), active: value } })), [layer, setSharedSettings]);
  const setEnabled = useCallback((value: boolean) => setSharedSettings(settings => ({ ...settings, [layer]: { ...(settings[layer] as object), enabled: value } })), [layer, setSharedSettings]);
  const setMaxZoom = useCallback((value: number) => setSharedSettings(settings => ({ ...settings, [layer]: { ...(settings[layer] as object), maxZoom: value } })), [layer, setSharedSettings]);
  const setMinZoom = useCallback((value: number) => setSharedSettings(settings => ({ ...settings, [layer]: { ...(settings[layer] as object), minZoom: value } })), [layer, setSharedSettings]);

  const layerSetting = useMemo(() => ({
    ...(sharedSettings[layer] as LayerSetting),
    setActive: setActive,
    setEnabled: setEnabled,
    setMaxZoom: setMaxZoom,
    setMinZoom: setMinZoom,
  }), [layer, setActive, setEnabled, setMaxZoom, setMinZoom, sharedSettings]);

  return layerSetting;
};

const useAirportLayer = (sharedSettings: SharedSettings, setSharedSettings: Dispatch<SetStateAction<SharedSettings>>) => {
  const layer = useLayer('airports', sharedSettings, setSharedSettings);

  const enableHardRunway = useCallback((value: boolean) => setSharedSettings(settings => ({ ...settings, airports: { ...settings['airports'], hardRunway: value } })), [setSharedSettings]);
  const enableSoftRunway = useCallback((value: boolean) => setSharedSettings(settings => ({ ...settings, airports: { ...settings['airports'], softRunway: value } })), [setSharedSettings]);
  const enableWaterRunway = useCallback((value: boolean) => setSharedSettings(settings => ({ ...settings, airports: { ...settings['airports'], waterRunway: value } })), [setSharedSettings]);
  const enablePrivate = useCallback((value: boolean) => setSharedSettings(settings => ({ ...settings, airports: { ...settings['airports'], private: value } })), [setSharedSettings]);
  const enableHelipads = useCallback((value: boolean) => setSharedSettings(settings => ({ ...settings, airports: { ...settings['airports'], helipads: value } })), [setSharedSettings]);

  const layerSetting = useMemo(() => ({
    ...(sharedSettings['airports'] as AirportLayerOptions),
    ...layer,

    enableHardRunway: enableHardRunway,
    enableSoftRunway: enableSoftRunway,
    enableWaterRunway: enableWaterRunway,
    enablePrivate: enablePrivate,
    enableHelipads: enableHelipads,
  }), [enableHardRunway, enableHelipads, enablePrivate, enableSoftRunway, enableWaterRunway, layer, sharedSettings]);

  return layerSetting;
};

const SettingsContextProvider = ({ children, setPopup, emptyPopup }: PropsWithChildren<{
  setPopup: Dispatch<SetStateAction<ReactElement<unknown, string | JSXElementConstructor<unknown>>>>,
  emptyPopup: ReactElement
}>) => {
  const [sharedSettings, setSharedSettings] = useState(SharedSettingsRecord.defaultValues);

  const getSIAPDF = useSIAPDF(sharedSettings.SIAAddr, sharedSettings.SIAAuth)
  const getSIAAZBA = useSIAZBA(sharedSettings.SIAAZBAAddr, sharedSettings.SIAAZBADateAddr, sharedSettings.SIAAuth);

  const globalSettings = useMemo((): Settings => ({
    emptyPopup: emptyPopup
  }), [emptyPopup]);

  const setServerPort = useCallback((value: number) => setSharedSettings(settings => ({ ...settings, serverPort: value })), []);
  const setDefaultSpeed = useCallback((value: number) => setSharedSettings(settings => ({ ...settings, defaultSpeed: value })), []);
  const setAdjustHeading = useCallback((value: boolean) => setSharedSettings(settings => ({ ...settings, adjustHeading: value })), []);
  const setAdjustTime = useCallback((value: boolean) => setSharedSettings(settings => ({ ...settings, adjustTime: value })), []);
  const setSIAAuth = useCallback((value: string) => setSharedSettings(settings => ({ ...settings, SIAAuth: value })), []);
  const setSIAAddr = useCallback((value: string) => setSharedSettings(settings => ({ ...settings, SIAAddr: value })), []);
  const setSIAAZBAAddr = useCallback((value: string) => setSharedSettings(settings => ({ ...settings, SIAAZBAAddr: value })), []);
  const setSIAAZBADateAddr = useCallback((value: string) => setSharedSettings(settings => ({ ...settings, SIAAZBADateAddr: value })), []);
  const setMarkerSize = useCallback((value: number) => setSharedSettings(settings => ({ ...settings, map: { ...settings.map, markerSize: value } })), []);

  const setTextMaxSize = useCallback((value: number) => setSharedSettings(settings => ({ ...settings, map: { ...settings.map, text: { ...settings.map.text, maxSize: value } } })), []);
  const setTextMinSize = useCallback((value: number) => setSharedSettings(settings => ({ ...settings, map: { ...settings.map, text: { ...settings.map.text, minSize: value } } })), []);
  const setTextBorderSize = useCallback((value: number) => setSharedSettings(settings => ({ ...settings, map: { ...settings.map, text: { ...settings.map.text, borderSize: value } } })), []);
  const setTextColor = useCallback((value: SetStateAction<Color>) => {
    if (typeof value === 'function') {
      setSharedSettings(settings => ({ ...settings, map: { ...settings.map, text: { ...settings.map.text, color: value(settings.map.text.color) } } }))
    } else {
      setSharedSettings(settings => ({ ...settings, map: { ...settings.map, text: { ...settings.map.text, color: value } } }))
    }
  }, []);
  const setTextBorderColor = useCallback((value: SetStateAction<Color>) => {
    if (typeof value === 'function') {
      setSharedSettings(settings => ({ ...settings, map: { ...settings.map, text: { ...settings.map.text, borderColor: value(settings.map.text.borderColor) } } }))
    } else {
      setSharedSettings(settings => ({ ...settings, map: { ...settings.map, text: { ...settings.map.text, borderColor: value } } }))
    }
  }, []);
  const setAZBAActiveHighColor = useCallback((value: SetStateAction<Color>) => {
    if (typeof value === 'function') {
      setSharedSettings(settings => ({ ...settings, map: { ...settings.map, azba: { ...settings.map.azba, activeHighColor: value(settings.map.azba.activeHighColor) } } }))
    } else {
      setSharedSettings(settings => ({ ...settings, map: { ...settings.map, azba: { ...settings.map.azba, activeHighColor: value } } }))
    }
  }, []);
  const setAZBAActiveLowColor = useCallback((value: SetStateAction<Color>) => {
    if (typeof value === 'function') {
      setSharedSettings(settings => ({ ...settings, map: { ...settings.map, azba: { ...settings.map.azba, activeLowColor: value(settings.map.azba.activeLowColor) } } }))
    } else {
      setSharedSettings(settings => ({ ...settings, map: { ...settings.map, azba: { ...settings.map.azba, activeLowColor: value } } }))
    }
  }, []);
  const setAZBAInactiveHighColor = useCallback((value: SetStateAction<Color>) => {
    if (typeof value === 'function') {
      setSharedSettings(settings => ({ ...settings, map: { ...settings.map, azba: { ...settings.map.azba, inactiveHighColor: value(settings.map.azba.inactiveHighColor) } } }))
    } else {
      setSharedSettings(settings => ({ ...settings, map: { ...settings.map, azba: { ...settings.map.azba, inactiveHighColor: value } } }))
    }
  }, []);
  const setAZBAInactiveLowColor = useCallback((value: SetStateAction<Color>) => {
    if (typeof value === 'function') {
      setSharedSettings(settings => ({ ...settings, map: { ...settings.map, azba: { ...settings.map.azba, inactiveLowColor: value(settings.map.azba.inactiveLowColor) } } }))
    } else {
      setSharedSettings(settings => ({ ...settings, map: { ...settings.map, azba: { ...settings.map.azba, inactiveLowColor: value } } }))
    }
  }, []);

  const setAZBARange = useCallback((value: number) => setSharedSettings(settings => ({ ...settings, map: { ...settings.map, azba: { ...settings.map.azba, range: value } } })), []);

  const airportsSetting = useAirportLayer(sharedSettings, setSharedSettings);
  const azbaSetting = useLayer('azba', sharedSettings, setSharedSettings);
  const planeSetting = useLayer('plane', sharedSettings, setSharedSettings);
  const OACISetting = useLayer('OACI', sharedSettings, setSharedSettings);
  const germanySetting = useLayer('germany', sharedSettings, setSharedSettings);
  const openaipmapsSettings = useLayer('openaipmaps', sharedSettings, setSharedSettings);
  const openflightmapsSettings = useLayer('openflightmaps', sharedSettings, setSharedSettings);
  const openflightmapsBaseSettings = useLayer('openflightmapsBase', sharedSettings, setSharedSettings);
  const USSectionalSetting = useLayer('USSectional', sharedSettings, setSharedSettings);
  const USIFRHighSetting = useLayer('USIFRHigh', sharedSettings, setSharedSettings);
  const USIFRLowSetting = useLayer('USIFRLow', sharedSettings, setSharedSettings);
  const opentopoSetting = useLayer('opentopo', sharedSettings, setSharedSettings);
  const mapforfreeSetting = useLayer('mapforfree', sharedSettings, setSharedSettings);
  const googlemapSetting = useLayer('googlemap', sharedSettings, setSharedSettings);
  const openstreetSetting = useLayer('openstreet', sharedSettings, setSharedSettings);

  const provider = useMemo((): GlobalSettings => ({
    ...globalSettings,
    ...sharedSettings,

    airports: { ...airportsSetting },
    azba: { ...azbaSetting },
    plane: { ...planeSetting },
    OACI: { ...OACISetting },
    germany: { ...germanySetting },
    openaipmaps: { ...openaipmapsSettings },
    openflightmaps: { ...openflightmapsSettings },
    openflightmapsBase: { ...openflightmapsBaseSettings },
    USSectional: { ...USSectionalSetting },
    USIFRHigh: { ...USIFRHighSetting },
    USIFRLow: { ...USIFRLowSetting },
    opentopo: { ...opentopoSetting },
    mapforfree: { ...mapforfreeSetting },
    googlemap: { ...googlemapSetting },
    openstreet: { ...openstreetSetting },

    getSIAPDF: getSIAPDF,
    getSIAAZBA: getSIAAZBA,

    setServerPort: setServerPort,
    setDefaultSpeed: setDefaultSpeed,
    setAdjustHeading: setAdjustHeading,
    setAdjustTime: setAdjustTime,
    setSIAAuth: setSIAAuth,
    setSIAAddr: setSIAAddr,
    setSIAAZBAAddr: setSIAAZBAAddr,
    setSIAAZBADateAddr: setSIAAZBADateAddr,
    setPopup: setPopup,

    map: {
      ...sharedSettings.map,

      text: {
        ...sharedSettings.map.text,

        setMaxSize: setTextMaxSize,
        setMinSize: setTextMinSize,
        setBorderSize: setTextBorderSize,
        setColor: setTextColor,
        setBorderColor: setTextBorderColor
      },

      azba: {
        ...sharedSettings.map.azba,

        setActiveHighColor: setAZBAActiveHighColor,
        setActiveLowColor: setAZBAActiveLowColor,
        setInactiveHighColor: setAZBAInactiveHighColor,
        setInactiveLowColor: setAZBAInactiveLowColor,
        setRange: setAZBARange

      },

      setMarkerSize: setMarkerSize
    }
  }), [
    airportsSetting, googlemapSetting, mapforfreeSetting, openstreetSetting, opentopoSetting, OACISetting,
    USIFRHighSetting, USIFRLowSetting, USSectionalSetting, azbaSetting, germanySetting, openflightmapsSettings,
    openaipmapsSettings, openflightmapsBaseSettings, planeSetting,
    getSIAAZBA, getSIAPDF,
    setAZBAActiveHighColor, setAZBAActiveLowColor, setAZBAInactiveHighColor, setAZBAInactiveLowColor, setAZBARange,
    setAdjustHeading, setAdjustTime, setMarkerSize, setPopup, setSIAAZBAAddr, setSIAAZBADateAddr, setSIAAddr, setSIAAuth, setDefaultSpeed,
    setServerPort, setTextBorderColor, setTextBorderSize, setTextColor, setTextMaxSize, setTextMinSize,
    globalSettings,
    sharedSettings
  ]);

  const [lastSent, setLastSent] = useState(sharedSettings);

  useEffect(() => {
    if (!deepEquals(sharedSettings, lastSent)) {
      messageHandler.send(sharedSettings);
      setLastSent(sharedSettings);
    }
  }, [lastSent, sharedSettings]);

  useEffect(() => {
    const onGetSettings = (settings: SharedSettings) => {
      setLastSent(settings);
      setSharedSettings(settings);
    };

    messageHandler.subscribe("__SETTINGS__", onGetSettings)
    messageHandler.send({ __GET_SETTINGS__: true });
    return () => {
      messageHandler.unsubscribe("__SETTINGS__", onGetSettings);
    }
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