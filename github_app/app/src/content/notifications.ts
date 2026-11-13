import type { LocaleMap } from "./types";

type NotificationText = {
  title: string;
  close: string;
  survey: { title: string; body: string; action: string };
  version: { title: string; details: string };
};

export const notificationText = {
  en: {
    title: "Important updates", close: "Close notifications",
    survey: {
      title: "Help shape VFRNav's future",
      body: "Do you use the standalone version? This quick survey will help decide whether to maintain it or focus development on more powerful server features, such as PDF streaming, for better performance and fewer MSFS API limitations.",
      action: "Take the survey"
    },
    version: {
      title: "What's new in 1.5.0",
      details: "Explore the changes"
    }
  },
  fr: {
    title: "Les infos à ne pas manquer", close: "Fermer les notifications",
    survey: {
      title: "Votre avis dessine la suite de VFRNav",
      body: "Utilisez-vous la version standalone ? Ce court sondage aidera à décider de sa maintenance ou à concentrer le développement sur des fonctions serveur plus puissantes, comme le streaming PDF, pour améliorer les performances et réduire les limites de l'API MSFS.",
      action: "Donner mon avis"
    },
    version: {
      title: "Les nouveautés de la version 1.5.0",
      details: "Découvrir les nouveautés"
    }
  },
  de: {
    title: "Wichtige Neuigkeiten", close: "Benachrichtigungen schließen",
    survey: {
      title: "Gestalte die Zukunft von VFRNav mit",
      body: "Nutzt du die Standalone-Version? Diese kurze Umfrage hilft zu entscheiden, ob sie weiter gepflegt wird oder leistungsfähigere Serverfunktionen wie PDF-Streaming im Mittelpunkt stehen sollen, für mehr Leistung und weniger Einschränkungen durch die MSFS-API.",
      action: "An der Umfrage teilnehmen"
    },
    version: {
      title: "Neu in Version 1.5.0",
      details: "Die Neuerungen entdecken"
    }
  },
  es: {
    title: "Novedades importantes", close: "Cerrar notificaciones",
    survey: {
      title: "Ayuda a definir el futuro de VFRNav",
      body: "¿Usas la versión standalone? Esta breve encuesta ayudará a decidir si mantenerla o centrar el desarrollo en funciones del servidor más potentes, como el streaming de PDF, para mejorar el rendimiento y reducir las limitaciones de la API de MSFS.",
      action: "Responder a la encuesta"
    },
    version: {
      title: "Novedades de la versión 1.5.0",
      details: "Descubrir los cambios"
    }
  },
  it: {
    title: "Novità importanti", close: "Chiudi le notifiche",
    survey: {
      title: "Aiuta a definire il futuro di VFRNav",
      body: "Usi la versione standalone? Questo breve sondaggio aiuterà a decidere se mantenerla o concentrarsi su funzioni server più potenti, come lo streaming PDF, per migliorare le prestazioni e ridurre i limiti dell'API MSFS.",
      action: "Rispondi al sondaggio"
    },
    version: {
      title: "Le novità della versione 1.5.0",
      details: "Scopri le novità"
    }
  },
  ja: {
    title: "大切なお知らせ", close: "通知を閉じる",
    survey: {
      title: "VFRNavの今後にご意見を",
      body: "スタンドアロン版を使用していますか？短いアンケートで、保守を継続するか、PDFストリーミングなどの強力なサーバー機能に開発を集中するかを検討します。性能向上とMSFS APIの制限軽減を目指しています。",
      action: "アンケートに回答する"
    },
    version: {
      title: "バージョン1.5.0の新機能",
      details: "変更内容を見る"
    }
  },
  nl: {
    title: "Belangrijk nieuws", close: "Meldingen sluiten",
    survey: {
      title: "Bepaal mee de toekomst van VFRNav",
      body: "Gebruik je de standalone-versie? Deze korte enquête helpt bepalen of die onderhouden moet blijven of dat de ontwikkeling zich beter kan richten op krachtigere serverfuncties, zoals PDF-streaming, voor betere prestaties en minder beperkingen van de MSFS-API.",
      action: "Vul de enquête in"
    },
    version: {
      title: "Nieuw in versie 1.5.0",
      details: "Ontdek de veranderingen"
    }
  },
  pl: {
    title: "Ważne wiadomości", close: "Zamknij powiadomienia",
    survey: {
      title: "Pomóż określić przyszłość VFRNav",
      body: "Korzystasz z wersji standalone? Ta krótka ankieta pomoże zdecydować, czy nadal ją utrzymywać, czy skupić rozwój na wydajniejszych funkcjach serwera, takich jak strumieniowanie PDF, aby poprawić wydajność i ograniczyć wpływ limitów API MSFS.",
      action: "Wypełnij ankietę"
    },
    version: {
      title: "Nowości w wersji 1.5.0",
      details: "Poznaj zmiany"
    }
  },
  pt: {
    title: "Informações importantes", close: "Fechar notificações",
    survey: {
      title: "Ajude a definir o futuro do VFRNav",
      body: "Utiliza a versão standalone? Este breve inquérito ajudará a decidir se deve continuar a ser mantida ou se o desenvolvimento se deve concentrar em funções de servidor mais potentes, como streaming de PDF, para melhorar o desempenho e reduzir as limitações da API do MSFS.",
      action: "Responder ao inquérito"
    },
    version: {
      title: "Novidades da versão 1.5.0",
      details: "Descobrir as novidades"
    }
  },
  "pt-BR": {
    title: "Informações importantes", close: "Fechar notificações",
    survey: {
      title: "Ajude a definir o futuro do VFRNav",
      body: "Você usa a versão standalone? Esta pesquisa rápida ajudará a decidir se ela deve continuar sendo mantida ou se o desenvolvimento deve focar em recursos de servidor mais poderosos, como streaming de PDF, para melhorar o desempenho e reduzir as limitações da API do MSFS.",
      action: "Responder à pesquisa"
    },
    version: {
      title: "Novidades da versão 1.5.0",
      details: "Conheça as novidades"
    }
  },
  ru: {
    title: "Важные новости", close: "Закрыть уведомления",
    survey: {
      title: "Помогите определить будущее VFRNav",
      body: "Пользуетесь автономной версией? Короткий опрос поможет решить, продолжать ли её поддержку или сосредоточиться на более мощных функциях сервера, таких как потоковая передача PDF, для повышения производительности и уменьшения ограничений API MSFS.",
      action: "Пройти опрос"
    },
    version: {
      title: "Что нового в версии 1.5.0",
      details: "Посмотреть изменения"
    }
  },
  sv: {
    title: "Viktiga nyheter", close: "Stäng meddelanden",
    survey: {
      title: "Hjälp till att forma VFRNavs framtid",
      body: "Använder du den fristående versionen? Den här korta enkäten hjälper till att avgöra om den ska underhållas eller om utvecklingen bör fokusera på kraftfullare serverfunktioner, som PDF-strömning, för bättre prestanda och färre begränsningar från MSFS API.",
      action: "Svara på enkäten"
    },
    version: {
      title: "Nytt i version 1.5.0",
      details: "Upptäck ändringarna"
    }
  },
  tr: {
    title: "Önemli haberler", close: "Bildirimleri kapat",
    survey: {
      title: "VFRNav'ın geleceğini şekillendirin",
      body: "Bağımsız sürümü kullanıyor musunuz? Bu kısa anket, bakımına devam mı edileceğine yoksa daha iyi performans ve daha az MSFS API kısıtlaması için PDF akışı gibi güçlü sunucu özelliklerine mi odaklanılacağına karar vermeye yardımcı olacak.",
      action: "Ankete katılın"
    },
    version: {
      title: "1.5.0 sürümündeki yenilikler",
      details: "Değişiklikleri keşfedin"
    }
  },
  "zh-CN": {
    title: "重要消息", close: "关闭通知",
    survey: {
      title: "一起决定 VFRNav 的未来",
      body: "您使用独立版吗？这份简短问卷将帮助决定继续维护独立版，还是集中开发 PDF 流式传输等更强大的服务器功能，以提高性能并减少 MSFS API 的限制。",
      action: "填写问卷"
    },
    version: {
      title: "1.5.0 版本新功能",
      details: "了解更新内容"
    }
  }
} satisfies LocaleMap<NotificationText>;
