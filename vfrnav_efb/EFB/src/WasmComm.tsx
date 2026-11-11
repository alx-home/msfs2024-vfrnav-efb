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

const WASM_TIMEOUT_MS = 10000;
const TABLET_EVENTS = new Set([
   "VFRNAV_GET_TABLET_SHORTCUT",
   "VFRNAV_TABLET_JOYSTICK",
   "VFRNAV_SET_TABLET_SHORTCUT"
]);

// Same transport as the SDK's CommBus.js, without loading its global class.
class WasmCommBusListener extends ViewListener.ViewListener {
   callWasm(eventName: string, data: string): Promise<unknown> {
      return this.call("COMM_BUS_WASM_CALLBACK", eventName, data);
   }
}

/** @brief Exchange correlated requests and responses with the simulator WASM module. */
export class WasmComm {
   private commBusListener: Promise<CommBusListener> | undefined;

   /** @brief Initialize the CommBus listener once; failed initialization may be retried. */
   private getListener() {
      this.commBusListener ??= Promise.resolve().then(() => {
         return new Promise<CommBusListener>((resolve, reject) => {
            const callback = (data: string) => {
               listener.off("VFRNAV_WASM_INIT", callback);

               if (data.startsWith("error:")) {
                  reject(new Error(`WASM initialization failed with error: ${data.substring(6)}`));
                  return;
               } else if (!data.startsWith("data:")) {
                  reject(new Error(`Received unexpected initialization data from WASM: ${data}`));
                  return;
               }

               const id = +data.substring(5);
               if (!Number.isSafeInteger(id) || id < 0) {
                  reject(new Error(`Received malformed initialization data from WASM: ${data}`));
                  return;
               }

               this.nextRequestId = id;
               listener.on("VFRNAV_WASM_RESPONSE", (data: string) => {
                  const sepIndex = data.indexOf(":");

                  if (sepIndex === -1) {
                     console.error(`Received malformed response from WASM: ${data}`);
                     return;
                  }

                  const responseId = +data.substring(0, sepIndex);
                  const responseData = data.substring(sepIndex + 1);

                  const pending = this.pendingResponses.get(responseId);
                  if (pending) {
                     this.pendingResponses.delete(responseId);
                     if (responseData.startsWith("error:")) {
                        pending.reject(responseData.substring(6));
                     } else if (responseData.startsWith("data:")) {
                        pending.resolve(responseData.substring(5));
                     } else {
                        pending.reject(`Received response with unexpected format: ${responseData}`);
                     }
                  }
               });

               resolve(listener);
            };
            const listener = RegisterViewListenerT("JS_LISTENER_COMM_BUS", () => {
               try {
                  listener.on("VFRNAV_WASM_INIT", callback);
                  listener.callWasm("VFRNAV_WASM_INIT", `${this.nextRequestId}:init`);
               } catch (error) {
                  listener.off("VFRNAV_WASM_INIT", callback);
                  reject(error);
               }
            }, WasmCommBusListener);
         });
      }).catch((error: unknown) => {
         this.commBusListener = undefined;
         throw error;
      });
      return this.commBusListener;
   }
   private readonly pendingResponses = new Map<number, { resolve: (_response: string) => void, reject: (_error: string) => void }>();
   private nextRequestId = 0;

   /**
    * @brief Send a request to WASM and await its correlated response.
    *
    * @param eventName CommBus event identifying the requested operation.
    * @param data Payload to send with the request.
    *
    * @returns The response payload.
    *
    * @throws If initialization, dispatch, or the request fails or times out.
    */
   async callWasm(eventName: string, data: string): Promise<string | undefined> {
      const hasTimeout = TABLET_EVENTS.has(eventName);
      let timedOut = false;
      let requestId: number | undefined;
      const request = async () => {
         const listener = await this.getListener();
         if (timedOut) {
            throw new Error(`Timed out waiting for WASM response to ${eventName}`);
         }

         const id = ++this.nextRequestId;
         requestId = id;

         return new Promise<string>((resolve, reject) => {
            this.pendingResponses.set(id, {
               resolve,
               reject: error => reject(new Error(error))
            });

            try {
               listener.callWasm(eventName, `${id}:${data}`);
            } catch (error) {
               this.pendingResponses.delete(id);
               reject(error);
            }
         });
      };

      if (!hasTimeout) {
         return request();
      }

      return new Promise<string>((resolve, reject) => {
         const timeout = setTimeout(() => {
            timedOut = true;
            if (requestId !== undefined) {
               this.pendingResponses.delete(requestId);
            }

            reject(new Error(`Timed out waiting for WASM response to ${eventName}`));
         }, WASM_TIMEOUT_MS);

         request().then(
            response => {
               clearTimeout(timeout);
               resolve(response);
            },
            error => {
               clearTimeout(timeout);
               reject(error);
            }
         );
      });
   }

   async on(eventName: string, handler: (_data: string) => void) {
      const listener = await this.getListener();
      listener.on(eventName, handler);
   }

   async off(eventName: string, handler: (_data: string) => void) {
      const listener = await this.getListener();
      listener.off(eventName, handler);
   }
};