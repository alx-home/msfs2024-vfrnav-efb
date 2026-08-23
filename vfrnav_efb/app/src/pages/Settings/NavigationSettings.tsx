/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 */

import { useSettings } from "@Settings/SettingsStore";
import { SharedSettingsRecord } from "@shared/Settings";
import { PropsWithChildren, useMemo } from "react";
import { useEvent } from "react-use-event-hook";
import { useShallow } from "zustand/react/shallow";
import { Group } from "./Group";
import { InputItem } from "./InputItem";
import { SliderItem } from "./SliderItem";

const ErrorMessage = ({ children }: PropsWithChildren<{ type: string }>) => children;

export const NavigationSettings = () => {
   const azba = useSettings(useShallow(settings => ({
      range: settings.map.azba.range,
      setRange: settings.map.azba.setRange
   })));
   const defaultSpeed = useSettings(settings => settings.defaultSpeed);
   const setDefaultSpeed = useSettings(settings => settings.setDefaultSpeed);
   const setSpeed = useEvent((value: string) => setDefaultSpeed(+value));
   const validate = useEvent((value: string) => Promise.resolve(/^\d*$/g.test(value)));
   const AZBARange = useMemo(() => {
      const hours = Math.floor(azba.range / 60);
      const minutes = Math.floor(azba.range - hours * 60);
      return (hours ? hours + 'h' : '') + (minutes < 10 ? '0' : '') + minutes + 'min';
   }, [azba.range]);

   return <Group name="Navigation">
      <SliderItem category="AZBA" name="Margin" range={{ min: 0, max: 24 * 60 }}
         defaultValue={SharedSettingsRecord.defaultValues.map.azba.range} value={azba.range} onChange={azba.setRange}>
         <div className="flex flex-row">
            <div className="flex flex-col justify-center">Consider an AZBA zone to be active {AZBARange} before its real beginning time.</div>
         </div>
      </SliderItem>
      <InputItem name="Speed" type="text" placeholder={SharedSettingsRecord.defaultValues.defaultSpeed.toString()} inputMode="decimal"
         value={defaultSpeed.toString()} defaultValue={SharedSettingsRecord.defaultValues.defaultSpeed.toString()}
         validate={validate} onChange={setSpeed}>
         <div>Specify the default cruise speed for the aircraft when generating a new navigation path.</div>
         <ErrorMessage type="Error">Please enter a numerical value !</ErrorMessage>
      </InputItem>
   </Group>;
};
