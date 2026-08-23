/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 */

import { useSettings } from "@Settings/SettingsStore";
import { Color, SharedSettingsRecord } from "@shared/Settings";
import { PropsWithChildren } from "react";
import { useShallow } from "zustand/react/shallow";
import { ColorPicker } from "./ColorPicker";
import oaciImg from '@efb-images/oaci.jpg';

type AzbaColorKey = Exclude<{
    [Key in keyof typeof SharedSettingsRecord.defaultValues.map.azba]: typeof SharedSettingsRecord.defaultValues.map.azba[Key] extends Color ? Key : never
}[keyof typeof SharedSettingsRecord.defaultValues.map.azba], undefined>;

type AzbaColorSetterKey = {
    [Key in AzbaColorKey]: `set${Capitalize<Key & string>}`;
}[AzbaColorKey];

const colorToCss = (color: Color) =>
   `rgba(${color.red.toFixed(0)}, ${color.green.toFixed(0)}, ${color.blue.toFixed(0)}, ${color.alpha})`;

export const AzbaColorSetting = ({ name, colorKey, setterKey, children }: PropsWithChildren<{
   name: string,
   colorKey: AzbaColorKey,
   setterKey: AzbaColorSetterKey
}>) => {
   const { color, setColor } = useSettings(useShallow(settings => ({
      color: settings.map.azba[colorKey],
      setColor: settings.map.azba[setterKey]
   })));

   return <ColorPicker name={name} category="AZBA" defaultColor={SharedSettingsRecord.defaultValues.map.azba[colorKey]} value={color} setColor={setColor}>
      <div className="flex flex-row min-h-[60px]">
         <div className="flex min-w-[50px] justify-center">
            <div className="flex flex-row justify-end rounded-md overflow-hidden mr-2 min-w-[50px]"
               style={{ backgroundImage: `url(${oaciImg})`, backgroundSize: 'cover' }}>
               <div className="flex w-1/2 h-full" style={{ backgroundColor: colorToCss(color) }} />
            </div>
            {children}
         </div>
      </div>
   </ColorPicker>;
};
