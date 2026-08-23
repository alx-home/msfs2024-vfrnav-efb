/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 */

import { CheckBox } from "@alx-home/Utils";
import { LayerKey } from "@Settings/Settings";
import { useSettings } from "@Settings/SettingsStore";
import { SharedSettingsRecord } from "@shared/Settings";
import { PropsWithChildren } from "react";
import { useShallow } from "zustand/react/shallow";

export const LayerActivationSetting = ({ settingKey, children, disable }: PropsWithChildren<{
   settingKey: LayerKey,
   disable?: boolean
}>) => {
   const setting = useSettings(useShallow(settings => ({
      enabled: settings[settingKey].enabled,
      setEnabled: settings[settingKey].setEnabled
   })));

   return <CheckBox onChange={setting.setEnabled} active={!(disable ?? false)}
      value={setting.enabled} defaultValue={SharedSettingsRecord.defaultValues[settingKey].enabled}>
      {children}
   </CheckBox>;
};
