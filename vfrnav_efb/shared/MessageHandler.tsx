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
import { FacilitiesRecord, GetFacilitiesRecord, GetICAOSRecord as GetIcaosRecord, GetLatLonRecord, GetMetarRecord, IcaosRecord, LatLonRecord, MetarRecord } from './Facilities';
import { SharedSettingsRecord, SetPanelSizeRecord, SetEfbModeRecord, CleanPlaneRecordsRecord } from './Settings';
import { EditRecordRecord, GetPlaneBlobRecord, PlaneBlobRecord, PlanePosRecord, PlaneRecordsRecord, RemoveRecordRecord } from './PlanPos';
import { ByeByeRecord, HelloWorldRecord, SetIdRecord } from './HelloWorld';
import { FileExistRecord, FileExistResponseRecord, GetFileRecord, GetFileResponseRecord, OpenFileRecord, OpenFileResponseRecord } from './Files';
import { EfbStateRecord, GetEFBStateRecord, GetServerStateRecord, ServerStateRecord } from './Server';
import { ExportNavRecord, ImportNavRecord } from './NavData';
import { ExportPdfsRecord, PdfBlobRecord, PdfProcessedRecord } from './Pdfs';
import { DefaultFuelPresetRecord, DeleteFuelPresetRecord, FuelPresetsRecord, FuelRecord, GetFuelCurveRecord, GetFuelPresetsRecord, GetFuelRecord, SetFuelCurveRecord } from './Fuel';
import { DefaultDeviationPresetRecord, DeleteDeviationPresetRecord, DeviationPresetsRecord, GetDeviationCurveRecord, GetDeviationPresetsRecord, SetDeviationCurveRecord } from './Deviation';
import { DateResponseRecord, GetDateRecord } from './Date';
import { ATCIDResponseRecord, GetATCIdRecord } from './ATCId';

export type GetSettings = { __GET_SETTINGS__: true };
export type GetRecords = { __GET_RECORDS__: true };

const GetSettingsRecord = GenRecord<GetSettings>({
   __GET_SETTINGS__: true
}, {})
const GetRecordsRecord = GenRecord<GetRecords>({
   __GET_RECORDS__: true
}, {});

const Messages = {
   "__ATC_ID_RESPONSE__": ATCIDResponseRecord,
   "__BYE_BYE__": ByeByeRecord,
   "__CLEAN_PLANE_RECORDS__": CleanPlaneRecordsRecord,
   "__DATE_RESPONSE__": DateResponseRecord,
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
   "__GET_ATC_ID__": GetATCIdRecord,
   "__GET_DATE__": GetDateRecord,
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
   "__GET_PLANE_BLOB__": GetPlaneBlobRecord,
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
   "__PDF_BLOB__": PdfBlobRecord,
   "__PDF_PROCESSED__": PdfProcessedRecord,
   "__PLANE_BLOB__": PlaneBlobRecord,
   "__PLANE_POS__": PlanePosRecord,
   "__RECORDS__": PlaneRecordsRecord,
   "__REMOVE_RECORD__": RemoveRecordRecord,
   "__SERVER_STATE__": ServerStateRecord,
   "__SET_EFB_MODE__": SetEfbModeRecord,
   "__SET_ID__": SetIdRecord,
   "__SET_PANEL_SIZE__": SetPanelSizeRecord,
   "__SETTINGS__": SharedSettingsRecord,
};
export type MessageType = {
   [Id in keyof typeof Messages]: typeof Messages[Id]["defaultValues"]
}[keyof typeof Messages];
type MessageId = keyof typeof Messages;
const MessageIdValues = Object.keys(Messages) as [MessageId];

export const isMessage = <Id extends MessageId,>(id: Id, message: MessageType): message is typeof Messages[Id]["defaultValues"] => {
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
            this.sendImpl(data, Messages[value]);
            return true
         }

         return false
      })
   }

   subscribe<T extends MessageId>(uuid: T, callback: (_message: typeof Messages[T]["defaultValues"]) => void) {
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