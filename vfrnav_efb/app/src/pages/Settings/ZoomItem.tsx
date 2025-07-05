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

import { DualSlider } from "@alx-home/Utils";
import { LayerSettingSetter } from "@Settings/Settings";
import { LayerSetting } from "@shared/Settings";
import { useCallback, useMemo } from "react";

export const ZoomItem = ({ name, setting, defaultSetting, reset }: {
   name: string,
   setting: LayerSetting & LayerSettingSetter,
   defaultSetting: LayerSetting,
   reset?: boolean
}) => {
   const range = useMemo(() => ({ min: 0, max: 30 }), []);
   const onChange = useCallback((min: number, max: number) => { setting.setMaxZoom(range.max - min); setting.setMinZoom(range.max - max) }, [range.max, setting]);
   const defaultValue = useMemo(() => ({ max: range.max - (defaultSetting.minZoom ?? 0), min: range.max - (defaultSetting.maxZoom ?? range.max) }), [defaultSetting.maxZoom, defaultSetting.minZoom, range.max])
   const value = useMemo(() => ({ max: range.max - (setting.minZoom ?? 0), min: range.max - (setting.maxZoom ?? range.max) }), [range.max, setting.maxZoom, setting.minZoom])

   return <DualSlider onChange={onChange} range={range} reset={reset}
      value={value}
      defaultValue={defaultValue}
      className={"max-w-3xl"}>
      <div className="flex flex-row w-40">{name}:</div>
   </DualSlider>
}
