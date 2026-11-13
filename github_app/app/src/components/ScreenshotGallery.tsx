import { useEffect, useState } from "react";
import type { Language } from "../content";
import { galleryText } from "../content/gallery";
import SectionHeading from "./SectionHeading";
import SupportIcon from "./SupportIcon";
import { useAutoplay } from "../useAutoplay";

const images = Object.entries(import.meta.glob<string>("../assets/gallery/*.{jpg,webp}", {
  eager: true, query: "?url", import: "default"
})).sort(([first], [second]) => first.localeCompare(second)).map(([, url]) => url);
if (!images.length) throw new Error("The Flightsim.to gallery contains no images.");

export default function ScreenshotGallery({ language }: { language: Language }) {
  const text = galleryText[language];
  const { ref, paused, setPaused, playing, interactions } = useAutoplay<HTMLElement>();
  const [slide, setSlide] = useState<{ current: number; previous: number | null }>({ current: 0, previous: null });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  const changeSlide = (direction: number) => {
    setReady(false);
    setError(false);
    setSlide((value) => ({ previous: value.current, current: (value.current + direction + images.length) % images.length }));
  };

  useEffect(() => {
    if (!playing || !ready) return;
    const timer = window.setTimeout(() => {
      setReady(false);
      setError(false);
      setSlide((value) => ({ previous: value.current, current: (value.current + 1) % images.length }));
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [playing, ready, slide.current]);

  return (
    <section ref={ref} id="gallery" data-overview-section aria-label={text.title}
      className="border-t border-line py-[clamp(2.5rem,5vw,4rem)]" {...interactions}>
      <SectionHeading title={text.title} description={text.intro} />
      <figure className="overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        <a href={images[slide.current]} target="_blank" rel="noopener noreferrer"
          className="relative block aspect-video overflow-hidden bg-page" aria-label={`${text.image} ${slide.current + 1} / ${images.length}`}>
          {slide.previous !== null && <img src={images[slide.previous]} alt="" aria-hidden="true"
            className="absolute inset-0 size-full object-contain" />}
          <img key={slide.current} src={images[slide.current]} alt={`${text.image} ${slide.current + 1} / ${images.length}`}
            decoding="async"
            onLoad={() => setReady(true)}
            onError={() => {
              console.error("Unable to load gallery image.", images[slide.current]);
              setError(true);
            }}
            className={`gallery-image absolute inset-0 size-full object-contain transition-opacity duration-1000 motion-reduce:transition-none ${ready || slide.previous === null ? "opacity-100" : "opacity-0"}`} />
        </a>
        {error && <p role="alert" className="px-5 py-3 text-sm text-red-300">{text.error}</p>}
        <figcaption className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-4 max-[600px]:justify-center">
          <a href="https://flightsim.to/addon/86883/efb-msfs2024-vfrnav" className="inline-flex items-center gap-2 text-sm text-muted no-underline hover:text-accent">
            <SupportIcon name="images" />{text.source}
          </a>
          <div className="flex items-center gap-2">
            <button type="button" aria-label={text.previous} disabled={!ready && !error}
              className="grid size-11 cursor-pointer place-items-center rounded-lg border border-line text-ink hover:border-accent disabled:cursor-wait disabled:opacity-40"
              onClick={() => changeSlide(-1)}><SupportIcon name="previous" /></button>
            <span className="min-w-16 text-center text-sm text-muted tabular-nums" aria-live={paused ? "polite" : "off"}>{slide.current + 1} / {images.length}</span>
            <button type="button" aria-label={paused ? text.play : text.pause}
              className="grid size-11 cursor-pointer place-items-center rounded-lg border border-line text-accent hover:border-accent"
              onClick={() => setPaused((value) => !value)}><SupportIcon name={paused ? "play" : "pause"} /></button>
            <button type="button" aria-label={text.next} disabled={!ready && !error}
              className="grid size-11 cursor-pointer place-items-center rounded-lg border border-line text-ink hover:border-accent disabled:cursor-wait disabled:opacity-40"
              onClick={() => changeSlide(1)}><SupportIcon name="next" /></button>
          </div>
        </figcaption>
      </figure>
    </section>
  );
}
