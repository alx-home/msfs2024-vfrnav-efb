import {
  translations,
  type Language
} from "../content";
import SectionHeading from "../components/SectionHeading";

function NotesPage({ language }: { language: Language }) {
  const text = translations[language];

  return (
    <section id="notes" className="scroll-mt-24 py-[clamp(3.4rem,7vw,5rem)] max-[900px]:scroll-mt-4 max-[600px]:py-10">
      <SectionHeading title={text.notes[0]} description={text.notes[1]} />
      <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
        {text.notes[2].map(([heading, body]) => (
          <article className="rounded-[13px] border border-line bg-[linear-gradient(145deg,rgba(23,36,55,.9),rgba(17,28,44,.9))] p-[1.3rem] text-muted" key={heading}>
            <strong className="mb-[.4rem] block font-bold text-ink">{heading}</strong>
            <span>{body}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default NotesPage;
