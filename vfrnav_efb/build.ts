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

import { AppConfig, LibConfig, VitePlugin } from '@alx-home/build';
import { OutputAsset, OutputChunk } from "rollup";

import { minify } from "terser";

import externalGlobals from 'rollup-plugin-external-globals';
import legacy from '@vitejs/plugin-legacy';
import { copyFile, mkdir } from 'fs';

import Jpackage from "./package.json" with { type: "json" };;
const peerDependencies = Jpackage.peerDependencies;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const msfsEmbeded = process.env.MSFS_EMBEDED;
const __SIA_AUTH__ = process.env.__SIA_AUTH__;
const __SIA_ADDR__ = process.env.__SIA_ADDR__;
const __SIA_AZBA_ADDR__ = process.env.__SIA_AZBA_ADDR__;
const __SIA_AZBA_DATE_ADDR__ = process.env.__SIA_AZBA_DATE_ADDR__;

console.assert(msfsEmbeded !== undefined)

let watch = false;
process.argv.forEach(function (val) {
  if (val == "--watch") {
    watch = true;
  }
});

type App = "app" | "efb";
const output_dir = (name: App) => {
  return (name === "app" ? "../../build/vfrnav_efb/dist/efb/" : "../../build/vfrnav_efb/dist/");
}

const msfs_postprocess = (): VitePlugin => {
  return {
    name: "msfsPostProcess",
    enforce: "post",
    async generateBundle(_options, bundle): Promise<void> {
      if (!msfsEmbeded) {
        return;
      }

      const promises: Promise<void>[] = [];

      for (const key in bundle) {
        promises.push(new Promise((resolve) => {
          const elem = bundle[key];

          if ((elem.type === 'chunk' && key.endsWith('.js')) ||
            key.endsWith('.html') ||
            (elem.type === 'asset' && elem.fileName.endsWith('.css'))) {
            const process = (content: string) => content
              .replace(/\/assets\/([^"]+\.(?!css))/g, "coui://html_ui/efb_ui/apps/msfs2024-vfrnav/efb/assets/$1")
              .replace(/rgb\(([^ ]+) ([^ ]+) ([^ ]+) \/ ([^)]+)\)/g, `rgba($1,$2,$3,$4)`);

            if (key.endsWith('.js')) {
              const chunk = elem as OutputChunk;
              chunk.code = process(chunk.code);
            } else {
              const asset = elem as OutputAsset;
              asset.source = process(asset.source as string);
            }
          }

          resolve();
        }));
      }

      await Promise.all(promises);
    }
  }
}

const minifyBundles = (): VitePlugin => {
  return {
    name: "minifyBundles",
    async generateBundle(_options, bundle): Promise<void> {
      for (const key in bundle) {
        if (bundle[key].type === 'chunk' && key.endsWith('.js')) {
          const minifyCode = await minify(bundle[key].code, { sourceMap: false })
          bundle[key].code = `(()=>{${minifyCode.code}})()`
        }
      }
    },
  }
}

const copyFiles = () => {
  return {
    name: "copyFiles",
    closeBundle: () => {
      mkdir(path.resolve(__dirname, '../build/vfrnav_efb/dist/assets/'), { recursive: true }, err => {
        if (err) throw err;
      });
      copyFile(path.resolve(__dirname, '../images/app-icon.svg'), path.resolve(__dirname, '../build/vfrnav_efb/dist/assets/app-icon.svg'), err => {
        if (err) throw err;
      });
    }
  }
}

const GetConfig = (name: App): UserConfig => ({
  ...(name === "app" ? AppConfig : LibConfig)({
    name: name,
    entries: name === "efb" ? {
      entry: "./src/App.tsx",
      fileName: () => "App.js",
      formats: ["es"],
    } : [],
    rollupOptions: name === "app" ? undefined : {
      output: {
        manualChunks: undefined
      },
      external: [...Object.keys(peerDependencies)],
    },
    empty_out: name === "app",
    define: {
      __MSFS_EMBEDED__: msfsEmbeded,
      __SIA_AUTH__: JSON.stringify(__SIA_AUTH__),
      __SIA_ADDR__: JSON.stringify(__SIA_ADDR__),
      __SIA_AZBA_ADDR__: JSON.stringify(__SIA_AZBA_ADDR__),
      __SIA_AZBA_DATE_ADDR__: JSON.stringify(__SIA_AZBA_DATE_ADDR__),
    },
    plugins:
      (name === "app" ?
        [
          msfs_postprocess(),
          legacy({
            targets: ['chrome >= 49']
          })
        ] : [
          externalGlobals({
            "@microsoft/msfs-sdk": "msfssdk",
            "@workingtitlesim/garminsdk": "garminsdk"
          }),
          minifyBundles(),
          copyFiles()
        ]) as VitePlugin[]
    ,
    output_dir: output_dir(name),
    target: 'es2017',
  }), ...{
    root: name
  },
} as UserConfig);

const buildProject = async (name: App) => {
  if (watch) {
    await createServer({
      ...GetConfig(name),
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
    await build(GetConfig(name));
  }
}

process.argv.forEach(function (val) {
  if (val == "efb") {
    console.log("Building EFB...")
    buildProject("efb")
  } else if (val == "app") {
    console.log("Building EFB App...")
    buildProject("app")
  }
});