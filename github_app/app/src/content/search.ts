import type { LocaleMap } from "./types";

export const searchText = {
  en: { label: "Search help", results: "Search results", empty: "No matching help. Try another word.", clear: "Clear search" },
  fr: { label: "Rechercher dans l'aide", results: "Résultats de recherche", empty: "Aucune aide trouvée. Essayez un autre mot.", clear: "Effacer la recherche" },
  de: { label: "Hilfe durchsuchen", results: "Suchergebnisse", empty: "Keine passende Hilfe. Versuchen Sie ein anderes Wort.", clear: "Suche löschen" },
  es: { label: "Buscar en la ayuda", results: "Resultados de búsqueda", empty: "No hay resultados. Prueba otra palabra.", clear: "Borrar búsqueda" },
  it: { label: "Cerca nella guida", results: "Risultati di ricerca", empty: "Nessun risultato. Prova un'altra parola.", clear: "Cancella ricerca" },
  ja: { label: "ヘルプを検索", results: "検索結果", empty: "一致するヘルプがありません。別の語を試してください。", clear: "検索をクリア" },
  nl: { label: "Zoek in de hulp", results: "Zoekresultaten", empty: "Geen passende hulp. Probeer een ander woord.", clear: "Zoekopdracht wissen" },
  pl: { label: "Szukaj w pomocy", results: "Wyniki wyszukiwania", empty: "Brak wyników. Spróbuj innego słowa.", clear: "Wyczyść wyszukiwanie" },
  pt: { label: "Pesquisar na ajuda", results: "Resultados da pesquisa", empty: "Sem resultados. Tente outra palavra.", clear: "Limpar pesquisa" },
  "pt-BR": { label: "Pesquisar na ajuda", results: "Resultados da pesquisa", empty: "Nenhum resultado. Tente outra palavra.", clear: "Limpar pesquisa" },
  ru: { label: "Поиск по справке", results: "Результаты поиска", empty: "Ничего не найдено. Попробуйте другое слово.", clear: "Очистить поиск" },
  sv: { label: "Sök i hjälpen", results: "Sökresultat", empty: "Ingen matchande hjälp. Prova ett annat ord.", clear: "Rensa sökning" },
  tr: { label: "Yardımda ara", results: "Arama sonuçları", empty: "Eşleşen yardım yok. Başka bir sözcük deneyin.", clear: "Aramayı temizle" },
  "zh-CN": { label: "搜索帮助", results: "搜索结果", empty: "未找到相关帮助，请尝试其他词语。", clear: "清除搜索" }
} satisfies LocaleMap<{ label: string; results: string; empty: string; clear: string }>;
