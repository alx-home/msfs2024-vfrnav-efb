/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 */

import { useSettings } from "@Settings/SettingsStore";
import { SharedSettingsRecord } from "@shared/Settings";
import { PropsWithChildren, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Group } from "./Group";
import { InputItem } from "./InputItem";
import { useEvent } from "react-use-event-hook";

type AddressValidator = (_value: string, _blur: boolean) => Promise<boolean>;
type SIAValueKey = Extract<keyof typeof SharedSettingsRecord.defaultValues, `SIA${string}`>;
type SIASetterKey = {
   [Key in SIAValueKey]: `set${Key}`;
}[SIAValueKey];

const ErrorMessage = ({ children }: PropsWithChildren<{ type: string }>) => children;

const SIASetting = ({ name, valueKey, setterKey, placeholder, validate, children }: PropsWithChildren<{
   name: string,
   valueKey: SIAValueKey,
   setterKey: SIASetterKey,
   placeholder: string,
   validate: AddressValidator
}>) => {
   const { value, onChange } = useSettings(useShallow(settings => ({
      value: settings[valueKey],
      onChange: settings[setterKey]
   })));

   return <InputItem category="SIA" name={name} inputMode="text" validate={validate}
      placeholder={placeholder} value={value} defaultValue={SharedSettingsRecord.defaultValues[valueKey]}
      onChange={onChange}>
      {children}
   </InputItem>;
};

export const SIASettings = ({ advanced }: { advanced: boolean }) => {
   const getPatternReg = useEvent((value: string, blur: boolean) => {
      if (blur) {
         return String.raw`\{${value}\}`;
      } else {
         return Array.from(`{${value}}`).reduce((prev, char) => {
            if (/[{}]/.test(char)) {
               return prev + `(?:\\${char}|$)`;
            } else {
               return prev + `(?:${char}|$)`;
            }
         }, '');
      }
   });
   const uriValidator = useEvent((regex: string, blur: boolean, value: string) => {
      const port = blur ? String.raw`(:\d{1,4})?` : String.raw`(?:\:|$)(?:\d|$){4}`;
      const proto = blur ? `(https?|ftp|file)://`
         : `(((?:h|$)(?:t|$)(?:t|$)(?:p|$)(?:s|$)?)|`
         + `((?:f|$)(?:t|$)(?:p|$))|`
         + `((?:f|$)(?:i|$)(?:l|$)(?:e|$))`
         + String.raw`)(?:\:|$)(?:/|$){2}`;

      return (!value.length) || new RegExp(`^${proto}${regex}${port}$`, 'g').test(value);
   });
   const uriChar = useMemo(() => String.raw`(\w|\/|-|_|\.|\&|\=|\?)`, []);
   const validateSIAAddr = useEvent((value: string, blur: boolean) => {
      const icao = getPatternReg('icao', blur);
      return Promise.resolve(uriValidator(`${uriChar}*${icao}${uriChar}*`, blur, value));
   });
   const validateSIAAZBAAddr = useEvent((value: string, blur: boolean) => {
      const date = getPatternReg('date', blur);
      return Promise.resolve(uriValidator(`${uriChar}*${date}${uriChar}*`, blur, value));
   });
   const validateSIAAZBADateAddr = useEvent((value: string, blur: boolean) =>
      Promise.resolve(uriValidator(`${uriChar}+`, blur, value)));
   const validateAuthorizationToken = useEvent(value => Promise.resolve(/^(\w+)?=?$/g.test(value)));

   return <Group name="Enroute Charts" className={advanced ? "" : 'hidden'}>
      <div className={advanced ? "" : 'hidden'}>
         <SIASetting name="Authorization token" valueKey="SIAAuth" setterKey="setSIAAuth"
            validate={validateAuthorizationToken}
            placeholder="Please enter an authorization token">
            Authorization token for accessing SIA Enroute charts on the PDF page. Use this settings in case of a broken default address.<br />
            For more information, please go to the addon wiki: <a href="https://github.com/alx-home/msfs2024-vfrnav-efb/wiki">https://github.com/alx-home/msfs2024-vfrnav-efb/wiki</a>
         </SIASetting>
         <SIASetting name="Address" valueKey="SIAAddr" setterKey="setSIAAddr" validate={validateSIAAddr}
            placeholder={__SIA_ADDR__}>
            PDF template Address with {'{icao}'} placeholder. Use this settings in case of a broken default address.<br />
            For more information, please go to the addon wiki: <a href="https://github.com/alx-home/msfs2024-vfrnav-efb/wiki">https://github.com/alx-home/msfs2024-vfrnav-efb/wiki</a>
            <ErrorMessage type="Error">Invalid Address! pattern: (http,https,ftp)://***{'{icao}'}***</ErrorMessage>
         </SIASetting>
         <SIASetting name="AZBA address" valueKey="SIAAZBAAddr" setterKey="setSIAAZBAAddr" validate={validateSIAAZBAAddr}
            placeholder={__SIA_AZBA_ADDR__}>
            AZBA template Address with {'{date}'} placeholder. Use this settings in case of a broken default address.<br />
            For more information, please go to the addon wiki: <a href="https://github.com/alx-home/msfs2024-vfrnav-efb/wiki">https://github.com/alx-home/msfs2024-vfrnav-efb/wiki</a>
            <ErrorMessage type="Error">Invalid Address! pattern: (http,https,ftp)://***{'{date}'}***</ErrorMessage>
         </SIASetting>
         <SIASetting name="AZBA date address" valueKey="SIAAZBADateAddr" setterKey="setSIAAZBADateAddr" validate={validateSIAAZBADateAddr}
            placeholder={__SIA_AZBA_DATE_ADDR__}>
            AZBA date template Address. Use this setting in case of a broken default address.<br />
            For more information, please go to the addon wiki: <a href="https://github.com/alx-home/msfs2024-vfrnav-efb/wiki">https://github.com/alx-home/msfs2024-vfrnav-efb/wiki</a>
            <ErrorMessage type="Error">Invalid Address! pattern: (http,https,ftp)://***</ErrorMessage>
         </SIASetting>
      </div>
   </Group>;
};
