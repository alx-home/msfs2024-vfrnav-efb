import {
  translations,
  type Language
} from "../content";
import SectionHeading from "../components/SectionHeading";
import EfbModesGuide from "../components/EfbModesGuide";
import { usageTopicIds } from "../navigation";
import DocumentationLayout from "../components/DocumentationLayout";
import { efbModes } from "../content/efbModes";
import { getUsageGroups } from "../content/usage";
import SupportIcon from "../components/SupportIcon";
import { KeyboardText } from "../components/KeyboardShortcut";

const controlIcons = ["move", "resize", "panel", "rotate", "book"] as const;

function UsagePage({ language, locationHash, onSelectTopic }: {
  language: Language;
  locationHash: string;
  onSelectTopic: (topic: string) => void;
}) {
  const text = translations[language];
  const screenshotGroups = getUsageGroups(language);
  const topics = [
    ...screenshotGroups.map((group, index) => ({ id: usageTopicIds[index], label: group.heading })),
    { id: "efb-modes", label: efbModes[language].title },
    { id: "controls", label: text.controls[0] }
  ];
  const selectedId = topics.find((topic) => `#${topic.id}` === locationHash)?.id ?? usageTopicIds[0];
  const groupIndex = usageTopicIds.findIndex((id) => id === selectedId);
  const group = screenshotGroups[groupIndex];

  return (
    <section id="using" className="scroll-mt-24 py-6 max-[900px]:scroll-mt-4 max-[600px]:py-4">
      <SectionHeading title={text.using[0]} description={text.using[1]} />
      <DocumentationLayout topics={topics} selectedId={selectedId} label={text.using[0]} onSelectTopic={onSelectTopic}>
        {group && <>
          <h3>{group.heading}</h3>
          <p><KeyboardText>{group.description}</KeyboardText></p>
          <ol className="grid gap-4">
            {group.items.map((item, index) => <li className="flex items-start gap-4 rounded-xl border border-line bg-page/30 p-5" key={item}>
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-sm font-bold text-accent" aria-hidden="true">{index + 1}</span>
              <p className="min-w-0"><KeyboardText>{item}</KeyboardText></p>
            </li>)}
          </ol>
        </>}
        {selectedId === "efb-modes" && <EfbModesGuide language={language} />}
        {selectedId === "controls" && <>
          <h3>{text.controls[0]}</h3>
          <p>{text.controls[1]}</p>
          <ul className="grid gap-4 text-muted">
            {text.controls[2].map((control, index) => <li className="flex items-start gap-4 rounded-xl border border-line bg-page/30 p-5" key={control}>
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-sky/20 bg-sky/10 text-sky" aria-hidden="true">
                <SupportIcon name={controlIcons[index]} />
              </span>
              <p className="min-w-0 flex-1 self-center"><KeyboardText>{control}</KeyboardText></p>
            </li>)}
          </ul>
        </>}
      </DocumentationLayout>
    </section>
  );
}

export default UsagePage;
