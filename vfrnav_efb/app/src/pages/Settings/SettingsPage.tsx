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

import { Button, useBatch } from "@alx-home/Utils";

import { useCallback, useEffect, useState } from 'react';
import { useEvent } from "react-use-event-hook";

import { SetPanelSize } from "@shared/Settings";

import { messageHandler, useSettings } from "@Settings/SettingsStore";

import { List } from "./List";
import { Group } from "./Group";
import { SliderItem } from "./SliderItem";
import { CheckItem } from "./CheckItem";
import { Items } from "./Items";
import { ZoomItem } from "./ZoomItem";
import { Legend } from "./Legend";
import { Item } from "./Item";
import { AirportOptionSetting } from "./AirportOptionSetting";
import { AzbaColorSetting } from "./AzbaColorSetting";
import { BorderSizeSetting } from "./BorderSizeSetting";
import { LayerActivationSetting } from "./LayerActivationSetting";
import { MarkerSizeSetting } from "./MarkerSizeSetting";
import { NavigationSettings } from "./NavigationSettings";
import { SIASettings } from "./SIASettings";
import { TextColorSetting } from "./TextColorSetting";
import { TextSizeSetting } from "./TextSizeSetting";



export const WarnPopup = ({ resolve }: {
   resolve: () => void
}) => {
   const setPopup = useSettings(settings => settings.setPopup);
   const emptyPopup = useSettings(settings => settings.emptyPopup);
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
               Ctrl+Shift+Right Click on the EFB to reset to the default size.
            </div>
         </div>
      </div>
      <div className='flex flex-row grow'>
         <Button active={true} onClick={close}>OK</Button>
      </div>
   </div >
};

export const CleanupRecordsPopup = ({ resolve }: {
   resolve: () => void
}) => {
   const setPopup = useSettings(settings => settings.setPopup);
   const emptyPopup = useSettings(settings => settings.emptyPopup);
   const close = useEvent(() => {
      setPopup(emptyPopup);
      resolve();
   });

   const cleanRecords = useEvent(() => {
      messageHandler.send({
         __CLEAN_PLANE_RECORDS__: true
      });
   });

   return <div className='flex flex-col grow'>
      <div className='text-2xl text-yellow-500'>Warning !</div>
      <div className='text-sm overflow-hidden my-5 mb-8'>
         <div className="flex flex-col m-auto">
            <div className="mb-1">You will lose all your plane records</div>
            <div>Do you want to continue ?</div>
         </div>
      </div>
      <div className='flex flex-row grow'>
         <Button active={true} onClick={cleanRecords}>Yes do it</Button>
         <div className='ml-1 flex flex-row grow [&>*]:bg-red-800 [&>*]:hover:bg-red-500 [&>*]:hover:border-white'>
            <Button className='px-4' active={true} onClick={close}>Cancel</Button>
         </div>
      </div>
   </div >
};


export const SettingsPage = () => {
   const setPopup = useSettings(settings => settings.setPopup);
   const [advanced, setAdvanced] = useState(false);
   const [panelWidth, setPanelWidth] = useState(1);
   const [panelHeight, setPanelHeight] = useState(1);
   const [panelOffsetX, setPanelOffsetX] = useState(0);
   const [panelOffsetY, setPanelOffsetY] = useState(0);
   const [dpiScale, setDpiScale] = useState(1);
   const [menuDpi, setMenuDpi] = useState(1);
   const [borderScale, setBorderScale] = useState(1);
   const [showEFBCaption, setShowEFBCaption] = useState(true);
   const [initialized, setInitialized] = useState(false);
   const [warned, setWarned] = useState(false);

   const warn = useCallback(async () => {
      if (!warned) {
         const promise = new Promise<void>((resolve) => {
            setPopup(<WarnPopup resolve={resolve} />);
         });

         await promise;
         setWarned(true);
         return false;
      }

      return true;
   }, [setPopup, warned]);

   const sendEfbSize = useBatch(() => {
      if (__MSFS_EMBEDED__) {
         if (initialized) {
            messageHandler.send({
               __SET_PANEL_SIZE__: true,

               x: panelOffsetX,
               y: panelOffsetY,
               width: panelWidth,
               height: panelHeight,
               borderScale: borderScale,
               dpiScale: dpiScale,
               menuDpiScale: menuDpi,
               captionBar: showEFBCaption
            });
         }
      }
   });

   const setPanelWidthCallback = useEvent(async (value: number) => {
      if (await warn()) {
         setPanelWidth(value);
         sendEfbSize();
      }
   });
   const setPanelHeightCallback = useEvent(async (value: number) => {
      if (await warn()) {
         setPanelHeight(value);
         sendEfbSize();
      }
   });
   const setPanelOffsetYCallback = useEvent(async (value: number) => {
      setPanelOffsetY(value);
      sendEfbSize();
   });
   const setPanelOffsetXCallback = useEvent(async (value: number) => {
      setPanelOffsetX(value);
      sendEfbSize();
   });
   const setShowEFBCaptionCallback = useEvent(async (value: boolean) => {
      setShowEFBCaption(value);
      sendEfbSize();
   });
   const setDpiScaleCallback = useEvent(async (value: number) => {
      if (await warn()) {
         setDpiScale(value);
         sendEfbSize();
      }
   });
   const setMenuDpiCallback = useEvent(async (value: number) => {
      if (await warn()) {
         setMenuDpi(value);
         sendEfbSize();
      }
   });
   const setBorderScaleCallback = useEvent(async (value: number) => {
      setBorderScale(value);
      sendEfbSize();
   });

   const cleanupPlaneRecords = useEvent(async () => {
      const promise = new Promise<void>(resolve => {
         setPopup(<CleanupRecordsPopup resolve={resolve} />);
      });

      await promise;
   });


   useEffect(() => {
      const callback = (msg: SetPanelSize) => {
         setPanelOffsetX(msg.x);
         setPanelOffsetY(msg.y);
         setPanelWidth(msg.width);
         setPanelHeight(msg.height);
         setBorderScale(msg.borderScale);
         setDpiScale(msg.dpiScale);
         setMenuDpi(msg.menuDpiScale);
         setInitialized(true);
      }
      messageHandler.subscribe("__SET_PANEL_SIZE__", callback);

      return () => messageHandler.unsubscribe("__SET_PANEL_SIZE__", callback);
   }, [setInitialized, setPanelOffsetX, setPanelOffsetY, setPanelWidth, setPanelHeight, setBorderScale, setDpiScale, setMenuDpi]);

   return <div className="flex grow justify-center m-2 p-4">
      <div className={"transition transition-std p-4 max-w-[1280px] h-full  m-auto flex text-left flex-col "
         + " hocus:border-msfs"
      }>
         <div className="flex flex-row pl-4 pb-[32px]">
            <div className="flex flex-row grow min-h-12 items-center justify-between p-4 text-2xl border-b-2 border-gray-700 mb-4">
               Settings
            </div>
         </div>
         <List>
            <NavigationSettings />
            {
               __MSFS_EMBEDED__ &&
               <Group name="EFB">
                  <CheckItem category="Panel" name="EFB Caption bar" value={showEFBCaption} onChange={setShowEFBCaptionCallback} defaultValue={true} >
                     Show the EFB caption bar.
                  </CheckItem>
                  <SliderItem category="Panel" name="x Offset"
                     range={{ min: 0., max: 1. }}
                     defaultValue={0}
                     value={panelOffsetX}
                     onChange={setPanelOffsetXCallback}>
                     Set the EFB panel X offset as a percentage of the available area.
                  </SliderItem>
                  <SliderItem category="Panel" name="y Offset"
                     range={{ min: 0., max: 1. }}
                     defaultValue={0}
                     value={panelOffsetY}
                     onChange={setPanelOffsetYCallback}>
                     Set the EFB panel Y offset as a percentage of the available area.
                  </SliderItem>
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
                     onChange={setBorderScaleCallback}>
                     Adjust the Border size of the EFB.
                  </SliderItem>
               </Group>
            }
            <Group name="Map">
               <Items name="Airports" category="Layers">
                  <LayerActivationSetting settingKey="airports">
                     Use Airports Layer
                  </LayerActivationSetting>
                  <AirportOptionSetting settingKey='hardRunway'>
                     - Hard runway airports
                  </AirportOptionSetting>
                  <AirportOptionSetting settingKey='softRunway'>
                     - Soft runway airports
                  </AirportOptionSetting>
                  <AirportOptionSetting settingKey='private'>
                     - Private / Military airports
                  </AirportOptionSetting>
                  <AirportOptionSetting settingKey='helipads'>
                     - Helipads
                  </AirportOptionSetting>
                  <AirportOptionSetting settingKey='waterRunway'>
                     - Hippodromes
                  </AirportOptionSetting>
               </Items>
               <Items name="VFR" category="Layers">
                  <LayerActivationSetting settingKey="azba">
                     Use France AZBA Layer (sia)
                  </LayerActivationSetting>
                  <LayerActivationSetting settingKey="OACI">
                     Use France OACI Layer (geoportal)
                  </LayerActivationSetting>
                  <LayerActivationSetting settingKey="germany">
                     Use Germany DFS Layer (secais).
                  </LayerActivationSetting>
                  <LayerActivationSetting settingKey="openaipmaps" disable={true}>
                     <div className="opacity-30">
                        Use Open Aip Layer (Disabled: Until optimized).
                     </div>
                  </LayerActivationSetting>
                  <LayerActivationSetting settingKey="openflightmaps">
                     Use Open Flight Layer.
                  </LayerActivationSetting>
                  <LayerActivationSetting settingKey="openflightmapsBase">
                     Use Open Flight Base Layer (Background).
                  </LayerActivationSetting>
                  <LayerActivationSetting settingKey="USSectional">
                     Use US sectional Layers (iflightplanner).
                  </LayerActivationSetting>
               </Items>
               <Items name="IFR" category="Layers">
                  <LayerActivationSetting settingKey="USIFRHigh">
                     Use US High IFR Layers (iflightplanner).
                  </LayerActivationSetting>
                  <LayerActivationSetting settingKey="USIFRLow">
                     Use US Low IFR Layers (iflightplanner).
                  </LayerActivationSetting>
               </Items>
               <Items name="Topographic" category="Layers">
                  <LayerActivationSetting settingKey="opentopo">
                     Use Open Topo Layer.
                  </LayerActivationSetting>
                  <LayerActivationSetting settingKey="mapforfree">
                     Use Map for free Layer.
                  </LayerActivationSetting>
               </Items>
               <Items name="World" category="Layers">
                  <LayerActivationSetting settingKey="googlemap">
                     Use Google map Layer.
                  </LayerActivationSetting>
                  <LayerActivationSetting settingKey="openstreet">
                     Use Open Street map Layer.
                  </LayerActivationSetting>
               </Items>
               <Items name="Cheat" category="Layers">
                  <LayerActivationSetting settingKey="plane">
                     Use plane Layer (Displays aircraft position on the map).
                  </LayerActivationSetting>
               </Items>
               <Items name="Visibility" category="Layers">
                  <Legend>
                     <div className="pb-2">
                        Set zoom levels for which the layer is to be displayed on the map. Zooming out of this range on the map will hide the layer.
                     </div>
                  </Legend>
                  <ZoomItem name="Airports" settingKey="airports" />
                  <ZoomItem name="France AZBA" settingKey="azba" />
                  <ZoomItem name="France OACI" settingKey="OACI" />
                  <ZoomItem name="Germany DFS" settingKey="germany" />
                  <ZoomItem name="US sectional" settingKey="USSectional" />
                  <ZoomItem name="US High IFR" settingKey="USIFRHigh" />
                  <ZoomItem name="US Low IFR" settingKey="USIFRLow" />
                  <ZoomItem name="Open Aip" settingKey="openaipmaps" />
                  <ZoomItem name="Open Flight" settingKey="openflightmaps" />
                  <ZoomItem name="Open Flight Base" settingKey="openflightmapsBase" />
                  <ZoomItem name="Open Topo" settingKey="opentopo" />
                  <ZoomItem name="Open Street" settingKey="openstreet" />
                  <ZoomItem name="Map4Free" settingKey="mapforfree" />
                  <ZoomItem name="Google" settingKey="googlemap" />
                  <ZoomItem name="Plane" settingKey="plane" />
               </Items>
            </Group>
            <Group name="Map Display">
               <AzbaColorSetting name="Active high color" colorKey="activeHighColor" setterKey="setActiveHighColor">
                  <div className="flex flex-col justify-center">Set AZBA active high layer color.</div>
               </AzbaColorSetting>
               <AzbaColorSetting name="Active low color" colorKey="activeLowColor" setterKey="setActiveLowColor">
                  <div className="flex flex-col justify-center">Set AZBA active low layer color.</div>
               </AzbaColorSetting>
               <AzbaColorSetting name="Inactive high color" colorKey="inactiveHighColor" setterKey="setInactiveHighColor">
                  <div className="flex flex-col justify-center">Set AZBA inactive high layer color.</div>
               </AzbaColorSetting>
               <AzbaColorSetting name="Inactive low color" colorKey="inactiveLowColor" setterKey="setInactiveLowColor">
                  <div className="flex flex-col justify-center">Set AZBA inactive low layer color.</div>
               </AzbaColorSetting>
               <TextSizeSetting />
               <BorderSizeSetting />
               <TextColorSetting />
               <TextColorSetting border />
               <MarkerSizeSetting />
            </Group>
            <SIASettings advanced={advanced} />
            {__MSFS_EMBEDED__ && <Group name="Data">
               <Item name={"Cleanup"} category={"Record"} onReset={cleanupPlaneRecords} >
                  <div>
                     Cleanup stored data. Use this option to clear all plane records data stored in the simulator. Use this option in case of any issue related to plane records data (like a corrupted record or a &quot;Cloud save error&quot; due to the previous release not clearing data properly).
                  </div>
                  <div className="flex flex-row grow translate-y-4">
                     <Button active={true} onClick={cleanupPlaneRecords}>
                        Clean plane records
                     </Button>
                  </div>
               </Item>
            </Group>}
            <Group name="Expert">
               <CheckItem category="Settings" name="Advanced" value={advanced} onChange={setAdvanced} defaultValue={false} >
                  Display advanced settings.
               </CheckItem>
            </Group>
         </List>
      </div>
   </div>;
}