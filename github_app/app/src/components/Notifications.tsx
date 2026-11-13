import type { Language } from "../content";
import { notificationText } from "../content/notifications";
import { resourceUrls } from "../content/support";
import SupportIcon from "./SupportIcon";

export default function Notifications({ language, onSelectTopic }: {
  language: Language;
  onSelectTopic: (topic: string) => void;
}) {
  const text = notificationText[language];
  return (
    <>
      <button type="button" popoverTarget="important-messages" aria-label={`${text.title} (2)`}
        className="relative grid size-12 shrink-0 cursor-pointer place-items-center rounded-xl border border-line bg-surface text-accent transition-colors hover:border-accent hover:bg-raised">
        <SupportIcon name="bell" />
        <span aria-hidden="true" className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-page bg-accent text-[11px] leading-none font-bold text-[#06201d]">2</span>
      </button>
      <div id="important-messages" popover="auto" role="dialog" aria-labelledby="notification-title"
        className="fixed inset-auto top-[calc(var(--navigation-height,10rem)_+_.5rem)] right-[max(.75rem,calc((100%_-_1120px)/2))] m-0 max-h-[calc(100dvh_-_var(--navigation-height,10rem)_-_1.5rem)] w-[min(30rem,calc(100%_-_1.5rem))] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface p-5 text-ink shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="notification-title" className="text-lg font-semibold">{text.title}</h2>
          <button type="button" popoverTarget="important-messages" popoverTargetAction="hide" aria-label={text.close}
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg text-muted hover:bg-raised hover:text-ink">
            <SupportIcon name="close" />
          </button>
        </div>
        <div className="space-y-4">
          <article aria-labelledby="notification-survey" className="rounded-xl border border-accent/30 bg-page p-4">
            <div className="mb-2 flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-accent"><SupportIcon name="feedback" /></span>
              <h3 id="notification-survey" className="font-semibold">{text.survey.title}</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted">{text.survey.body}</p>
            <a href={resourceUrls[5]} target="_blank" rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-bold text-[#06201d] no-underline hover:bg-[#8be6d8]">
              {text.survey.action}<SupportIcon name="arrow" />
            </a>
          </article>
          <article aria-labelledby="notification-version" className="rounded-xl border border-line bg-page p-4">
            <div className="mb-2 flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-accent"><SupportIcon name="tablet" /></span>
              <h3 id="notification-version" className="font-semibold">{text.version.title}</h3>
            </div>
            <a href="#release-1.5.0"
              className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent no-underline hover:text-[#a4f3e7]"
              onClick={(event) => {
                if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                const panel = document.getElementById("important-messages");
                if (!panel) throw new Error("The notification popover was not found.");
                panel.hidePopover();
                onSelectTopic("release-1.5.0");
              }}>
              {text.version.details}<SupportIcon name="arrow" />
            </a>
          </article>
        </div>
      </div>
    </>
  );
}
