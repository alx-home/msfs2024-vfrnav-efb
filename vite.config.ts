import { defineConfig } from "vite";
import { libInjectCss } from 'vite-plugin-lib-inject-css'
import eslint from 'vite-plugin-eslint';
import path from "path";
import sass from 'vite-plugin-sass';

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
   ],
});