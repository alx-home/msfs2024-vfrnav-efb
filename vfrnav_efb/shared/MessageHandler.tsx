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
import { Facilities, FacilitiesRecord, GetFacilities, GetFacilitiesRecord, GetMetar, GetMetarRecord, Metar, MetarRecord } from './Facilities';
import { SharedSettingsRecord, SharedSettings } from './Settings';
import { EditRecord, EditRecordRecord, GetRecord, GetRecordRecord, PlanePos, PlanePoses, PlanePosesRecord, PlanePosRecord, PlaneRecords, PlaneRecordsRecord, RemoveRecord, RemoveRecordRecord } from './PlanPos';
import { ByeBye, ByeByeRecord, HelloWorld, HelloWorldRecord } from './HelloWorld';

const MessageIdValues = ["__HELLO_WORLD__", "__BYE_BYE__", "__SETTINGS__", "__GET_SETTINGS__", "__GET_RECORDS__", "__GET_FACILITIES__",
   "__FACILITIES__", "__GET_METAR__", "__METAR__", "__PLANE_POS__", "__PLANE_POSES__", "__RECORDS__",
   "__REMOVE_RECORD__", "__EDIT_RECORD__", '__GET_RECORD__'] as const;
type MessageId = (typeof MessageIdValues)[number];

type GetSettings = { __GET_SETTINGS__: true };
type GetRecords = { __GET_RECORDS__: true };

const GetSettingsRecord = GenRecord<GetSettings>({
   __GET_SETTINGS__: true
}, {})
const GetRecordsRecord = GenRecord<GetRecords>({
   __GET_RECORDS__: true
}, {});

type MessageTypes = {
   "__BYE_BYE__": ByeBye,
   "__HELLO_WORLD__": HelloWorld,
   "__SETTINGS__": SharedSettings,
   "__GET_SETTINGS__": GetSettings,
   "__GET_RECORDS__": GetRecords,
   "__GET_FACILITIES__": GetFacilities,
   "__FACILITIES__": Facilities,
   "__GET_METAR__": GetMetar,
   "__METAR__": Metar,
   "__PLANE_POS__": PlanePos,
   "__PLANE_POSES__": PlanePoses,
   "__RECORDS__": PlaneRecords,
   "__REMOVE_RECORD__": RemoveRecord,
   "__EDIT_RECORD__": EditRecord,
   "__GET_RECORD__": GetRecord
};
export type MessageType = MessageTypes[keyof MessageTypes];

const MessageRecord: Record<MessageId, TypeRecord<MessageType> | undefined> = {
   "__BYE_BYE__": ByeByeRecord,
   "__HELLO_WORLD__": HelloWorldRecord,
   "__SETTINGS__": SharedSettingsRecord,
   "__GET_SETTINGS__": GetSettingsRecord,
   "__GET_RECORDS__": GetRecordsRecord,
   "__GET_FACILITIES__": GetFacilitiesRecord,
   "__FACILITIES__": FacilitiesRecord,
   "__GET_METAR__": GetMetarRecord,
   "__METAR__": MetarRecord,
   "__PLANE_POS__": PlanePosRecord,
   "__PLANE_POSES__": PlanePosesRecord,
   "__RECORDS__": PlaneRecordsRecord,
   "__REMOVE_RECORD__": RemoveRecordRecord,
   "__EDIT_RECORD__": EditRecordRecord,
   "__GET_RECORD__": GetRecordRecord
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
         if ((data as any)[value]) {
            this.sendImpl(data, MessageRecord[value]);
            return true
         }

         return false
      })
   }

   subscribe<T extends MessageType>(uuid: MessageId, callback: (_message: T) => void) {
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
      } else if (window.vfrnav_postMessage) {
         window.vfrnav_postMessage(record ? reduce(data, record) : data);
      } else {
         // @todo
      }
   }
};