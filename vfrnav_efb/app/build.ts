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

import { lint, AppConfig, VitePlugin } from '@alx-home/build';
import { OutputAsset, OutputChunk } from "rollup";
import { config } from "dotenv";

import legacy from '@vitejs/plugin-legacy';

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

const __SIA_AUTH__ = process.env.__SIA_AUTH__;
const __SIA_ADDR__ = process.env.__SIA_ADDR__;
const __SIA_AZBA_ADDR__ = process.env.__SIA_AZBA_ADDR__;
const __SIA_AZBA_DATE_ADDR__ = process.env.__SIA_AZBA_DATE_ADDR__;

let msfsEmbedded = false;
let watch = false;
process.argv.forEach(function (val) {
  if (val == "--watch") {
    watch = true;
  } else if (val == "--embedded") {
    msfsEmbedded = true;
  }
});

const output_dir = msfsEmbedded ? "../../build/vfrnav_efb/dist/efb/" : "../../build/vfrnav_efb/efb";

const msfs_postprocess = (): VitePlugin => {
  return {
    name: "msfsPostProcess",
    enforce: "post",
    async generateBundle(_options, bundle): Promise<void> {
      console.assert(msfsEmbedded);

      const promises: Promise<void>[] = [];

      for (const key in bundle) {
        promises.push(new Promise((resolve) => {
          const elem = bundle[key];

          if ((elem.type === 'chunk' && key.endsWith('.js')) ||
            key.endsWith('.html') ||
            (elem.type === 'asset' && elem.fileName.endsWith('.css'))) {
            const process = (content: string) => content
              .replace(/\/assets\/([^"]+\.(?!css))/g, "coui://html_ui/efb_ui/efb_apps/msfs2024-vfrnav/efb/assets/$1")
              .replace(/rgb\(([^ ]+) ([^ ]+) ([^ ]+) \/ ([^)]+)\)/g, `rgba($1,$2,$3,$4)`);

            if (key.endsWith('.js')) {
              const chunk = elem as OutputChunk;
              chunk.code = process(chunk.code);
              if (!key.includes('polyfills-legacy')) {
                chunk.code = '(() => {\nif (typeof System === "undefined") {\n   return;\n   }\n' + chunk.code + '\n})()';
              }
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

const GetConfig = (): UserConfig => ({
  ...AppConfig({
    empty_out: true,
    define: {
      __MSFS_EMBEDED__: msfsEmbedded,
      __SIA_AUTH__: JSON.stringify(__SIA_AUTH__),
      __SIA_ADDR__: JSON.stringify(__SIA_ADDR__),
      __SIA_AZBA_ADDR__: JSON.stringify(__SIA_AZBA_ADDR__),
      __SIA_AZBA_DATE_ADDR__: JSON.stringify(__SIA_AZBA_DATE_ADDR__),
    },
    rollup_options: {
      output: {
        manualChunks: undefined,
      }
    },
    plugins: [
      ...(msfsEmbedded ?
        [
          msfs_postprocess(),
          legacy({
            targets: ['chrome >= 49'],
            renderModernChunks: false,
          })]
        : []
      ),
    ] as VitePlugin[],
    output_dir: output_dir,
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

if (msfsEmbedded) {
  console.log("Building Embedded EFB App...")
} else {
  console.log("Building EFB App...")
}
await lint(".")
buildProject()