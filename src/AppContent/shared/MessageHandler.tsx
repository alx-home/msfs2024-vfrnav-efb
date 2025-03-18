import { reduce, TypeRecord } from './Types';
import { Facilities, FacilitiesRecord, GetFacilities, GetFacilitiesRecord, GetMetar, GetMetarRecord, Metar, MetarRecord } from './Facilities';
import { SharedSettingsRecord, SharedSettings } from './Settings';
import { ActiveRecord, ActiveRecordRecord, EditRecord, EditRecordRecord, GetRecord, GetRecordRecord, PlanePos, PlanePoses, PlanePosesRecord, PlanePosRecord, PlaneRecords, PlaneRecordsRecord, RemoveRecord, RemoveRecordRecord } from './PlanPos';

const MessageIdValues = ["SharedSettings", "GetSettings", "GetPlaneRecords", "GetFacilities",
   "Facilities", "GetMetar", "Metar", "PlanePos", "PlanePoses", "PlaneRecords",
   "RemoveRecord", "EditRecord", "ActiveRecord", 'GetRecord'] as const;
type MessageId = (typeof MessageIdValues)[number];
type HandledType = SharedSettings | Facilities | "GetSettings" | "GetPlaneRecords"
   | GetFacilities | GetMetar | Metar | PlanePos | PlanePoses | PlaneRecords
   | RemoveRecord | EditRecord | ActiveRecord | GetRecord;

// todo generic ?
type MessageType = (SharedSettings & {
   mType: 'SharedSettings'
})
   | (Facilities & {
      mType: 'Facilities'
   })
   | ({ mType: "GetSettings" })
   | { mType: "GetPlaneRecords" }
   | (GetFacilities & {
      mType: 'GetFacilities'
   })
   | (GetMetar & {
      mType: 'GetMetar'
   })
   | (Metar & {
      mType: 'Metar'
   })
   | (PlanePos & {
      mType: 'PlanePos'
   })
   | (PlanePoses & {
      mType: 'PlanePoses'
   })
   | (PlaneRecords & {
      mType: 'PlaneRecords'
   })
   | (ActiveRecord & {
      mType: 'ActiveRecord'
   })
   | (EditRecord & {
      mType: 'EditRecord'
   })
   | (RemoveRecord & {
      mType: 'RemoveRecord'
   })
   | (GetRecord & {
      mType: 'GetRecord'
   });

const MessageRecord: Record<MessageId, TypeRecord<HandledType> | undefined> = {
   "SharedSettings": SharedSettingsRecord,
   "GetSettings": undefined,
   "GetPlaneRecords": undefined,
   "GetFacilities": GetFacilitiesRecord,
   "Facilities": FacilitiesRecord,
   "GetMetar": GetMetarRecord,
   "Metar": MetarRecord,
   "PlanePos": PlanePosRecord,
   "PlanePoses": PlanePosesRecord,
   "PlaneRecords": PlaneRecordsRecord,
   "RemoveRecord": RemoveRecordRecord,
   "GetRecord": GetRecordRecord,
   "EditRecord": EditRecordRecord,
   "ActiveRecord": ActiveRecordRecord
}

export class MessageHandler {
   private callbacks: Record<MessageId, ((_message: unknown) => void)[]> = JSON.parse(`{${MessageIdValues.map(value => `"${value}":[]`).join()}}`);

   // eslint-disable-next-line no-unused-vars
   constructor(private readonly iframe?: HTMLIFrameElement) {
      const onmessage = window.onmessage;
      window.onmessage = (e) => {
         if (e.data.source === 'vfrNav') {
            const obj = JSON.parse(e.data.value) as { id: MessageId, value: unknown };
            this.callbacks[obj.id].forEach(callback => callback(obj.value));
         } else {
            onmessage?.call(window, e);
         }
      };
   }

   send<T extends MessageType>(data: T) {
      this.sendImpl(data, MessageRecord[data.mType] as TypeRecord<T>);
   }

   subscribe<T extends HandledType>(uuid: MessageId, callback: (_message: T) => void) {
      this.callbacks[uuid].push(callback as (_: unknown) => void);
   }

   unsubscribe<T extends HandledType>(uuid: MessageId, callback: (_message: T) => void) {
      const index = this.callbacks[uuid].findIndex(value => value === callback as (_: unknown) => void);

      if (index !== -1) {
         this.callbacks[uuid].splice(index, 1);
      }
   }

   private sendImpl<T extends MessageType>(data: T, record?: TypeRecord<T>) {
      const sanitizedData = JSON.stringify({ id: data.mType, value: record ? reduce(data, record) : data });

      const elem = this.iframe ? this.iframe.contentWindow : window.top;
      elem?.postMessage({ source: 'vfrNav', value: sanitizedData }, '*');
   }
};