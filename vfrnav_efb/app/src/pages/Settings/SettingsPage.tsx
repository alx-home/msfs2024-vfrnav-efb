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

import { Button, CheckBox } from "@alx-home/Utils";

import { PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { AirportLayerOptions, LayerSetting, SetEfbMode, SetPanelSize, SharedSettingsRecord } from "@shared/Settings";

import { messageHandler, SettingsContext } from "@Settings/SettingsProvider";
import { AirportLayerSettingSetter, LayerSettingSetter } from "@Settings/Settings";

import { List } from "./List";
import { Group } from "./Group";
import { InputItem } from "./InputItem";
import { SliderItem } from "./SliderItem";
import { CheckItem } from "./CheckItem";
import { Items } from "./Items";
import { ZoomItem } from "./ZoomItem";
import { Legend } from "./Legend";
import { ColorPicker } from "./ColorPicker";
import { DualSliderItem } from "./DualSliderItem";

import markerImg from '@efb-images/marker-icon-blue.svg';
import oaciImg from '@efb-images/oaci.jpg';

const ErrorMessage = ({ children }: PropsWithChildren<{
   type: string
}>) => {
   return children;
};

const LayerActivation = ({ setting, defaultSetting, reset, children }: PropsWithChildren<{
   setting: LayerSetting & LayerSettingSetter,
   defaultSetting: LayerSetting,
   reset?: boolean
}>) => {
   return <CheckBox onChange={setting.setEnabled} reset={reset}
      value={setting.enabled} defaultValue={defaultSetting.enabled}>
      {children}
   </CheckBox>
}

const AirortLayerOption = ({ setting, defaultSetting, reset, children, settingKey }: PropsWithChildren<{
   setting: AirportLayerOptions & LayerSetting & AirportLayerSettingSetter,
   defaultSetting: AirportLayerOptions,
   reset?: boolean,
   settingKey: keyof AirportLayerOptions
}>) => {
   const keySetter = useMemo(() => ('enable' + settingKey.charAt(0).toUpperCase() + settingKey.substring(1)) as keyof AirportLayerSettingSetter, [settingKey]);

   return <CheckBox onChange={setting[keySetter]} reset={reset}
      value={setting[settingKey]} defaultValue={defaultSetting[settingKey]} active={setting.active}>
      {children}
   </CheckBox>
}



export const WarnPopup = ({ resolve }: {
   resolve: () => void
}) => {
   const { setPopup, emptyPopup } = useContext(SettingsContext)!;
   const close = useCallback(() => {
      setPopup(emptyPopup);
      resolve();
   }, [setPopup, emptyPopup, resolve]);

   return <div className='flex flex-col grow'>
      <div className='text-2xl text-yellow-500'>Warning !</div>
      <div className='text-sm overflow-hidden my-5'>
         <div className="flex flex-col m-auto">
            <div>If you can&apos;t access the resize buttons because the UI is too small,</div>
            <div>
               Alt+Click on the top of the EFB to reload the EFB OS and restore the default size.
            </div>
         </div>
      </div>
      <div className='flex flex-row grow'>
         <Button active={true} onClick={close}>OK</Button>
      </div>
   </div >
};


export const SettingsPage = ({ active }: {
   active: boolean
}) => {
   const { setPopup } = useContext(SettingsContext)!;

   const settings = useContext(SettingsContext)!;
   const [opacity, setOpacity] = useState(' opacity-0');
   const [advanced, setAdvanced] = useState(false);
   const setSpeed = useCallback((value: string) => settings.setDefaultSpeed(+value), [settings]);
   const [panelWidth, setPanelWidth] = useState(1);
   const [panelHeight, setPanelHeight] = useState(1);
   const [dpiScale, setDpiScale] = useState(1);
   const [menuDpi, setMenuDpi] = useState(1);
   const [borderScale, setBorderScale] = useState(1);
   const [mode2D, setMode2D] = useState(true);
   const [initialized, setInitialized] = useState(false);
   const [warned, setWarned] = useState(false);

   const warn = useCallback(async () => {
      if (!warned) {
         const promise = new Promise<void>((resolve) => {
            setPopup(<WarnPopup resolve={resolve} />);
         });

         await promise;
         setWarned(true);
      }
   }, [setPopup, warned]);

   const setPanelWidthCallback = useCallback(async (value: number) => {
      await warn();
      setPanelWidth(value);
   }, [warn]);
   const setPanelHeightCallback = useCallback(async (value: number) => {
      await warn();
      setPanelHeight(value);
   }, [warn]);
   const setDpiScaleCallback = useCallback(async (value: number) => {
      await warn();
      setDpiScale(value);
   }, [warn]);
   const setMenuDpiCallback = useCallback(async (value: number) => {
      await warn();
      setMenuDpi(value);
   }, [warn]);

   useEffect(() => {
      if (__MSFS_EMBEDED__) {
         document.documentElement.style.setProperty('--dpi-scale', mode2D ? (menuDpi / (dpiScale * panelWidth)).toString() : '1');
         document.documentElement.style.setProperty('--resize-ratio', mode2D ? panelWidth.toFixed(2) : '1');
         document.documentElement.style.setProperty('--font-size', mode2D ? (dpiScale * 100).toFixed(0) + '%' : '100%');
      }
   }, [dpiScale, panelWidth, menuDpi, mode2D]);

   useEffect(() => {
      if (__MSFS_EMBEDED__) {
         if (initialized) {
            messageHandler.send({
               __SET_PANEL_SIZE__: true,

               width: panelWidth,
               height: panelHeight,
               borderScale: borderScale,
               dpiScale: dpiScale,
               menuDpiScale: menuDpi
            });
         }
      }
   }, [panelWidth, panelHeight, borderScale, dpiScale, menuDpi, initialized]);

   useEffect(() => {
      const callback = (msg: SetPanelSize) => {
         setPanelWidth(msg.width);
         setPanelHeight(msg.height);
         setBorderScale(msg.borderScale);
         setDpiScale(msg.dpiScale);
         setMenuDpi(msg.menuDpiScale);
         setInitialized(true);
      }
      messageHandler.subscribe("__SET_PANEL_SIZE__", callback);

      return () => messageHandler.unsubscribe("__SET_PANEL_SIZE__", callback);
   }, [setInitialized, setPanelWidth, setPanelHeight, setBorderScale, setDpiScale, setMenuDpi]);

   useEffect(() => {
      const callback = (msg: SetEfbMode) => {
         setMode2D(msg.mode2D);
      }
      messageHandler.subscribe("__SET_EFB_MODE__", callback);

      return () => messageHandler.unsubscribe("__SET_EFB_MODE__", callback);
   }, []);

   useEffect(() => {
      if (active) {
         setOpacity(' opacity-100');
      } else {
         setOpacity(' opacity-0');
      }
   }, [active]);

   const textSize = useMemo(() => ({ min: settings.map.text.minSize, max: settings.map.text.maxSize }), [settings.map.text.maxSize, settings.map.text.minSize]);
   const defaultTextSize = useMemo(() => ({ min: SharedSettingsRecord.defaultValues.map.text.minSize, max: SharedSettingsRecord.defaultValues.map.text.maxSize }), []);
   const setTextSize = useCallback((min: number, max: number) => {
      settings.map.text.setMinSize(min);
      settings.map.text.setMaxSize(max);
   }, [settings.map.text]);


   const getPatternReg = useCallback((value: string, blur: boolean) => {
      return blur ? `\\{${value}\\}` : Array.from(`{${value}}`).reduce((prev, char) => prev + `(?:${/[{}]/.test(char) ? `\\${char}` : char}|$)`, '');
   }, []);

   const uriValidator = useCallback((regex: string, blur: boolean, value: string) => {
      const port = blur ? `(:\\d{1,4})?` : `(?:\\:|$)(?:\\d|$){4}`;
      const proto = blur ? `(https?|ftp|file)://` :
         `(((?:h|$)(?:t|$)(?:t|$)(?:p|$)(?:s|$)?)|`
         + `((?:f|$)(?:t|$)(?:p|$))|`
         + `((?:f|$)(?:i|$)(?:l|$)(?:e|$))`
         + `)(?:\\:|$)(?:/|$){2}`;

      return (!value.length) || new RegExp('^' + proto + regex + port + '$', 'g').test(value)
   }, []);

   const uriChar = useMemo(() => '(\\w|\\/|-|_|\\.|\\&|\\=|\\?)', []);

   const validateSIAAddr = useCallback((value: string, blur: boolean) => {
      const regex = (() => {
         const icao = getPatternReg('icao', blur);

         return `${uriChar}*${icao}${uriChar}*`;
      })();

      return Promise.resolve(uriValidator(regex, blur, value))
   }, [getPatternReg, uriValidator, uriChar]);

   const validateSIAAZBAAddr = useCallback((value: string, blur: boolean) => {
      const regex = (() => {
         const date = getPatternReg('date', blur);

         return `${uriChar}*${date}${uriChar}*`;
      })();

      return Promise.resolve(uriValidator(regex, blur, value))
   }, [getPatternReg, uriValidator, uriChar]);

   const validateSIAAZBADateAddr = useCallback((value: string, blur: boolean) => {
      return Promise.resolve(uriValidator(`${uriChar}+`, blur, value))
   }, [uriValidator, uriChar]);

   const AZBARange = useMemo(() => {
      const range = settings.map.azba.range;
      const hours = Math.floor(range / 60);
      const minutes = Math.floor(range - hours * 60);

      return (hours ? hours + 'h' : '') + (minutes < 10 ? '0' : '') + minutes + 'min';
   }, [settings.map.azba.range]);


   return <div className="flex grow justify-center m-2 p-4" style={active ? {} : { display: 'none' }}>
      <div className={"transition transition-std p-4 max-w-[1280px] h-full  m-auto flex text-left flex-col "
         + " hocus:border-msfs"
         + opacity
      }>
         <div className="flex flex-row pl-4 pb-[32px]">
            <div className="flex flex-row grow min-h-12 items-center justify-between p-4 text-2xl border-b-2 border-gray-700 mb-4">
               Settings
            </div>
         </div>
         <List>
            <Group name="Navigation">
               <SliderItem category="AZBA" name="Margin"
                  range={{ min: 0, max: 24 * 60 }}
                  defaultValue={SharedSettingsRecord.defaultValues.map.azba.range}
                  value={settings.map.azba.range}
                  onChange={settings.map.azba.setRange}>
                  <div className="flex flex-row">
                     <div className="flex flex-col justify-center">Consider an AZBA zone to be active {AZBARange} before its real beginning time.</div>
                  </div>
               </SliderItem>
               <InputItem name="Speed" type="text" placeholder={SharedSettingsRecord.defaultValues.defaultSpeed.toString()} inputMode="decimal"
                  value={settings.defaultSpeed.toString()} defaultValue={SharedSettingsRecord.defaultValues.defaultSpeed.toString()}
                  validate={value => Promise.resolve(/^\d*$/g.test(value))}
                  onChange={setSpeed}>
                  <div>
                     Specify the default cruise speed for the aircraft when generating a new navigation path.
                  </div>
                  <ErrorMessage type='Error'>
                     Please enter a numerical value !
                  </ErrorMessage>
               </InputItem>
            </Group>
            {
               __MSFS_EMBEDED__ && mode2D &&
               <Group name="EFB">
                  <SliderItem category="Panel" name="Width"
                     range={{ min: 0.05, max: 1 }}
                     defaultValue={1}
                     oneShot={true}
                     value={panelWidth}
                     onChange={setPanelWidthCallback}>
                     Set the EFB panel width as a percentage of the default size.
                  </SliderItem>
                  <SliderItem category="Panel" name="Height"
                     range={{ min: 0.05, max: 1 }}
                     defaultValue={1}
                     value={panelHeight}
                     onChange={setPanelHeightCallback}>
                     Set the EFB panel height as a percentage of the default size.
                  </SliderItem>
                  <SliderItem category="Panel" name="DPI Scale"
                     range={{ min: 0.1, max: 2 }}
                     defaultValue={1}
                     oneShot={true}
                     value={dpiScale}
                     onChange={setDpiScaleCallback}>
                     Adjust the DPI scale for the VfrNav app.
                  </SliderItem>
                  <SliderItem category="Panel" name="Menu DPI Scale"
                     range={{ min: 0.1, max: 1 }}
                     defaultValue={1}
                     oneShot={true}
                     value={menuDpi}
                     onChange={setMenuDpiCallback}>
                     Adjust the DPI scale for the left menu panel.
                  </SliderItem>
                  <SliderItem category="Panel" name="EFB Border"
                     range={{ min: 0.1, max: 1 }}
                     defaultValue={1}
                     oneShot={true}
                     value={borderScale}
                     onChange={setBorderScale}>
                     Adjust the Border size of the EFB.
                  </SliderItem>
               </Group>
            }
            <Group name="Map">
               <Items name="Airports" category="Layers">
                  <LayerActivation setting={settings.airports} defaultSetting={SharedSettingsRecord.defaultValues.airports}>
                     Use Airports Layer
                  </LayerActivation>
                  <AirortLayerOption setting={settings.airports} defaultSetting={SharedSettingsRecord.defaultValues.airports} settingKey='hardRunway'>
                     - Hard runway airports
                  </AirortLayerOption>
                  <AirortLayerOption setting={settings.airports} defaultSetting={SharedSettingsRecord.defaultValues.airports} settingKey='softRunway'>
                     - Soft runway airports
                  </AirortLayerOption>
                  <AirortLayerOption setting={settings.airports} defaultSetting={SharedSettingsRecord.defaultValues.airports} settingKey='private'>
                     - Private / Military airports
                  </AirortLayerOption>
                  <AirortLayerOption setting={settings.airports} defaultSetting={SharedSettingsRecord.defaultValues.airports} settingKey='helipads'>
                     - Helipads
                  </AirortLayerOption>
                  <AirortLayerOption setting={settings.airports} defaultSetting={SharedSettingsRecord.defaultValues.airports} settingKey='waterRunway'>
                     - Hippodromes
                  </AirortLayerOption>
               </Items>
               <Items name="VFR" category="Layers">
                  <LayerActivation setting={settings.azba} defaultSetting={SharedSettingsRecord.defaultValues.azba}>
                     Use France AZBA Layer (sia)
                  </LayerActivation>
                  <LayerActivation setting={settings.OACI} defaultSetting={SharedSettingsRecord.defaultValues.OACI}>
                     Use France OACI Layer (geoportal)
                  </LayerActivation>
                  <LayerActivation setting={settings.germany} defaultSetting={SharedSettingsRecord.defaultValues.germany}>
                     Use Germany DFS Layer (secais).
                  </LayerActivation>
                  <LayerActivation setting={settings.openaipmaps} defaultSetting={SharedSettingsRecord.defaultValues.openaipmaps}>
                     Use Open Aip Layer.
                  </LayerActivation>
                  <LayerActivation setting={settings.openflightmaps} defaultSetting={SharedSettingsRecord.defaultValues.openflightmaps}>
                     Use Open Flight Layer.
                  </LayerActivation>
                  <LayerActivation setting={settings.openflightmapsBase} defaultSetting={SharedSettingsRecord.defaultValues.openflightmapsBase}>
                     Use Open Flight Base Layer (Background).
                  </LayerActivation>
                  <LayerActivation setting={settings.USSectional} defaultSetting={SharedSettingsRecord.defaultValues.USSectional}>
                     Use US sectional Layers (iflightplanner).
                  </LayerActivation>
               </Items>
               <Items name="IFR" category="Layers">
                  <LayerActivation setting={settings.USIFRHigh} defaultSetting={SharedSettingsRecord.defaultValues.USIFRHigh}>
                     Use US High IFR Layers (iflightplanner).
                  </LayerActivation>
                  <LayerActivation setting={settings.USIFRLow} defaultSetting={SharedSettingsRecord.defaultValues.USIFRLow}>
                     Use US Low IFR Layers (iflightplanner).
                  </LayerActivation>
               </Items>
               <Items name="Topographic" category="Layers">
                  <LayerActivation setting={settings.opentopo} defaultSetting={SharedSettingsRecord.defaultValues.opentopo}>
                     Use Open Topo Layer.
                  </LayerActivation>
                  <LayerActivation setting={settings.mapforfree} defaultSetting={SharedSettingsRecord.defaultValues.mapforfree}>
                     Use Map for free Layer.
                  </LayerActivation>
               </Items>
               <Items name="World" category="Layers">
                  <LayerActivation setting={settings.googlemap} defaultSetting={SharedSettingsRecord.defaultValues.googlemap}>
                     Use Google map Layer.
                  </LayerActivation>
                  <LayerActivation setting={settings.openstreet} defaultSetting={SharedSettingsRecord.defaultValues.openstreet}>
                     Use Open Street map Layer.
                  </LayerActivation>
               </Items>
               <Items name="Cheat" category="Layers">
                  <LayerActivation setting={settings.plane} defaultSetting={SharedSettingsRecord.defaultValues.plane}>
                     Use plane Layer (Displays aircraft position on the map).
                  </LayerActivation>
               </Items>
               <Items name="Visibility" category="Layers">
                  <Legend>
                     <div className="pb-2">
                        Set zoom levels for which the layer is to be displayed on the map. Zooming out of this range on the map will hide the layer.
                     </div>
                  </Legend>
                  <ZoomItem name="Airports" setting={settings.airports} defaultSetting={SharedSettingsRecord.defaultValues.airports} />
                  <ZoomItem name="France AZBA" setting={settings.azba} defaultSetting={SharedSettingsRecord.defaultValues.azba} />
                  <ZoomItem name="France OACI" setting={settings.OACI} defaultSetting={SharedSettingsRecord.defaultValues.OACI} />
                  <ZoomItem name="Germany DFS" setting={settings.germany} defaultSetting={SharedSettingsRecord.defaultValues.germany} />
                  <ZoomItem name="US sectional" setting={settings.USSectional} defaultSetting={SharedSettingsRecord.defaultValues.USSectional} />
                  <ZoomItem name="US High IFR" setting={settings.USIFRHigh} defaultSetting={SharedSettingsRecord.defaultValues.USIFRHigh} />
                  <ZoomItem name="US Low IFR" setting={settings.USIFRLow} defaultSetting={SharedSettingsRecord.defaultValues.USIFRLow} />
                  <ZoomItem name="Open Aip" setting={settings.openaipmaps} defaultSetting={SharedSettingsRecord.defaultValues.openaipmaps} />
                  <ZoomItem name="Open Flight" setting={settings.openflightmaps} defaultSetting={SharedSettingsRecord.defaultValues.openflightmaps} />
                  <ZoomItem name="Open Flight Base" setting={settings.openflightmapsBase} defaultSetting={SharedSettingsRecord.defaultValues.openflightmapsBase} />
                  <ZoomItem name="Open Topo" setting={settings.opentopo} defaultSetting={SharedSettingsRecord.defaultValues.opentopo} />
                  <ZoomItem name="Open Street" setting={settings.openstreet} defaultSetting={SharedSettingsRecord.defaultValues.openstreet} />
                  <ZoomItem name="Map4Free" setting={settings.mapforfree} defaultSetting={SharedSettingsRecord.defaultValues.mapforfree} />
                  <ZoomItem name="Google" setting={settings.googlemap} defaultSetting={SharedSettingsRecord.defaultValues.googlemap} />
                  <ZoomItem name="Plane" setting={settings.plane} defaultSetting={SharedSettingsRecord.defaultValues.plane} />
               </Items>
            </Group>
            <Group name="Map Display">
               <ColorPicker name="Active high color" category="AZBA" defaultColor={SharedSettingsRecord.defaultValues.map.azba.activeHighColor} value={settings.map.azba.activeHighColor} setColor={settings.map.azba.setActiveHighColor}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex min-w-[50px] justify-center">
                        <div className={"flex flex-row justify-end rounded-md overflow-hidden mr-2 min-w-[50px]"} style={{ backgroundImage: `url(${oaciImg})`, backgroundSize: 'cover' }} >
                           <div className="flex w-1/2 h-full"
                              style={{
                                 backgroundColor: `rgba(${settings.map.azba.activeHighColor.red.toFixed(0)}, ${settings.map.azba.activeHighColor.green.toFixed(0)}, ${settings.map.azba.activeHighColor.blue.toFixed(0)}, ${settings.map.azba.activeHighColor.alpha})`,
                              }} />
                        </div>
                        <div className="flex flex-col justify-center">Set AZBA active high layer color.</div>
                     </div>
                  </div>
               </ColorPicker>
               <ColorPicker name="Active low color" category="AZBA" defaultColor={SharedSettingsRecord.defaultValues.map.azba.activeLowColor} value={settings.map.azba.activeLowColor} setColor={settings.map.azba.setActiveLowColor}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex min-w-[50px] justify-center">
                        <div className={"flex flex-row justify-end rounded-md overflow-hidden mr-2 min-w-[50px]"} style={{ backgroundImage: `url(${oaciImg})`, backgroundSize: 'cover' }}  >
                           <div className="flex w-1/2 h-full"
                              style={{
                                 backgroundColor: `rgba(${settings.map.azba.activeLowColor.red.toFixed(0)}, ${settings.map.azba.activeLowColor.green.toFixed(0)}, ${settings.map.azba.activeLowColor.blue.toFixed(0)}, ${settings.map.azba.activeLowColor.alpha})`
                              }} />
                        </div>
                        <div className="flex flex-col justify-center">Set AZBA active low layer color.</div>
                     </div>
                  </div>
               </ColorPicker>
               <ColorPicker name="Inactive high color" category="AZBA" defaultColor={SharedSettingsRecord.defaultValues.map.azba.inactiveHighColor} value={settings.map.azba.inactiveHighColor} setColor={settings.map.azba.setInactiveHighColor}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex min-w-[50px] justify-center">
                        <div className={"flex flex-row justify-end rounded-md overflow-hidden mr-2 min-w-[50px]"} style={{ backgroundImage: `url(${oaciImg})`, backgroundSize: 'cover' }} >
                           <div className="flex w-1/2 h-full"
                              style={{
                                 backgroundColor: `rgba(${settings.map.azba.inactiveHighColor.red.toFixed(0)}, ${settings.map.azba.inactiveHighColor.green.toFixed(0)}, ${settings.map.azba.inactiveHighColor.blue.toFixed(0)}, ${settings.map.azba.inactiveHighColor.alpha})`
                              }} />
                        </div>
                        <div className="flex flex-col justify-center">Set AZBA inactive high layer color.</div>
                     </div>
                  </div>
               </ColorPicker>
               <ColorPicker name="Inactive low color" category="AZBA" defaultColor={SharedSettingsRecord.defaultValues.map.azba.inactiveLowColor} value={settings.map.azba.inactiveLowColor} setColor={settings.map.azba.setInactiveLowColor}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex min-w-[50px] justify-center">
                        <div className={"flex flex-row justify-end rounded-md overflow-hidden mr-2 min-w-[50px]"} style={{ backgroundImage: `url(${oaciImg})`, backgroundSize: 'cover' }}  >
                           <div className="flex w-1/2 h-full"
                              style={{
                                 backgroundColor: `rgba(${settings.map.azba.inactiveLowColor.red.toFixed(0)}, ${settings.map.azba.inactiveLowColor.green.toFixed(0)}, ${settings.map.azba.inactiveLowColor.blue.toFixed(0)}, ${settings.map.azba.inactiveLowColor.alpha})`
                              }} />
                        </div>
                        <div className="flex flex-col justify-center">Set AZBA inactive low layer color.</div>
                     </div>
                  </div>
               </ColorPicker>
               <DualSliderItem category="Legs" name="Text size"
                  range={{ min: 5, max: 50 }}
                  defaultValue={defaultTextSize}
                  value={textSize}
                  onChange={setTextSize}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex flex-row min-w-[80px] justify-center">
                        <div className={"flex flex-col justify-center mr-1"} style={{ font: `900 ${textSize.min.toFixed(0)}px Inter-bold, sans-serif` }}>a</div>
                        <div className={"flex flex-col justify-center"} style={{ font: `900 ${textSize.max.toFixed(0)}px Inter-bold, sans-serif` }}>A</div>
                     </div>
                     <div className="flex flex-col justify-center">Set bounds of navigation legs text size.</div>
                  </div>
               </DualSliderItem>
               <SliderItem category="Legs" name="Border size"
                  range={{ min: 1, max: 15 }}
                  defaultValue={SharedSettingsRecord.defaultValues.map.text.borderSize}
                  value={settings.map.text.borderSize}
                  onChange={settings.map.text.setBorderSize}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex min-w-[50px] justify-center mr-2">
                        <div className={"relative flex flex-col justify-center"} style={{ font: `900 50px Inter-bold, sans-serif` }}>
                           <div className="z-0 text-transparent" style={{
                              WebkitTextStroke: `${settings.map.text.borderSize.toFixed(0)}px #fff`
                           }}>A</div>
                           <div className="position absolute top-0 bottom-0 left-0 right-0 z-10 text-[var(--background)] group-hover:text-[var(--menu-bg)]">A</div></div>
                     </div>
                     <div className="flex flex-col justify-center">Set navigation legs text border size.</div>
                  </div>
               </SliderItem>
               <ColorPicker name="Text Color" category="Legs" defaultColor={SharedSettingsRecord.defaultValues.map.text.color} value={settings.map.text.color} setColor={settings.map.text.setColor}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex min-w-[50px] justify-center">
                        <div className={"flex flex-col justify-center bg-white rounded-md px-2 mr-2"} style={{ font: `900 50px Inter-bold, sans-serif`, color: `rgba(${settings.map.text.color.red.toFixed(0)}, ${settings.map.text.color.green.toFixed(0)}, ${settings.map.text.color.blue.toFixed(0)}, ${settings.map.text.color.alpha})` }}>A</div>
                        <div className="flex flex-col justify-center">Set navigation legs text color.</div>
                     </div>
                  </div>
               </ColorPicker>
               <ColorPicker name="Border Color" category="Legs" defaultColor={SharedSettingsRecord.defaultValues.map.text.borderColor} value={settings.map.text.borderColor} setColor={settings.map.text.setBorderColor}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex min-w-[50px] justify-center mr-2">
                        <div className={"relative flex flex-col justify-center"} style={{ font: `900 50px Inter-bold, sans-serif` }}>
                           <div className="z-0 text-transparent" style={{
                              WebkitTextStroke: `10px rgba(${settings.map.text.borderColor.red.toFixed(0)}, ${settings.map.text.borderColor.green.toFixed(0)}, ${settings.map.text.borderColor.blue.toFixed(0)}, ${settings.map.text.borderColor.alpha})`
                           }}>A</div>
                           <div className="position absolute top-0 bottom-0 left-0 right-0 text-[var(--background)] group-hover:text-[var(--menu-bg)] z-10">A</div>
                        </div>
                     </div>
                     <div className="flex flex-col justify-center">Set navigation legs text border color.</div>
                  </div>
               </ColorPicker>
               <SliderItem category="Marker" name="Size"
                  range={{ min: 10, max: 80 }}
                  value={settings.map.markerSize} defaultValue={SharedSettingsRecord.defaultValues.map.markerSize}
                  onChange={settings.map.setMarkerSize}>
                  <div className="flex flex-row min-h-[80px]">
                     <div className="flex min-w-[80px] justify-center">
                        <img alt='marker' src={markerImg} width={settings.map.markerSize} />
                     </div>
                     <div className="flex flex-col justify-center">Set navigation legs marker size.</div>
                  </div>
               </SliderItem>
            </Group>
            <Group name="Enroute Charts" className={advanced ? "" : 'hidden'}>
               <div className={advanced ? "" : 'hidden'}>
                  <InputItem category="SIA" name="Authorization token" inputMode="text"
                     validate={value => Promise.resolve(/^(\w+)?=?$/g.test(value))}
                     placeholder='Please enter an authorization token'
                     value={settings.SIAAuth} defaultValue={SharedSettingsRecord.defaultValues.SIAAuth}
                     onChange={settings.setSIAAuth}>
                     Authorization token for accessing SIA Enroute charts on the PDF page. Use this settings in case of a broken default address.<br />
                     For more information, please go to the addon wiki: <a href="https://github.com/alx-home/msfs2024-vfrnav-efb/wiki">https://github.com/alx-home/msfs2024-vfrnav-efb/wiki</a>
                  </InputItem>
                  <InputItem category="SIA" name="Address" inputMode="text"
                     validate={validateSIAAddr}
                     placeholder={__SIA_ADDR__}
                     value={settings.SIAAddr} defaultValue={SharedSettingsRecord.defaultValues.SIAAddr}
                     onChange={settings.setSIAAddr}>
                     PDF template Address with {'{icao}'} placeholder. Use this settings in case of a broken default address.<br />
                     For more information, please go to the addon wiki: <a href="https://github.com/alx-home/msfs2024-vfrnav-efb/wiki">https://github.com/alx-home/msfs2024-vfrnav-efb/wiki</a>
                     <ErrorMessage type='Error'>
                        Invalid Address! pattern: (http,https,ftp)://***{'{icao}'}***
                     </ErrorMessage>
                  </InputItem>
                  <InputItem category="SIA" name="AZBA address" inputMode="text"
                     validate={validateSIAAZBAAddr}
                     placeholder={__SIA_AZBA_ADDR__}
                     value={settings.SIAAZBAAddr} defaultValue={SharedSettingsRecord.defaultValues.SIAAZBAAddr}
                     onChange={settings.setSIAAZBAAddr}>
                     AZBA template Address with {'{date}'} placeholder. Use this settings in case of a broken default address.<br />
                     For more information, please go to the addon wiki: <a href="https://github.com/alx-home/msfs2024-vfrnav-efb/wiki">https://github.com/alx-home/msfs2024-vfrnav-efb/wiki</a>
                     <ErrorMessage type='Error'>
                        Invalid Address! pattern: (http,https,ftp)://***{'{date}'}***
                     </ErrorMessage>
                  </InputItem>
                  <InputItem category="SIA" name="AZBA date address" inputMode="text"
                     validate={validateSIAAZBADateAddr}
                     placeholder={__SIA_AZBA_DATE_ADDR__}
                     value={settings.SIAAZBADateAddr} defaultValue={SharedSettingsRecord.defaultValues.SIAAZBADateAddr}
                     onChange={settings.setSIAAZBADateAddr}>
                     AZBA date template Address. Use this settings in case of a broken default address.<br />
                     For more information, please go to the addon wiki: <a href="https://github.com/alx-home/msfs2024-vfrnav-efb/wiki">https://github.com/alx-home/msfs2024-vfrnav-efb/wiki</a>
                     <ErrorMessage type='Error'>
                        Invalid Address! pattern: (http,https,ftp)://***
                     </ErrorMessage>
                  </InputItem>
               </div>
            </Group>
            <Group name="Expert">
               <CheckItem category="Settings" name="Advanced" value={advanced} onChange={setAdvanced} defaultValue={false} >
                  Display advanced settings.
               </CheckItem>
            </Group>
         </List>
      </div>
   </div >;
}