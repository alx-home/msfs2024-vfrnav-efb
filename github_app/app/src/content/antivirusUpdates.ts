import type { LocaleMap } from "./types";

type UpdateText = {
  checked: string; analyzed: string; pending: string; vendors: string; none: string; noLabel: string; explanation: string;
};

export const antivirusUpdates = {
  en: {
    checked: "Last checked", analyzed: "VirusTotal analysis", pending: "Awaiting an automatic check",
    vendors: "Flagged vendors and detection labels", none: "No malicious or suspicious verdicts in this analysis.",
    noLabel: "No detection label provided",
    explanation: "Automatically refreshed every six hours. Counts show malicious or suspicious verdicts out of completed engine results; timeouts, failures and unsupported engines are excluded. Results are not live; check the timestamps and open VirusTotal for the current report."
  },
  fr: {
    checked: "Dernière vérification", analyzed: "Analyse VirusTotal", pending: "En attente d'une vérification automatique",
    vendors: "Antivirus ayant signalé le fichier et libellés de détection", none: "Aucun verdict malveillant ou suspect dans cette analyse.",
    noLabel: "Aucun libellé de détection fourni",
    explanation: "Actualisation automatique toutes les six heures. Le compteur indique les verdicts malveillants ou suspects parmi les analyses terminées ; délais dépassés, échecs et moteurs incompatibles sont exclus. Ces résultats ne sont pas en direct : consultez les dates et ouvrez VirusTotal pour le rapport actuel."
  },
  de: {
    checked: "Zuletzt geprüft", analyzed: "VirusTotal-Analyse", pending: "Automatische Prüfung ausstehend",
    vendors: "Meldende Anbieter und Erkennungsnamen", none: "Keine schädlichen oder verdächtigen Befunde in dieser Analyse.",
    noLabel: "Kein Erkennungsname angegeben",
    explanation: "Automatische Aktualisierung alle sechs Stunden. Gezählt werden schädliche oder verdächtige Befunde unter abgeschlossenen Prüfungen; Zeitüberschreitungen, Fehler und nicht unterstützte Engines sind ausgeschlossen. Keine Echtzeitdaten: Zeitstempel prüfen und den aktuellen Bericht bei VirusTotal öffnen."
  },
  es: {
    checked: "Última consulta", analyzed: "Análisis de VirusTotal", pending: "Pendiente de comprobación automática",
    vendors: "Proveedores que alertaron y etiquetas de detección", none: "Ningún veredicto malicioso o sospechoso en este análisis.",
    noLabel: "Sin etiqueta de detección",
    explanation: "Actualización automática cada seis horas. El contador incluye veredictos maliciosos o sospechosos entre los análisis completados; excluye tiempos agotados, fallos y motores incompatibles. No son datos en directo: consulta las fechas y abre VirusTotal para ver el informe actual."
  },
  it: {
    checked: "Ultimo controllo", analyzed: "Analisi VirusTotal", pending: "In attesa del controllo automatico",
    vendors: "Fornitori che hanno segnalato il file ed etichette", none: "Nessun verdetto dannoso o sospetto in questa analisi.",
    noLabel: "Nessuna etichetta di rilevamento fornita",
    explanation: "Aggiornamento automatico ogni sei ore. Il conteggio indica i verdetti dannosi o sospetti tra le analisi completate; esclude timeout, errori e motori non supportati. Non sono dati in tempo reale: controlla le date e apri VirusTotal per il rapporto attuale."
  },
  ja: {
    checked: "最終確認", analyzed: "VirusTotalの解析日時", pending: "自動確認を待っています",
    vendors: "検出したベンダーと検出名", none: "この解析では悪意のある判定や疑わしい判定はありません。",
    noLabel: "検出名の提供なし",
    explanation: "6時間ごとに自動更新します。完了したエンジンの解析結果のうち、悪意のある判定または疑わしい判定を集計します。タイムアウト、失敗、非対応のエンジンは除外します。リアルタイムではありません。日時を確認し、最新のレポートはVirusTotalで開いてください。"
  },
  nl: {
    checked: "Laatst gecontroleerd", analyzed: "VirusTotal-analyse", pending: "Wacht op automatische controle",
    vendors: "Meldende leveranciers en detectielabels", none: "Geen schadelijke of verdachte oordelen in deze analyse.",
    noLabel: "Geen detectielabel opgegeven",
    explanation: "Automatische vernieuwing om de zes uur. De teller toont schadelijke of verdachte oordelen uit voltooide controles; time-outs, fouten en niet-ondersteunde engines zijn uitgesloten. Dit zijn geen livegegevens: controleer de tijdstempels en open VirusTotal voor het actuele rapport."
  },
  pl: {
    checked: "Ostatnio sprawdzono", analyzed: "Analiza VirusTotal", pending: "Oczekiwanie na automatyczne sprawdzenie",
    vendors: "Zgłaszający dostawcy i etykiety wykryć", none: "Brak złośliwych lub podejrzanych wyników w tej analizie.",
    noLabel: "Nie podano etykiety wykrycia",
    explanation: "Automatyczna aktualizacja co sześć godzin. Licznik obejmuje złośliwe lub podejrzane wyniki ukończonych analiz; pomija limity czasu, błędy i nieobsługiwane silniki. To nie są dane na żywo: sprawdź daty i otwórz VirusTotal, aby zobaczyć aktualny raport."
  },
  pt: {
    checked: "Última consulta", analyzed: "Análise VirusTotal", pending: "A aguardar verificação automática",
    vendors: "Fornecedores que sinalizaram e etiquetas de deteção", none: "Nenhum veredito malicioso ou suspeito nesta análise.",
    noLabel: "Sem etiqueta de deteção fornecida",
    explanation: "Atualização automática a cada seis horas. A contagem inclui vereditos maliciosos ou suspeitos entre análises concluídas; exclui tempos excedidos, falhas e motores incompatíveis. Não são dados em direto: consulte as datas e abra o VirusTotal para ver o relatório atual."
  },
  "pt-BR": {
    checked: "Última consulta", analyzed: "Análise do VirusTotal", pending: "Aguardando verificação automática",
    vendors: "Fornecedores que sinalizaram e rótulos de detecção", none: "Nenhum veredito malicioso ou suspeito nesta análise.",
    noLabel: "Nenhum rótulo de detecção fornecido",
    explanation: "Atualização automática a cada seis horas. A contagem inclui vereditos maliciosos ou suspeitos entre análises concluídas; exclui tempos esgotados, falhas e mecanismos incompatíveis. Não são dados ao vivo: confira as datas e abra o VirusTotal para ver o relatório atual."
  },
  ru: {
    checked: "Последняя проверка", analyzed: "Анализ VirusTotal", pending: "Ожидается автоматическая проверка",
    vendors: "Сработавшие антивирусы и названия обнаружений", none: "В этом анализе нет вредоносных или подозрительных вердиктов.",
    noLabel: "Название обнаружения не указано",
    explanation: "Автообновление каждые шесть часов. Счётчик показывает вредоносные или подозрительные вердикты среди завершённых проверок; тайм-ауты, ошибки и неподдерживаемые движки исключены. Это не данные в реальном времени: проверьте даты и откройте VirusTotal для актуального отчёта."
  },
  sv: {
    checked: "Senast kontrollerad", analyzed: "VirusTotal-analys", pending: "Väntar på automatisk kontroll",
    vendors: "Varnande leverantörer och detektionsnamn", none: "Inga skadliga eller misstänkta omdömen i denna analys.",
    noLabel: "Inget detektionsnamn angivet",
    explanation: "Uppdateras automatiskt var sjätte timme. Räknaren visar skadliga eller misstänkta omdömen bland slutförda kontroller; tidsgränser, fel och motorer utan stöd räknas inte. Inte realtidsdata: kontrollera tidsstämplarna och öppna VirusTotal för den aktuella rapporten."
  },
  tr: {
    checked: "Son kontrol", analyzed: "VirusTotal analizi", pending: "Otomatik kontrol bekleniyor",
    vendors: "Uyarı veren sağlayıcılar ve tespit etiketleri", none: "Bu analizde kötü amaçlı veya şüpheli sonuç yok.",
    noLabel: "Tespit etiketi sağlanmadı",
    explanation: "Altı saatte bir otomatik güncellenir. Sayaç, tamamlanan motor sonuçları içindeki kötü amaçlı veya şüpheli sonuçları gösterir; zaman aşımları, hatalar ve desteklenmeyen motorlar hariçtir. Canlı veri değildir: tarihleri kontrol edin ve güncel rapor için VirusTotal'ı açın."
  },
  "zh-CN": {
    checked: "上次检查", analyzed: "VirusTotal分析时间", pending: "等待自动检查",
    vendors: "报告风险的厂商及检测标签", none: "本次分析中没有恶意或可疑判定。",
    noLabel: "未提供检测标签",
    explanation: "每六小时自动更新。计数显示已完成分析中被判为恶意或可疑的引擎数量；不包括超时、失败和不支持的引擎。这不是实时数据：请查看时间戳，并打开VirusTotal获取当前报告。"
  }
} satisfies LocaleMap<UpdateText>;
