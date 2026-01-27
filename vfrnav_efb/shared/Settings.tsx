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

import { GenRecord } from "./Types";

export type LayerSetting = {
  active: boolean,
  enabled: boolean,
  minZoom?: number,
  maxZoom?: number
}

export type AirportLayerOptions = {
  hardRunway: boolean
  softRunway: boolean
  waterRunway: boolean
  private: boolean
  helipads: boolean
}

export type Color = {
  red: number
  green: number
  blue: number
  alpha: number
};

export type SharedSettings = {
  __SETTINGS__: true

  defaultSpeed: number,
  SIAAuth: string,
  SIAAddr: string,
  SIAAZBAAddr: string,
  SIAAZBADateAddr: string,

  azba: LayerSetting,
  plane: LayerSetting,
  airports: LayerSetting & AirportLayerOptions,
  OACI: LayerSetting,
  germany: LayerSetting,
  openaipmaps: LayerSetting,
  openflightmaps: LayerSetting,
  openflightmapsBase: LayerSetting,
  USSectional: LayerSetting,
  USIFRHigh: LayerSetting,
  USIFRLow: LayerSetting,
  opentopo: LayerSetting,
  mapforfree: LayerSetting,
  googlemap: LayerSetting,
  openstreet: LayerSetting,

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
  },
};

export type SetEfbMode = {
  __SET_EFB_MODE__: true,
  mode2D: boolean
};

export const SetEfbModeRecord = GenRecord<SetEfbMode>({
  __SET_EFB_MODE__: true,
  mode2D: true
}, {});

export type SetPanelSize = {
  __SET_PANEL_SIZE__: true,

  x: number,
  y: number,
  width: number,
  height: number,
  borderScale: number,
  dpiScale: number,
  menuDpiScale: number
  captionBar: boolean
};

export const SetPanelSizeRecord = GenRecord<SetPanelSize>({
  __SET_PANEL_SIZE__: true,

  x: 0,
  y: 0,
  width: 1,
  height: 1,
  borderScale: 1,
  dpiScale: 1,
  menuDpiScale: 1,
  captionBar: true
}, {});

const LayerRecord = GenRecord<LayerSetting>({
  active: true,
  enabled: true
}, {
  maxZoom: { optional: true, record: 'number' },
  minZoom: { optional: true, record: 'number' },
})

export const SharedSettingsRecord = GenRecord<SharedSettings>({
  __SETTINGS__: true,

  defaultSpeed: 95,
  SIAAuth: __SIA_AUTH__,
  SIAAddr: __SIA_ADDR__,
  SIAAZBAAddr: __SIA_AZBA_ADDR__,
  SIAAZBADateAddr: __SIA_AZBA_DATE_ADDR__,

  airports: {
    helipads: false,
    waterRunway: true,
    hardRunway: true,
    softRunway: true,
    private: false,
    enabled: true,
    active: true,
    minZoom: 8
  },
  azba: {
    enabled: true,
    active: true,
    minZoom: 0,
    maxZoom: 12
  },
  plane: {
    enabled: false,
    active: false,
  },
  OACI: {
    enabled: true,
    active: true,
    minZoom: 0,
    maxZoom: 12
  },
  germany: {
    enabled: true,
    active: false,
  },
  openaipmaps: {
    enabled: false,
    active: false,
  },
  openflightmaps: {
    enabled: true,
    active: false,
  },
  openflightmapsBase: {
    enabled: true,
    active: false,
  },
  USSectional: {
    enabled: true,
    active: false
  },
  USIFRHigh: {
    enabled: false,
    active: false
  },
  USIFRLow: {
    enabled: false,
    active: false
  },
  opentopo: {
    enabled: true,
    active: false
  },
  mapforfree: {
    enabled: true,
    active: false
  },
  googlemap: {
    enabled: true,
    active: true
  },
  openstreet: {
    enabled: true,
    active: false
  },

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
}, {
  azba: LayerRecord,
  plane: LayerRecord,
  airports: LayerRecord,
  OACI: LayerRecord,
  germany: LayerRecord,
  openaipmaps: LayerRecord,
  openflightmaps: LayerRecord,
  openflightmapsBase: LayerRecord,
  USSectional: LayerRecord,
  USIFRHigh: LayerRecord,
  USIFRLow: LayerRecord,
  opentopo: LayerRecord,
  mapforfree: LayerRecord,
  googlemap: LayerRecord,
  openstreet: LayerRecord,
})