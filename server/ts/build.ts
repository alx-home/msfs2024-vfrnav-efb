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
import path from "path";
import { fileURLToPath } from "url";

import { AppConfig } from '@alx-home/build';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let watch = false;
process.argv.forEach(function (val) {
   if (val == "--watch") {
      watch = true;
   }
});

const GetConfig = (name: string): UserConfig => ({
   ...AppConfig({
      output_dir: "../../../build/server/ts/" + name + "/dist",
   }), ...{
      root: name
   },
});

const buildProject = async (name: string, port: number) => {
   // console.log(JSON.stringify(GetConfig(name), undefined, 3))

   if (watch) {
      await createServer({
         ...GetConfig(name),
         server: {
            port: port,
            host: 'localhost',
            fs: {
               allow: [
                  searchForWorkspaceRoot(__dirname),
                  path.resolve(__dirname, "../../packages/ts-utils/src/fonts")
               ]
            }
         }
      }).then((server) => server.listen(port));
   } else {
      await build(GetConfig(name));
   }
}

process.argv.forEach(function (val) {
   if (val == "taskbar") {
      console.log("Building taskbar...")
      buildProject("taskbar", 4001)
   } else if (val == "taskbar-tooltip") {
      console.log("Building taskbar_tooltip...")
      buildProject("taskbar_tooltip", 4002)
   } else if (val == "app") {
      console.log("Building app...")
      buildProject("app", 4000)
   }
});
