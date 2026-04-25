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