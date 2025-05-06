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

import { lint, LibConfig, VitePlugin } from '@alx-home/build';

import { minify } from "terser";

import externalGlobals from 'rollup-plugin-external-globals';
import { copyFile, cp, mkdir } from 'fs';

import Jpackage from "./package.json" with { type: "json" }; import { config } from "dotenv";

const peerDependencies = Jpackage.peerDependencies;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dev = false;
process.argv.forEach(function (val) {
  if (val == "--dev") {
    dev = true;
  }
});


if (dev) {
  config({
    path: "../.env.development"
  });
} else {
  config({
    path: "../.env.production"
  });
}

const msfsEmbedded = true;
const __SIA_AUTH__ = process.env.__SIA_AUTH__;
const __SIA_ADDR__ = process.env.__SIA_ADDR__;
const __SIA_AZBA_ADDR__ = process.env.__SIA_AZBA_ADDR__;
const __SIA_AZBA_DATE_ADDR__ = process.env.__SIA_AZBA_DATE_ADDR__;

let watch = false;
process.argv.forEach(function (val) {
  if (val == "--watch") {
    watch = true;
  }
});

const output_dir = "../../build/vfrnav_efb/dist/"

const minifyBundles = (): VitePlugin => {
  return {
    name: "minifyBundles",
    async generateBundle(_options, bundle): Promise<void> {
      for (const key in bundle) {
        if (bundle[key].type === 'chunk' && key.endsWith('.js')) {
          if (dev) {
            bundle[key].code = `(()=>{${bundle[key].code}})()`
          } else {
            const minifyCode = await minify(bundle[key].code, { sourceMap: false })
            bundle[key].code = `(()=>{${minifyCode.code}})()`
          }
        }
      }
    },
  }
}

const copyFiles = () => {
  return {
    name: "copyFiles",
    closeBundle: () => {
      mkdir(path.resolve(__dirname, '../../build/vfrnav_efb/dist/assets/'), { recursive: true }, err => {
        if (err) throw err;
      });
      copyFile(path.resolve(__dirname, '../../images/app-icon.svg'), path.resolve(__dirname, '../../build/vfrnav_efb/dist/assets/app-icon.svg'), err => {
        if (err) throw err;
      });
      copyFile(path.resolve(__dirname, './msfs2024-vfrnavProject.xml'), path.resolve(__dirname, '../../build/vfrnav_efb/msfs2024-vfrnavProject.xml'), err => {
        if (err) throw err;
      });
      cp(path.resolve(__dirname, './PackageDefinitions'), path.resolve(__dirname, '../../build/vfrnav_efb/PackageDefinitions'), { recursive: true }, err => {
        if (err) throw err;
      });
    }
  }
}

const GetConfig = (): UserConfig => ({
  ...(LibConfig)({
    name: "EFB",
    with_react: false,
    entries: {
      entry: "./src/main.tsx",
      fileName: () => "VfrNav.js",
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        manualChunks: undefined
      },
      external: [...Object.keys(peerDependencies)],
    },
    empty_out: false,
    define: {
      BASE_URL: JSON.stringify(`coui://html_ui/efb_ui/efb_apps/msfs2024-vfrnav`),
      __MSFS_EMBEDED__: msfsEmbedded,
      __SIA_AUTH__: JSON.stringify(__SIA_AUTH__),
      __SIA_ADDR__: JSON.stringify(__SIA_ADDR__),
      __SIA_AZBA_ADDR__: JSON.stringify(__SIA_AZBA_ADDR__),
      __SIA_AZBA_DATE_ADDR__: JSON.stringify(__SIA_AZBA_DATE_ADDR__),
    },
    plugins:
      [
        externalGlobals({
          "@microsoft/msfs-sdk": "msfssdk",
          "@workingtitlesim/garminsdk": "garminsdk"
        }),
        minifyBundles(),
        copyFiles(),
      ] as VitePlugin[]
    ,
    output_dir: output_dir,
    target: 'es2017',
    with_tailwindcss: false
  }), ...{
    root: "."
  },
} as UserConfig);

const buildProject = async () => {
  if (watch) {
    await createServer({
      ...GetConfig(),
      server: {
        port: 4003,
        host: 'localhost',
        fs: {
          allow: [
            searchForWorkspaceRoot(__dirname),
            path.resolve(__dirname, "../../build/_deps/ts_utils-build/dist/fonts")
          ]
        }
      }
    }).then((server) => server.listen(4003));
  } else {
    await build(GetConfig());
  }
}

console.log("Building EFB...");

await lint(".")
buildProject()