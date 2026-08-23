/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 */

import markerImg from '@efb-images/marker-icon-blue.svg';
import { useSettings } from "@Settings/SettingsStore";
import { SharedSettingsRecord } from "@shared/Settings";
import { useShallow } from "zustand/react/shallow";
import { SliderItem } from "./SliderItem";

export const MarkerSizeSetting = () => {
   const { value, onChange } = useSettings(useShallow(settings => ({
      value: settings.map.markerSize,
      onChange: settings.map.setMarkerSize
   })));

   return <SliderItem category="Marker" name="Size" range={{ min: 10, max: 80 }}
      value={value} defaultValue={SharedSettingsRecord.defaultValues.map.markerSize} onChange={onChange}>
      <div className="flex flex-row min-h-[80px]">
         <div className="flex min-w-[80px] justify-center"><img alt="marker" src={markerImg} width={value} /></div>
         <div className="flex flex-col justify-center">Set navigation legs marker size.</div>
      </div>
   </SliderItem>;
};
