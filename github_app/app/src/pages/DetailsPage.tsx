import {
  detailedGuide,
  type Language
} from "../content";
import SectionHeading from "../components/SectionHeading";
import DocumentationLayout from "../components/DocumentationLayout";
import { detailTopicIds } from "../navigation";
import SupportIcon from "../components/SupportIcon";
import { KeyboardText } from "../components/KeyboardShortcut";

const detailIcons = ["panel", "images", "route", "keyboard", "book", "weather", "review", "code"] as const;

function DetailsPage({ language, locationHash, onSelectTopic }: {
  language: Language;
  locationHash: string;
  onSelectTopic: (topic: string) => void;
}) {
  const details = detailedGuide[language];
  const topics = details.items.map(([heading], index) => ({ id: detailTopicIds[index], label: heading }));
  const selectedIndex = topics.findIndex((topic) => `#${topic.id}` === locationHash);
  const index = selectedIndex < 0 ? 0 : selectedIndex;
  const [heading, body] = details.items[index];
  const paragraphs = Array.from(new Intl.Segmenter(language, { granularity: "sentence" }).segment(body),
    ({ segment }) => segment.trim());

  return (
    <section id="details" className="scroll-mt-24 py-6 max-[900px]:scroll-mt-4 max-[600px]:py-4">
      <SectionHeading title={details.title} description={details.intro} />
      <DocumentationLayout topics={topics} selectedId={topics[index].id} label={details.title} onSelectTopic={onSelectTopic}>
        <h3 className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-accent/20 bg-accent/10 text-accent"><SupportIcon name={detailIcons[index]} /></span>
          <span className="min-w-0 self-center wrap-anywhere">{heading}</span>
        </h3>
        <div className="max-w-prose space-y-6">
          {paragraphs.map((paragraph, paragraphIndex) => <p key={paragraph} className={paragraphIndex === 0 ? "text-ink" : "border-l-2 border-accent/20 pl-5"}><KeyboardText>{paragraph}</KeyboardText></p>)}
        </div>
      </DocumentationLayout>
    </section>
  );
}

export default DetailsPage;
