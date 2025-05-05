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

import { ServerState } from "@common/env";
import { useCallback, useEffect, useMemo, useState } from "react"

export const useServer = () => {
   const [serverState, setServerState] = useState<ServerState>('switching');

   const serverLock = useMemo(() => serverState == 'invalid_port' || serverState == 'switching', [serverState]);
   const serverStateStr = useMemo(() => {
      if (serverState == 'stopped') {
         return "Start Server"
      } else if (serverState == 'running') {
         return "Stop Server"
      } else if (serverState == 'invalid_port') {
         return "Invalid Port"
      } else {
         return "In progress"
      }
   }, [serverState]);


   const switchServer = useCallback(() => {
      if (serverState == 'switching') {
         return;
      }

      window.switchServer();
   }, [serverState]);

   useEffect(() => {
      let stop = false;

      (async () => {
         setServerState(await window.getServerState())

         while (!stop) {
            setServerState(await window.watchServerState())
         }
      })()

      return () => { stop = true; }
   }, []);

   return { serverState: serverState, switchServer: switchServer, serverStateStr: serverStateStr, serverLock: serverLock };
}