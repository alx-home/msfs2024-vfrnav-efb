import type { LocaleMap } from "./types";

export const overviewText = {
  en: {
    nextSection: { gallery: "See VFRNav in action", workflow: "Prepare for my first flight", features: "Explore the features" },
    previousBenefit: "Previous benefit", nextBenefit: "Next benefit"
  },
  fr: {
    nextSection: { gallery: "Voir VFRNav en action", workflow: "Préparer mon premier vol", features: "Explorer les fonctionnalités" },
    previousBenefit: "Atout précédent", nextBenefit: "Atout suivant"
  },
  de: {
    nextSection: { gallery: "VFRNav in Aktion erleben", workflow: "Meinen ersten Flug vorbereiten", features: "Die Funktionen entdecken" },
    previousBenefit: "Vorheriger Vorteil", nextBenefit: "Nächster Vorteil"
  },
  es: {
    nextSection: { gallery: "Ver VFRNav en acción", workflow: "Preparar mi primer vuelo", features: "Explorar las funciones" },
    previousBenefit: "Ventaja anterior", nextBenefit: "Siguiente ventaja"
  },
  it: {
    nextSection: { gallery: "Guarda VFRNav in azione", workflow: "Prepara il primo volo", features: "Esplora le funzionalità" },
    previousBenefit: "Vantaggio precedente", nextBenefit: "Vantaggio successivo"
  },
  ja: {
    nextSection: { gallery: "VFRNavの画面を見てみる", workflow: "初めてのフライトを準備する", features: "便利な機能を探す" },
    previousBenefit: "前の特長", nextBenefit: "次の特長"
  },
  nl: {
    nextSection: { gallery: "Bekijk VFRNav in actie", workflow: "Mijn eerste vlucht voorbereiden", features: "Ontdek de functies" },
    previousBenefit: "Vorig voordeel", nextBenefit: "Volgend voordeel"
  },
  pl: {
    nextSection: { gallery: "Zobacz VFRNav w akcji", workflow: "Przygotuj pierwszy lot", features: "Poznaj funkcje" },
    previousBenefit: "Poprzednia zaleta", nextBenefit: "Następna zaleta"
  },
  pt: {
    nextSection: { gallery: "Ver o VFRNav em ação", workflow: "Preparar o meu primeiro voo", features: "Explorar as funcionalidades" },
    previousBenefit: "Vantagem anterior", nextBenefit: "Vantagem seguinte"
  },
  "pt-BR": {
    nextSection: { gallery: "Veja o VFRNav em ação", workflow: "Prepare seu primeiro voo", features: "Explore as funcionalidades" },
    previousBenefit: "Vantagem anterior", nextBenefit: "Próxima vantagem"
  },
  ru: {
    nextSection: { gallery: "Посмотреть VFRNav в действии", workflow: "Подготовиться к первому полёту", features: "Открыть все возможности" },
    previousBenefit: "Предыдущее преимущество", nextBenefit: "Следующее преимущество"
  },
  sv: {
    nextSection: { gallery: "Se VFRNav i praktiken", workflow: "Förbered min första flygning", features: "Upptäck funktionerna" },
    previousBenefit: "Föregående fördel", nextBenefit: "Nästa fördel"
  },
  tr: {
    nextSection: { gallery: "VFRNav'ı iş başında görün", workflow: "İlk uçuşumu hazırlayayım", features: "Özellikleri keşfedin" },
    previousBenefit: "Önceki avantaj", nextBenefit: "Sonraki avantaj"
  },
  "zh-CN": {
    nextSection: { gallery: "看看 VFRNav 的实际画面", workflow: "准备我的首次飞行", features: "探索实用功能" },
    previousBenefit: "上一个亮点", nextBenefit: "下一个亮点"
  }
} satisfies LocaleMap<{
  nextSection: Record<"gallery" | "workflow" | "features", string>;
  previousBenefit: string;
  nextBenefit: string;
}>;
