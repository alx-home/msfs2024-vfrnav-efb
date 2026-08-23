/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 */

import { CheckBox } from "@alx-home/Utils";
import { AirportLayerSettingSetter } from "@Settings/Settings";
import { useSettings } from "@Settings/SettingsStore";
import { AirportLayerOptions, SharedSettingsRecord } from "@shared/Settings";
import { PropsWithChildren } from "react";
import { useShallow } from "zustand/react/shallow";

type AirportOptionKey = Extract<keyof AirportLayerOptions, string>;

const airportOptionSetters = {
   hardRunway: 'enableHardRunway',
   softRunway: 'enableSoftRunway',
   waterRunway: 'enableWaterRunway',
   private: 'enablePrivate',
   helipads: 'enableHelipads'
} as const satisfies Record<AirportOptionKey, keyof AirportLayerSettingSetter>;

export const AirportOptionSetting = ({ settingKey, children }: PropsWithChildren<{
   settingKey: AirportOptionKey
}>) => {
   const keySetter = airportOptionSetters[settingKey];
   const setting = useSettings(useShallow(settings => ({
      active: settings.airports.active,
      value: settings.airports[settingKey],
      setValue: settings.airports[keySetter]
   })));

   return <CheckBox onChange={setting.setValue} value={setting.value}
      defaultValue={SharedSettingsRecord.defaultValues.airports[settingKey]} active={setting.active}>
      {children}
   </CheckBox>;
};
