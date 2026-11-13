import type { ReactNode } from "react";

const shortcutPattern = /(?<![A-Za-z0-9_])(?:Ctrl|Control|Alt|Shift|Maj|Strg|Umschalt|Mayús|Maiusc)(?:\s*\+\s*(?:Ctrl|Control|Alt|Shift|Maj|Strg|Umschalt|Mayús|Maiusc|[A-Z0-9]))*(?![A-Za-z0-9_])|\+\s*\/\s*[-\u2212]/gu;

function Keycap({ children }: { children: string }) {
  return <kbd className="rounded-md border border-line border-b-2 bg-raised px-2.5 py-1 font-sans text-sm font-semibold text-ink">{children}</kbd>;
}

export default function KeyboardShortcut({ shortcut }: { shortcut: string }) {
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-2 align-baseline">
      {shortcut.split("+").map((key, index) => <span key={index} className="inline-flex items-center gap-2">
        {index > 0 && <span>+</span>}
        <Keycap>{key.trim()}</Keycap>
      </span>)}
    </span>
  );
}

export function KeyboardText({ children }: { children: string }) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const match of children.matchAll(shortcutPattern)) {
    parts.push(children.slice(cursor, match.index));
    parts.push(<span key={match.index} className="mx-1">
      {match[0].startsWith("+")
        ? <span className="inline-flex max-w-full items-center gap-2 align-baseline"><Keycap>+</Keycap>/<Keycap>{match[0].slice(-1)}</Keycap></span>
        : <KeyboardShortcut shortcut={match[0]} />}
    </span>);
    cursor = match.index + match[0].length;
  }
  parts.push(children.slice(cursor));
  return <>{parts}</>;
}
