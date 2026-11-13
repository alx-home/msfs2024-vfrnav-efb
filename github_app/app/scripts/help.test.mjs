import assert from "node:assert/strict";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const server = await createServer({
  configFile: false,
  esbuild: { jsx: "automatic" },
  root: fileURLToPath(new URL("..", import.meta.url)),
  server: { middlewareMode: true, watch: null, hmr: false },
  appType: "custom"
});
after(() => server.close());

const { createSearchDocuments, searchHelp } = await server.ssrLoadModule("/src/search.ts");
const { languages } = await server.ssrLoadModule("/src/content/types.ts");
const { screenshotWalkthrough } = await server.ssrLoadModule("/src/content/screenshots.ts");
const { efbModes } = await server.ssrLoadModule("/src/content/efbModes.ts");
const { KeyboardText } = await server.ssrLoadModule("/src/components/KeyboardShortcut.tsx");
const { default: NextSectionButton } = await server.ssrLoadModule("/src/components/NextSectionButton.tsx");
const { default: Notifications } = await server.ssrLoadModule("/src/components/Notifications.tsx");
const { resourceUrls } = await server.ssrLoadModule("/src/content/support.ts");
const { getReleaseNotes, releaseTopics } = await server.ssrLoadModule("/src/releaseNotes.ts");
const { releaseChanges } = await server.ssrLoadModule("/src/content/releases/index.ts");
const { default: ReleasesPage } = await server.ssrLoadModule("/src/pages/ReleasesPage.tsx");
const { getTabFromHash, tabIds, tabLabels } = await server.ssrLoadModule("/src/navigation.ts");
const { default: TabNavigation } = await server.ssrLoadModule("/src/components/TabNavigation.tsx");
const { default: donationIcon } = await server.ssrLoadModule("/src/assets/donation.svg");
const { parseReleases, parseVirusTotalSnapshot, filterReleases, findVersionReport, scoreTone } = await server.ssrLoadModule("/src/reports.ts");
const { default: VirusTotalAnalysis } = await server.ssrLoadModule("/src/components/VirusTotalAnalysis.tsx");
const { antivirusUpdates } = await server.ssrLoadModule("/src/content/antivirusUpdates.ts");

test("searches localized headings and bodies in every language", () => {
  for (const language of languages) {
    const documents = createSearchDocuments(language);
    for (const document of documents) {
      assert.ok(searchHelp(documents, document.title).some((result) =>
        result.id === document.id && result.title === document.title), `${language}: ${document.title}`);
    }
  }
});

test("ignores case and accents and requires every search word", () => {
  const documents = createSearchDocuments("fr");
  assert.ok(searchHelp(documents, "  DEVIATION   compas ").some((result) => result.id === "install"));
  assert.deepEqual(searchHelp(documents, "DEVIATION compas nonexistent-word-xyz"), []);
});

test("ranks matching headings before body-only matches and shows nearby text", () => {
  const results = searchHelp([
    { id: "body", title: "Other", section: "Usage", body: `${"Intro ".repeat(50)}map instructions` },
    { id: "title", title: "Map", section: "Usage", body: "Navigation" }
  ], "map");
  assert.equal(results[0].id, "title");
  assert.ok(results[1].snippet.includes("map instructions"));
  assert.ok(results[1].snippet.startsWith("..."));
});

test("finds screenshot instructions under their actual charts and navlog topics", () => {
  const documents = createSearchDocuments("en");
  for (const [index, id] of [[11, "charts-guide"], [8, "navlog-guide"]]) {
    assert.ok(searchHelp(documents, screenshotWalkthrough.en.items[index]).some((result) => result.id === id));
  }
});

test("indexes installer details, 3D controls, and donation notes", () => {
  const documents = createSearchDocuments("en");
  for (const [query, id] of [
    ["Windows login", "install"],
    ["Ctrl+T", "efb-modes"],
    ["rotation rings", "efb-modes"],
    ["width and height change together", "efb-modes"],
    ["SHA-256", "antivirus"],
    ["platform fees", "support"]
  ]) {
    assert.ok(searchHelp(documents, query).some((result) => result.id === id), query);
  }
});

test("keeps illustrated panel instructions and shortcuts searchable in every language", () => {
  for (const language of languages) {
    const documents = createSearchDocuments(language);
    for (const [title, body, shortcut] of efbModes[language].panelSteps) {
      for (const query of [title, body, ...(shortcut ? [shortcut] : [])]) {
        assert.ok(searchHelp(documents, query).some((result) => result.id === "efb-modes"), `${language}: ${query}`);
      }
    }
  }
});

test("returns no results for blank, unmatched, or literal special-character queries", () => {
  const documents = createSearchDocuments("en");
  for (const query of ["", " \t ", "nonexistent-word-xyz", "[.*]"]) {
    assert.deepEqual(searchHelp(documents, query), []);
  }
});

test("renders inline localized shortcuts as keycaps while keeping mouse gestures as text", () => {
  const text = "Ctrl+Maj+clic droit ; Ctrl + T ; Alt/Maj+molette ; Alt + Maj + glisser.";
  const html = renderToStaticMarkup(createElement(KeyboardText, { children: text }));
  assert.deepEqual([...html.matchAll(/<kbd[^>]*>(.*?)<\/kbd>/g)].map((match) => match[1]),
    ["Ctrl", "Maj", "Ctrl", "T", "Alt", "Maj", "Alt", "Maj"]);
  assert.equal(html.replace(/<[^>]*>/g, "").replace(/\s/g, ""), text.replace(/\s/g, ""));
});

test("recognizes shortcuts beside CJK text without matching ordinary words", () => {
  const text = "按Ctrl+T显示。Altitude Controls Shifted Major PreCtrl.";
  const html = renderToStaticMarkup(createElement(KeyboardText, { children: text }));
  assert.deepEqual([...html.matchAll(/<kbd[^>]*>(.*?)<\/kbd>/g)].map((match) => match[1]), ["Ctrl", "T"]);
  assert.equal(html.replace(/<[^>]*>/g, "").replace(/\s/g, ""), text.replace(/\s/g, ""));
});

test("formats PDF zoom controls without turning ordinary operators into keys", () => {
  const text = "PDF: +/- or + / - to zoom; 95 + 5 = 100.";
  const html = renderToStaticMarkup(createElement(KeyboardText, { children: text }));
  assert.deepEqual([...html.matchAll(/<kbd[^>]*>(.*?)<\/kbd>/g)].map((match) => match[1]), ["+", "-", "+", "-"]);
  assert.equal(html.replace(/<[^>]*>/g, "").replace(/\s/g, ""), text.replace(/\s/g, ""));
});

test("renders visible destination-specific section controls without waiting for scrolling", () => {
  for (const language of languages) {
    const labels = ["gallery", "workflow", "features"].map((targetId) => {
      const html = renderToStaticMarkup(createElement(NextSectionButton, { language, targetId }));
      assert.ok(html.includes(`aria-controls="${targetId}"`));
      assert.match(html, /<svg/);
      return html.replace(/<[^>]*>/g, "");
    });
    assert.equal(new Set(labels).size, 3, language);
    assert.ok(labels.every((label) => label.trim().length > 0), language);
  }
});

test("keeps the survey and links to release details instead of duplicating them in notifications", () => {
  for (const language of languages) {
    const html = renderToStaticMarkup(createElement(Notifications, { language, onSelectTopic: () => {} }));
    assert.equal([...html.matchAll(/<article\b/g)].length, 2, language);
    assert.match(html, /popovertarget="important-messages"/i);
    assert.match(html, /popover="auto"/);
    assert.ok(html.includes(resourceUrls[5]), language);
    assert.match(html, /href="#release-1\.5\.0"/);
    assert.match(html, /<h3[^>]*id="notification-version"[^>]*>[^<]*1\.5\.0/);
    assert.ok(!html.includes("<details"), language);
    assert.ok(!html.includes("<li"), language);
    assert.ok(!html.includes("/releases/"), language);
  }
});

test("keeps all historical versions and dates in the independently authored site manifest", async () => {
  const source = JSON.parse(await readFile(new URL("../../../vfrnav_efb/EFB/release_notes.json", import.meta.url), "utf8"));
  const notes = getReleaseNotes("en");
  assert.deepEqual(notes.map(({ version, date }) => ({ version, date })),
    [...source.release_notes].reverse().map(({ version, date }) => ({
      version, date: new Date(`${date} UTC`).toISOString().slice(0, 10)
    })));
  assert.equal(new Set(notes.map((release) => release.version)).size, notes.length);
  for (const release of notes) {
    assert.ok(releaseTopics.some((topic) => topic.id === `release-${release.version}`));
    assert.equal(getTabFromHash(`#release-${release.version}`), "releases");
  }
});

test("provides every rewritten change in all languages without English fallbacks or lost issue references", () => {
  const keys = Object.keys(releaseChanges.en).sort();
  for (const language of languages) {
    const changes = releaseChanges[language];
    assert.deepEqual(Object.keys(changes).sort(), keys, language);
    for (const id of keys) {
      assert.ok(changes[id].trim(), `${language}: ${id}`);
      if (language !== "en") assert.notEqual(changes[id], releaseChanges.en[id], `${language}: ${id}`);
      for (const [reference] of releaseChanges.en[id].matchAll(/\(#\d+\)/g)) {
        assert.ok(changes[id].includes(reference), `${language}: ${id}: ${reference}`);
      }
    }
  }
});

test("renders localized release text, dates and framed categories while keeping Flightsim.to downloads", () => {
  for (const language of languages) {
    const notes = getReleaseNotes(language);
    for (const release of [notes[0], notes[notes.length - 1]]) {
      const html = renderToStaticMarkup(createElement(ReleasesPage, {
        language, locationHash: `#release-${release.version}`, onSelectTopic: () => {}
      }));
      assert.ok(html.includes(`id="release-${release.version}"`));
      assert.ok(html.includes(`<h3>${release.version}</h3>`));
      assert.match(html, new RegExp(`datetime="${release.date}"`, "i"));
      assert.equal([...html.matchAll(/<option\b/g)].length, notes.length);
      assert.ok(html.includes(resourceUrls[0]));
      assert.ok(!/[\u{1F527}\u{1F41E}]/u.test(html));
      assert.match(html, /<h4[^>]*>[\s\S]*?<svg/);
      for (const item of release.groups.flatMap((group) => group.categories.flatMap((category) => category.items))) {
        const escaped = renderToStaticMarkup(createElement(KeyboardText, { children: item }));
        assert.ok(html.includes(escaped), `${language}: ${release.version}: ${item}`);
      }
    }
  }
});

test("renders decorative icons alongside every tab label, reusing the donation image for Support", () => {
  const html = renderToStaticMarkup(createElement(TabNavigation, {
    activeTab: "overview", labels: tabLabels.en, label: "Navigation", onSelect: () => {}
  }));
  const buttons = [...html.matchAll(/<button\b[\s\S]*?<\/button>/g)].map((match) => match[0]);
  assert.equal(buttons.length, tabIds.length);
  for (const [index, button] of buttons.entries()) {
    assert.ok(button.includes(tabLabels.en[tabIds[index]]));
    if (tabIds[index] === "support") {
      const expectedSource = renderToStaticMarkup(createElement("img", { src: donationIcon, alt: "" })).match(/src="[^"]*"/)[0];
      assert.ok(button.includes(expectedSource));
      assert.match(button, /<img[^>]*alt=""/);
    } else {
      assert.match(button, /<svg[^>]*aria-hidden="true"/);
    }
  }
});

test("finds every release using its rewritten notes in the selected language", () => {
  for (const language of languages) {
    const documents = createSearchDocuments(language);
    for (const release of getReleaseNotes(language)) {
      const item = release.groups[0].categories[0].items[0];
      assert.ok(searchHelp(documents, item).some((result) => result.id === `release-${release.version}`),
        `${language}: ${release.version}`);
    }
  }
});

test("preserves report metadata without hardcoded scores and keeps detection-score thresholds", async () => {
  const source = JSON.parse(await readFile(new URL("../public/releases.json", import.meta.url), "utf8"));
  assert.deepEqual(parseReleases(source), source);
  assert.equal(scoreTone("0 / 71"), "green");
  assert.equal(scoreTone("3 / 71"), "yellow");
  assert.equal(scoreTone("4 / 71"), "red");
});

const scan = {
  type: "installer", filename: "installer.exe", sha256: "a".repeat(64),
  vt: `https://virustotal.com/gui/file/${"a".repeat(64)}`
};
const releases = [
  { version: "Alpha", date: "13-11-2026", scans: [scan, { ...scan, type: "community", filename: "community.zip" }] },
  { version: "Beta", date: "12-11-2026", scans: [{ ...scan, type: "server", filename: "server.exe" }] }
];

test("combines release selection with case-insensitive version, component and filename filters", () => {
  assert.deepEqual(filterReleases(releases, "Alpha", "  INSTALLER  ")[0].scans, [scan]);
  assert.deepEqual(filterReleases(releases, "", "BETA"), [releases[1]]);
  assert.deepEqual(filterReleases(releases, "", "COMMUNITY.ZIP")[0].scans, [releases[0].scans[1]]);
  assert.deepEqual(filterReleases(releases, "Alpha", "server"), []);
});

test("matches version-specific antivirus reports without mixing stable, alpha or partial versions", () => {
  const stable = { ...releases[0], version: "v1.5.0 (under testing)" };
  const alpha = { ...releases[0], version: "alpha-1.5.0" };
  const reports = [stable, alpha, { ...releases[0], version: "v1.5.1 (latest)" }];
  assert.equal(findVersionReport(reports, "1.5.0"), stable);
  assert.equal(findVersionReport(reports, "alpha-1.5.0"), alpha);
  assert.equal(findVersionReport(reports, "1.5"), undefined);
  assert.equal(findVersionReport(reports, "1.4.0"), undefined);
  assert.equal(findVersionReport([{ ...stable, scans: [] }], "1.5.0"), undefined);
  assert.equal(getTabFromHash("#antivirus-1.5.0"), "antivirus");
  assert.deepEqual(filterReleases(reports, findVersionReport(reports, "1.5.0").version, ""), [stable]);
});

test("rejects malformed or inconsistent reports instead of presenting them as valid", () => {
  assert.throws(() => parseReleases({}), /array/);
  for (const change of [
    { sha256: "invalid" },
    { vt: "https://example.com/report" }, { filename: null }
  ]) {
    assert.throws(() => parseReleases([{ ...releases[0], scans: [{ ...scan, ...change }] }]));
  }
});

test("validates refreshed VirusTotal snapshots and rejects invalid or misleading results", () => {
  const analysis = { analyzedAt: "2026-11-13T21:00:00.000Z", score: "1 / 70",
    vendors: [{ name: "Vendor", category: "malicious", label: "Trojan.Test" }] };
  const snapshot = { checkedAt: "2026-11-13T22:00:00.000Z", files: { [scan.sha256]: analysis } };
  assert.deepEqual(parseVirusTotalSnapshot(snapshot), snapshot);
  assert.deepEqual(parseVirusTotalSnapshot({ checkedAt: null, files: {} }), { checkedAt: null, files: {} });
  for (const change of [{ score: "0 / 70" }, { score: "1 / 0" }, { analyzedAt: "invalid" },
    { vendors: [{ name: "Vendor", category: "harmless", label: null }] }]) {
    assert.throws(() => parseVirusTotalSnapshot({ ...snapshot, files: { [scan.sha256]: { ...analysis, ...change } } }));
  }
  assert.throws(() => parseVirusTotalSnapshot({ ...snapshot, checkedAt: null }));
});

test("renders vendor labels safely and distinguishes pending from zero detections in every language", () => {
  const analysis = { analyzedAt: "2026-11-13T21:00:00.000Z", score: "1 / 70",
    vendors: [{ name: "Test vendor", category: "suspicious", label: "<script>unsafe</script>" }] };
  for (const language of languages) {
    const render = (value) => renderToStaticMarkup(createElement(VirusTotalAnalysis, { language, analysis: value }));
    const escaped = (value) => renderToStaticMarkup(createElement("span", null, value)).slice(6, -7);
    const html = render(analysis);
    assert.ok(html.includes("Test vendor"));
    assert.ok(html.includes("suspicious"));
    assert.ok(html.includes("&lt;script&gt;unsafe&lt;/script&gt;"));
    assert.ok(!html.includes("<script>"));
    assert.ok(render(undefined).includes(escaped(antivirusUpdates[language].pending)), language);
    const clear = render({ ...analysis, score: "0 / 70", vendors: [] });
    assert.ok(clear.includes(escaped(antivirusUpdates[language].none)), language);
    assert.ok(!clear.includes(escaped(antivirusUpdates[language].pending)), language);
  }
});
