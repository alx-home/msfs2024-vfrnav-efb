import type { Language, LocaleMap } from "./types";

const versionStatuses = {
  en: { latest: "latest", "under testing": "under testing" },
  fr: { latest: "dernière version", "under testing": "en cours de test" },
  de: { latest: "neueste Version", "under testing": "im Test" },
  es: { latest: "última versión", "under testing": "en pruebas" },
  it: { latest: "ultima versione", "under testing": "in fase di test" },
  ja: { latest: "最新版", "under testing": "テスト中" },
  nl: { latest: "nieuwste versie", "under testing": "wordt getest" },
  pl: { latest: "najnowsza wersja", "under testing": "w trakcie testów" },
  pt: { latest: "versão mais recente", "under testing": "em testes" },
  "pt-BR": { latest: "versão mais recente", "under testing": "em testes" },
  ru: { latest: "последняя версия", "under testing": "на тестировании" },
  sv: { latest: "senaste versionen", "under testing": "under test" },
  tr: { latest: "en son sürüm", "under testing": "test aşamasında" },
  "zh-CN": { latest: "最新版", "under testing": "测试中" }
} satisfies LocaleMap<Record<"latest" | "under testing", string>>;

export function formatReportVersion(version: string, language: Language): string {
  return version.replace(/\((latest|under testing)\)$/, (_, status: string) =>
    `(${status === "latest" ? versionStatuses[language].latest : versionStatuses[language]["under testing"]})`);
}

type ReportText = {
  title: string; subtitle: string; component: string; result: string; hash: string; view: string;
  search: string; releases: string; loading: string; empty: string; error: string; retry: string; packing: string; installed: string;
};

export const antivirusText = {
  en: {
    title: "VirusTotal Security Verification", subtitle: "Official VirusTotal reports for MSFS2024 VFRNav.",
    installed: "These alerts mainly concern the installer. The Community package has never had a detection in the published reports. The installed server executable generally has few or no detections. Separate reports below show the results for each component and version.",
    component: "Component", result: "Result", hash: "SHA-256", view: "View Scan",
    search: "Search version, component or filename", releases: "All releases", loading: "Loading reports...",
    empty: "No reports match your filters.", error: "Reports could not be loaded.", retry: "Try again",
    packing: "VFRNav uses UPX compression to keep downloads small and a self-extracting installer to make setup easier. Some antivirus tools, especially those using machine learning, can mistake these packaging techniques for suspicious behavior and produce false-positive alerts.",
  },
  fr: {
    title: "Vérification VirusTotal", subtitle: "Rapports VirusTotal officiels pour MSFS2024 VFRNav.",
    installed: "Ces alertes concernent surtout l'installateur. Le package Community n'a jamais eu de détection dans les rapports publiés. L'exécutable du serveur installé présente généralement peu ou pas de détections. Les rapports séparés ci-dessous détaillent les résultats pour chaque composant et chaque version.",
    component: "Composant", result: "Résultat", hash: "SHA-256", view: "Voir l'analyse",
    search: "Rechercher une version, un composant ou un fichier", releases: "Toutes les versions", loading: "Chargement des rapports...",
    empty: "Aucun rapport ne correspond à vos filtres.", error: "Impossible de charger les rapports.", retry: "Réessayer",
    packing: "VFRNav utilise la compression UPX pour alléger le téléchargement et un installateur auto-extractible pour simplifier l'installation. Certains antivirus, notamment ceux fondés sur l'apprentissage automatique, peuvent confondre ces mécanismes de distribution avec un comportement suspect et afficher des faux positifs.",
  },
  de: {
    title: "VirusTotal Sicherheitsprüfung", subtitle: "Offizielle VirusTotal-Berichte für MSFS2024 VFRNav.",
    installed: "Diese Warnungen betreffen vor allem das Installationsprogramm. Das Community-Paket hatte in den veröffentlichten Berichten noch nie eine Erkennung. Die installierte ausführbare Serverdatei weist normalerweise wenige oder keine Erkennungen auf. Die separaten Berichte unten zeigen die Ergebnisse für jede Komponente und Version.",
    component: "Komponente", result: "Ergebnis", hash: "SHA-256", view: "Scan anzeigen",
    search: "Version, Komponente oder Dateiname suchen", releases: "Alle Versionen", loading: "Berichte werden geladen...",
    empty: "Keine Berichte entsprechen den Filtern.", error: "Berichte konnten nicht geladen werden.", retry: "Erneut versuchen",
    packing: "VFRNav nutzt UPX-Komprimierung für kleinere Downloads und ein selbstentpackendes Installationsprogramm für eine einfache Einrichtung. Manche Antivirenprogramme, insbesondere solche mit maschinellem Lernen, können diese Verpackungstechniken mit verdächtigem Verhalten verwechseln und Fehlalarme ausgeben.",
  },
  es: {
    title: "Verificación de Seguridad VirusTotal", subtitle: "Informes oficiales de VirusTotal para MSFS2024 VFRNav.",
    installed: "Estas alertas afectan principalmente al instalador. El paquete Community nunca ha tenido detecciones en los informes publicados. El ejecutable del servidor instalado suele tener pocas detecciones o ninguna. Los informes separados de abajo muestran los resultados de cada componente y versión.",
    component: "Componente", result: "Resultado", hash: "SHA-256", view: "Ver análisis",
    search: "Buscar versión, componente o archivo", releases: "Todas las versiones", loading: "Cargando informes...",
    empty: "Ningún informe coincide con los filtros.", error: "No se pudieron cargar los informes.", retry: "Reintentar",
    packing: "VFRNav usa compresión UPX para reducir el tamaño de la descarga y un instalador autoextraíble para facilitar la instalación. Algunos antivirus, especialmente los basados en aprendizaje automático, pueden confundir estas técnicas de distribución con un comportamiento sospechoso y generar falsos positivos.",
  },
  it: {
    title: "Verifica di Sicurezza VirusTotal", subtitle: "Rapporti ufficiali VirusTotal per MSFS2024 VFRNav.",
    installed: "Questi avvisi riguardano soprattutto il programma di installazione. Il pacchetto Community non ha mai avuto rilevamenti nei rapporti pubblicati. L'eseguibile del server installato presenta generalmente pochi rilevamenti o nessuno. I rapporti separati qui sotto mostrano i risultati per ogni componente e versione.",
    component: "Componente", result: "Risultato", hash: "SHA-256", view: "Visualizza scansione",
    search: "Cerca versione, componente o file", releases: "Tutte le versioni", loading: "Caricamento dei rapporti...",
    empty: "Nessun rapporto corrisponde ai filtri.", error: "Impossibile caricare i rapporti.", retry: "Riprova",
    packing: "VFRNav usa la compressione UPX per ridurre le dimensioni del download e un programma di installazione autoestraente per semplificare l'installazione. Alcuni antivirus, soprattutto quelli basati sull'apprendimento automatico, possono scambiare queste tecniche di distribuzione per comportamenti sospetti e generare falsi positivi.",
  },
  ja: {
    title: "VirusTotal セキュリティ検証", subtitle: "MSFS2024 VFRNav の公式 VirusTotal レポート。",
    installed: "これらの警告は主にインストーラーに関するものです。公開済みのレポートでは、Communityパッケージに検出が出たことはありません。インストールされたサーバー実行ファイルの検出数は通常少ないかゼロです。下の個別レポートで、コンポーネントとバージョンごとの結果を確認できます。",
    component: "コンポーネント", result: "結果", hash: "SHA-256", view: "スキャンを見る",
    search: "バージョン・コンポーネント・ファイル名で検索", releases: "すべてのバージョン", loading: "レポートを読み込み中...",
    empty: "条件に一致するレポートはありません。", error: "レポートを読み込めませんでした。", retry: "再試行",
    packing: "VFRNavはダウンロードを小さくするためにUPX圧縮を使い、簡単にインストールできるよう自己展開型インストーラーを採用しています。一部のウイルス対策ソフト、特に機械学習を使うものは、これらの配布方法を疑わしい動作と取り違え、誤検知の警告を表示することがあります。",
  },
  nl: {
    title: "VirusTotal Beveiligingscontrole", subtitle: "Officiële VirusTotal-rapporten voor MSFS2024 VFRNav.",
    installed: "Deze meldingen betreffen vooral het installatieprogramma. Het Community-pakket heeft in de gepubliceerde rapporten nooit een detectie gehad. Het geïnstalleerde uitvoerbare serverbestand heeft doorgaans weinig of geen detecties. De afzonderlijke rapporten hieronder tonen de resultaten per onderdeel en versie.",
    component: "Onderdeel", result: "Resultaat", hash: "SHA-256", view: "Scan bekijken",
    search: "Zoek versie, onderdeel of bestandsnaam", releases: "Alle versies", loading: "Rapporten laden...",
    empty: "Geen rapporten voor deze filters.", error: "Rapporten konden niet worden geladen.", retry: "Opnieuw proberen",
    packing: "VFRNav gebruikt UPX-compressie voor kleinere downloads en een zelfuitpakkend installatieprogramma om de installatie eenvoudiger te maken. Sommige antivirusprogramma's, vooral die met machinaal leren, kunnen deze verpakkingstechnieken verwarren met verdacht gedrag en foutpositieve meldingen geven.",
  },
  pl: {
    title: "Weryfikacja Bezpieczeństwa VirusTotal", subtitle: "Oficjalne raporty VirusTotal dla MSFS2024 VFRNav.",
    installed: "Te ostrzeżenia dotyczą głównie instalatora. Pakiet Community nigdy nie miał wykryć w opublikowanych raportach. Zainstalowany plik wykonywalny serwera zwykle ma niewiele wykryć lub nie ma ich wcale. Oddzielne raporty poniżej pokazują wyniki dla każdego komponentu i wersji.",
    component: "Komponent", result: "Wynik", hash: "SHA-256", view: "Pokaż skan",
    search: "Szukaj wersji, komponentu lub pliku", releases: "Wszystkie wersje", loading: "Wczytywanie raportów...",
    empty: "Brak raportów pasujących do filtrów.", error: "Nie udało się wczytać raportów.", retry: "Spróbuj ponownie",
    packing: "VFRNav wykorzystuje kompresję UPX, aby zmniejszyć rozmiar pobieranego pliku, oraz samorozpakowujący instalator, aby ułatwić instalację. Niektóre antywirusy, zwłaszcza korzystające z uczenia maszynowego, mogą pomylić te metody dystrybucji z podejrzanym zachowaniem i wyświetlać fałszywe alarmy.",
  },
  pt: {
    title: "Verificação de Segurança VirusTotal", subtitle: "Relatórios oficiais VirusTotal para o MSFS2024 VFRNav.",
    installed: "Estes alertas dizem respeito sobretudo ao instalador. O pacote Community nunca teve deteções nos relatórios publicados. O executável do servidor instalado apresenta geralmente poucas ou nenhumas deteções. Os relatórios separados abaixo mostram os resultados de cada componente e versão.",
    component: "Componente", result: "Resultado", hash: "SHA-256", view: "Ver análise",
    search: "Pesquisar versão, componente ou ficheiro", releases: "Todas as versões", loading: "A carregar relatórios...",
    empty: "Nenhum relatório corresponde aos filtros.", error: "Não foi possível carregar os relatórios.", retry: "Tentar novamente",
    packing: "O VFRNav utiliza compressão UPX para reduzir o tamanho da transferência e um instalador autoextraível para facilitar a instalação. Alguns antivírus, sobretudo os baseados em aprendizagem automática, podem confundir estas técnicas de distribuição com comportamento suspeito e apresentar falsos positivos.",
  },
  "pt-BR": {
    title: "Verificação de Segurança VirusTotal", subtitle: "Relatórios oficiais do VirusTotal para o MSFS2024 VFRNav.",
    installed: "Esses alertas dizem respeito principalmente ao instalador. O pacote Community nunca teve detecções nos relatórios publicados. O executável do servidor instalado geralmente apresenta poucas ou nenhuma detecção. Os relatórios separados abaixo mostram os resultados de cada componente e versão.",
    component: "Componente", result: "Resultado", hash: "SHA-256", view: "Ver análise",
    search: "Buscar versão, componente ou arquivo", releases: "Todas as versões", loading: "Carregando relatórios...",
    empty: "Nenhum relatório corresponde aos filtros.", error: "Não foi possível carregar os relatórios.", retry: "Tentar novamente",
    packing: "O VFRNav usa compactação UPX para reduzir o tamanho do download e um instalador autoextraível para facilitar a instalação. Alguns antivírus, especialmente os baseados em aprendizado de máquina, podem confundir essas técnicas de distribuição com comportamento suspeito e gerar falsos positivos.",
  },
  ru: {
    title: "Проверка Безопасности VirusTotal", subtitle: "Официальные отчёты VirusTotal для MSFS2024 VFRNav.",
    installed: "Эти предупреждения в основном касаются установщика. В опубликованных отчётах у пакета Community никогда не было срабатываний. У установленного исполняемого файла сервера обычно мало срабатываний или их нет вовсе. Отдельные отчёты ниже показывают результаты для каждого компонента и версии.",
    component: "Компонент", result: "Результат", hash: "SHA-256", view: "Открыть отчёт",
    search: "Поиск версии, компонента или файла", releases: "Все версии", loading: "Загрузка отчётов...",
    empty: "Нет отчётов по выбранным фильтрам.", error: "Не удалось загрузить отчёты.", retry: "Повторить",
    packing: "VFRNav использует сжатие UPX для уменьшения размера загрузки и самораспаковывающийся установщик для удобной установки. Некоторые антивирусы, особенно использующие машинное обучение, могут принять эти способы упаковки за подозрительное поведение и выдать ложные предупреждения.",
  },
  sv: {
    title: "VirusTotal Säkerhetskontroll", subtitle: "Officiella VirusTotal-rapporter för MSFS2024 VFRNav.",
    installed: "Dessa varningar gäller främst installationsprogrammet. Community-paketet har aldrig haft någon detektion i de publicerade rapporterna. Serverns installerade körbara fil har vanligtvis få eller inga detektioner. De separata rapporterna nedan visar resultaten för varje komponent och version.",
    component: "Komponent", result: "Resultat", hash: "SHA-256", view: "Visa skanning",
    search: "Sök version, komponent eller filnamn", releases: "Alla versioner", loading: "Laddar rapporter...",
    empty: "Inga rapporter matchar filtren.", error: "Rapporterna kunde inte laddas.", retry: "Försök igen",
    packing: "VFRNav använder UPX-komprimering för mindre nedladdningar och ett självuppackande installationsprogram för enklare installation. Vissa antivirusprogram, särskilt de som använder maskininlärning, kan förväxla dessa paketeringsmetoder med misstänkt beteende och ge falsklarm.",
  },
  tr: {
    title: "VirusTotal Güvenlik Doğrulaması", subtitle: "MSFS2024 VFRNav için resmi VirusTotal raporları.",
    installed: "Bu uyarılar çoğunlukla yükleyiciyle ilgilidir. Yayımlanan raporlarda Community paketinde hiç tespit olmamıştır. Kurulan sunucu çalıştırılabilir dosyasında genellikle az sayıda tespit olur veya hiç tespit olmaz. Aşağıdaki ayrı raporlar, her bileşen ve sürüm için sonuçları gösterir.",
    component: "Bileşen", result: "Sonuç", hash: "SHA-256", view: "Taramayı Görüntüle",
    search: "Sürüm, bileşen veya dosya adı ara", releases: "Tüm sürümler", loading: "Raporlar yükleniyor...",
    empty: "Filtrelerle eşleşen rapor yok.", error: "Raporlar yüklenemedi.", retry: "Yeniden dene",
    packing: "VFRNav, indirme boyutunu küçültmek için UPX sıkıştırması ve kurulumu kolaylaştırmak için kendiliğinden açılan bir yükleyici kullanır. Özellikle makine öğrenimi kullanan bazı antivirüsler, bu paketleme yöntemlerini şüpheli davranışla karıştırarak yanlış pozitif uyarıları verebilir.",
  },
  "zh-CN": {
    title: "VirusTotal 安全验证", subtitle: "MSFS2024 VFRNav 官方 VirusTotal 报告。",
    installed: "这些警报主要涉及安装程序。在已发布的报告中，Community包从未出现检测。安装后的服务器可执行文件通常只有少量检测或没有检测。下方的独立报告展示了各组件和版本的具体结果。",
    component: "组件", result: "结果", hash: "SHA-256", view: "查看扫描结果",
    search: "搜索版本、组件或文件名", releases: "所有版本", loading: "正在加载报告...",
    empty: "没有符合筛选条件的报告。", error: "无法加载报告。", retry: "重试",
    packing: "VFRNav使用UPX压缩来减小下载体积，并采用自解压安装程序来简化安装。部分杀毒软件，尤其是基于机器学习的软件，可能将这些打包方式误认为可疑行为，从而产生误报。",
  }
} satisfies LocaleMap<ReportText>;
