import { useEffect, useState } from "react";
import { translations, type Language } from "../content";
import { galleryText } from "../content/gallery";
import { overviewText } from "../content/overview";
import { useAutoplay } from "../useAutoplay";
import SupportIcon from "./SupportIcon";

const icons = ["route", "book", "route", "review", "weather", "tablet"] as const;

export default function BenefitCard({ language, titles, descriptions }: {
  language: Language;
  titles: readonly string[];
  descriptions: readonly string[];
}) {
  const [index, setIndex] = useState(0);
  const { ref, paused, setPaused, playing, interactions } = useAutoplay<HTMLDivElement>();
  const labels = overviewText[language];
  const playback = galleryText[language];
  const count = descriptions.length;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % count), 6500);
    return () => window.clearInterval(timer);
  }, [playing, count]);

  return (
    <div ref={ref} className="benefit-card flex min-w-0 flex-col gap-6 rounded-[18px] border border-line bg-[linear-gradient(145deg,#10243a,#101a2a_74%)] p-[clamp(1.3rem,3vw,2rem)] shadow-[0_24px_80px_rgba(0,0,0,.28)]" {...interactions}>
      <p className="text-[.78rem] font-[750] tracking-[.12em] text-accent uppercase">{translations[language].features[0]}</p>
      <div className="grid flex-1" aria-live={paused ? "polite" : "off"}>
        {descriptions.map((description, item) => <div key={item} aria-hidden={item !== index}
          className={`benefit-panel flex min-w-0 flex-col items-start gap-5 transition-opacity duration-700 [grid-area:1/1] motion-reduce:transition-none ${item === index ? "visible opacity-100" : "invisible opacity-0"}`}>
          <span className="grid size-12 place-items-center rounded-xl border border-accent/20 bg-accent/10 text-accent [&>svg]:size-6"><SupportIcon name={icons[item]} /></span>
          <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] leading-[1.2] font-bold">{titles[item]}</h2>
          <p className="text-base leading-8 text-muted">{description}</p>
        </div>)}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <span className="benefit-counter text-sm text-muted tabular-nums">{index + 1} / {count}</span>
        <div className="flex gap-2">
          <button type="button" aria-label={labels.previousBenefit}
            className="grid size-11 cursor-pointer place-items-center rounded-lg border border-line text-ink hover:border-accent"
            onClick={() => setIndex((value) => (value + count - 1) % count)}><SupportIcon name="previous" /></button>
          <button type="button" aria-label={paused ? playback.play : playback.pause}
            className="grid size-11 cursor-pointer place-items-center rounded-lg border border-line text-accent hover:border-accent"
            onClick={() => setPaused((value) => !value)}><SupportIcon name={paused ? "play" : "pause"} /></button>
          <button type="button" aria-label={labels.nextBenefit}
            className="grid size-11 cursor-pointer place-items-center rounded-lg border border-line text-ink hover:border-accent"
            onClick={() => setIndex((value) => (value + 1) % count)}><SupportIcon name="next" /></button>
        </div>
      </div>
    </div>
  );
}
