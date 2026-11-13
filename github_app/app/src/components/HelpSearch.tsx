import { useMemo, useRef, useState } from "react";
import type { Language } from "../content";
import { searchText } from "../content/search";
import { createSearchDocuments, searchHelp } from "../search";
import SupportIcon from "./SupportIcon";

export default function HelpSearch({ language, onSelectTopic }: {
  language: Language;
  onSelectTopic: (topic: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const documents = useMemo(() => createSearchDocuments(language), [language]);
  const results = searchHelp(documents, query);
  const text = searchText[language];
  const showResults = isOpen && query.trim().length > 0;

  const selectResult = (id: string) => {
    onSelectTopic(id);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <form role="search" className="relative min-w-0 w-full max-[900px]:col-span-2 max-[900px]:row-start-2"
      onSubmit={(event) => {
        event.preventDefault();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target === input.current && !event.nativeEvent.isComposing) {
          event.preventDefault();
          if (showResults && results[0]) selectResult(results[0].id);
        }
        if (event.key === "Escape") {
          event.preventDefault();
          input.current?.focus();
          setIsOpen(false);
        }
      }}>
      <label className="sr-only" htmlFor="help-search">{text.label}</label>
      <span className="pointer-events-none absolute top-3.5 left-4 text-muted"><SupportIcon name="search" /></span>
      <input id="help-search" ref={input} type="search" autoComplete="off"
        className="min-h-12 w-full min-w-0 rounded-xl border border-line bg-surface/75 py-3 pr-12 pl-11 text-base text-ink placeholder:text-muted focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-search-cancel-button]:appearance-none"
        placeholder={text.label} value={query}
        aria-describedby={showResults ? "help-search-status" : undefined}
        aria-controls={showResults ? "help-search-results" : undefined}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.currentTarget.value);
          setIsOpen(true);
        }} />
      {query && <button type="button" aria-label={text.clear}
        className="absolute top-0.5 right-0.5 grid size-11 cursor-pointer place-items-center rounded-lg text-muted hover:text-ink"
        onClick={() => {
          setQuery("");
          input.current?.focus();
        }}><SupportIcon name="close" /></button>}
      {showResults && <div className="absolute top-full right-0 mt-2 max-h-[min(65dvh,28rem)] w-full overflow-y-auto rounded-xl border border-line bg-surface shadow-2xl min-[901px]:w-[min(36rem,calc(100vw_-_3rem))]">
        <p id="help-search-status" role="status" className="border-b border-line px-4 py-3 text-sm text-muted">
          {results.length ? `${text.results}: ${results.length}` : text.empty}
        </p>
        <ul id="help-search-results" aria-label={text.results} className="divide-y divide-line">
          {results.map((result) => (
            <li key={`${result.id}:${result.title}`}>
              <a href={`#${result.id}`} className="block p-4 text-ink no-underline hover:bg-raised focus-visible:bg-raised focus-visible:-outline-offset-2"
                onClick={(event) => {
                  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  selectResult(result.id);
                }}>
                <span className="mb-1 block text-xs font-semibold text-accent">{result.section}</span>
                <span className="block font-semibold">{result.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{result.snippet}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>}
    </form>
  );
}
