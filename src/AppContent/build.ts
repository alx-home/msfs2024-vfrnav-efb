import { Plugin, UserConfig, build, createServer } from "vite";
import eslint from 'vite-plugin-eslint';
import react from '@vitejs/plugin-react'
import sass from 'vite-plugin-sass';
import legacy from '@vitejs/plugin-legacy';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { OutputAsset, OutputChunk } from "rollup";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const minify = false;

const msfsEmbeded = process.env.MSFS_EMBEDED;
console.assert(msfsEmbeded !== undefined)

const efbPlugin = (): Plugin => {
   return {
      name: "msfsPostProcess",
      enforce: "post",
      async generateBundle(options, bundle): Promise<void> {
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
      MsfsEmbeded: msfsEmbeded
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
      sourcemap: process.env.BUILD_TYPE === 'development',
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
   css: {
      postcss: './postcss.config.mjs',
   }
};

if (process.env.BUILD_TYPE === 'production') {
   await build(EFBConfig);
} else {
   await createServer({
      ...EFBConfig,
      server: {
         port: 4000,
         host: 'localhost',
      }
   }).then((server) => server.listen(4000));

}