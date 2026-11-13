import { useRef } from "react";
import { tabIds, type TabId } from "../navigation";
import SupportIcon from "./SupportIcon";
import donationIcon from "../assets/donation.svg";

const tabIcons = {
  overview: "home", install: "download", using: "book", details: "info",
  notes: "issue", releases: "review", antivirus: "shield"
} as const;

export default function TabNavigation({
  activeTab,
  labels,
  label,
  onSelect
}: {
  activeTab: TabId;
  labels: Record<TabId, string>;
  label: string;
  onSelect: (tab: TabId) => void;
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  return (
    <div className="flex items-stretch gap-2 overflow-x-auto border-b border-line py-4" role="tablist" aria-label={label}>
      {tabIds.map((tab, index) => (
        <button
          className="inline-flex min-h-11 min-w-max shrink-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-line bg-surface p-[.7rem] text-[.9rem] leading-[1.4] whitespace-nowrap text-muted hover:border-accent hover:text-ink aria-selected:border-accent aria-selected:bg-accent aria-selected:font-bold aria-selected:text-[#06201d] [&>svg]:shrink-0"
          key={tab}
          ref={(element) => { buttons.current[index] = element; }}
          type="button"
          role="tab"
          id={`tab-${tab}`}
          aria-controls={`panel-${tab}`}
          aria-selected={activeTab === tab}
          tabIndex={activeTab === tab ? 0 : -1}
          onClick={() => onSelect(tab)}
          onKeyDown={(event) => {
            let nextIndex: number;
            switch (event.key) {
              case "ArrowRight": nextIndex = (index + 1) % tabIds.length; break;
              case "ArrowLeft": nextIndex = (index + tabIds.length - 1) % tabIds.length; break;
              case "Home": nextIndex = 0; break;
              case "End": nextIndex = tabIds.length - 1; break;
              default: return;
            }
            event.preventDefault();
            buttons.current[nextIndex]?.focus();
            onSelect(tabIds[nextIndex]);
          }}
        >
          {tab === "support"
            ? <img className="block size-5 shrink-0" src={donationIcon} alt="" width="20" height="20" />
            : <SupportIcon name={tabIcons[tab]} />}
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}
