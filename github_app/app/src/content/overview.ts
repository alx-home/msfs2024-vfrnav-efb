import type { LocaleMap } from "./types";

export const overviewText = {
  en: { nextSection: "Next section", previousBenefit: "Previous benefit", nextBenefit: "Next benefit" },
  fr: { nextSection: "Section suivante", previousBenefit: "Atout précédent", nextBenefit: "Atout suivant" },
  de: { nextSection: "Nächster Abschnitt", previousBenefit: "Vorheriger Vorteil", nextBenefit: "Nächster Vorteil" },
  es: { nextSection: "Siguiente sección", previousBenefit: "Ventaja anterior", nextBenefit: "Siguiente ventaja" },
  it: { nextSection: "Sezione successiva", previousBenefit: "Vantaggio precedente", nextBenefit: "Vantaggio successivo" },
  ja: { nextSection: "次のセクション", previousBenefit: "前の特長", nextBenefit: "次の特長" },
  nl: { nextSection: "Volgende sectie", previousBenefit: "Vorig voordeel", nextBenefit: "Volgend voordeel" },
  pl: { nextSection: "Następna sekcja", previousBenefit: "Poprzednia zaleta", nextBenefit: "Następna zaleta" },
  pt: { nextSection: "Secção seguinte", previousBenefit: "Vantagem anterior", nextBenefit: "Vantagem seguinte" },
  "pt-BR": { nextSection: "Próxima seção", previousBenefit: "Vantagem anterior", nextBenefit: "Próxima vantagem" },
  ru: { nextSection: "Следующий раздел", previousBenefit: "Предыдущее преимущество", nextBenefit: "Следующее преимущество" },
  sv: { nextSection: "Nästa avsnitt", previousBenefit: "Föregående fördel", nextBenefit: "Nästa fördel" },
  tr: { nextSection: "Sonraki bölüm", previousBenefit: "Önceki avantaj", nextBenefit: "Sonraki avantaj" },
  "zh-CN": { nextSection: "下一节", previousBenefit: "上一个亮点", nextBenefit: "下一个亮点" }
} satisfies LocaleMap<{ nextSection: string; previousBenefit: string; nextBenefit: string }>;
