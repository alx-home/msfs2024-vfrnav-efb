import { readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout } from "node:timers/promises";

const categories = ["malicious", "suspicious", "harmless", "undetected", "timeout", "confirmed-timeout", "failure", "type-unsupported"];
const completed = new Set(["malicious", "suspicious", "harmless", "undetected"]);
const flagged = new Set(["malicious", "suspicious"]);
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function extractReport(value, sha256) {
  const attributes = value?.data?.attributes;
  if (value?.data?.id !== sha256 || !isRecord(attributes?.last_analysis_results)
    || !isRecord(attributes.last_analysis_stats)
    || !Number.isSafeInteger(attributes.last_analysis_date) || attributes.last_analysis_date <= 0) {
    throw new Error(`Invalid VirusTotal file report for ${sha256}.`);
  }
  const counts = Object.fromEntries(categories.map((category) => [category, 0]));
  const vendors = [];
  let total = 0;
  for (const result of Object.values(attributes.last_analysis_results)) {
    if (!isRecord(result) || !categories.includes(result.category)
      || typeof result.engine_name !== "string" || !result.engine_name.trim()
      || (result.result !== null && typeof result.result !== "string")) {
      throw new Error(`Invalid VirusTotal vendor result for ${sha256}.`);
    }
    counts[result.category]++;
    if (completed.has(result.category)) total++;
    if (flagged.has(result.category)) {
      vendors.push({ name: result.engine_name, category: result.category, label: result.result });
    }
  }
  if (!total || categories.some((category) => attributes.last_analysis_stats[category] !== counts[category])) {
    throw new Error(`Inconsistent VirusTotal analysis statistics for ${sha256}.`);
  }
  return {
    analyzedAt: new Date(attributes.last_analysis_date * 1000).toISOString(),
    score: `${vendors.length} / ${total}`,
    vendors: vendors.sort((a, b) => a.name.localeCompare(b.name, "en"))
  };
}

export async function collectReports(releases, apiKey, { fetchReport = fetch, pause = setTimeout, now = () => new Date() } = {}) {
  if (!apiKey?.trim()) throw new Error("Set the VIRUSTOTAL_API_KEY repository secret before running this action.");
  if (!Array.isArray(releases) || !releases.length) throw new Error("Expected a nonempty release manifest.");
  const hashes = new Set();
  for (const release of releases) {
    if (!Array.isArray(release.scans)) throw new Error("Invalid release scan manifest.");
    for (const scan of release.scans) {
      if (!/^[a-f0-9]{64}$/.test(scan.sha256)) throw new Error("Invalid SHA-256 in release manifest.");
      hashes.add(scan.sha256);
    }
  }
  if (!hashes.size) throw new Error("No file hashes to check.");
  const files = {};
  for (const hash of hashes) {
    // The public API permits four requests per minute, including across minute boundaries.
    if (Object.keys(files).length) await pause(16_000);
    const response = await fetchReport(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: { "x-apikey": apiKey },
      signal: AbortSignal.timeout(30_000)
    });
    if (!response.ok) throw new Error(`VirusTotal request for ${hash} failed: HTTP ${response.status}. Previous results were not replaced.`);
    files[hash] = extractReport(await response.json(), hash);
  }
  return { checkedAt: now().toISOString(), files };
}

async function main() {
  const [manifest, output] = process.argv.slice(2);
  if (!manifest || !output) throw new Error("Usage: node update-virustotal.mjs <release-manifest> <output-json>");
  const releases = JSON.parse(await readFile(manifest, "utf8"));
  const snapshot = await collectReports(releases, process.env.VIRUSTOTAL_API_KEY);
  const temporary = `${output}.tmp`;
  await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`);
  await rename(temporary, output);
  console.log(`Updated VirusTotal results for ${Object.keys(snapshot.files).length} unique files.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
