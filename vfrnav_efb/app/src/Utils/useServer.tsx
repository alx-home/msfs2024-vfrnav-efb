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
import { EfbState, ServerState } from "@shared/Server";
import { useEffect, useState } from "react"

export const useServer = () => {
   const [connected, setConnected] = useState(!__MSFS_EMBEDED__ && !window.__WEB_SERVER__);

   useEffect(() => {
      if (__MSFS_EMBEDED__ || window.__WEB_SERVER__) {
         const onStateChanged = (message: ServerState) => {
            setConnected(message.state);
         };
         messageHandler.subscribe("__SERVER_STATE__", onStateChanged);
         messageHandler.send({ "__GET_SERVER_STATE__": true });

         return () => messageHandler.unsubscribe("__SERVER_STATE__", onStateChanged);
      } else {
         let stop = false;

         (async () => {
            setConnected(await window.getServerState!() === 'running')

            while (!stop) {
               setConnected(await window.watchServerState!() === 'running')
            }
         })()

         return () => { stop = true; }
      }
   }, [connected]);

   return connected;
}

export const useEFBServer = () => {
   const [connected, setConnected] = useState(__MSFS_EMBEDED__);

   useEffect(() => {
      if (!__MSFS_EMBEDED__) {
         const onStateChanged = (message: EfbState) => {
            setConnected(message.state);
         };
         messageHandler.subscribe("__EFB_STATE__", onStateChanged);
         messageHandler.send({ "__GET_EFB_STATE__": true });

         return () => messageHandler.unsubscribe("__EFB_STATE__", onStateChanged);
      }
   }, [connected]);

   return connected;
}