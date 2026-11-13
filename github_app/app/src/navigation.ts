import type { LocaleMap } from "./content/types";

export const tabIds = ["overview", "install", "using", "details", "notes", "antivirus", "support"] as const;
export type TabId = typeof tabIds[number];

export function scrollToSection(section: HTMLElement, behavior: ScrollBehavior = "auto") {
  const navigation = document.getElementById("site-navigation");
  if (!navigation) throw new Error("The site navigation was not found.");
  window.scrollTo({
    top: Math.max(0, section.getBoundingClientRect().top + window.scrollY - navigation.getBoundingClientRect().height - 16),
    behavior
  });
}

export const tabLabels = {
  en: { overview: "Overview", install: "Install", using: "Usage", details: "Details", notes: "Limits", antivirus: "Antivirus", support: "Support" },
  fr: { overview: "Aperçu", install: "Installer", using: "Utiliser", details: "Détails", notes: "Limites", antivirus: "Antivirus", support: "Soutien" },
  de: { overview: "Übersicht", install: "Installation", using: "Nutzung", details: "Details", notes: "Grenzen", antivirus: "Virenschutz", support: "Support" },
  es: { overview: "Resumen", install: "Instalar", using: "Uso", details: "Detalles", notes: "Límites", antivirus: "Antivirus", support: "Apoyo" },
  it: { overview: "Panoramica", install: "Installa", using: "Uso", details: "Dettagli", notes: "Limiti", antivirus: "Antivirus", support: "Supporto" },
  ja: { overview: "概要", install: "導入", using: "使い方", details: "詳細", notes: "制限", antivirus: "ウイルス対策", support: "支援" },
  nl: { overview: "Overzicht", install: "Installeren", using: "Gebruik", details: "Details", notes: "Beperkingen", antivirus: "Antivirus", support: "Steun" },
  pl: { overview: "Przegląd", install: "Instalacja", using: "Obsługa", details: "Szczegóły", notes: "Ograniczenia", antivirus: "Antywirus", support: "Wsparcie" },
  pt: { overview: "Início", install: "Instalar", using: "Uso", details: "Detalhes", notes: "Limites", antivirus: "Antivírus", support: "Apoiar" },
  "pt-BR": { overview: "Início", install: "Instalar", using: "Uso", details: "Detalhes", notes: "Limites", antivirus: "Antivírus", support: "Apoiar" },
  ru: { overview: "Обзор", install: "Установка", using: "Работа", details: "Подробно", notes: "Ограничения", antivirus: "Антивирус", support: "Поддержка" },
  sv: { overview: "Översikt", install: "Installera", using: "Användning", details: "Detaljer", notes: "Gränser", antivirus: "Antivirus", support: "Stöd" },
  tr: { overview: "Genel bakış", install: "Kurulum", using: "Kullanım", details: "Ayrıntılar", notes: "Sınırlamalar", antivirus: "Antivirüs", support: "Destek" },
  "zh-CN": { overview: "概览", install: "安装", using: "使用", details: "详情", notes: "限制", antivirus: "病毒检测", support: "支持" }
} satisfies LocaleMap<Record<TabId, string>>;

export const usageTopicIds = [
  "settings-guide", "map-guide", "charts-guide", "navlog-guide", "weather-guide", "review-guide"
] as const;

export const featureGuideIds = [
  usageTopicIds[1], usageTopicIds[2], usageTopicIds[3],
  usageTopicIds[5], usageTopicIds[4], "efb-modes"
] as const;

export const detailTopicIds = [
  "detail-settings", "detail-layers", "detail-routes", "detail-navlog",
  "detail-charts", "detail-airports", "detail-recording", "detail-server"
] as const;

export function getTabFromHash(locationHash = window.location.hash): TabId {
  const hash = locationHash.slice(1);
  if (hash === "workflow" || hash === "features") return "overview";
  if (usageTopicIds.some((topic) => topic === hash)) return "using";
  if (detailTopicIds.some((topic) => topic === hash)) return "details";
  if (hash === "screenshots" || hash === "controls" || hash === "efb-modes") return "using";
  return tabIds.find((tab) => tab === hash) ?? "overview";
}
