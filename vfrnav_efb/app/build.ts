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

const getLegacyBabelTools = (() => {
  let promise: Promise<{
    babel: typeof import("@babel/core");
    presetEnv: unknown;
  }> | undefined;

  return () => {
    const babelModuleName = "@babel/core";
    const presetEnvModuleName = "@babel/preset-env";

    promise ??= Promise.all([
      import(babelModuleName),
      import(presetEnvModuleName),
    ]).then(([babel, presetEnv]) => ({
      babel,
      presetEnv: presetEnv.default,
    }));

    return promise;
  };
})();

const transpileLegacyChunk = async (content: string) => {
  const { babel, presetEnv } = await getLegacyBabelTools();
  const result = await babel.transformAsync(content, {
    babelrc: false,
    browserslistConfigFile: false,
    compact: true,
    configFile: false,
    sourceMaps: false,
    sourceType: "script",
    presets: [[presetEnv, {
      bugfixes: true,
      exclude: ["transform-typeof-symbol"],
      forceAllTransforms: true,
      modules: false,
      shippedProposals: true,
      targets: {
        chrome: "49",
      },
      useBuiltIns: false,
    }]],
  });

  return result?.code ?? content;
};

const msfs_postprocess = (): VitePlugin => {
  return {
    name: "msfsPostProcess",
    enforce: "post",
    async generateBundle(_options, bundle): Promise<void> {
      console.assert(msfsEmbedded);

      const promises: Promise<void>[] = [];

      for (const key in bundle) {
        promises.push((async () => {
          const elem = bundle[key];

          if ((elem.type === 'chunk' && key.endsWith('.js')) ||
            key.endsWith('.html') ||
            (elem.type === 'asset' && elem.fileName.endsWith('.css'))) {
            const process = (content: string) => content
              .replace(/\/assets\/([^"]+\.(?!css))/g, "coui://html_ui/efb_ui/efb_apps/msfs2024-vfrnav/efb/assets/$1")
              .replace(/rgb\(([^ ]+) ([^ ]+) ([^ ]+) \/ ([^)]+)\)/g, `rgba($1,$2,$3,$4)`);
            const transpileIteratorHelpers = (content: string) => content
              .replace(/([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])*)\.values\(\)\.map\(/g, 'Array.from($1.values()).map(')
              .replace(/([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])*)\.keys\(\)\.map\(/g, 'Array.from($1.keys()).map(')
              .replace(/([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])*)\.entries\(\)\.find\(/g, 'Array.from($1.entries()).find(');

            if (elem.type === 'chunk' && key.endsWith('.js')) {
              let code = transpileIteratorHelpers(process(elem.code));

              if (!key.includes('polyfills-legacy')) {
                code = '(function () {\nif (typeof System === "undefined") {\n   return;\n}\nvar __msfsGlobal = typeof self !== "undefined" ? self : (typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : {}));\nif (typeof global === "undefined") {\n   __msfsGlobal.global = __msfsGlobal;\n}\n' + code + '\n})();';
              }

              if (key.includes('-legacy')) {
                code = await transpileLegacyChunk(code);
              }

              elem.code = code;
            } else if (elem.type === 'asset') {
              elem.source = process(elem.source as string);
            }
          }
        })());
      }

      await Promise.all(promises);
    }
  }
}

const GetConfig = (): UserConfig => ({
  ...AppConfig({
    empty_out: true,
    define: {
      __WATCH_MODE__: watch,
      __MSFS_EMBEDED__: msfsEmbedded,
      __SIA_AUTH__: JSON.stringify(__SIA_AUTH__),
      __SIA_ADDR__: JSON.stringify(__SIA_ADDR__),
      __SIA_AZBA_ADDR__: JSON.stringify(__SIA_AZBA_ADDR__),
      __SIA_AZBA_DATE_ADDR__: JSON.stringify(__SIA_AZBA_DATE_ADDR__),
    },
    rollup_options: {
      output: {
          manualChunks: (_id: string) => {
          // Let Vite handle chunk splitting automatically based on dynamic imports
          // The lazy() components will naturally create separate chunks
          return undefined;
        },
      }
    },
    plugins: [
      ...(msfsEmbedded ?
        [
          legacy({
            targets: ['chrome >= 49'],
            renderModernChunks: false,
          }),
          msfs_postprocess(),
        ]
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
try {
  await lint(".")
} catch (error) {
  console.warn("Lint failed, continuing build:", error);
}
await buildProject()