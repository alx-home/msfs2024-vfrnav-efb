import type { Language } from "../content";
import { antivirusText } from "../content/antivirus";
import { antivirusUpdates } from "../content/antivirusUpdates";
import { scoreTone, type FileAnalysis } from "../reports";

const tones = {
  green: "border-green-400/30 bg-green-400/10 text-green-300",
  yellow: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  red: "border-red-400/30 bg-red-400/10 text-red-300"
};

export default function VirusTotalAnalysis({ analysis, language }: { analysis: FileAnalysis | undefined; language: Language }) {
  const text = antivirusUpdates[language];
  if (!analysis) return <p className="text-sm text-muted">{text.pending}</p>;
  const date = new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span aria-label={`${antivirusText[language].result}: ${analysis.score}`}
          className={`rounded-full border px-3 py-1 text-sm font-bold ${tones[scoreTone(analysis.score)]}`}>{analysis.score}</span>
        <p className="text-xs text-muted">{text.analyzed}: <time dateTime={analysis.analyzedAt}>{date.format(new Date(analysis.analyzedAt))}</time></p>
      </div>
      {analysis.vendors.length > 0 ? <div className="rounded-xl border border-amber-400/25 p-4">
        <h5 className="mb-3 text-sm font-semibold text-ink">{text.vendors}</h5>
        <ul className="space-y-3">
          {analysis.vendors.map((vendor) => <li key={`${vendor.name}-${vendor.category}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <span className="font-semibold text-ink">{vendor.name}</span>
            <span className="rounded border border-amber-400/30 px-2 py-0.5 text-xs text-amber-300">{vendor.category}</span>
            <span className="min-w-0 break-all text-muted">{vendor.label || text.noLabel}</span>
          </li>)}
        </ul>
      </div> : <p className="text-sm text-muted">{text.none}</p>}
    </div>
  );
}
