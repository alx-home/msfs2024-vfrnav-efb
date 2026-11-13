import { cpSync, copyFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("../", import.meta.url));
if (!process.argv[2]) throw new Error("Specify the GitHub Pages checkout: npm run publish -- <pages-repository>");
const siteRoot = resolve(process.argv[2]);
const buildRoot = resolve(appRoot, "../../build/github_app/dist");
const publishedAssets = resolve(siteRoot, "assets");

mkdirSync(resolve(siteRoot, "help"), { recursive: true });
copyFileSync(resolve(buildRoot, "index.html"), resolve(siteRoot, "index.html"));
rmSync(publishedAssets, { recursive: true, force: true });
cpSync(resolve(buildRoot, "assets"), publishedAssets, { recursive: true });
copyFileSync(resolve(buildRoot, "releases.json"), resolve(siteRoot, "releases.json"));
copyFileSync(resolve(buildRoot, "help/index.html"), resolve(siteRoot, "help/index.html"));
rmSync(resolve(siteRoot, "help/assets"), { recursive: true, force: true });
