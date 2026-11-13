import { useEffect, useState } from "react";
import type { Language } from "../content";
import { antivirusText } from "../content/antivirus";
import { filterReleases, parseReleases, scoreTone, type Release } from "../reports";
import SectionHeading from "../components/SectionHeading";
import SupportIcon from "../components/SupportIcon";

type ReportsState = { status: "loading" } | { status: "error" } | { status: "ready"; releases: Release[] };
const tones = {
  green: "border-green-400/30 bg-green-400/10 text-green-300",
  yellow: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  red: "border-red-400/30 bg-red-400/10 text-red-300"
};

export default function AntivirusPage({ language }: { language: Language }) {
  const text = antivirusText[language];
  const [state, setState] = useState<ReportsState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [version, setVersion] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    const load = async () => {
      try {
        const response = await fetch("./releases.json", { signal: controller.signal });
        if (!response.ok) throw new Error(`Reports request failed: HTTP ${response.status}`);
        const data: unknown = await response.json();
        const releases = parseReleases(data);
        if (!controller.signal.aborted) setState({ status: "ready", releases });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Unable to load VirusTotal reports.", error);
        setState({ status: "error" });
      }
    };
    void load();
    return () => controller.abort();
  }, [attempt]);

  const releases = state.status === "ready" ? filterReleases(state.releases, version, query) : [];
  return (
    <section id="antivirus" className="scroll-mt-24 py-[clamp(3.4rem,7vw,5rem)] max-[600px]:py-10">
      <SectionHeading title={text.title} description={text.subtitle} />
      <p className="mb-8 flex items-start gap-4 rounded-2xl border border-sky/25 bg-sky/5 p-5 text-sm leading-7 text-muted">
        <span className="mt-1 shrink-0 text-sky"><SupportIcon name="shield" /></span>{text.note}
      </p>
      {state.status === "loading" && <p role="status" className="py-8 text-muted">{text.loading}</p>}
      {state.status === "error" && <div role="alert" className="rounded-2xl border border-red-400/30 bg-surface p-6">
        <p className="mb-4 text-red-300">{text.error}</p>
        <button type="button" className="min-h-11 cursor-pointer rounded-lg border border-line px-4 text-ink hover:border-accent"
          onClick={() => setAttempt((value) => value + 1)}>{text.retry}</button>
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
            <select id="report-release" value={version} onChange={(event) => setVersion(event.currentTarget.value)}
              className="min-h-12 w-full min-w-0 rounded-xl border border-line bg-surface px-4 py-3 text-ink">
              <option value="">{text.releases}</option>
              {state.releases.map((release) => <option key={release.version} value={release.version}>{release.version}</option>)}
            </select>
          </label>
        </div>
        {!releases.length && <p role="status" className="py-8 text-muted">{text.empty}</p>}
        <div className="space-y-8">
          {releases.map((release) => <article key={release.version} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-accent/5 px-6 py-5">
              <h3 className="text-xl font-bold text-accent">{release.version}</h3>
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
                  <span aria-label={`${text.result}: ${scan.score}`}
                    className={`rounded-full border px-3 py-1 text-sm font-bold ${tones[scoreTone(scan.score)]}`}>{scan.score}</span>
                  <a className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-accent no-underline hover:border-accent"
                    href={scan.vt} target="_blank" rel="noopener noreferrer">{text.view}<SupportIcon name="arrow" /></a>
                </div>
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
