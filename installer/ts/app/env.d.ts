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
import "@common/env.d.ts"

declare global {
   interface Window {
      openFile: (_path: string,
         _filters: {
            name: string,
            value: string[]
         }[]) => Promise<string | undefined>;

      openFolder: (_path: string) => Promise<string | undefined>;
      findCommunity: () => Promise<string | undefined>;
      defaultInstallPath: () => Promise<string | undefined>;
      exists: (_val: string) => Promise<boolean>;
      parentExists: (_val: string) => Promise<boolean>;
      abort: () => void;
      validate: (_startupOption: StartupOption, _communityPath: string, _installPath: string) => Promise<void>;
      start_program: () => Promise<boolean>;
      clean_path: (_path: string) => Promise<boolean>;
   }
}

declare const __WEB_BROWSER_TEST__: boolean;
