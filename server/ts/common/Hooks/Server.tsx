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

import { ServerState } from "@server-common/env";
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "@vfrnav/i18n"

export const useServer = () => {
   const { t, lang } = useTranslation();
   const [serverState, setServerState] = useState<ServerState>('switching');

   const serverLock = useMemo(() => serverState === 'invalid_port' || serverState === 'switching', [serverState]);
   const serverStateStr = useMemo(() => {
      if (serverState === 'stopped') {
         return t("serverState.start")
      } else if (serverState === 'running') {
         return t("serverState.stop")
      } else if (serverState === 'invalid_port') {
         return t("serverState.invalidPort")
      } else {
         return t("serverState.inProgress")
      }
   }, [serverState, lang]);


   const switchServer = useCallback(() => {
      if (serverState === 'switching') {
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