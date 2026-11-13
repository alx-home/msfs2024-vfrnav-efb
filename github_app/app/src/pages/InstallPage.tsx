import {
  translations,
  type Language
} from "../content";
import SectionHeading from "../components/SectionHeading";
import { installerGuide } from "../content/installer";

const featureGuideIds = ["detail-server", "charts-guide", "navlog-guide", "efb-modes", "detail-server"];

function InstallPage({ language }: { language: Language }) {
  const text = translations[language];
  const installer = installerGuide[language];

  return (
    <section id="install" className="scroll-mt-24 py-[clamp(3.4rem,7vw,5rem)] max-[900px]:scroll-mt-4 max-[600px]:py-10">
      <SectionHeading title={text.install[0]} description={text.install[1]} />
      <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
        <article className="rounded-[13px] border border-line bg-[linear-gradient(145deg,rgba(23,36,55,.9),rgba(17,28,44,.9))] p-[1.3rem] text-muted">{text.install[2]}</article>
        <article className="rounded-[13px] border border-accent/30 bg-[linear-gradient(145deg,rgba(23,36,55,.9),rgba(17,28,44,.9))] p-[1.3rem] text-muted">{text.install[3]}</article>
      </div>
      <article className="mt-6 rounded-[13px] border border-accent/30 bg-[linear-gradient(145deg,rgba(23,36,55,.9),rgba(17,28,44,.9))] p-[clamp(1.3rem,3vw,2rem)]">
        <h3 className="mb-5 text-xl leading-snug font-semibold">{installer.title}</h3>
        <ul className="grid grid-cols-2 gap-6 max-[600px]:grid-cols-1">
          {installer.features.map(([title, description], index) => (
            <li className="min-w-0 last:col-span-full" key={title}>
              <h4 className="mb-1 font-semibold">
                <a className="text-accent underline decoration-accent/40 underline-offset-4 hover:text-[#a4f3e7]" href={`#${featureGuideIds[index]}`}>{title}</a>
              </h4>
              <p className="text-sm leading-7 text-muted">{description}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t border-line pt-4 text-sm text-muted">{installer.connection}</p>
      </article>
      <p className="mt-4 mb-4 rounded-r-lg border-l-[3px] border-warning bg-warning/8 px-4 py-[.9rem] text-[#e7d6b3]">{text.install[4]}</p>
    </section>
  );
}

export default InstallPage;
