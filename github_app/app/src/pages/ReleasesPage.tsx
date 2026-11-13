import { translations, type Language } from "../content";
import { releasesText } from "../content/releases";
import { resourceUrls } from "../content/support";
import { antivirusText } from "../content/antivirus";
import { tabLabels } from "../navigation";
import { findVersionReport } from "../reports";
import { useAntivirusReports } from "../useAntivirusReports";
import { getReleaseNotes, releaseTopics } from "../releaseNotes";
import DocumentationLayout from "../components/DocumentationLayout";
import SectionHeading from "../components/SectionHeading";
import SupportIcon from "../components/SupportIcon";
import { KeyboardText } from "../components/KeyboardShortcut";

const componentIcons = { all: "launch", server: "download", efb: "tablet" } as const;

export default function ReleasesPage({ language, locationHash, onSelectTopic }: {
  language: Language;
  locationHash: string;
  onSelectTopic: (topic: string) => void;
}) {
  const text = releasesText[language];
  const releaseNotes = getReleaseNotes(language);
  const selectedIndex = releaseTopics.findIndex((topic) => `#${topic.id}` === locationHash);
  const index = selectedIndex < 0 ? 0 : selectedIndex;
  const release = releaseNotes[index];
  const { state, retry } = useAntivirusReports();
  const report = state.status === "ready" ? findVersionReport(state.releases, release.version) : undefined;
  const reportText = antivirusText[language];
  const date = new Intl.DateTimeFormat(language, { dateStyle: "long", timeZone: "UTC" })
    .format(new Date(`${release.date}T00:00:00Z`));

  return (
    <section id="releases" className="scroll-mt-24 py-6 max-[900px]:scroll-mt-4 max-[600px]:py-4">
      <SectionHeading title={text.title} description={text.intro} />
      <DocumentationLayout topics={releaseTopics} selectedId={releaseTopics[index].id} label={text.versions} onSelectTopic={onSelectTopic}>
        <h3>{release.version}</h3>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <time dateTime={release.date} className="text-sm text-muted">{date}</time>
          <div className="flex flex-wrap items-center gap-3">
            {report && <a href={`#antivirus-${release.version}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-page px-4 py-2 text-sm font-semibold text-accent no-underline hover:border-accent"
              onClick={(event) => {
                if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onSelectTopic(`antivirus-${release.version}`);
              }}><SupportIcon name="shield" />{tabLabels[language].antivirus}</a>}
            <a href={resourceUrls[0]} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-page px-4 py-2 text-sm font-semibold text-accent no-underline hover:border-accent">
              {translations[language].hero[3]}<SupportIcon name="download" />
            </a>
          </div>
        </div>
        {state.status === "loading" && <p role="status" className="mb-6 text-sm text-muted">{reportText.loading}</p>}
        {state.status === "error" && <div role="alert" className="mb-6 rounded-xl border border-red-400/30 bg-page p-4 text-sm">
          <p className="text-red-300">{reportText.error}</p>
          <button type="button" className="mt-2 min-h-11 cursor-pointer text-accent underline underline-offset-4" onClick={retry}>{reportText.retry}</button>
        </div>}
        <div className="space-y-7">
          {release.groups.map((group, groupIndex) => (
            <section key={groupIndex} aria-labelledby={`release-component-${groupIndex}`}
              className="overflow-hidden rounded-xl border border-line bg-page">
              <h4 id={`release-component-${groupIndex}`}
                className="flex items-center gap-3 border-b border-line border-l-4 border-l-accent bg-raised px-5 py-4 text-sm font-bold tracking-wide text-ink uppercase">
                <span className="shrink-0 text-accent"><SupportIcon name={componentIcons[group.component]} /></span>
                <span>{text.components[group.component]}</span>
              </h4>
              <div className="space-y-5 p-[clamp(1rem,2vw,1.5rem)] max-[600px]:p-2">
                {group.categories.map((category, categoryIndex) => (
                  <div key={categoryIndex} className={`rounded-xl border bg-surface p-5 max-[600px]:p-3 ${category.kind === "fixes"
                    ? "border-amber-400/25" : "border-accent/20"}`}>
                    <h5
                      className={`mb-5 inline-flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed font-bold ${category.kind === "fixes"
                        ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                        : "border-accent/30 bg-accent/10 text-accent"}`}>
                      <span className="shrink-0"><SupportIcon name={category.kind === "fixes" ? "bug" : "wrench"} /></span>
                      <span className="min-w-0">{text[category.kind]}</span>
                    </h5>
                    <ul className="list-disc space-y-5 pl-5 text-sm leading-7 marker:text-accent">
                      {category.items.map((item, itemIndex) => <li key={itemIndex} className="text-ink"><KeyboardText>{item}</KeyboardText></li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DocumentationLayout>
    </section>
  );
}
