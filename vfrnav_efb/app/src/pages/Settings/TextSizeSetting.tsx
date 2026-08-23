/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 */

import { useSettings } from "@Settings/SettingsStore";
import { SharedSettingsRecord } from "@shared/Settings";
import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { DualSliderItem } from "./DualSliderItem";

export const TextSizeSetting = () => {
   const text = useSettings(useShallow(settings => ({
      minSize: settings.map.text.minSize,
      maxSize: settings.map.text.maxSize,
      setMinSize: settings.map.text.setMinSize,
      setMaxSize: settings.map.text.setMaxSize
   })));
   const value = useMemo(() => ({ min: text.minSize, max: text.maxSize }), [text.maxSize, text.minSize]);
   const defaultValue = useMemo(() => ({
      min: SharedSettingsRecord.defaultValues.map.text.minSize,
      max: SharedSettingsRecord.defaultValues.map.text.maxSize
   }), []);
   const onChange = useCallback((min: number, max: number) => {
      text.setMinSize(min);
      text.setMaxSize(max);
   }, [text]);

   return <DualSliderItem category="Legs" name="Text size" range={{ min: 5, max: 50 }}
      defaultValue={defaultValue} value={value} onChange={onChange}>
      <div className="flex flex-row min-h-[60px]">
         <div className="flex flex-row min-w-[80px] justify-center">
            <div className="flex flex-col justify-center mr-1" style={{ font: `900 ${value.min.toFixed(0)}px Inter-bold, sans-serif` }}>a</div>
            <div className="flex flex-col justify-center" style={{ font: `900 ${value.max.toFixed(0)}px Inter-bold, sans-serif` }}>A</div>
         </div>
         <div className="flex flex-col justify-center">Set bounds of navigation legs text size.</div>
      </div>
   </DualSliderItem>;
};
