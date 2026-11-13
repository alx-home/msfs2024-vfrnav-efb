import { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import TabNavigation from "./components/TabNavigation";
import { languages, translations, type Language } from "./content";
import { getTabFromHash, scrollToSection, tabIds, tabLabels, type TabId } from "./navigation";
import OverviewPage from "./pages/OverviewPage";
import InstallPage from "./pages/InstallPage";
import UsagePage from "./pages/UsagePage";
import DetailsPage from "./pages/DetailsPage";
import NotesPage from "./pages/NotesPage";
import SupportPage from "./pages/SupportPage";
import HelpSearch from "./components/HelpSearch";
import AntivirusPage from "./pages/AntivirusPage";
import Notifications from "./components/Notifications";
import ReleasesPage from "./pages/ReleasesPage";

function getInitialLanguage(): Language {
  const browserLanguage = navigator.language;
  const exactMatch = languages.find((language) => language === browserLanguage);
  if (exactMatch) return exactMatch;
  if (browserLanguage.toLowerCase().startsWith("zh")) return "zh-CN";
  if (browserLanguage.toLowerCase().startsWith("pt") && browserLanguage.toLowerCase().includes("br")) {
    return "pt-BR";
  }
  return languages.find((language) => language === browserLanguage.slice(0, 2)) ?? "en";
}

const pages = {
  install: InstallPage,
  notes: NotesPage,
  support: SupportPage
};

export default function App() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [locationHash, setLocationHash] = useState(() => window.location.hash);
  const activeTab = getTabFromHash(locationHash);
  const previousTab = useRef<TabId | undefined>(undefined);
  const navigation = useRef<HTMLDivElement>(null);
  const text = translations[language];
  const labels = tabLabels[language];

  useEffect(() => {
    if (!navigation.current) throw new Error("The site navigation was not found.");
    const element = navigation.current;
    const updateHeight = () => {
      document.documentElement.style.setProperty("--navigation-height", `${element.getBoundingClientRect().height}px`);
    };
    const updateBackdrop = () => {
      const scrolled = String(window.scrollY > 8);
      if (element.dataset.scrolled !== scrolled) element.dataset.scrolled = scrolled;
    };
    updateHeight();
    updateBackdrop();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    window.addEventListener("scroll", updateBackdrop, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateBackdrop);
      document.documentElement.style.removeProperty("--navigation-height");
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = text.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) throw new Error("The page description meta element was not found.");
    description.content = text.description;
  }, [language, text]);

  useEffect(() => {
    const onHashChange = () => setLocationHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const changedTab = previousTab.current !== undefined && previousTab.current !== activeTab;
    const sameTab = previousTab.current === activeTab;
    previousTab.current = activeTab;
    if (sameTab && (activeTab === "using" || activeTab === "details" || activeTab === "releases")) return;
    if (changedTab) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }

    const hash = locationHash.slice(1);
    const target = document.getElementById(hash);
    if (target && !tabIds.some((tab) => tab === hash)) {
      const scrollTarget = target.closest(".documentation-layout") ?? target;
      if (scrollTarget instanceof HTMLElement) scrollToSection(scrollTarget);
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [locationHash, activeTab]);

  const selectTopic = (topic: string) => {
    const hash = `#${topic}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    setLocationHash(hash);
  };

  const selectTab = (tab: TabId) => {
    setLocationHash(`#${tab}`);
    if (window.location.hash !== `#${tab}`) window.location.hash = tab;
  };

  return (
    <div className="mx-auto flex min-h-dvh w-[min(1120px,calc(100%_-_2.5rem))] flex-col max-[600px]:w-[min(1120px,calc(100%_-_1.5rem))] [&_a:not([class])]:text-accent [&_a:not([class])]:underline [&_a:not([class])]:underline-offset-[.2em] [&_a:not([class])]:hover:text-[#a4f3e7] [&_:is(a,button,select):focus-visible]:rounded-sm [&_:is(a,button,select):focus-visible]:outline-2 [&_:is(a,button,select):focus-visible]:outline-offset-4 [&_:is(a,button,select):focus-visible]:outline-accent motion-reduce:[&_*]:transition-none">
      <div id="site-navigation" ref={navigation} className="isolate sticky top-0 z-40 before:pointer-events-none before:fixed before:inset-x-0 before:top-0 before:-z-10 before:h-[calc(var(--navigation-height,0px)_+_1.5rem)] before:bg-page/95 before:opacity-0 before:backdrop-blur-xl before:[mask-image:linear-gradient(to_bottom,black_calc(100%_-_1.5rem),transparent)] before:transition-opacity before:duration-200 data-[scrolled=true]:before:opacity-100">
        <Header language={language} label={text.language} onLanguageChange={setLanguage}>
          <div className="flex min-w-0 items-center gap-3 max-[900px]:col-span-2 max-[900px]:row-start-2">
            <HelpSearch key={language} language={language} onSelectTopic={selectTopic} />
            <Notifications language={language} onSelectTopic={selectTopic} />
          </div>
        </Header>
        <TabNavigation activeTab={activeTab} labels={labels} label={text.navLabel} onSelect={selectTab} />
      </div>
      <main className="flex-1">
        {tabIds.map((tab) => {
          const renderPage = () => {
            if (tab === "overview") return <OverviewPage language={language} onSelectTopic={selectTopic} />;
            if (tab === "using") return <UsagePage language={language} locationHash={locationHash} onSelectTopic={selectTopic} />;
            if (tab === "details") return <DetailsPage language={language} locationHash={locationHash} onSelectTopic={selectTopic} />;
            if (tab === "releases") return <ReleasesPage language={language} locationHash={locationHash} onSelectTopic={selectTopic} />;
            if (tab === "antivirus") return <AntivirusPage language={language} locationHash={locationHash} />;
            const Page = pages[tab];
            return <Page language={language} />;
          };
          return (
            <div
              key={tab}
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
              hidden={activeTab !== tab}
              tabIndex={0}
            >
              {activeTab === tab && renderPage()}
            </div>
          );
        })}
      </main>
      <footer className="border-t border-line pt-[1.6rem] pb-10 text-[.88rem] text-muted">
        <div className="mx-auto flex w-[min(1120px,calc(100%_-_2.5rem))] flex-wrap justify-between gap-x-6 gap-y-[.8rem] max-[600px]:w-[min(1120px,calc(100%_-_1.5rem))]">
          <span>{text.support[3]}</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>&copy; 2024 Alexandre GARCIN</span>
            <a href="https://github.com/alx-home/msfs2024-vfrnav-efb/blob/HEAD/LICENSE" target="_blank" rel="noopener noreferrer">GNU GPL v3</a>
            <a href="#antivirus" onClick={(event) => {
              if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              selectTopic("antivirus");
            }}>{text.support[4]}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
