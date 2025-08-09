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

export type ServerState = 'switching' | 'running' | 'stopped' | 'invalid_port';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_ENVIRONMENT: string;
      NODE_ENV: 'development' | 'production';
      BUILD_TYPE: 'development' | 'production';
      MSFS_EMBEDED: boolean;
      EMPTY_OUT_DIR: boolean;
      __SIA_AUTH__: string;
      __SIA_ADDR__: string;
      __SIA_AZBA_ADDR__: string;
      __SIA_AZBA_DATE_ADDR__: string;
    }
  }

  const __MSFS_EMBEDED__: boolean;
  const __SIA_AUTH__: string;
  const __SIA_ADDR__: string;
  const __SIA_AZBA_ADDR__: string;
  const __SIA_AZBA_DATE_ADDR__: string;

  interface Window {
    __WEB_SERVER__?: boolean;
    manager?: unknown;

    vfrnav_postMessage: ((_: MessageType) => void) | undefined;
    vfrnav_onmessage: ((_: MessageType) => Promise<void>) | undefined;

    file_exists: (_: string) => Promise<boolean>;
    openFile: (_path: string, _filters: {
      name: string,
      value: string[]
    }[]) => Promise<string>;
    getFile: (_: string) => Promise<string>;
    severStateChanged: (_currentState: boolean) => Promise<boolean>;

    // For app only
    getServerState?: () => Promise<ServerState>;
    watchServerState?: () => Promise<ServerState>;
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export { }