import { UserConfig, build } from "vite";
import { libInjectCss } from 'vite-plugin-lib-inject-css'
import eslint from 'vite-plugin-eslint';
import path from "path";
import sass from 'vite-plugin-sass';
import externalGlobals from 'rollup-plugin-external-globals';
import { minify } from "terser";

import { peerDependencies } from "./package.json";
import { copyFile, mkdir } from 'fs';

const __SIA_AUTH__ = process.env.__SIA_AUTH__;
const __SIA_ADDR__ = process.env.__SIA_ADDR__;
const __SIA_AZBA_ADDR__ = process.env.__SIA_AZBA_ADDR__;
const __SIA_AZBA_DATE_ADDR__ = process.env.__SIA_AZBA_DATE_ADDR__;

const minifyBundles = () => {
   return {
      name: "minifyBundles",
      async generateBundle(options, bundle) {
         for (const key in bundle) {
            if (bundle[key].type === 'chunk' && key.endsWith('.js')) {
               const minifyCode = await minify(bundle[key].code, { sourceMap: false })
               bundle[key].code = `(()=>{${minifyCode.code}})()`
            }
         }
         return bundle
      },
   }
}

const copyFiles = () => {
   return {
      name: "copyFiles",
      closeBundle: () => {
         mkdir(path.resolve(__dirname, 'dist/assets/'), { recursive: true }, err => {
            if (err) throw err;
         });
         copyFile(path.resolve(__dirname, './assets/app-icon.svg'), path.resolve(__dirname, 'dist/assets/app-icon.svg'), err => {
            if (err) throw err;
         });
      }
   }
}


const Config: UserConfig = {
   define: {
      BASE_URL: JSON.stringify(`coui://html_ui/efb_ui/efb_apps/msfs2024-vfrnav`),
      __SIA_AUTH__: JSON.stringify(__SIA_AUTH__),
      __SIA_ADDR__: JSON.stringify(__SIA_ADDR__),
      __SIA_AZBA_ADDR__: JSON.stringify(__SIA_AZBA_ADDR__),
      __SIA_AZBA_DATE_ADDR__: JSON.stringify(__SIA_AZBA_DATE_ADDR__),
   },
   build: {
      minify: true,
      lib: {
         entry: "./src/App.tsx",
         fileName: () => "App.js",
         // cssFileName: "App.css",
         formats: ["es"],
      },
      rollupOptions: {
         output: {
            manualChunks: undefined
         },
         external: [...Object.keys(peerDependencies)],
      },
      ssr: false,
      sourcemap: true,
      emptyOutDir: false,
      target: 'es2017',
   },
   resolve: {
      alias: {
         "@shared": path.resolve(__dirname, "./src/AppContent/shared"),
      },
   },
   plugins: [
      eslint(),
      sass(),
      libInjectCss(),
      externalGlobals({
         "@microsoft/msfs-sdk": "msfssdk",
         "@workingtitlesim/garminsdk": "garminsdk"
      }),
      minifyBundles(),
      copyFiles()
   ],
};

build(Config);
