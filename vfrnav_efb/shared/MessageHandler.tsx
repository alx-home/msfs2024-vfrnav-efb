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

import { reduce, TypeRecord } from './Types';
import { Facilities, FacilitiesRecord, GetFacilities, GetFacilitiesRecord, GetMetar, GetMetarRecord, Metar, MetarRecord } from './Facilities';
import { SharedSettingsRecord, SharedSettings } from './Settings';
import { ActiveRecord, ActiveRecordRecord, EditRecord, EditRecordRecord, GetRecord, GetRecordRecord, PlanePos, PlanePoses, PlanePosesRecord, PlanePosRecord, PlaneRecords, PlaneRecordsRecord, RemoveRecord, RemoveRecordRecord } from './PlanPos';

const MessageIdValues = ["__SETTINGS__", "__GET_SETTINGS__", "__GET_RECORDS__", "__GET_FACILITIES__",
  "__FACILITIES__", "__GET_METAR__", "__METAR__", "__PLANE_POS__", "__PLANE_POSES__", "__RECORDS__",
  "__REMOVE_RECORD__", "__EDIT_RECORD__", "__ACTIVE_RECORD__", '__GET_RECORD__'] as const;
type MessageId = (typeof MessageIdValues)[number];

type MessageType = SharedSettings
  | { __GET_SETTINGS__: true }
  | { __GET_RECORDS__: true }
  | GetFacilities
  | Facilities
  | GetMetar
  | Metar
  | PlanePos
  | PlanePoses
  | PlaneRecords
  | RemoveRecord
  | EditRecord
  | ActiveRecord
  | GetRecord;

const MessageRecord: Record<MessageId, TypeRecord<MessageType> | undefined> = {
  "__SETTINGS__": SharedSettingsRecord,
  "__GET_SETTINGS__": undefined,
  "__GET_RECORDS__": undefined,
  "__GET_FACILITIES__": GetFacilitiesRecord,
  "__FACILITIES__": FacilitiesRecord,
  "__GET_METAR__": GetMetarRecord,
  "__METAR__": MetarRecord,
  "__PLANE_POS__": PlanePosRecord,
  "__PLANE_POSES__": PlanePosesRecord,
  "__RECORDS__": PlaneRecordsRecord,
  "__REMOVE_RECORD__": RemoveRecordRecord,
  "__EDIT_RECORD__": EditRecordRecord,
  "__ACTIVE_RECORD__": ActiveRecordRecord,
  "__GET_RECORD__": GetRecordRecord
}

export class MessageHandler {
  private readonly callbacks: Record<MessageId, ((_message: unknown) => void)[]> = (() => {
    const record_str = MessageIdValues.map(value => `"${value}":[]`).join();
    return JSON.parse(`{${record_str}}`)
  })();

  // eslint-disable-next-line no-unused-vars
  constructor(private readonly iframe?: HTMLIFrameElement) {
    const onmessage = window.onmessage;
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
    const sanitizedData = JSON.stringify(record ? reduce(data, record) : data);

    const elem = this.iframe ? this.iframe.contentWindow : window.top;
    elem?.postMessage({ source: 'vfrNav', value: sanitizedData }, elem.origin);
  }
};