import { Plugin, UserConfig, build, createServer } from "vite";
import eslint from 'vite-plugin-eslint';
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { OutputAsset, OutputChunk } from "rollup";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const minify = true;

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
      __MSFS_EMBEDED__: msfsEmbeded,
      __SIA_AUTH__: JSON.stringify("Y9Q3Ve72nN3PnTXmEtKnS4sggmdsigRMWH9kCDGHpCHyenFKKGhDq5vgBWZ4"),
      __SIA_ADDR__: JSON.stringify("https://bo-prod-sofia-vac.sia-france.fr/api/v1/custom/file-path/{icao}/AD"),
      __SIA_AZBA_ADDR__: JSON.stringify("https://bo-prod-sofia-vac.sia-france.fr/api/v2/r_t_b_as?itemsPerPage=800&date={date}"),
      __SIA_AZBA_DATE_ADDR__: JSON.stringify("https://bo-prod-sofia-vac.sia-france.fr/api/v2/custom/currentDate"),
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
   },
   resolve: {
      alias: {
         "@Events": path.resolve(__dirname, "./src/Events"),
         "@fonts": path.resolve(__dirname, "./src/fonts"),
         "@images": path.resolve(__dirname, "./src/images"),
         "@app": path.resolve(__dirname, "./src/app"),
         "@Ol": path.resolve(__dirname, "./src/Ol"),
         "@pages": path.resolve(__dirname, "./src/pages"),
         "@polyfills": path.resolve(__dirname, "./src/polyfills"),
         "@public": path.resolve(__dirname, "./public"),
         "@Settings": path.resolve(__dirname, "./src/Settings"),
         "@shared": path.resolve(__dirname, "./shared"),
         "@Utils": path.resolve(__dirname, "./src/Utils"),
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
      cssInjectedByJsPlugin(),
      eslint(),
      legacy({
         targets: ['chrome >= 49']
      }),
   ],
   css: {
      postcss: {
         plugins: [
            autoprefixer,
            tailwindcss
         ]
      },
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