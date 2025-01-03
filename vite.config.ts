import { defineConfig } from 'vite';
import { libInjectCss } from 'vite-plugin-lib-inject-css'
import eslint from 'vite-plugin-eslint';
import path from "path";
import sass from 'vite-plugin-sass';
import externalGlobals from 'rollup-plugin-external-globals';
import { minify } from "terser";

import { peerDependencies } from "./package.json";

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

export default defineConfig({
   define: {
      BASE_URL: JSON.stringify(`coui://html_ui/efb_ui/efb_apps/msfs2024-vfrnav`)
   },
   build: {
      minify: true,
      lib: {
         entry: "./src/App.tsx",
         fileName: () => "App.js",
         cssFileName: "App.css",
         formats: ["es"],
      },
      rollupOptions: {
         output: {
            manualChunks: undefined,
         },
         external: [...Object.keys(peerDependencies)],
      },
      ssr: false,
      sourcemap: true,
      emptyOutDir: true,
      target: 'es2017'
   },
   resolve: {
      alias: {
         "@": path.resolve(__dirname, "./src"),
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
      minifyBundles()
   ],
});