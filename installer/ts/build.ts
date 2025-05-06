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

import { UserConfig, build, createServer, searchForWorkspaceRoot } from "vite";

import { AppConfig } from '@alx-home/build';

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let watch = false;
process.argv.forEach(function (val) {
   if (val == "--watch") {
      watch = true;
   }
});

const Config: UserConfig = AppConfig({
   output_dir: "../../build/installer/ts/app/dist"
});

if (watch) {
   await createServer({
      ...Config,
      server: {
         port: 4000,
         host: 'localhost',
         fs: {
            allow: [
               searchForWorkspaceRoot(__dirname),
               path.resolve(__dirname, "../../packages/ts-utils/src/fonts")
            ]
         }
      }
   }).then((server) => server.listen(3999));
} else {
   await build(Config);
}