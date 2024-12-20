import { defineConfig } from "vite";
import eslint from 'vite-plugin-eslint';
import path from "path";
import react from '@vitejs/plugin-react'
import sass from 'vite-plugin-sass';
import legacy from '@vitejs/plugin-legacy';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
// import { readFileSync } from "fs";

const msfsPostProcess = () => {
   return {
      name: "msfsPostProcess",
      enforce: "post",
      generateBundle(options, bundle) {
         for (const key in bundle) {
            const elem = bundle[key];

            if ((elem.type === 'chunk' && key.endsWith('.js')) ||
               key.endsWith('.html') ||
               (elem.type === 'asset' && elem.fileName.endsWith('.css'))) {
               const process = (content) => content
                  // .replace(/url\((\/[^)]+)\)/, ((_, filepath) => {
                  // if (filepath.endsWith('.ttf')) {
                  //    const filename = filepath.substring(8);
                  //    const file = readFileSync(path.resolve(__dirname, `./src/fonts/${filename.substring(0, filename.length - 13)}.ttf`), 'utf8')
                  //    return `url("data:application/font-ttf;charset=utf-8;base64,${Buffer.from(file, 'binary').toString('base64')}")`
                  // }
                  // return `url('${filepath}')`;
                  // }))
                  .replace(/\/assets\/([^"]+\.(?!css))/g, "coui://html_ui/efb_ui/efb_apps/msfs2024-vfrnav/efb/assets/$1")
                  .replace(/rgb\(([^ ]+) ([^ ]+) ([^ ]+) \/ ([^)]+)\)/g, `rgba($1,$2,$3,$4)`);

               if (key.endsWith('.js')) {
                  elem.code = process(elem.code);
               } else {
                  elem.source = process(elem.source);
               }
            }
         }
         return bundle
      }
   }
}

export default defineConfig({
   build: {
      minify: true,
      rollupOptions: {
         output: {
            manualChunks: undefined,
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
         "@public": path.resolve(__dirname, "./public"),
      },
   },
   plugins: [
      msfsPostProcess(),
      react(),
      sass(),
      cssInjectedByJsPlugin(),
      eslint(),
      legacy({
         targets: ['chrome <= 49']
      })
   ],
   css: {
      postcss: './postcss.config.mjs',
   }
});