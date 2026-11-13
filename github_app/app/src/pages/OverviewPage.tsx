import {
  translations,
  type Language
} from "../content";
import SectionHeading from "../components/SectionHeading";
import FeatureIllustration, { featureIllustrations } from "../components/FeatureIllustration";
import { featureGuideIds } from "../navigation";
import { efbModes } from "../content/efbModes";
import { workflowTitles } from "../content/workflow";
import SupportIcon from "../components/SupportIcon";
import ScreenshotGallery from "../components/ScreenshotGallery";
import BenefitCard from "../components/BenefitCard";
import NextSectionButton from "../components/NextSectionButton";

const downloadUrl = "https://flightsim.to/addon/86883/efb-msfs2024-vfrnav";
const workflowIcons = ["download", "launch", "route", "review"] as const;

function OverviewPage({ language, onSelectTopic }: {
  language: Language;
  onSelectTopic: (topic: string) => void;
}) {
  const text = translations[language];
  const featureItems = text.featureItems ?? text.features.slice(2);
  const featureGuideLabels = [
    text.using[2][1][0],
    text.using[2][2][0],
    text.using[2][3][0],
    text.using[2][5][0],
    text.using[2][4][0],
    efbModes[language].title
  ];

  return (
    <>
      <section id="overview-intro" data-overview-section className="grid grid-cols-[minmax(0,1.05fr)_minmax(280px,.95fr)] items-center gap-[clamp(2rem,6vw,5rem)] py-[clamp(3.5rem,8vw,6.5rem)] max-[900px]:grid-cols-1 max-[600px]:gap-6 max-[600px]:py-8 [&>*]:min-w-0">
        <div>
          <p className="mb-4 text-[.78rem] font-[750] tracking-[.14em] text-accent uppercase">{text.hero[0]}</p>
          <h1 className="mb-[1.15rem] max-w-[720px] text-[clamp(2.6rem,6vw,4.7rem)] leading-[1.04] font-bold tracking-[-.055em] max-[600px]:text-[clamp(2rem,8vw,3rem)]">{text.hero[1]}</h1>
          <p className="mb-4 max-w-[610px] text-[clamp(1.05rem,2vw,1.2rem)] text-muted">{text.hero[2]}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-[.8rem] max-[600px]:flex-col max-[600px]:items-stretch">
            <a className="inline-flex min-h-[46px] items-center justify-center gap-[.55rem] rounded-[9px] border border-accent bg-accent px-[1.05rem] py-[.7rem] text-center font-bold text-[#06201d] no-underline transition-[transform,background] duration-[180ms] hover:-translate-y-0.5 hover:bg-[#8be6d8]" href={downloadUrl}>{text.hero[3]}</a>
            <a className="inline-flex min-h-[46px] items-center justify-center gap-[.55rem] rounded-[9px] border border-line px-[1.05rem] py-[.7rem] text-center font-bold text-ink no-underline transition-[transform,background] duration-[180ms] hover:-translate-y-0.5" href="#using" onClick={(event) => {
              if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              onSelectTopic("using");
            }}>{text.hero[4]}</a>
          </div>
          <p className="mt-4 text-[.88rem] text-muted">{text.hero[5]}</p>
        </div>
        <BenefitCard language={language} titles={featureGuideLabels} descriptions={featureItems} />
      </section>

      <ScreenshotGallery language={language} />

      <section id="workflow" data-overview-section className="scroll-mt-24 border-t border-line py-[clamp(3.4rem,7vw,5rem)] max-[900px]:scroll-mt-4 max-[600px]:py-10">
        <SectionHeading title={text.workflow[0]} description={text.workflow[1]} />
        <ol className="grid grid-cols-4 gap-x-8 gap-y-6 rounded-2xl border border-line bg-surface/40 p-[clamp(1.25rem,3vw,2rem)] max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
          {text.steps.map((step, index) => (
            <li className="relative row-span-3 grid min-w-0 grid-rows-subgrid gap-y-3 after:absolute after:top-6 after:-right-4 after:left-16 after:h-px after:bg-linear-to-r after:from-accent/35 after:to-line last:after:hidden max-[900px]:row-span-1 max-[900px]:grid-cols-[48px_minmax(0,1fr)] max-[900px]:grid-rows-none max-[900px]:gap-x-4 max-[900px]:gap-y-2 max-[900px]:after:hidden" key={step}>
              <span className="relative flex size-12 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent max-[900px]:row-span-2 [&>svg]:size-6" aria-hidden="true">
                <SupportIcon name={workflowIcons[index]} />
                <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full border border-line bg-page text-[10px] font-bold">{String(index + 1).padStart(2, "0")}</span>
              </span>
              <h3 className="text-lg leading-snug font-semibold tracking-tight text-ink max-[900px]:col-start-2">{workflowTitles[language][index]}</h3>
              <p className="text-sm leading-7 text-muted max-[900px]:col-start-2">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="features" data-overview-section className="scroll-mt-24 border-t border-line py-[clamp(3.4rem,7vw,5rem)] max-[900px]:scroll-mt-4 max-[600px]:py-10">
        <SectionHeading title={text.features[0]} description={text.features[1]} />
        <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
          {featureItems.map((item, index) => {
            const illustration = featureIllustrations[index];
            const guideId = featureGuideIds[index];
            if (!illustration) throw new Error(`Missing illustration for feature ${index + 1}.`);
            if (!guideId) throw new Error(`Missing documentation link for feature ${index + 1}.`);
            return (
              <article className="feature-card flex min-w-0 flex-col items-start rounded-[13px] border border-line bg-[linear-gradient(145deg,rgba(23,36,55,.9),rgba(17,28,44,.9))] p-[1.2rem] text-muted" key={item}>
                <FeatureIllustration feature={illustration} />
                <p>{item}</p>
                <a className="mt-auto inline-flex min-h-11 items-center pt-2 text-accent underline underline-offset-[.2em] hover:text-[#a4f3e7]" href={`#${guideId}`} onClick={(event) => {
                  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  onSelectTopic(guideId);
                }}>{featureGuideLabels[index]}</a>
              </article>
            );
          })}
        </div>
      </section>
      <NextSectionButton language={language} />
    </>
  );
}

export default OverviewPage;
