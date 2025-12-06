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

import { GenRecord, reduce, TypeRecord } from './Types';
import { Facilities, FacilitiesRecord, GetFacilities, GetFacilitiesRecord, GetICAOS, GetICAOSRecord as GetIcaosRecord, GetLatLon, GetLatLonRecord, GetMetar, GetMetarRecord, Icaos, IcaosRecord, LatLon, LatLonRecord, Metar, MetarRecord } from './Facilities';
import { SharedSettingsRecord, SharedSettings, SetPanelSize, SetPanelSizeRecord } from './Settings';
import { EditRecord, EditRecordRecord, GetRecord, GetRecordRecord, PlanePos, PlanePoses, PlanePosesRecord, PlanePosRecord, PlaneRecords, PlaneRecordsRecord, RemoveRecord, RemoveRecordRecord } from './PlanPos';
import { ByeBye, ByeByeRecord, HelloWorld, HelloWorldRecord, SetId, SetIdRecord } from './HelloWorld';
import { FileExist, FileExistRecord, FileExistResponse, FileExistResponseRecord, GetFile, GetFileRecord, GetFileResponse, GetFileResponseRecord, OpenFile, OpenFileRecord, OpenFileResponse, OpenFileResponseRecord } from './Files';
import { EfbState, EfbStateRecord, GetEFBState, GetEFBStateRecord, GetServerState, GetServerStateRecord, ServerState, ServerStateRecord } from './Server';
import { ExportNav, ExportNavRecord, ImportNav, ImportNavRecord } from './NavData';
import { ExportPdfs, ExportPdfsRecord } from './Pdfs';
import { DefaultFuelPreset, DefaultFuelPresetRecord, DeleteFuelPreset, DeleteFuelPresetRecord, Fuel, FuelPresets, FuelPresetsRecord, FuelRecord, GetFuel, GetFuelCurve, GetFuelCurveRecord, GetFuelPresets, GetFuelPresetsRecord, GetFuelRecord, SetFuelCurve, SetFuelCurveRecord } from './Fuel';
import { DefaultDeviationPreset, DefaultDeviationPresetRecord, DeleteDeviationPreset, DeleteDeviationPresetRecord, DeviationPresets, DeviationPresetsRecord, GetDeviationCurve, GetDeviationCurveRecord, GetDeviationPresets, GetDeviationPresetsRecord, SetDeviationCurve, SetDeviationCurveRecord } from './Deviation';

const MessageIdValues = [
   "__EXPORT_NAV__",
   "__GET_RECORD__",
   "__IMPORT_NAV__",
   "__BYE_BYE__",
   "__DEFAULT_DEVIATION_PRESET__",
   "__DEFAULT_FUEL_PRESET__",
   "__DELETE_DEVIATION_PRESET__",
   "__DELETE_FUEL_PRESET__",
   "__DEVIATION_CURVE__",
   "__DEVIATION_PRESETS__",
   "__EDIT_RECORD__",
   "__EFB_STATE__",
   "__EXPORT_PDFS__",
   "__FACILITIES__",
   "__FILE_EXISTS__",
   "__FILE_EXISTS_RESPONSE__",
   "__FUEL__",
   "__FUEL_CURVE__",
   "__FUEL_PRESETS__",
   "__GET_DEVIATION_CURVE__",
   "__GET_DEVIATION_PRESETS__",
   "__GET_EFB_STATE__",
   "__GET_FACILITIES__",
   "__GET_FILE__",
   "__GET_FILE_RESPONSE__",
   "__GET_FUEL__",
   "__GET_FUEL_CURVE__",
   "__GET_FUEL_PRESETS__",
   "__GET_ICAOS__",
   "__GET_LAT_LON__",
   "__GET_METAR__",
   "__GET_RECORDS__",
   "__GET_SERVER_STATE__",
   "__GET_SETTINGS__",
   "__HELLO_WORLD__",
   "__ICAOS__",
   "__LAT_LON__",
   "__METAR__",
   "__OPEN_FILE__",
   "__OPEN_FILE_RESPONSE__",
   "__PLANE_POS__",
   "__PLANE_POSES__",
   "__RECORDS__",
   "__REMOVE_RECORD__",
   "__SERVER_STATE__",
   "__SET_ID__",
   "__SET_PANEL_SIZE__",
   "__SETTINGS__",
] as const;
type MessageId = (typeof MessageIdValues)[number];

export type GetSettings = { __GET_SETTINGS__: true };
export type GetRecords = { __GET_RECORDS__: true };

const GetSettingsRecord = GenRecord<GetSettings>({
   __GET_SETTINGS__: true
}, {})
const GetRecordsRecord = GenRecord<GetRecords>({
   __GET_RECORDS__: true
}, {});

type MessageTypes = {
   "__BYE_BYE__": ByeBye,
   "__DEFAULT_DEVIATION_PRESET__": DefaultDeviationPreset,
   "__DEFAULT_FUEL_PRESET__": DefaultFuelPreset,
   "__DELETE_DEVIATION_PRESET__": DeleteDeviationPreset,
   "__DELETE_FUEL_PRESET__": DeleteFuelPreset,
   "__DEVIATION_CURVE__": SetDeviationCurve,
   "__DEVIATION_PRESETS__": DeviationPresets,
   "__EDIT_RECORD__": EditRecord,
   "__EFB_STATE__": EfbState,
   "__EXPORT_NAV__": ExportNav,
   "__EXPORT_PDFS__": ExportPdfs,
   "__FACILITIES__": Facilities,
   "__FILE_EXISTS__": FileExist,
   "__FILE_EXISTS_RESPONSE__": FileExistResponse,
   "__FUEL__": Fuel,
   "__FUEL_CURVE__": SetFuelCurve,
   "__FUEL_PRESETS__": FuelPresets,
   "__GET_DEVIATION_CURVE__": GetDeviationCurve,
   "__GET_DEVIATION_PRESETS__": GetDeviationPresets,
   "__GET_EFB_STATE__": GetEFBState,
   "__GET_FACILITIES__": GetFacilities,
   "__GET_FILE__": GetFile,
   "__GET_FILE_RESPONSE__": GetFileResponse,
   "__GET_FUEL__": GetFuel,
   "__GET_FUEL_CURVE__": GetFuelCurve,
   "__GET_FUEL_PRESETS__": GetFuelPresets,
   "__GET_ICAOS__": GetICAOS,
   "__GET_LAT_LON__": GetLatLon,
   "__GET_METAR__": GetMetar,
   "__GET_RECORD__": GetRecord,
   "__GET_RECORDS__": GetRecords,
   "__GET_SERVER_STATE__": GetServerState,
   "__GET_SETTINGS__": GetSettings,
   "__HELLO_WORLD__": HelloWorld,
   "__ICAOS__": Icaos,
   "__IMPORT_NAV__": ImportNav,
   "__LAT_LON__": LatLon,
   "__METAR__": Metar,
   "__OPEN_FILE__": OpenFile,
   "__OPEN_FILE_RESPONSE__": OpenFileResponse,
   "__PLANE_POS__": PlanePos,
   "__PLANE_POSES__": PlanePoses,
   "__RECORDS__": PlaneRecords,
   "__REMOVE_RECORD__": RemoveRecord,
   "__SERVER_STATE__": ServerState,
   "__SET_ID__": SetId,
   "__SET_PANEL_SIZE__": SetPanelSize,
   "__SETTINGS__": SharedSettings,
};
export type MessageType = MessageTypes[keyof MessageTypes];

const MessageRecord: Record<MessageId, TypeRecord<MessageType> | undefined> = {
   "__BYE_BYE__": ByeByeRecord,
   "__DEFAULT_DEVIATION_PRESET__": DefaultDeviationPresetRecord,
   "__DEFAULT_FUEL_PRESET__": DefaultFuelPresetRecord,
   "__DELETE_DEVIATION_PRESET__": DeleteDeviationPresetRecord,
   "__DELETE_FUEL_PRESET__": DeleteFuelPresetRecord,
   "__DEVIATION_CURVE__": SetDeviationCurveRecord,
   "__DEVIATION_PRESETS__": DeviationPresetsRecord,
   "__EDIT_RECORD__": EditRecordRecord,
   "__EFB_STATE__": EfbStateRecord,
   "__EXPORT_NAV__": ExportNavRecord,
   "__EXPORT_PDFS__": ExportPdfsRecord,
   "__FACILITIES__": FacilitiesRecord,
   "__FILE_EXISTS__": FileExistRecord,
   "__FILE_EXISTS_RESPONSE__": FileExistResponseRecord,
   "__FUEL__": FuelRecord,
   "__FUEL_CURVE__": SetFuelCurveRecord,
   "__FUEL_PRESETS__": FuelPresetsRecord,
   "__GET_DEVIATION_CURVE__": GetDeviationCurveRecord,
   "__GET_DEVIATION_PRESETS__": GetDeviationPresetsRecord,
   "__GET_EFB_STATE__": GetEFBStateRecord,
   "__GET_FACILITIES__": GetFacilitiesRecord,
   "__GET_FILE__": GetFileRecord,
   "__GET_FILE_RESPONSE__": GetFileResponseRecord,
   "__GET_FUEL__": GetFuelRecord,
   "__GET_FUEL_CURVE__": GetFuelCurveRecord,
   "__GET_FUEL_PRESETS__": GetFuelPresetsRecord,
   "__GET_ICAOS__": GetIcaosRecord,
   "__GET_LAT_LON__": GetLatLonRecord,
   "__GET_METAR__": GetMetarRecord,
   "__GET_RECORD__": GetRecordRecord,
   "__GET_RECORDS__": GetRecordsRecord,
   "__GET_SERVER_STATE__": GetServerStateRecord,
   "__GET_SETTINGS__": GetSettingsRecord,
   "__HELLO_WORLD__": HelloWorldRecord,
   "__ICAOS__": IcaosRecord,
   "__IMPORT_NAV__": ImportNavRecord,
   "__LAT_LON__": LatLonRecord,
   "__METAR__": MetarRecord,
   "__OPEN_FILE__": OpenFileRecord,
   "__OPEN_FILE_RESPONSE__": OpenFileResponseRecord,
   "__PLANE_POS__": PlanePosRecord,
   "__PLANE_POSES__": PlanePosesRecord,
   "__RECORDS__": PlaneRecordsRecord,
   "__REMOVE_RECORD__": RemoveRecordRecord,
   "__SERVER_STATE__": ServerStateRecord,
   "__SET_ID__": SetIdRecord,
   "__SET_PANEL_SIZE__": SetPanelSizeRecord,
   "__SETTINGS__": SharedSettingsRecord,
};

export const isMessage = <Id extends MessageId,>(id: Id, message: MessageType): message is MessageTypes[Id] => {
   return id in message;
};

export class MessageHandler {
   private readonly callbacks: Record<MessageId, ((_message: unknown) => void)[]> = (() => {
      const record_str = MessageIdValues.map(value => `"${value}":[]`).join();
      return JSON.parse(`{${record_str}}`)
   })();

   // eslint-disable-next-line no-unused-vars
   constructor(private readonly iframe?: HTMLIFrameElement) {
      const onmessage = window.onmessage;

      if (__MSFS_EMBEDED__) {
         window.onmessage = (e) => {
            if (e.data.source === 'vfrNav') {
               const obj = JSON.parse(e.data.value);

               MessageIdValues.find(value => {
                  if (obj[value]) {
                     this.callbacks[value].forEach(callback => callback(obj));
                     return true
                  }

                  return false
               })
            } else {
               onmessage?.call(window, e);
            }
         };
      } else {
         window.vfrnav_onmessage = async (obj: MessageType) => {
            MessageIdValues.find(value => {
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               if ((obj as any)[value]) {
                  this.callbacks[value].forEach(callback => callback(obj));
                  return true
               }

               return false
            })
         }
      }
   }

   send<T extends MessageType>(data: T) {
      MessageIdValues.find(value => {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         if ((data as any)[value]) {
            this.sendImpl(data, MessageRecord[value]);
            return true
         }

         return false
      })
   }

   subscribe<T extends MessageId>(uuid: T, callback: (_message: MessageTypes[T]) => void) {
      this.callbacks[uuid].push(callback as (_: unknown) => void);
   }

   unsubscribe<T extends MessageType>(uuid: MessageId, callback: (_message: T) => void) {
      const index = this.callbacks[uuid].findIndex(value => value === callback as (_: unknown) => void);

      if (index !== -1) {
         this.callbacks[uuid].splice(index, 1);
      } else {
         console.error(`Unsubscribe: callback not registered for message ${uuid}`);
      }
   }

   private sendImpl(data: MessageType, record?: TypeRecord<MessageType>) {
      if (__MSFS_EMBEDED__) {
         const sanitizedData = JSON.stringify(record ? reduce(data, record) : data);

         const elem = this.iframe ? this.iframe.contentWindow : window.top;
         elem?.postMessage({ source: 'vfrNav', value: sanitizedData }, elem.origin);
      } else {
         window.vfrnav_postMessage!(record ? reduce(data, record) : data);
      }
   }
};