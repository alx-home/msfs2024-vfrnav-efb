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

import { Dispatch, JSXElementConstructor, ReactElement, SetStateAction, RefObject } from 'react';
import { SharedSettings, Color } from '@shared/Settings';
import { Azba } from "./SIAAZBA";
import { Src } from "@pages/Charts/ChartsPage";

export type LayerSettingSetter = {
  setActive: (_value: boolean) => void,
  setEnabled: (_value: boolean) => void,
  setMinZoom: (_value: number) => void,
  setMaxZoom: (_value: number) => void
}

export type AirportLayerSettingSetter = {
  enableHardRunway: (_value: boolean) => void,
  enableSoftRunway: (_value: boolean) => void,
  enableWaterRunway: (_value: boolean) => void,
  enablePrivate: (_value: boolean) => void,
  enableHelipads: (_value: boolean) => void,
}

export type Settings = {
  emptyPopup: ReactElement,
};

export type GlobalSettings = Settings & SharedSettings & {
  setDefaultSpeed: (_speed: number) => void,
  setSIAAddr: (_addr: string) => void,
  setSIAAZBAAddr: (_addr: string) => void,
  setSIAAZBADateAddr: (_addr: string) => void,
  setSIAAuth: (_token: string) => void,
  setAdjustHeading: (_enable: boolean) => void,
  setAdjustTime: (_enable: boolean) => void,

  getSIAPDF: (_icao: string) => Promise<Uint8Array>,
  getSIAAZBA: () => Promise<Azba[]>,
  setPopup: Dispatch<SetStateAction<ReactElement<unknown, string | JSXElementConstructor<unknown>>>>
  setPage: Dispatch<SetStateAction<string>>

  addPdf: RefObject<((_name: string, _pdf: Src) => void) | undefined>,

  azba: LayerSettingSetter & SharedSettings['azba'],
  airports: AirportLayerSettingSetter & LayerSettingSetter & SharedSettings['airports'],
  plane: LayerSettingSetter & SharedSettings['plane'],
  OACI: LayerSettingSetter & SharedSettings['OACI'],
  germany: LayerSettingSetter & SharedSettings['germany'],
  openaipmaps: LayerSettingSetter & SharedSettings['openaipmaps'],
  openflightmaps: LayerSettingSetter & SharedSettings['openflightmaps'],
  openflightmapsBase: LayerSettingSetter & SharedSettings['openflightmapsBase'],
  USSectional: LayerSettingSetter & SharedSettings['USSectional'],
  USIFRHigh: LayerSettingSetter & SharedSettings['USIFRHigh'],
  USIFRLow: LayerSettingSetter & SharedSettings['USIFRLow'],
  opentopo: LayerSettingSetter & SharedSettings['opentopo'],
  mapforfree: LayerSettingSetter & SharedSettings['mapforfree'],
  googlemap: LayerSettingSetter & SharedSettings['googlemap'],
  openstreet: LayerSettingSetter & SharedSettings['openstreet'],

  map: {
    text: {
      setMaxSize: (_size: number) => void
      setMinSize: (_size: number) => void
      setBorderSize: (_size: number) => void
      setColor: Dispatch<SetStateAction<Color>>
      setBorderColor: Dispatch<SetStateAction<Color>>
    } & SharedSettings['map']['text'],

    azba: {
      setActiveHighColor: Dispatch<SetStateAction<Color>>
      setActiveLowColor: Dispatch<SetStateAction<Color>>
      setInactiveHighColor: Dispatch<SetStateAction<Color>>
      setInactiveLowColor: Dispatch<SetStateAction<Color>>
      setRange: (_range: number) => void
    } & SharedSettings['map']['azba'],

    setMarkerSize: (_size: number) => void
  } & SharedSettings['map']
};