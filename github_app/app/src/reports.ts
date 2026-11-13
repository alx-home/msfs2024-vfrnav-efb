export type Scan = { type: string; filename: string; score: string; sha256: string; vt: string };
export type Release = { version: string; date: string; scans: Scan[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseReleases(value: unknown): Release[] {
  if (!Array.isArray(value)) throw new Error("Expected an array of release reports.");
  return value.map((release) => {
    if (!isRecord(release) || typeof release.version !== "string" || typeof release.date !== "string"
      || !Array.isArray(release.scans)) throw new Error("Invalid release report.");
    return {
      version: release.version,
      date: release.date,
      scans: release.scans.map((scan: unknown) => {
        if (!isRecord(scan) || typeof scan.type !== "string" || typeof scan.filename !== "string"
          || typeof scan.score !== "string" || !/^\d+\s*\/\s*\d+$/.test(scan.score)
          || typeof scan.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(scan.sha256)
          || typeof scan.vt !== "string") throw new Error("Invalid antivirus scan.");
        const [detections, total] = scan.score.split("/").map(Number);
        const report = new URL(scan.vt);
        if (detections > total || total === 0 || report.protocol !== "https:"
          || !["virustotal.com", "www.virustotal.com"].includes(report.hostname)
          || report.pathname !== `/gui/file/${scan.sha256}`) throw new Error("Invalid antivirus report result or URL.");
        return { type: scan.type, filename: scan.filename, score: scan.score, sha256: scan.sha256, vt: scan.vt };
      })
    };
  });
}

export function filterReleases(releases: readonly Release[], version: string, query: string): Release[] {
  const search = query.trim().toLowerCase();
  return releases.filter((release) => !version || release.version === version).flatMap((release) => {
    const scans = release.scans.filter((scan) =>
      `${release.version} ${scan.type} ${scan.filename}`.toLowerCase().includes(search));
    return scans.length ? [{ ...release, scans }] : [];
  });
}

export function findVersionReport(releases: readonly Release[], version: string): Release | undefined {
  return releases.find((release) => release.scans.length > 0
    && release.version.replace(/^v(?=\d)/, "").replace(/\s+\([^)]*\)$/, "") === version);
}

export function scoreTone(score: string) {
  const detections = Number(score.split("/")[0]);
  return detections === 0 ? "green" : detections <= 3 ? "yellow" : "red";
}
