import { useLayoutEffect, useRef, type ReactNode } from "react";

export default function DocumentationLayout({
  topics,
  selectedId,
  label,
  onSelectTopic,
  children
}: {
  topics: ReadonlyArray<{ id: string; label: string }>;
  selectedId: string;
  label: string;
  onSelectTopic: (topic: string) => void;
  children: ReactNode;
}) {
  const content = useRef<HTMLElement>(null);
  const layout = useRef<HTMLDivElement>(null);
  const topicList = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const article = content.current;
    const container = layout.current;
    const navigation = document.getElementById("site-navigation");
    const footer = document.querySelector("footer");
    const section = article?.closest("section");
    if (!article || !container || !navigation || !footer || !section) throw new Error("The documentation layout elements were not found.");
    const updateHeight = () => {
      const top = article.getBoundingClientRect().top + window.scrollY;
      const bottomSpace = footer.getBoundingClientRect().height + parseFloat(getComputedStyle(section).paddingBottom);
      const height = `${Math.max(160, window.innerHeight - top - bottomSpace)}px`;
      if (container.style.getPropertyValue("--documentation-height") !== height) {
        container.style.setProperty("--documentation-height", height);
      }
    };
    updateHeight();
    const list = topicList.current;
    const selected = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (list && selected) {
      if (selected.offsetTop < list.scrollTop) {
        list.scrollTop = selected.offsetTop;
      } else if (selected.offsetTop + selected.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = selected.offsetTop + selected.offsetHeight - list.clientHeight;
      }
    }
    const observer = new ResizeObserver(updateHeight);
    observer.observe(navigation);
    observer.observe(footer);
    const heading = article.parentElement?.previousElementSibling;
    if (heading) observer.observe(heading);
    window.addEventListener("resize", updateHeight);
    window.addEventListener("scroll", updateHeight, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("scroll", updateHeight);
    };
  }, [selectedId, label]);

  return (
    <div ref={layout} className="documentation-layout grid scroll-mt-24 grid-cols-[minmax(210px,270px)_minmax(0,1fr)] items-start gap-[clamp(1rem,3vw,2rem)] max-[900px]:scroll-mt-4 max-[900px]:grid-cols-1 [&>*]:min-w-0">
      <nav ref={topicList} className="documentation-topics sticky top-[calc(var(--navigation-height,0px)_+_1rem)] flex max-h-[var(--documentation-height)] flex-col items-stretch gap-[.4rem] overflow-y-auto overscroll-contain text-[.88rem] [scrollbar-gutter:stable] max-[900px]:hidden" aria-label={label}>
        {topics.map((topic) => (
          <a
            className="flex min-h-12 shrink-0 items-center rounded-[9px] border border-line bg-surface px-4 py-[.8rem] text-muted no-underline hover:text-ink aria-[current=page]:border-accent aria-[current=page]:bg-accent/10 aria-[current=page]:font-bold aria-[current=page]:text-accent"
            href={`#${topic.id}`}
            key={topic.id}
            aria-current={selectedId === topic.id ? "page" : undefined}
            onClick={(event) => {
              if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              onSelectTopic(topic.id);
            }}
          >
            {topic.label}
          </a>
        ))}
      </nav>
      <label className="documentation-picker hidden gap-2 text-muted max-[900px]:grid">
        <span>{label}</span>
        <select
          className="min-h-11 w-full min-w-0 rounded-lg border border-line bg-surface px-[.65rem] py-2 text-base text-ink"
          value={selectedId}
          onChange={(event) => {
            const topic = topics.find((item) => item.id === event.currentTarget.value);
            if (!topic) throw new Error(`Unknown documentation topic: ${event.currentTarget.value}`);
            onSelectTopic(topic.id);
          }}
        >
          {topics.map((topic) => <option value={topic.id} key={topic.id}>{topic.label}</option>)}
        </select>
      </label>
      <article key={selectedId} ref={content} className="documentation-article max-h-[var(--documentation-height)] min-w-0 overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface p-[clamp(1.25rem,3vw,2.5rem)] text-base leading-8 text-muted [scrollbar-gutter:stable] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&_h3]:mb-6 [&_h3]:text-[clamp(1.35rem,3vw,1.8rem)] [&_h3]:leading-[1.3] [&_h3]:font-bold [&_h3]:text-ink [&>p]:mb-6 [&>:last-child]:mb-0" id={selectedId} tabIndex={0}>
        {children}
      </article>
    </div>
  );
}
