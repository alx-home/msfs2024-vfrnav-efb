import { useEffect, useState } from "react";
import type { Language } from "../content";
import { antivirusText, formatReportVersion } from "../content/antivirus";
import { antivirusUpdates } from "../content/antivirusUpdates";
import { filterReleases, findVersionReport } from "../reports";
import { useAntivirusReports, useVirusTotalResults } from "../useAntivirusReports";
import SectionHeading from "../components/SectionHeading";
import SupportIcon from "../components/SupportIcon";
import VirusTotalAnalysis from "../components/VirusTotalAnalysis";

export default function AntivirusPage({ language, locationHash }: { language: Language; locationHash: string }) {
  const text = antivirusText[language];
  const { state, retry } = useAntivirusReports();
  const results = useVirusTotalResults();
  const updateText = antivirusUpdates[language];
  const [version, setVersion] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setVersion(null);
    setQuery("");
  }, [locationHash]);

  const requestedVersion = locationHash.startsWith("#antivirus-") ? locationHash.slice("#antivirus-".length) : "";
  const selectedVersion = version ?? (state.status === "ready" && requestedVersion
    ? findVersionReport(state.releases, requestedVersion)?.version ?? requestedVersion : "");
  const releases = state.status === "ready" ? filterReleases(state.releases, selectedVersion, query) : [];
  return (
    <section id="antivirus" className="scroll-mt-24 py-[clamp(3.4rem,7vw,5rem)] max-[600px]:py-10">
      <SectionHeading title={text.title} description={text.subtitle} />
      <div className="mb-8 flex items-start gap-4 rounded-2xl border border-sky/25 bg-sky/5 p-5 text-sm leading-7 text-muted">
        <span className="mt-1 shrink-0 text-sky"><SupportIcon name="shield" /></span>
        <div className="min-w-0 space-y-3">
          <p>{text.packing}</p>
          <p>{text.installed}</p>
        </div>
      </div>
      <p className="mb-4 text-sm leading-7 text-muted">{updateText.explanation}</p>
      {results.state.status === "loading" && <p role="status" className="mb-6 text-muted">{text.loading}</p>}
      {results.state.status === "error" && <div role="alert" className="mb-6 rounded-xl border border-red-400/30 p-4">
        <p className="text-red-300">{text.error}</p>
        <button type="button" className="mt-2 min-h-11 cursor-pointer text-accent underline" onClick={results.retry}>{text.retry}</button>
      </div>}
      {results.state.status === "ready" && <p className="mb-6 text-sm text-muted">
        {results.state.value.checkedAt ? <>{updateText.checked}: <time dateTime={results.state.value.checkedAt}>
          {new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(results.state.value.checkedAt))}
        </time></> : updateText.pending}
      </p>}
      {state.status === "loading" && <p role="status" className="py-8 text-muted">{text.loading}</p>}
      {state.status === "error" && <div role="alert" className="rounded-2xl border border-red-400/30 bg-surface p-6">
        <p className="mb-4 text-red-300">{text.error}</p>
        <button type="button" className="min-h-11 cursor-pointer rounded-lg border border-line px-4 text-ink hover:border-accent"
          onClick={retry}>{text.retry}</button>
      </div>}
      {state.status === "ready" && <>
        <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] gap-4 max-[600px]:grid-cols-1">
          <label className="relative min-w-0">
            <span className="sr-only">{text.search}</span>
            <span className="pointer-events-none absolute top-3.5 left-4 text-muted"><SupportIcon name="search" /></span>
            <input id="report-search" type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder={text.search}
              className="min-h-12 w-full min-w-0 rounded-xl border border-line bg-surface py-3 pr-4 pl-11 text-ink focus-visible:outline-2 focus-visible:outline-accent" />
          </label>
          <label className="min-w-0">
            <span className="sr-only">{text.releases}</span>
            <select id="report-release" value={selectedVersion} onChange={(event) => setVersion(event.currentTarget.value)}
              className="min-h-12 w-full min-w-0 rounded-xl border border-line bg-surface px-4 py-3 text-ink">
              <option value="">{text.releases}</option>
              {state.releases.map((release) => <option key={release.version} value={release.version}>{formatReportVersion(release.version, language)}</option>)}
            </select>
          </label>
        </div>
        {!releases.length && <p role="status" className="py-8 text-muted">{text.empty}</p>}
        <div className="space-y-8">
          {releases.map((release) => <article key={release.version} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-accent/5 px-6 py-5">
              <h3 className="text-xl font-bold text-accent">{formatReportVersion(release.version, language)}</h3>
              <span className="text-sm text-muted">{release.date}</span>
            </header>
            <ul className="divide-y divide-line">
              {release.scans.map((scan) => <li key={scan.sha256} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4 p-6 max-[600px]:grid-cols-1">
                <div className="min-w-0">
                  <span className="mb-1 block text-xs tracking-wide text-muted uppercase">{text.component}</span>
                  <h4 className="font-semibold text-ink">{scan.type}</h4>
                  <p className="mt-1 text-sm break-all text-muted">{scan.filename}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <a className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-accent no-underline hover:border-accent"
                    href={scan.vt} target="_blank" rel="noopener noreferrer">{text.view}<SupportIcon name="arrow" /></a>
                </div>
                {results.state.status === "ready" && <div className="col-span-full min-w-0">
                  <VirusTotalAnalysis language={language} analysis={results.state.value.files[scan.sha256]} />
                </div>}
                <p className="col-span-full min-w-0 rounded-lg bg-page/50 px-4 py-3 text-xs leading-6 text-muted">
                  <span className="mr-3 font-semibold">{text.hash}</span><code className="break-all select-all">{scan.sha256}</code>
                </p>
              </li>)}
            </ul>
          </article>)}
        </div>
      </>}
    </section>
  );
}
