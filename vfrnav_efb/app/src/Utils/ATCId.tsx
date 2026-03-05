import { messageHandler } from "@Settings/SettingsProvider";
import { ATCIDResponse } from "@shared/ATCId";
import { useEvent } from "react-use-event-hook";

export const useATCId = () => {
   return useEvent(async (timeout?: number) => {
      const callback: { current: ((_message: ATCIDResponse) => void) | undefined } = {
         current: undefined
      };

      return new Promise<string>((resolve, reject) => {
         const timeoutId = setTimeout(() => {
            reject(new Error("Timeout while waiting for ATC ID response"));
         }, timeout ?? 200);

         callback.current = (message) => {
            clearTimeout(timeoutId);
            resolve(message.value);
         };
         messageHandler.subscribe("__ATC_ID_RESPONSE__", callback.current);

         messageHandler.send({
            __GET_ATC_ID__: true
         });
      }).finally(() => {
         if (callback.current) {
            messageHandler.unsubscribe("__ATC_ID_RESPONSE__", callback.current);
         } else {
            console.assert(false, "Callback should be defined at this point");
         }
      });
   });
};