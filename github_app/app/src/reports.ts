export type Scan = { type: string; filename: string; sha256: string; vt: string };
export type Release = { version: string; date: string; scans: Scan[] };
export type VendorDetection = { name: string; category: "malicious" | "suspicious"; label: string | null };
export type FileAnalysis = { analyzedAt: string; score: string; vendors: VendorDetection[] };
export type VirusTotalSnapshot = { checkedAt: string | null; files: Record<string, FileAnalysis> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

export function parseVirusTotalSnapshot(value: unknown): VirusTotalSnapshot {
  if (!isRecord(value) || (value.checkedAt !== null && !isTimestamp(value.checkedAt))
    || !isRecord(value.files) || Array.isArray(value.files)
    || (value.checkedAt === null && Object.keys(value.files).length > 0)) {
    throw new Error("Invalid VirusTotal snapshot.");
  }
  const files: Record<string, FileAnalysis> = {};
  for (const [hash, file] of Object.entries(value.files)) {
    if (!/^[a-f0-9]{64}$/.test(hash) || !isRecord(file) || !isTimestamp(file.analyzedAt)
      || typeof file.score !== "string" || !/^\d+ \/ \d+$/.test(file.score) || !Array.isArray(file.vendors)) {
      throw new Error("Invalid VirusTotal file analysis.");
    }
    const [detections, total] = file.score.split("/").map(Number);
    if (!Number.isSafeInteger(total) || !Number.isSafeInteger(detections)
      || detections > total || total === 0 || detections !== file.vendors.length) {
      throw new Error("Inconsistent VirusTotal detection count.");
    }
    const vendors = file.vendors.map((vendor: unknown): VendorDetection => {
      if (!isRecord(vendor) || typeof vendor.name !== "string" || !vendor.name.trim()
        || (vendor.category !== "malicious" && vendor.category !== "suspicious")
        || (vendor.label !== null && typeof vendor.label !== "string")) {
        throw new Error("Invalid VirusTotal vendor detection.");
      }
      return { name: vendor.name, category: vendor.category, label: vendor.label };
    });
    files[hash] = { analyzedAt: file.analyzedAt, score: file.score, vendors };
  }
  return { checkedAt: value.checkedAt, files };
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
          || typeof scan.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(scan.sha256)
          || typeof scan.vt !== "string") throw new Error("Invalid antivirus scan.");
        const report = new URL(scan.vt);
        if (report.protocol !== "https:"
          || !["virustotal.com", "www.virustotal.com"].includes(report.hostname)
          || report.pathname !== `/gui/file/${scan.sha256}`) throw new Error("Invalid antivirus report result or URL.");
        return { type: scan.type, filename: scan.filename, sha256: scan.sha256, vt: scan.vt };
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
