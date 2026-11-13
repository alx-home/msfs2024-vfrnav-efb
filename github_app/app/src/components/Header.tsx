import { languages, type Language } from "../content";
import type { ReactNode } from "react";
import appIcon from "../assets/app-icon.svg";

const languageNames: Record<Language, string> = {
  en: "English", fr: "Français", de: "Deutsch", es: "Español",
  it: "Italiano", ja: "日本語", nl: "Nederlands", pl: "Polski",
  pt: "Português", "pt-BR": "Português (Brasil)", ru: "Русский",
  sv: "Svenska", tr: "Türkçe", "zh-CN": "简体中文"
};

export default function Header({
  language,
  label,
  onLanguageChange,
  children
}: {
  language: Language;
  label: string;
  onLanguageChange: (language: Language) => void;
  children: ReactNode;
}) {
  return (
    <header className="relative z-40 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-6 gap-y-4 border-b border-line py-4 max-[900px]:grid-cols-[minmax(0,1fr)_auto] max-[600px]:gap-x-3">
      <a className="inline-flex min-w-0 items-center gap-[.65rem] font-[750] text-ink no-underline hover:text-[#a4f3e7] max-[600px]:text-sm" href="#overview">
        <img className="size-[34px] shrink-0" src={appIcon} alt="" width="34" height="34" />
        <span><span className="whitespace-nowrap">VFRNav EFB</span> <span className="whitespace-nowrap text-muted">MSFS 2024</span></span>
      </a>
      {children}
      <label className="flex min-w-0 items-center justify-self-end gap-2 text-[.82rem] text-muted max-[900px]:col-start-2 max-[900px]:row-start-1" htmlFor="language-select">
        <span className="max-[900px]:sr-only">{label}</span>
        <select
          className="min-h-11 min-w-0 max-w-[190px] rounded-lg border border-line bg-surface px-[.65rem] py-2 text-ink max-[600px]:w-[122px]"
          id="language-select"
          value={language}
          onChange={(event) => {
            const selected = languages.find((option) => option === event.currentTarget.value);
            if (!selected) throw new Error(`Unsupported language: ${event.currentTarget.value}`);
            onLanguageChange(selected);
          }}
        >
          {languages.map((option) => (
            <option key={option} value={option}>{languageNames[option]}</option>
          ))}
        </select>
      </label>
    </header>
  );
}
