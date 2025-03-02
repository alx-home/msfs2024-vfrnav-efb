import { isType, reduce, TypeRecord } from './Types';
import { Facilities, FacilitiesRecord, GetFacilities, GetFacilitiesRecord, GetMetar, GetMetarRecord, Metar, MetarRecord } from './Facilities';
import { SharedSettingsRecord, SharedSettings } from './Settings';

const MessageIdValues = ["SharedSettings", "GetSettings", "GetFacilities", "Facilities", "GetMetar", "Metar"] as const;
type MessageType = SharedSettings | Facilities | "GetSettings" | GetFacilities | GetMetar | Metar;
type MessageId = (typeof MessageIdValues)[number];

const MessageRecord: Record<MessageId, TypeRecord<MessageType> | undefined> = {
   "SharedSettings": SharedSettingsRecord,
   "GetSettings": undefined,
   "GetFacilities": GetFacilitiesRecord,
   "Facilities": FacilitiesRecord,
   "GetMetar": GetMetarRecord,
   "Metar": MetarRecord
}

const checkMessage = (type: MessageId, _object: unknown) => {
   if (MessageRecord[type] === undefined) {
      return typeof _object === 'string' && type === _object;
   } else {
      return isType(_object, MessageRecord[type])
   }
}

export class MessageHandler {
   private callbacks: Record<MessageId, ((_message: unknown) => void)[]> = JSON.parse(`{${MessageIdValues.map(value => `"${value}":[]`).join()}}`);

   // eslint-disable-next-line no-unused-vars
   constructor(private readonly iframe?: HTMLIFrameElement) {
      const onmessage = window.onmessage;
      window.onmessage = (e) => {
         if (e.data.source === 'vfrNav') {
            const obj = JSON.parse(e.data.value)

            const messageId = MessageIdValues.find(value => checkMessage(value, obj));
            if (messageId) {
               this.callbacks[messageId].forEach(callback => callback(obj));
            }
         } else {
            onmessage?.call(window, e);
         }
      };
   }

   send<T extends MessageType>(data: T) {
      const messageId = MessageIdValues.find(value => checkMessage(value, data));
      if (messageId) {
         this.sendImpl(data, MessageRecord[messageId] as TypeRecord<T>);
      }
   }

   subscribe<T extends MessageType>(uuid: MessageId, callback: (_message: T) => void) {
      this.callbacks[uuid].push(callback as (_: unknown) => void);
   }

   unsubscribe<T extends MessageType>(uuid: MessageId, callback: (_message: T) => void) {
      const index = this.callbacks[uuid].findIndex(value => value === callback as (_: unknown) => void);

      if (index !== -1) {
         this.callbacks[uuid].splice(index, 1);
      }
   }

   private sendImpl<T>(data: T, record?: TypeRecord<T>) {
      const sanitizedData = JSON.stringify(record ? reduce(data, record) : data);

      const elem = this.iframe ? this.iframe.contentWindow : window.top;
      elem?.postMessage({ source: 'vfrNav', value: sanitizedData }, '*');
   }
};