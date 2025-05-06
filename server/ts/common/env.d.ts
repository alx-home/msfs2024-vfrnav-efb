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

import "@alx-home/types"
import "@common/env"

export type StartupOption = 'Login' | 'Startup' | 'Never';
export type ServerState = 'switching' | 'running' | 'stopped' | 'invalid_port';

declare global {
   interface Window {
      openFile: ({ _ }: {
         value: string,
         filters?: {
            name: string,
            value: string[]
         }[]
      } | string) => Promise<string | undefined>;

      openFolder: (_val: string) => Promise<string | undefined>;

      findCommunity: () => Promise<string | undefined>;
      defaultInstallPath: () => Promise<string | undefined>;

      exists: (_val: string) => Promise<boolean>;
      parentExists: (_val: string) => Promise<boolean>;
      abort: () => void;

      hideTaskbar: () => void;
      showTaskbar: () => void;

      openEFB: () => void;
      openWebEFB: () => void;

      hideTaskbarToolTip: () => void;
      showTaskbarToolTip: () => void;

      showSettings: () => void;

      display_appstopping: () => void;

      startupOption: (_value?: StartupOption) => Promise<StartupOption>;

      autostartServer: (_value?: boolean) => Promise<boolean>;
      serverPort: (_value?: number) => Promise<number>;

      switchServer: () => Promise<void>;
      watchServerState: () => Promise<ServerState>;
      getServerState: () => Promise<ServerState>;
   }
}

declare const __WEB_BROWSER_TEST__: boolean;


declare module '*.jpg';
declare module '*.css';
declare module '*.ttf';
declare module '*.pdf';
declare module '*.svg';