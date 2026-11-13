import type { LocaleMap } from "./types";
import type { ReleaseComponent } from "./releases/manifest";

export const releasesText = {
  en: {
    title: "Release history", intro: "Explore the improvements and fixes in every version, from newest to oldest.", versions: "Choose a version",
    components: { all: "Across the project", server: "Installer / server", efb: "EFB" }, improvements: "Improvements", fixes: "Fixes"
  },
  fr: {
    title: "Historique des versions", intro: "Retrouvez les nouveautés et les corrections de chaque version, de la plus récente à la plus ancienne.", versions: "Choisir une version",
    components: { all: "Ensemble du projet", server: "Installeur / serveur", efb: "EFB" }, improvements: "Améliorations", fixes: "Corrections"
  },
  de: {
    title: "Versionsverlauf", intro: "Entdecke die Verbesserungen und Fehlerbehebungen aller Versionen, beginnend mit der neuesten.", versions: "Version auswählen",
    components: { all: "Projektweit", server: "Installationsprogramm / Server", efb: "EFB" }, improvements: "Verbesserungen", fixes: "Fehlerbehebungen"
  },
  es: {
    title: "Historial de versiones", intro: "Descubre las mejoras y correcciones de cada versión, de la más reciente a la más antigua.", versions: "Elegir una versión",
    components: { all: "Todo el proyecto", server: "Instalador / servidor", efb: "EFB" }, improvements: "Mejoras", fixes: "Correcciones"
  },
  it: {
    title: "Cronologia delle versioni", intro: "Scopri miglioramenti e correzioni di ogni versione, dalla più recente alla più vecchia.", versions: "Scegli una versione",
    components: { all: "Tutto il progetto", server: "Programma di installazione / server", efb: "EFB" }, improvements: "Miglioramenti", fixes: "Correzioni"
  },
  ja: {
    title: "リリース履歴", intro: "各バージョンの改善点と修正内容を新しい順に確認できます。", versions: "バージョンを選択",
    components: { all: "プロジェクト全体", server: "インストーラー / サーバー", efb: "EFB" }, improvements: "改善点", fixes: "修正"
  },
  nl: {
    title: "Versiegeschiedenis", intro: "Ontdek de verbeteringen en oplossingen van elke versie, van nieuw naar oud.", versions: "Kies een versie",
    components: { all: "Hele project", server: "Installatieprogramma / server", efb: "EFB" }, improvements: "Verbeteringen", fixes: "Oplossingen"
  },
  pl: {
    title: "Historia wersji", intro: "Poznaj ulepszenia i poprawki każdej wersji, od najnowszej do najstarszej.", versions: "Wybierz wersję",
    components: { all: "Cały projekt", server: "Instalator / serwer", efb: "EFB" }, improvements: "Ulepszenia", fixes: "Poprawki"
  },
  pt: {
    title: "Histórico de versões", intro: "Descubra as melhorias e correções de cada versão, da mais recente à mais antiga.", versions: "Escolher uma versão",
    components: { all: "Todo o projeto", server: "Instalador / servidor", efb: "EFB" }, improvements: "Melhorias", fixes: "Correções"
  },
  "pt-BR": {
    title: "Histórico de versões", intro: "Conheça as melhorias e correções de cada versão, da mais recente à mais antiga.", versions: "Escolha uma versão",
    components: { all: "Todo o projeto", server: "Instalador / servidor", efb: "EFB" }, improvements: "Melhorias", fixes: "Correções"
  },
  ru: {
    title: "История версий", intro: "Улучшения и исправления каждой версии, от новых к старым.", versions: "Выберите версию",
    components: { all: "Весь проект", server: "Установщик / сервер", efb: "EFB" }, improvements: "Улучшения", fixes: "Исправления"
  },
  sv: {
    title: "Versionshistorik", intro: "Upptäck förbättringar och rättningar i varje version, från den senaste till den äldsta.", versions: "Välj en version",
    components: { all: "Hela projektet", server: "Installationsprogram / server", efb: "EFB" }, improvements: "Förbättringar", fixes: "Rättningar"
  },
  tr: {
    title: "Sürüm geçmişi", intro: "Her sürümün iyileştirmelerini ve düzeltmelerini en yeniden en eskiye keşfedin.", versions: "Bir sürüm seçin",
    components: { all: "Proje genelinde", server: "Kurulum programı / sunucu", efb: "EFB" }, improvements: "İyileştirmeler", fixes: "Düzeltmeler"
  },
  "zh-CN": {
    title: "版本历史", intro: "按从新到旧的顺序，了解各版本的改进和修复。", versions: "选择版本",
    components: { all: "整个项目", server: "安装程序 / 服务器", efb: "EFB" }, improvements: "改进", fixes: "修复"
  }
} satisfies LocaleMap<{
  title: string; intro: string; versions: string;
  components: Record<ReleaseComponent, string>; improvements: string; fixes: string;
}>;
