/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 */

import { useSettings } from "@Settings/SettingsStore";
import { SharedSettingsRecord } from "@shared/Settings";
import { useShallow } from "zustand/react/shallow";
import { SliderItem } from "./SliderItem";

export const BorderSizeSetting = () => {
   const { value, onChange } = useSettings(useShallow(settings => ({
      value: settings.map.text.borderSize,
      onChange: settings.map.text.setBorderSize
   })));

   return <SliderItem category="Legs" name="Border size" range={{ min: 1, max: 15 }}
      defaultValue={SharedSettingsRecord.defaultValues.map.text.borderSize} value={value} onChange={onChange}>
      <div className="flex flex-row min-h-[60px]">
         <div className="flex min-w-[50px] justify-center mr-2">
            <div className="relative flex flex-col justify-center" style={{ font: `900 50px Inter-bold, sans-serif` }}>
               <div className="z-0 text-transparent" style={{ WebkitTextStroke: `${value.toFixed(0)}px #fff` }}>A</div>
               <div className="absolute top-0 bottom-0 left-0 right-0 z-10 text-[var(--background)] group-hover:text-[var(--menu-bg)]">A</div>
            </div>
         </div>
         <div className="flex flex-col justify-center">Set navigation legs text border size.</div>
      </div>
   </SliderItem>;
};
