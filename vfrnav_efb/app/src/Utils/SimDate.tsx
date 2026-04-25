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