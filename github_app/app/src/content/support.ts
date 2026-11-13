import type { LocaleMap, DonationText, DonationUrls, ResourceUrls } from './types';

export const donationText = {
         en: ["Support the project", "If VFRNav is useful to you, you can support its continued development using any of these donation links.", ["Donate with Liberapay", "Donate with PayPal", "Buy me a coffee"]],
         fr: ["Soutenir le projet", "Si VFRNav vous est utile, vous pouvez soutenir son développement avec l'un de ces liens de don.", ["Faire un don avec Liberapay", "Faire un don avec PayPal", "M'offrir un café"]],
         de: ["Projekt unterstützen", "Wenn Ihnen VFRNav hilft, können Sie die Weiterentwicklung über einen dieser Spendenlinks unterstützen.", ["Mit Liberapay spenden", "Mit PayPal spenden", "Einen Kaffee spendieren"]],
         es: ["Apoya el proyecto", "Si VFRNav te resulta útil, puedes apoyar su desarrollo mediante cualquiera de estos enlaces de donación.", ["Donar con Liberapay", "Donar con PayPal", "Invítame a un café"]],
         it: ["Sostieni il progetto", "Se VFRNav ti è utile, puoi sostenere il suo sviluppo tramite uno di questi link per le donazioni.", ["Dona con Liberapay", "Dona con PayPal", "Offrimi un caffè"]],
         ja: ["プロジェクトを支援", "VFRNavがお役に立った場合、以下のいずれかの寄付リンクから開発を支援できます。", ["Liberapayで寄付", "PayPalで寄付", "コーヒーを贈る"]],
         nl: ["Steun het project", "Als VFRNav nuttig voor je is, kun je de verdere ontwikkeling steunen via een van deze donatielinks.", ["Doneer via Liberapay", "Doneer via PayPal", "Trakteer op een kop koffie"]],
         pl: ["Wesprzyj projekt", "Jeśli VFRNav jest przydatny, możesz wesprzeć jego dalszy rozwój za pomocą jednego z tych linków do wpłat.", ["Wpłać przez Liberapay", "Wpłać przez PayPal", "Postaw mi kawę"]],
         pt: ["Apoie o projeto", "Se o VFRNav lhe for útil, pode apoiar o seu desenvolvimento através de qualquer uma destas ligações de donativo.", ["Doar com Liberapay", "Doar com PayPal", "Oferecer-me um café"]],
         "pt-BR": ["Apoie o projeto", "Se o VFRNav for útil para você, é possível apoiar seu desenvolvimento por qualquer um destes links de doação.", ["Doar pelo Liberapay", "Doar pelo PayPal", "Pague um café"]],
         ru: ["Поддержать проект", "Если VFRNav оказался полезен, вы можете поддержать его дальнейшую разработку по одной из этих ссылок.", ["Пожертвовать через Liberapay", "Пожертвовать через PayPal", "Угостить меня кофе"]],
         sv: ["Stöd projektet", "Om VFRNav är användbart för dig kan du stödja den fortsatta utvecklingen via någon av dessa donationslänkar.", ["Donera via Liberapay", "Donera via PayPal", "Bjud mig på en kaffe"]],
         tr: ["Projeyi destekleyin", "VFRNav işinize yarıyorsa bu bağış bağlantılarından biriyle geliştirilmesini destekleyebilirsiniz.", ["Liberapay ile bağış yapın", "PayPal ile bağış yapın", "Bana bir kahve ısmarlayın"]],
         "zh-CN": ["支持项目", "如果 VFRNav 对您有帮助，可以通过以下任一捐赠链接支持项目的持续开发。", ["通过 Liberapay 捐赠", "通过 PayPal 捐赠", "请我喝杯咖啡"]]
      } satisfies LocaleMap<DonationText>;

export const donationDetails = {
  en: {
    badges: ["Preferred", "Convenient"],
    notes: ["More of your donation supports development", "Convenient and widely trusted", "Includes more platform fees"]
  },
  fr: {
    badges: ["Recommandé", "Pratique"],
    notes: ["Une plus grande part de votre don soutient le développement", "Pratique et largement reconnu", "Frais de plateforme plus élevés"]
  },
  de: {
    badges: ["Bevorzugt", "Bequem"],
    notes: ["Mehr von Ihrer Spende unterstützt die Entwicklung", "Bequem und weithin bewährt", "Höhere Plattformgebühren"]
  },
  es: {
    badges: ["Preferido", "Práctico"],
    notes: ["Una mayor parte de tu donación apoya el desarrollo", "Práctico y de confianza", "Incluye más comisiones de la plataforma"]
  },
  it: {
    badges: ["Preferito", "Comodo"],
    notes: ["Una parte maggiore della donazione sostiene lo sviluppo", "Comodo e ampiamente riconosciuto", "Prevede commissioni di piattaforma più alte"]
  },
  ja: {
    badges: ["おすすめ", "便利"],
    notes: ["寄付のより多くの部分が開発支援に充てられます", "便利で広く信頼されています", "プラットフォーム手数料が高めです"]
  },
  nl: {
    badges: ["Voorkeur", "Gemakkelijk"],
    notes: ["Een groter deel van je donatie steunt de ontwikkeling", "Gemakkelijk en breed vertrouwd", "Hogere platformkosten"]
  },
  pl: {
    badges: ["Zalecane", "Wygodne"],
    notes: ["Większa część wpłaty wspiera rozwój", "Wygodna i powszechnie zaufana metoda", "Wyższe opłaty platformy"]
  },
  pt: {
    badges: ["Preferido", "Prático"],
    notes: ["Uma maior parte do seu donativo apoia o desenvolvimento", "Prático e amplamente reconhecido", "Inclui mais taxas da plataforma"]
  },
  "pt-BR": {
    badges: ["Preferido", "Prático"],
    notes: ["Uma parte maior da sua doação apoia o desenvolvimento", "Prático e amplamente reconhecido", "Inclui mais taxas da plataforma"]
  },
  ru: {
    badges: ["Предпочтительно", "Удобно"],
    notes: ["Большая часть пожертвования идёт на разработку", "Удобный и широко известный сервис", "Более высокие комиссии платформы"]
  },
  sv: {
    badges: ["Rekommenderas", "Smidigt"],
    notes: ["En större del av din donation stöder utvecklingen", "Smidigt och välkänt", "Högre plattformsavgifter"]
  },
  tr: {
    badges: ["Tercih edilen", "Pratik"],
    notes: ["Bağışınızın daha büyük bir kısmı geliştirmeyi destekler", "Pratik ve yaygın olarak güvenilir", "Daha yüksek platform ücretleri içerir"]
  },
  "zh-CN": {
    badges: ["首选", "便捷"],
    notes: ["更多捐款用于支持开发", "便捷且广受信赖", "平台手续费较高"]
  }
} satisfies LocaleMap<{ badges: readonly [string, string]; notes: readonly [string, string, string] }>;

export const donationUrls = [
         "https://liberapay.com/alex-home/donate",
         "https://www.paypal.com/donate/?hosted_button_id=UFLZE3KQB78Z4",
         "https://buymeacoffee.com/alex.home"
      ] satisfies DonationUrls;

export const resourceUrls = [
         "https://flightsim.to/addon/86883/efb-msfs2024-vfrnav",
         "https://github.com/alx-home/msfs2024-vfrnav-efb/wiki",
         "https://github.com/alx-home/msfs2024-vfrnav-efb/issues/new/choose",
         "https://discord.gg/r6N7a8qsRJ",
         "https://github.com/alx-home/msfs2024-vfrnav-efb",
         "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAAZAAImAMZdUMlFJWFZERjY1RkFPT0JMOTVWWTk1UUk0UC4u"
      ] satisfies ResourceUrls;
