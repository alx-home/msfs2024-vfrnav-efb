/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 */

import { useSettings } from "@Settings/SettingsStore";
import { Color, SharedSettingsRecord } from "@shared/Settings";
import { useShallow } from "zustand/react/shallow";
import { ColorPicker } from "./ColorPicker";

const colorToCss = (color: Color) =>
   `rgba(${color.red.toFixed(0)}, ${color.green.toFixed(0)}, ${color.blue.toFixed(0)}, ${color.alpha})`;

export const TextColorSetting = ({ border = false }: { border?: boolean }) => {
   const { color, setColor } = useSettings(useShallow(settings => border
      ? { color: settings.map.text.borderColor, setColor: settings.map.text.setBorderColor }
      : { color: settings.map.text.color, setColor: settings.map.text.setColor }));
   const defaultColor = border ? SharedSettingsRecord.defaultValues.map.text.borderColor : SharedSettingsRecord.defaultValues.map.text.color;

   return <ColorPicker name={border ? "Border Color" : "Text Color"} category="Legs" defaultColor={defaultColor} value={color} setColor={setColor}>
      <div className="flex flex-row min-h-[60px]">
         <div className="flex min-w-[50px] justify-center mr-2">
            <div className={border ? "relative flex flex-col justify-center" : "flex flex-col justify-center bg-white rounded-md px-2 mr-2"}
               style={border ? { font: `900 50px Inter-bold, sans-serif` } : { font: `900 50px Inter-bold, sans-serif`, color: colorToCss(color) }}>
               {border && <div className="z-0 text-transparent" style={{ WebkitTextStroke: `10px ${colorToCss(color)}` }}>A</div>}
               <div className={border ? "absolute top-0 bottom-0 left-0 right-0 text-[var(--background)] group-hover:text-[var(--menu-bg)] z-10" : ""}>A</div>
            </div>
         </div>
         <div className="flex flex-col justify-center">Set navigation legs text {border ? "border " : ""}color.</div>
      </div>
   </ColorPicker>;
};
