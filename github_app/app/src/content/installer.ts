import type { LocaleMap } from "./types";

type InstallerGuide = {
  title: string;
  features: readonly (readonly [string, string])[];
  connection: string;
};

export const installerGuide = {
  en: {
    title: "What the installer adds",
    features: [
      ["An EFB outside the simulator", "The included VFRNav server offers Open In App for a separate desktop EFB and Open In Browser for the web view. Prepare your flight outside the cockpit; browser/device access remains experimental."],
      ["Your own PDF documents", "In Charts, choose Local to add PDFs from your computer. From the standalone EFB, export documents to the simulator when its EFB is connected."],
      ["Navlogs and aircraft presets", "The standalone Navlog can Import and Export JSON files containing navlogs, compass-deviation curves and fuel-consumption presets. Upload sends the plans and selected data to the connected simulator EFB; it is not a button in the embedded app."],
      ["A movable 3D cockpit EFB", "The server's 3D tablet tab lets you scan aircraft, select them, then Apply and Confirm cockpit patches. The tablet can be positioned, rotated and scaled. Standard scans unpacked Community aircraft; Deep needs MSFS, Developer Mode and VFS projection. Follow restart requests."],
      ["Server startup controls", "In the server Settings, choose Windows login, MSFS startup or Never, enable Start server at launch if needed, and configure the listening port."]
    ],
    connection: "Installing the package is not enough for live transfers: keep the server running and the simulator EFB connected. The server is also required for synchronization when using Open In App."
  },
  fr: {
    title: "Ce que l'installateur apporte en plus",
    features: [
      ["Un EFB hors du simulateur", "Le serveur VFRNav fourni propose Open In App pour ouvrir un EFB dans une application de bureau et Open In Browser pour la version web. Préparez votre vol hors du cockpit ; l'accès par navigateur/appareil reste expérimental."],
      ["Vos propres documents PDF", "Dans Charts, choisissez Local pour ajouter les PDF de votre ordinateur. Depuis l'EFB autonome, exportez les documents vers le simulateur lorsque son EFB est connecté."],
      ["Journaux et profils avion", "Le Navlog autonome permet d'importer et d'exporter des fichiers JSON contenant journaux, courbes de déviation du compas et profils de consommation. Upload envoie les plans et les données sélectionnées à l'EFB connecté du simulateur ; ce bouton n'existe pas dans l'application intégrée."],
      ["Un EFB 3D mobile dans le cockpit", "L'onglet 3D tablet du serveur permet d'analyser les avions, de les sélectionner, puis d'appliquer les correctifs avec Apply et Confirm. Position, rotation et échelle sont réglables. Standard analyse les avions Community décompressés ; Deep exige MSFS, le mode développeur et la projection VFS. Respectez les demandes de redémarrage."],
      ["Le contrôle du démarrage du serveur", "Dans les Settings du serveur, choisissez Windows login, MSFS startup ou Never, activez Start server at launch si nécessaire et configurez le port d'écoute."]
    ],
    connection: "Installer le package ne suffit pas pour les transferts en direct : gardez le serveur actif et l'EFB du simulateur connecté. Le serveur est aussi nécessaire à la synchronisation avec Open In App."
  },
  de: {
    title: "Das bietet der Installer zusätzlich",
    features: [
      ["Ein EFB außerhalb des Simulators", "Der mitgelieferte VFRNav-Server bietet Open In App für ein separates Desktop-EFB und Open In Browser für die Webansicht. Bereiten Sie Flüge außerhalb des Cockpits vor; Browser-/Gerätezugriff bleibt experimentell."],
      ["Eigene PDF-Dokumente", "Wählen Sie unter Charts die Quelle Local, um PDFs vom Computer hinzuzufügen. Im eigenständigen EFB können Sie Dokumente an das verbundene Simulator-EFB übertragen."],
      ["Navlogs und Flugzeugprofile", "Das eigenständige Navlog importiert und exportiert JSON-Dateien mit Navlogs, Kompassabweichungskurven und Verbrauchsprofilen. Upload sendet Pläne und ausgewählte Daten an das verbundene Simulator-EFB; im integrierten EFB gibt es diese Schaltfläche nicht."],
      ["Ein bewegliches 3D-Cockpit-EFB", "Im Server-Tab 3D tablet scannen und wählen Sie Flugzeuge und bestätigen Patches mit Apply und Confirm. Position, Drehung und Größe sind einstellbar. Standard scannt entpackte Community-Flugzeuge; Deep benötigt MSFS, Developer Mode und VFS-Projektion. Neustartaufforderungen beachten."],
      ["Serverstart konfigurieren", "Wählen Sie in den Server-Settings Windows login, MSFS startup oder Never, aktivieren Sie bei Bedarf Start server at launch und stellen Sie den Port ein."]
    ],
    connection: "Für direkte Übertragungen genügt die Installation nicht: Der Server muss laufen und das Simulator-EFB verbunden sein. Auch Open In App benötigt den Server zur Synchronisierung."
  },
  es: {
    title: "Qué añade el instalador",
    features: [
      ["Un EFB fuera del simulador", "El servidor VFRNav incluido ofrece Open In App para un EFB de escritorio independiente y Open In Browser para la vista web. Prepara el vuelo fuera del cockpit; el acceso por navegador/dispositivo sigue siendo experimental."],
      ["Tus propios documentos PDF", "En Charts, elige Local para añadir PDF del ordenador. Desde el EFB independiente puedes exportarlos al simulador cuando su EFB esté conectado."],
      ["Navlogs y perfiles de avión", "El Navlog independiente importa y exporta archivos JSON con navlogs, curvas de desviación de brújula y perfiles de consumo. Upload envía los planes y datos seleccionados al EFB conectado del simulador; este botón no aparece en la aplicación integrada."],
      ["Un EFB 3D móvil en el cockpit", "La pestaña 3D tablet del servidor permite analizar y seleccionar aviones y aplicar parches con Apply y Confirm. Ajusta posición, rotación y escala. Standard analiza aviones Community descomprimidos; Deep requiere MSFS, Developer Mode y proyección VFS. Sigue las solicitudes de reinicio."],
      ["Control del inicio del servidor", "En Settings del servidor elige Windows login, MSFS startup o Never, activa Start server at launch si lo necesitas y configura el puerto."]
    ],
    connection: "Instalar el paquete no basta para las transferencias en directo: mantén el servidor activo y el EFB del simulador conectado. Open In App también necesita el servidor para sincronizarse."
  },
  it: {
    title: "Cosa aggiunge il programma di installazione",
    features: [
      ["Un EFB fuori dal simulatore", "Il server VFRNav incluso offre Open In App per un EFB desktop separato e Open In Browser per la versione web. Prepara il volo fuori dalla cabina; l'accesso via browser/dispositivo rimane sperimentale."],
      ["I tuoi documenti PDF", "In Charts scegli Local per aggiungere PDF dal computer. Dall'EFB autonomo puoi esportarli al simulatore quando il suo EFB è connesso."],
      ["Navlog e profili aereo", "Il Navlog autonomo importa ed esporta file JSON con navlog, curve di deviazione della bussola e profili di consumo. Upload invia piani e dati selezionati all'EFB connesso del simulatore; questo pulsante non compare nell'app integrata."],
      ["Un EFB 3D mobile nella cabina", "La scheda 3D tablet del server permette di analizzare e selezionare gli aerei e applicare le patch con Apply e Confirm. Regola posizione, rotazione e scala. Standard analizza aerei Community decompressi; Deep richiede MSFS, Developer Mode e proiezione VFS. Segui le richieste di riavvio."],
      ["Controllo dell'avvio del server", "Nelle Settings del server scegli Windows login, MSFS startup o Never, attiva Start server at launch se necessario e configura la porta."]
    ],
    connection: "Installare il pacchetto non basta per i trasferimenti in tempo reale: mantieni attivo il server e connesso l'EFB del simulatore. Anche Open In App richiede il server per la sincronizzazione."
  },
  ja: {
    title: "インストーラー版で追加される機能",
    features: [
      ["シミュレーター外のEFB", "付属のVFRNavサーバーからOpen In Appで別のデスクトップEFB、Open In Browserでウェブ版を開けます。コックピットの外で飛行を準備できますが、ブラウザーや外部端末からの利用は実験段階です。"],
      ["自分のPDF文書", "ChartsでLocalを選び、パソコンのPDFを追加します。独立版EFBから、接続中のシミュレーターEFBへ文書を転送できます。"],
      ["Navlogと機体プリセット", "独立版Navlogでは、Navlog、コンパス偏差曲線、燃料消費プリセットを含むJSONファイルをインポート・エクスポートできます。Uploadは計画と選択したデータを接続中のシミュレーターEFBへ送ります。統合版にはこのボタンはありません。"],
      ["移動できる3DコックピットEFB", "サーバーの3D tabletタブで機体をスキャンして選び、ApplyとConfirmでパッチを適用します。位置・回転・大きさを調整できます。Standardは展開済みCommunity機体が対象です。DeepにはMSFS、Developer Mode、VFS projectionが必要です。再起動の指示に従ってください。"],
      ["サーバーの起動設定", "サーバーのSettingsでWindows login、MSFS startup、Neverを選び、必要に応じてStart server at launchを有効にして待ち受けポートを設定します。"]
    ],
    connection: "リアルタイム転送にはインストールだけでは不十分です。サーバーを起動し、シミュレーターのEFBを接続してください。Open In Appの同期にもサーバーが必要です。"
  },
  nl: {
    title: "Wat het installatieprogramma toevoegt",
    features: [
      ["Een EFB buiten de simulator", "De meegeleverde VFRNav-server biedt Open In App voor een aparte desktop-EFB en Open In Browser voor de webversie. Bereid vluchten buiten de cockpit voor; toegang via browser/apparaat blijft experimenteel."],
      ["Je eigen PDF-documenten", "Kies Local in Charts om PDF's van je computer toe te voegen. Exporteer documenten vanuit de zelfstandige EFB naar de simulator wanneer diens EFB verbonden is."],
      ["Navlogs en vliegtuigprofielen", "De zelfstandige Navlog importeert en exporteert JSON-bestanden met navlogs, kompasafwijkingscurven en verbruiksprofielen. Upload stuurt plannen en geselecteerde gegevens naar de verbonden simulator-EFB; deze knop ontbreekt in de geïntegreerde app."],
      ["Een verplaatsbare 3D-cockpit-EFB", "Scan en selecteer vliegtuigen via het tabblad 3D tablet van de server en pas patches toe met Apply en Confirm. Positie, rotatie en schaal zijn instelbaar. Standard scant uitgepakte Community-vliegtuigen; Deep vereist MSFS, Developer Mode en VFS-projectie. Volg herstartverzoeken."],
      ["Serverstart instellen", "Kies Windows login, MSFS startup of Never in de server-Settings, schakel zo nodig Start server at launch in en stel de luisterpoort in."]
    ],
    connection: "Installatie alleen is niet voldoende voor directe overdracht: houd de server actief en de simulator-EFB verbonden. Ook Open In App vereist de server voor synchronisatie."
  },
  pl: {
    title: "Co dodaje instalator",
    features: [
      ["EFB poza symulatorem", "Dołączony serwer VFRNav oferuje Open In App dla osobnego EFB na pulpicie oraz Open In Browser dla wersji internetowej. Przygotuj lot poza kokpitem; dostęp przez przeglądarkę lub urządzenie pozostaje eksperymentalny."],
      ["Własne dokumenty PDF", "W Charts wybierz Local, aby dodać pliki PDF z komputera. Z samodzielnego EFB możesz przesłać dokumenty do symulatora, gdy jego EFB jest połączone."],
      ["Navlogi i profile samolotu", "Samodzielny Navlog importuje i eksportuje pliki JSON z navlogami, krzywymi dewiacji kompasu i profilami zużycia paliwa. Upload wysyła plany i wybrane dane do połączonego EFB symulatora; tego przycisku nie ma we wbudowanej aplikacji."],
      ["Ruchome EFB 3D w kokpicie", "Karta 3D tablet serwera pozwala skanować i wybierać samoloty oraz stosować poprawki przez Apply i Confirm. Można zmieniać pozycję, obrót i skalę. Standard skanuje rozpakowane samoloty Community; Deep wymaga MSFS, Developer Mode i projekcji VFS. Przestrzegaj poleceń ponownego uruchomienia."],
      ["Sterowanie uruchamianiem serwera", "W Settings serwera wybierz Windows login, MSFS startup lub Never, w razie potrzeby włącz Start server at launch i ustaw port nasłuchiwania."]
    ],
    connection: "Sama instalacja nie wystarczy do przesyłania na żywo: serwer musi działać, a EFB symulatora być połączone. Open In App także wymaga serwera do synchronizacji."
  },
  pt: {
    title: "O que o instalador acrescenta",
    features: [
      ["Um EFB fora do simulador", "O servidor VFRNav incluído oferece Open In App para um EFB de ambiente de trabalho separado e Open In Browser para a versão web. Prepare o voo fora do cockpit; o acesso por navegador/dispositivo continua experimental."],
      ["Os seus documentos PDF", "Em Charts, escolha Local para adicionar PDF do computador. A partir do EFB autónomo, exporte documentos para o simulador quando o respetivo EFB estiver ligado."],
      ["Navlogs e perfis de aeronave", "O Navlog autónomo importa e exporta ficheiros JSON com navlogs, curvas de desvio da bússola e perfis de consumo. Upload envia os planos e dados selecionados para o EFB ligado do simulador; este botão não existe na aplicação integrada."],
      ["Um EFB 3D móvel no cockpit", "O separador 3D tablet do servidor permite analisar e selecionar aeronaves e aplicar correções com Apply e Confirm. Ajuste posição, rotação e escala. Standard analisa aeronaves Community descomprimidas; Deep exige MSFS, Developer Mode e projeção VFS. Siga os pedidos de reinício."],
      ["Controlo do arranque do servidor", "Nas Settings do servidor, escolha Windows login, MSFS startup ou Never, ative Start server at launch se necessário e configure a porta."]
    ],
    connection: "Instalar o pacote não basta para transferências em direto: mantenha o servidor ativo e o EFB do simulador ligado. Open In App também necessita do servidor para sincronizar."
  },
  "pt-BR": {
    title: "O que o instalador acrescenta",
    features: [
      ["Um EFB fora do simulador", "O servidor VFRNav incluído oferece Open In App para um EFB de desktop separado e Open In Browser para a versão web. Prepare o voo fora do cockpit; o acesso por navegador/dispositivo continua experimental."],
      ["Seus próprios documentos PDF", "Em Charts, escolha Local para adicionar PDFs do computador. Pelo EFB independente, exporte documentos para o simulador quando o EFB dele estiver conectado."],
      ["Navlogs e perfis de aeronave", "O Navlog independente importa e exporta arquivos JSON com navlogs, curvas de desvio da bússola e perfis de consumo. Upload envia os planos e dados selecionados para o EFB conectado do simulador; esse botão não existe no aplicativo integrado."],
      ["Um EFB 3D móvel no cockpit", "A aba 3D tablet do servidor permite analisar e selecionar aeronaves e aplicar ajustes com Apply e Confirm. Ajuste posição, rotação e escala. Standard analisa aeronaves Community descompactadas; Deep exige MSFS, Developer Mode e projeção VFS. Siga os pedidos de reinicialização."],
      ["Controle da inicialização do servidor", "Nas Settings do servidor, escolha Windows login, MSFS startup ou Never, ative Start server at launch se necessário e configure a porta."]
    ],
    connection: "Instalar o pacote não basta para transferências em tempo real: mantenha o servidor ativo e o EFB do simulador conectado. Open In App também precisa do servidor para sincronizar."
  },
  ru: {
    title: "Что добавляет установщик",
    features: [
      ["EFB вне симулятора", "Включённый сервер VFRNav предлагает Open In App для отдельного настольного EFB и Open In Browser для веб-версии. Готовьте полёт вне кабины; доступ через браузер или устройство остаётся экспериментальным."],
      ["Собственные PDF-документы", "В Charts выберите Local для добавления PDF с компьютера. Из отдельного EFB можно передать документы в симулятор, если его EFB подключён."],
      ["Navlog и профили самолёта", "Отдельный Navlog импортирует и экспортирует JSON-файлы с журналами, кривыми девиации компаса и профилями расхода топлива. Upload отправляет планы и выбранные данные в подключённый EFB симулятора; во встроенном приложении этой кнопки нет."],
      ["Подвижный 3D EFB в кабине", "На вкладке 3D tablet сервера найдите и выберите самолёты, затем примените патчи через Apply и Confirm. Настраиваются положение, поворот и масштаб. Standard сканирует распакованные самолёты Community; Deep требует MSFS, Developer Mode и проекцию VFS. Выполняйте запросы перезапуска."],
      ["Управление запуском сервера", "В Settings сервера выберите Windows login, MSFS startup или Never, при необходимости включите Start server at launch и настройте порт."]
    ],
    connection: "Для передачи в реальном времени одной установки недостаточно: сервер должен работать, а EFB симулятора — быть подключён. Open In App также требует сервер для синхронизации."
  },
  sv: {
    title: "Det här tillför installationsprogrammet",
    features: [
      ["Ett EFB utanför simulatorn", "Den medföljande VFRNav-servern erbjuder Open In App för ett separat skrivbords-EFB och Open In Browser för webbversionen. Förbered flygningen utanför cockpit; åtkomst via webbläsare/enhet är fortfarande experimentell."],
      ["Egna PDF-dokument", "Välj Local i Charts för att lägga till PDF-filer från datorn. Exportera dokument från det fristående EFB till simulatorn när dess EFB är anslutet."],
      ["Navloggar och flygplansprofiler", "Det fristående Navlog importerar och exporterar JSON-filer med navloggar, kompassdeviationskurvor och förbrukningsprofiler. Upload skickar planer och valda data till simulatorns anslutna EFB; knappen finns inte i den integrerade appen."],
      ["Ett flyttbart 3D-EFB i cockpit", "Fliken 3D tablet i servern låter dig skanna och välja flygplan och tillämpa patchar med Apply och Confirm. Justera position, rotation och skala. Standard skannar uppackade Community-flygplan; Deep kräver MSFS, Developer Mode och VFS-projektion. Följ omstartsmeddelanden."],
      ["Styr serverstarten", "Välj Windows login, MSFS startup eller Never i serverns Settings, aktivera vid behov Start server at launch och ställ in lyssningsporten."]
    ],
    connection: "Installationen räcker inte för direktöverföring: håll servern igång och simulatorns EFB anslutet. Även Open In App behöver servern för synkronisering."
  },
  tr: {
    title: "Yükleyicinin ekledikleri",
    features: [
      ["Simülatör dışında EFB", "Dahil edilen VFRNav sunucusu, ayrı masaüstü EFB için Open In App ve web görünümü için Open In Browser sunar. Uçuşu kokpit dışında hazırlayın; tarayıcı/cihaz erişimi deneyseldir."],
      ["Kendi PDF belgeleriniz", "Bilgisayardan PDF eklemek için Charts içinde Local seçin. Simülatörün EFB'si bağlıyken bağımsız EFB'den belgeleri simülatöre aktarabilirsiniz."],
      ["Navlog ve uçak profilleri", "Bağımsız Navlog; navlog, pusula sapma eğrileri ve yakıt tüketim profilleri içeren JSON dosyalarını içe ve dışa aktarır. Upload, planları ve seçilen verileri bağlı simülatör EFB'sine gönderir; bu düğme gömülü uygulamada yoktur."],
      ["Kokpitte taşınabilir 3D EFB", "Sunucunun 3D tablet sekmesinde uçakları tarayıp seçin, Apply ve Confirm ile yamaları uygulayın. Konum, dönüş ve ölçek ayarlanabilir. Standard, açılmış Community uçaklarını tarar; Deep için MSFS, Developer Mode ve VFS projeksiyonu gerekir. Yeniden başlatma isteklerini izleyin."],
      ["Sunucu başlangıcını yönetin", "Sunucu Settings içinde Windows login, MSFS startup veya Never seçin, gerekirse Start server at launch seçeneğini etkinleştirin ve dinleme portunu ayarlayın."]
    ],
    connection: "Canlı aktarım için yalnızca yüklemek yeterli değildir: sunucuyu çalışır, simülatör EFB'sini bağlı tutun. Open In App eşitlemesi için de sunucu gerekir."
  },
  "zh-CN": {
    title: "安装程序版增加的功能",
    features: [
      ["模拟器之外的 EFB", "随附的 VFRNav 服务器提供 Open In App，用于打开独立桌面 EFB，以及 Open In Browser，用于打开网页版。可在驾驶舱外准备飞行；浏览器和外部设备访问仍属实验功能。"],
      ["自己的 PDF 文档", "在 Charts 中选择 Local，添加电脑上的 PDF。模拟器的 EFB 已连接时，可从独立 EFB 将文档导出至模拟器。"],
      ["Navlog 和飞机预设", "独立 Navlog 可导入和导出包含航行日志、罗盘偏差曲线和油耗预设的 JSON 文件。Upload 将计划和所选数据发送至已连接的模拟器 EFB；内嵌应用没有此按钮。"],
      ["可移动的 3D 驾驶舱 EFB", "在服务器的 3D tablet 标签页扫描并选择飞机，再通过 Apply 和 Confirm 应用补丁。可调整位置、旋转和缩放。Standard 扫描已解压的 Community 飞机；Deep 需要运行 MSFS 并启用 Developer Mode 和 VFS projection。请按提示重启。"],
      ["服务器启动控制", "在服务器 Settings 中选择 Windows login、MSFS startup 或 Never，按需启用 Start server at launch，并设置监听端口。"]
    ],
    connection: "实时传输不仅需要安装软件：还需保持服务器运行并连接模拟器 EFB。Open In App 的同步同样需要服务器。"
  }
} satisfies LocaleMap<InstallerGuide>;
