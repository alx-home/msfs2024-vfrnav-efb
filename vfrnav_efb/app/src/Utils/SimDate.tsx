import { messageHandler } from "@Settings/SettingsProvider";
import { DateResponse } from "@shared/Date";
import { useEvent } from "react-use-event-hook";

export const useSimDate = () => {
   return useEvent(async (timeout?: number) => {
      const callback: { current: ((_message: DateResponse) => void) | undefined } = {
         current: undefined
      };

      return new Promise<Date>((resolve, reject) => {
         const timeoutId = setTimeout(() => {
            reject(new Error("Timeout while waiting for date response"));
         }, timeout ?? 200);

         callback.current = (message) => {
            clearTimeout(timeoutId);
            resolve(new Date(message.date - message.timezone));
         };
         messageHandler.subscribe("__DATE_RESPONSE__", callback.current);

         messageHandler.send({
            __GET_DATE__: true
         });
      }).finally(() => {
         if (callback.current) {
            messageHandler.unsubscribe("__DATE_RESPONSE__", callback.current);
         } else {
            console.assert(false, "Callback should be defined at this point");
         }
      });
   });
};