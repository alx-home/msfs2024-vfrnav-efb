import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { AppConfig, type VitePlugin } from "@alx-home/build";
import tailwindcss from "@tailwindcss/vite";
import { build, createServer, type UserConfig } from "vite";

const appRoot = fileURLToPath(new URL(".", import.meta.url));
const { values } = parseArgs({
  options: {
    dev: { type: "boolean", default: false },
    watch: { type: "boolean", default: false },
    "out-dir": { type: "string" }
  }
});
const shared = AppConfig({
  output_dir: values["out-dir"] ?? resolve(appRoot, "../../build/github_app/dist"),
  empty_out: true,
  with_tailwindcss: false,
  // Match the other apps' bridge between separately installed Vite types.
  plugins: tailwindcss() as VitePlugin[],
  minify: values.dev ? false : "esbuild",
  target: "es2022"
});
const configuration = {
  ...shared,
  root: appRoot,
  configFile: false,
  base: "./",
  mode: values.dev ? "development" : "production",
  cacheDir: resolve(appRoot, "../../build/github_app/.vite"),
  build: { ...shared.build, sourcemap: values.dev },
  server: { host: "127.0.0.1" }
} as UserConfig;

if (values.watch) {
  const server = await createServer(configuration);
  await server.listen();
  server.printUrls();
} else {
  await build(configuration);
}
