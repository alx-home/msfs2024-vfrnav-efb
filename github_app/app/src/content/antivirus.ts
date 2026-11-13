import type { LocaleMap } from "./types";

type ReportText = {
  title: string; subtitle: string; component: string; result: string; hash: string; view: string;
  search: string; releases: string; loading: string; empty: string; error: string; retry: string; note: string;
};

export const antivirusText = {
  en: {
    title: "VirusTotal Security Verification", subtitle: "Official VirusTotal reports for MSFS2024 VFRNav.",
    component: "Component", result: "Result", hash: "SHA-256", view: "View Scan",
    search: "Search version, component or filename", releases: "All releases", loading: "Loading reports...",
    empty: "No reports match your filters.", error: "Reports could not be loaded.", retry: "Try again",
    note: "Detection counts are not a guarantee of safety. Read the full report and compare the SHA-256 hash with your downloaded file."
  },
  fr: {
    title: "Vérification VirusTotal", subtitle: "Rapports VirusTotal officiels pour MSFS2024 VFRNav.",
    component: "Composant", result: "Résultat", hash: "SHA-256", view: "Voir l'analyse",
    search: "Rechercher une version, un composant ou un fichier", releases: "Toutes les versions", loading: "Chargement des rapports...",
    empty: "Aucun rapport ne correspond à vos filtres.", error: "Impossible de charger les rapports.", retry: "Réessayer",
    note: "Le nombre de détections ne garantit pas la sécurité. Consultez le rapport complet et comparez l'empreinte SHA-256 avec celle du fichier téléchargé."
  },
  de: {
    title: "VirusTotal Sicherheitsprüfung", subtitle: "Offizielle VirusTotal-Berichte für MSFS2024 VFRNav.",
    component: "Komponente", result: "Ergebnis", hash: "SHA-256", view: "Scan anzeigen",
    search: "Version, Komponente oder Dateiname suchen", releases: "Alle Versionen", loading: "Berichte werden geladen...",
    empty: "Keine Berichte entsprechen den Filtern.", error: "Berichte konnten nicht geladen werden.", retry: "Erneut versuchen",
    note: "Erkennungszahlen garantieren keine Sicherheit. Lesen Sie den vollständigen Bericht und vergleichen Sie den SHA-256-Hash mit Ihrer heruntergeladenen Datei."
  },
  es: {
    title: "Verificación de Seguridad VirusTotal", subtitle: "Informes oficiales de VirusTotal para MSFS2024 VFRNav.",
    component: "Componente", result: "Resultado", hash: "SHA-256", view: "Ver análisis",
    search: "Buscar versión, componente o archivo", releases: "Todas las versiones", loading: "Cargando informes...",
    empty: "Ningún informe coincide con los filtros.", error: "No se pudieron cargar los informes.", retry: "Reintentar",
    note: "El número de detecciones no garantiza la seguridad. Lee el informe completo y compara el hash SHA-256 con el archivo descargado."
  },
  it: {
    title: "Verifica di Sicurezza VirusTotal", subtitle: "Rapporti ufficiali VirusTotal per MSFS2024 VFRNav.",
    component: "Componente", result: "Risultato", hash: "SHA-256", view: "Visualizza scansione",
    search: "Cerca versione, componente o file", releases: "Tutte le versioni", loading: "Caricamento dei rapporti...",
    empty: "Nessun rapporto corrisponde ai filtri.", error: "Impossibile caricare i rapporti.", retry: "Riprova",
    note: "Il numero di rilevamenti non garantisce la sicurezza. Leggi il rapporto completo e confronta l'hash SHA-256 con il file scaricato."
  },
  ja: {
    title: "VirusTotal セキュリティ検証", subtitle: "MSFS2024 VFRNav の公式 VirusTotal レポート。",
    component: "コンポーネント", result: "結果", hash: "SHA-256", view: "スキャンを見る",
    search: "バージョン・コンポーネント・ファイル名で検索", releases: "すべてのバージョン", loading: "レポートを読み込み中...",
    empty: "条件に一致するレポートはありません。", error: "レポートを読み込めませんでした。", retry: "再試行",
    note: "検出数だけで安全性は保証されません。詳細レポートを確認し、ダウンロードしたファイルの SHA-256 ハッシュと照合してください。"
  },
  nl: {
    title: "VirusTotal Beveiligingscontrole", subtitle: "Officiële VirusTotal-rapporten voor MSFS2024 VFRNav.",
    component: "Onderdeel", result: "Resultaat", hash: "SHA-256", view: "Scan bekijken",
    search: "Zoek versie, onderdeel of bestandsnaam", releases: "Alle versies", loading: "Rapporten laden...",
    empty: "Geen rapporten voor deze filters.", error: "Rapporten konden niet worden geladen.", retry: "Opnieuw proberen",
    note: "Detectieaantallen garanderen geen veiligheid. Lees het volledige rapport en vergelijk de SHA-256-hash met je gedownloade bestand."
  },
  pl: {
    title: "Weryfikacja Bezpieczeństwa VirusTotal", subtitle: "Oficjalne raporty VirusTotal dla MSFS2024 VFRNav.",
    component: "Komponent", result: "Wynik", hash: "SHA-256", view: "Pokaż skan",
    search: "Szukaj wersji, komponentu lub pliku", releases: "Wszystkie wersje", loading: "Wczytywanie raportów...",
    empty: "Brak raportów pasujących do filtrów.", error: "Nie udało się wczytać raportów.", retry: "Spróbuj ponownie",
    note: "Liczba wykryć nie gwarantuje bezpieczeństwa. Przeczytaj pełny raport i porównaj skrót SHA-256 z pobranym plikiem."
  },
  pt: {
    title: "Verificação de Segurança VirusTotal", subtitle: "Relatórios oficiais VirusTotal para o MSFS2024 VFRNav.",
    component: "Componente", result: "Resultado", hash: "SHA-256", view: "Ver análise",
    search: "Pesquisar versão, componente ou ficheiro", releases: "Todas as versões", loading: "A carregar relatórios...",
    empty: "Nenhum relatório corresponde aos filtros.", error: "Não foi possível carregar os relatórios.", retry: "Tentar novamente",
    note: "O número de deteções não garante segurança. Consulte o relatório completo e compare o hash SHA-256 com o ficheiro descarregado."
  },
  "pt-BR": {
    title: "Verificação de Segurança VirusTotal", subtitle: "Relatórios oficiais do VirusTotal para o MSFS2024 VFRNav.",
    component: "Componente", result: "Resultado", hash: "SHA-256", view: "Ver análise",
    search: "Buscar versão, componente ou arquivo", releases: "Todas as versões", loading: "Carregando relatórios...",
    empty: "Nenhum relatório corresponde aos filtros.", error: "Não foi possível carregar os relatórios.", retry: "Tentar novamente",
    note: "O número de detecções não garante segurança. Consulte o relatório completo e compare o hash SHA-256 com o arquivo baixado."
  },
  ru: {
    title: "Проверка Безопасности VirusTotal", subtitle: "Официальные отчёты VirusTotal для MSFS2024 VFRNav.",
    component: "Компонент", result: "Результат", hash: "SHA-256", view: "Открыть отчёт",
    search: "Поиск версии, компонента или файла", releases: "Все версии", loading: "Загрузка отчётов...",
    empty: "Нет отчётов по выбранным фильтрам.", error: "Не удалось загрузить отчёты.", retry: "Повторить",
    note: "Число обнаружений не гарантирует безопасность. Прочитайте полный отчёт и сравните SHA-256 с хешем загруженного файла."
  },
  sv: {
    title: "VirusTotal Säkerhetskontroll", subtitle: "Officiella VirusTotal-rapporter för MSFS2024 VFRNav.",
    component: "Komponent", result: "Resultat", hash: "SHA-256", view: "Visa skanning",
    search: "Sök version, komponent eller filnamn", releases: "Alla versioner", loading: "Laddar rapporter...",
    empty: "Inga rapporter matchar filtren.", error: "Rapporterna kunde inte laddas.", retry: "Försök igen",
    note: "Antalet upptäckter garanterar inte säkerhet. Läs hela rapporten och jämför SHA-256-hashen med din nedladdade fil."
  },
  tr: {
    title: "VirusTotal Güvenlik Doğrulaması", subtitle: "MSFS2024 VFRNav için resmi VirusTotal raporları.",
    component: "Bileşen", result: "Sonuç", hash: "SHA-256", view: "Taramayı Görüntüle",
    search: "Sürüm, bileşen veya dosya adı ara", releases: "Tüm sürümler", loading: "Raporlar yükleniyor...",
    empty: "Filtrelerle eşleşen rapor yok.", error: "Raporlar yüklenemedi.", retry: "Yeniden dene",
    note: "Tespit sayıları güvenlik garantisi değildir. Tam raporu okuyun ve SHA-256 özetini indirdiğiniz dosyayla karşılaştırın."
  },
  "zh-CN": {
    title: "VirusTotal 安全验证", subtitle: "MSFS2024 VFRNav 官方 VirusTotal 报告。",
    component: "组件", result: "结果", hash: "SHA-256", view: "查看扫描结果",
    search: "搜索版本、组件或文件名", releases: "所有版本", loading: "正在加载报告...",
    empty: "没有符合筛选条件的报告。", error: "无法加载报告。", retry: "重试",
    note: "检测数量并不能保证安全。请阅读完整报告，并将 SHA-256 哈希与下载的文件进行比对。"
  }
} satisfies LocaleMap<ReportText>;
