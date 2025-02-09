import { isType, reduce, Type } from '@shared/Types';
import { SharedSettingsRecord, SharedSettings } from './Settings';

const MessageIdValues = ["SharedSettings", "GetSettings"] as const;
type MessageType = SharedSettings | "GetSettings";
type MessageId = (typeof MessageIdValues)[number];

const MessageChecker: Record<MessageId, (_object: unknown) => boolean> = {
   "SharedSettings": (e) => isType<SharedSettings>(e, SharedSettingsRecord),
   "GetSettings": (_object) => _object === "GetSettings"
}
const MessageRecord: Record<MessageId, Type<MessageType> | undefined> = {
   "SharedSettings": SharedSettingsRecord,
   "GetSettings": undefined
}

export class MessageHandler {
   private callbacks: Record<MessageId, ((_message: unknown) => void)[]> = JSON.parse(`{${MessageIdValues.map(value => `"${value}":[]`).join()}}`);

   // eslint-disable-next-line no-unused-vars
   constructor(private readonly iframe?: HTMLIFrameElement) {
      const onmessage = window.onmessage;
      window.onmessage = (e) => {
         if (e.data.source === 'vfrNav') {
            const obj = JSON.parse(e.data.value)

            const messageId = MessageIdValues.find(value => MessageChecker[value]?.(obj));
            if (messageId) {
               this.callbacks[messageId].forEach(callback => callback(obj));
            }
         } else {
            onmessage?.call(window, e);
         }
      };
   }

   send<T extends MessageType>(data: T) {
      const messageId = MessageIdValues.find(value => MessageChecker[value]?.(data));
      if (messageId) {
         this.sendImpl(data, MessageRecord[messageId] as Type<T>);
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

   private sendImpl<T>(data: T, record?: Type<T>) {
      const sanitizedData = JSON.stringify(record ? reduce(data, record) : data);

      const elem = this.iframe ? this.iframe.contentWindow : window.top;
      elem?.postMessage({ source: 'vfrNav', value: sanitizedData }, '*');
   }
};