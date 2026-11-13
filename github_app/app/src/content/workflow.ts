import type { LocaleMap } from "./types";

export const workflowTitles = {
  en: ["Install VFRNav", "Open the EFB", "Prepare your flight", "Fly and review"],
  fr: ["Installer VFRNav", "Ouvrir l'EFB", "Préparer le vol", "Voler et revoir"],
  de: ["VFRNav installieren", "EFB öffnen", "Flug vorbereiten", "Fliegen und auswerten"],
  es: ["Instala VFRNav", "Abre el EFB", "Prepara tu vuelo", "Vuela y revisa"],
  it: ["Installa VFRNav", "Apri l'EFB", "Prepara il volo", "Vola e rivedi"],
  ja: ["VFRNavをインストール", "EFBを開く", "フライトを準備", "飛行して振り返る"],
  nl: ["Installeer VFRNav", "Open de EFB", "Bereid je vlucht voor", "Vlieg en kijk terug"],
  pl: ["Zainstaluj VFRNav", "Otwórz EFB", "Przygotuj lot", "Leć i przeanalizuj"],
  pt: ["Instale o VFRNav", "Abra o EFB", "Prepare o voo", "Voe e reveja"],
  "pt-BR": ["Instale o VFRNav", "Abra o EFB", "Prepare seu voo", "Voe e revise"],
  ru: ["Установите VFRNav", "Откройте EFB", "Подготовьте полёт", "Летайте и анализируйте"],
  sv: ["Installera VFRNav", "Öppna EFB", "Förbered flygningen", "Flyg och utvärdera"],
  tr: ["VFRNav'ı yükleyin", "EFB'yi açın", "Uçuşu hazırlayın", "Uçun ve inceleyin"],
  "zh-CN": ["安装 VFRNav", "打开 EFB", "准备飞行", "飞行与回顾"]
} satisfies LocaleMap<readonly [string, string, string, string]>;
