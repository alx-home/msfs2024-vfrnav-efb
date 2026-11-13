import { useEffect, useState } from "react";
import type { Language } from "../content";
import { overviewText } from "../content/overview";
import { scrollToSection } from "../navigation";
import SupportIcon from "./SupportIcon";

export default function NextSectionButton({ language }: { language: Language }) {
  const [nextId, setNextId] = useState("");
  useEffect(() => {
    const update = () => {
      const navigation = document.getElementById("site-navigation");
      if (!navigation) throw new Error("The site navigation was not found.");
      const next = [...document.querySelectorAll<HTMLElement>("[data-overview-section]")]
        .find((section) => section.getBoundingClientRect().top > navigation.getBoundingClientRect().bottom + 24);
      setNextId(next?.id ?? "");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [language]);

  if (!nextId) return null;
  const label = overviewText[language].nextSection;
  return (
    <button type="button" aria-label={label} title={label}
      className="fixed right-6 bottom-6 z-30 grid size-12 cursor-pointer place-items-center rounded-full border border-accent/50 bg-page/95 text-accent shadow-xl backdrop-blur-md transition-colors hover:bg-accent hover:text-page max-[600px]:right-4 max-[600px]:bottom-4"
      onClick={() => {
        const section = document.getElementById(nextId);
        if (!section) throw new Error(`Unknown overview section: ${nextId}`);
        scrollToSection(section, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth");
      }}><SupportIcon name="down" /></button>
  );
}
