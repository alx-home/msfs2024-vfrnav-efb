// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
import { Plugin, UserConfig, build, createServer } from "vite";
import eslint from 'vite-plugin-eslint';
import react from '@vitejs/plugin-react'
import sass from 'vite-plugin-sass';
import legacy from '@vitejs/plugin-legacy';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { OutputAsset, OutputChunk } from "rollup";
import path from "path";
import { fileURLToPath } from "url";
import { getBabelOutputPlugin } from '@rollup/plugin-babel';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const minify = false;

const efbPlugin = (): Plugin => {
   return {
      name: "msfsPostProcess",
      enforce: "post",
      async generateBundle(options, bundle): Promise<void> {
         const promises: Promise<void>[] = [];

         for (const key in bundle) {
            promises.push(new Promise((resolve) => {
               const elem = bundle[key];

               if ((elem.type === 'chunk' && key.endsWith('.js')) ||
                  key.endsWith('.html') ||
                  (elem.type === 'asset' && elem.fileName.endsWith('.css'))) {
                  const process = (content) => content
                     .replace(/\/assets\/([^"]+\.(?!css))/g, "coui://html_ui/efb_ui/efb_apps/msfs2024-vfrnav/efb/assets/$1")
                     .replace(/rgb\(([^ ]+) ([^ ]+) ([^ ]+) \/ ([^)]+)\)/g, `rgba($1,$2,$3,$4)`);

                  if (key.endsWith('.js')) {
                     const chunk = elem as OutputChunk;
                     chunk.code = process(chunk.code);
                  } else {
                     const asset = elem as OutputAsset;
                     asset.source = process(asset.source);
                  }
               }

               resolve();
            }));
         }

         await Promise.all(promises);
      }
   }
}

const EFBConfig: UserConfig = {
   mode: process.env.BUILD_TYPE,
   define: {
      MsfsEmbeded: true
   },
   build: {
      lib: false,
      minify: minify,
      rollupOptions: {
         output: {
            manualChunks: undefined
         }
      },
      outDir: "../../dist/efb/",
      ssr: false,
      sourcemap: false,
      emptyOutDir: true,
      target: 'es2017',
   },
   resolve: {
      alias: {
         "@": path.resolve(__dirname, "./src"),
         "@fonts": path.resolve(__dirname, "./src/fonts"),
         "@images": path.resolve(__dirname, "./src/images"),
         "@polyfills": path.resolve(__dirname, "./src/polyfills"),
         "@Events": path.resolve(__dirname, "./src/Events"),
         "@Utils": path.resolve(__dirname, "./src/Utils"),
         "@public": path.resolve(__dirname, "./public"),
      },
      extensions: [
         '.js',
         '.json',
         '.jsx',
         '.ts',
         '.tsx',
      ],
   },
   plugins: [
      efbPlugin(),
      react(),
      sass(),
      cssInjectedByJsPlugin(),
      eslint(),
      legacy({
         targets: ['chrome > 48 and chrome < 50']
      })
   ],
   assetsInclude: [
      "**/*.entry"
   ],
   css: {
      postcss: './postcss.config.mjs',
   }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
const pdfJsConfig: UserConfig = {
   mode: process.env.BUILD_TYPE,
   build: {
      minify: minify,
      rollupOptions: {
         output: {
            manualChunks: undefined
         }
      },
      outDir: "../../dist/efb/assets/",
      ssr: false,
      sourcemap: false,
      emptyOutDir: false,
      target: 'es2017',
      lib: {
         entry: "./src/polyfills/pdf.worker.mjs",
         fileName: () => "pdf.worker.js",
         formats: ["iife"],
         name: "WorkerMessageHandler"
      },
   },
   resolve: {
      extensions: [
         '.ts',
      ],
      alias: {
         "@polyfills": path.resolve(__dirname, "./src/polyfills"),
      }
   },
   plugins: [
      getBabelOutputPlugin({
         allowAllFormats: true,
         presets: [
            [
               '@babel/preset-env',
               {
                  useBuiltIns: false,
                  // Exclude transforms that make all code slower
                  exclude: ['transform-typeof-symbol'],
                  // https://babeljs.io/docs/en/babel-preset-env#modules
                  modules: "systemjs",
               },
            ],
         ],
         plugins: [
            /**
             * Extract the helper function.
             */
            [
               '@babel/plugin-transform-runtime',
               {
                  corejs: false,
               },
            ],
         ],
      })
   ]
};

if (process.env.BUILD_TYPE === 'production') {
   await build(EFBConfig);//.then(() => build(pdfJsConfig));
} else {
   await createServer({
      ...EFBConfig,
      server: {
         port: 4000,
         host: 'localhost',
      }
   }).then((server) => server.listen(4000));

}