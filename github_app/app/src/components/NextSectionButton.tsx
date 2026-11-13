import type { Language } from "../content";
import { overviewText } from "../content/overview";
import { scrollToSection } from "../navigation";
import SupportIcon from "./SupportIcon";

export default function NextSectionButton({ language, targetId }: {
  language: Language;
  targetId: keyof typeof overviewText.en.nextSection;
}) {
  const label = overviewText[language].nextSection[targetId];
  return (
    <div className="pointer-events-none sticky bottom-4 z-20 mt-6 flex justify-center">
      <button type="button" aria-controls={targetId}
        className="pointer-events-auto inline-flex min-h-11 max-w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-accent/40 bg-surface px-5 py-2 text-center text-sm font-semibold text-accent shadow-lg transition-colors hover:border-accent hover:bg-accent hover:text-[#06201d] [&>svg]:shrink-0"
        onClick={() => {
          const section = document.getElementById(targetId);
          if (!section) throw new Error(`Unknown overview section: ${targetId}`);
          scrollToSection(section, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth");
        }}>{label}<SupportIcon name="down" /></button>
    </div>
  );
}
