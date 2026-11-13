import assert from "node:assert/strict";
import { test } from "node:test";
import { collectReports, extractReport } from "./update-virustotal.mjs";

const hash = "a".repeat(64);
const otherHash = "b".repeat(64);
const categories = ["malicious", "suspicious", "harmless", "undetected", "timeout", "confirmed-timeout", "failure", "type-unsupported"];
function report(id = hash) {
  return { data: { id, attributes: {
    last_analysis_date: 1_794_610_000,
    last_analysis_stats: Object.fromEntries(categories.map((category) => [category, 1])),
    last_analysis_results: Object.fromEntries(categories.map((category, index) => [`engine-${index}`, {
      category, engine_name: `Vendor ${index}`, result: category === "malicious" ? "Trojan.Test" : null
    }]))
  } } };
}
const manifest = [{ scans: [{ sha256: hash }, { sha256: otherHash }, { sha256: hash }] }];

test("extracts flagged vendors, verbatim labels and completed-engine counts", () => {
  const analysis = extractReport(report(), hash);
  assert.equal(analysis.score, "2 / 4");
  assert.deepEqual(analysis.vendors, [
    { name: "Vendor 0", category: "malicious", label: "Trojan.Test" },
    { name: "Vendor 1", category: "suspicious", label: null }
  ]);
  assert.equal(analysis.analyzedAt, new Date(1_794_610_000 * 1000).toISOString());
});

test("rejects mismatched files, malformed vendors and inconsistent API statistics", () => {
  assert.throws(() => extractReport(report(otherHash), hash), /Invalid/);
  const inconsistent = report();
  inconsistent.data.attributes.last_analysis_stats.malicious = 4;
  assert.throws(() => extractReport(inconsistent, hash), /Inconsistent/);
  const invalid = report();
  invalid.data.attributes.last_analysis_results["engine-0"].result = {};
  assert.throws(() => extractReport(invalid, hash), /Invalid/);
});

test("fetches each unique hash once, rate-limits and timestamps a complete snapshot", async () => {
  const calls = [];
  const pauses = [];
  const snapshot = await collectReports(manifest, "test-key", {
    fetchReport: async (url, options) => {
      calls.push({ url, options });
      return Response.json(report(url.split("/").at(-1)));
    },
    pause: async (milliseconds) => pauses.push(milliseconds),
    now: () => new Date("2026-11-13T23:00:00.000Z")
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, `https://www.virustotal.com/api/v3/files/${hash}`);
  assert.equal(calls[0].options.headers["x-apikey"], "test-key");
  assert.deepEqual(pauses, [16_000]);
  assert.equal(snapshot.checkedAt, "2026-11-13T23:00:00.000Z");
  assert.deepEqual(Object.keys(snapshot.files), [hash, otherHash]);
});

test("fails explicitly on missing secrets, HTTP failures and invalid JSON without returning a partial snapshot", async () => {
  await assert.rejects(collectReports(manifest, ""), /VIRUSTOTAL_API_KEY/);
  let requests = 0;
  await assert.rejects(collectReports(manifest, "test-key", {
    pause: async () => {},
    fetchReport: async () => ++requests === 1 ? Response.json(report()) : new Response("", { status: 429 })
  }), /HTTP 429/);
  assert.equal(requests, 2);
  await assert.rejects(collectReports(manifest, "test-key", {
    fetchReport: async () => new Response("not JSON")
  }), SyntaxError);
});
