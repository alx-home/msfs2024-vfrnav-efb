import type { LocaleMap } from "./types";

type EfbModes = {
  title: string;
  summary: string;
  twoD: readonly [string, string];
  panelSteps: readonly (readonly [title: string, body: string, shortcut?: string])[];
  threeD: readonly [string, string];
  setup: string;
  controls: string;
};

export const efbModes: LocaleMap<EfbModes> = {
  en: {
    title: "Two EFB improvement modes",
    summary: "Two EFB modes: resize the 2D panel in VR, or add a placeable 3D cockpit tablet to your aircraft and adjust its position, rotation and scale.",
    twoD: ["2D EFB improvement", "Keep the simulator's panel EFB and resize its visible area, including in VR. This changes the visible panel area, not a physical cockpit tablet."],
    panelSteps: [
      ["Enable the adjustments", "In VFRNav Settings > EFB > Panel, enable the tweaks and adjust Width, Height and offsets."],
      ["Move the panel", "Hold this key and drag with the left mouse button to position the panel.", "Ctrl"],
      ["Resize the panel", "Hold these keys and drag with the left mouse button to adjust its size.", "Ctrl+Shift"],
      ["Restore the default size", "Hold these keys and right-click to restore the panel's default size.", "Ctrl+Shift"]
    ],
    threeD: ["3D EFB improvement (new)", "Add a 3D EFB to aircraft and place it where you want in the cockpit. Use the tablet's editing handles to adjust position, rotation and scale. This is a movable cockpit object, not the 2D panel-resizing workaround."],
    setup: "In the VFRNav server, open Cockpit EFB aircraft patches, Scan aircraft, select the aircraft, then Apply and Confirm. Standard scans unpacked Community aircraft without MSFS running. Deep (VFS projection) needs MSFS running with Developer Mode and VFS projection enabled. Generated Community overlays replace existing tablets without editing source aircraft files on disk. Follow restart requests; after aircraft updates, rescan and Apply outdated patches.",
    controls: "Ctrl+T shows/hides the 3D tablet by default. In the integrated VFRNav Settings > EFB, Tablet shortcut captures a different global combination; Tablet joystick button captures a button during a flight. These visibility bindings apply across aircraft and do not resize the 2D panel."
  },
  fr: {
    title: "Deux modes d'amélioration de l'EFB",
    summary: "Deux modes EFB : redimensionnez le panneau 2D en VR, ou ajoutez une tablette 3D dans votre avion et réglez librement sa position, sa rotation et son échelle.",
    twoD: ["Amélioration de l'EFB 2D", "Conservez l'EFB en panneau du simulateur et redimensionnez sa zone visible, y compris en VR. Cela modifie la zone visible du panneau, pas une tablette physique dans le cockpit."],
    panelSteps: [
      ["Activez les ajustements", "Dans VFRNav Settings > EFB > Panel, activez les ajustements puis réglez Width, Height et les décalages."],
      ["Déplacez le panneau", "Maintenez cette touche et faites glisser avec le bouton gauche de la souris pour positionner le panneau.", "Ctrl"],
      ["Réglez sa taille", "Maintenez ces touches et faites glisser avec le bouton gauche pour redimensionner le panneau.", "Ctrl+Maj"],
      ["Retrouvez la taille par défaut", "Maintenez ces touches et faites un clic droit pour restaurer la taille d'origine du panneau.", "Ctrl+Maj"]
    ],
    threeD: ["Amélioration de l'EFB 3D (nouveau)", "Ajoutez un EFB 3D aux avions et placez-le où vous voulez dans le cockpit. Les poignées d'édition de la tablette permettent d'ajuster position, rotation et échelle. Il s'agit d'un objet mobile dans le cockpit, distinct du redimensionnement du panneau 2D."],
    setup: "Dans le serveur VFRNav, ouvrez Cockpit EFB aircraft patches, lancez Scan aircraft, sélectionnez les avions puis Apply et Confirm. Standard recherche les avions Community décompressés sans nécessiter MSFS. Deep (VFS projection) exige MSFS lancé, le mode développeur et la projection VFS activés. Les surcouches Community générées remplacent les tablettes existantes sans modifier les fichiers sources des avions sur disque. Respectez les demandes de redémarrage ; après une mise à jour d'avion, relancez l'analyse et Apply pour les correctifs obsolètes.",
    controls: "Ctrl+T affiche/masque la tablette 3D par défaut. Dans les Settings > EFB de VFRNav intégré, Tablet shortcut capture une autre combinaison globale ; Tablet joystick button capture un bouton pendant un vol. Ces commandes de visibilité s'appliquent aux avions et ne redimensionnent pas le panneau 2D."
  },
  de: {
    title: "Zwei EFB-Erweiterungsmodi",
    summary: "Zwei EFB-Modi: das 2D-Panel in VR skalieren oder ein frei platzierbares 3D-Cockpit-Tablet hinzufügen und Position, Drehung und Größe anpassen.",
    twoD: ["2D-EFB-Erweiterung", "Das Panel-EFB des Simulators bleibt erhalten; sein sichtbarer Bereich lässt sich auch in VR ändern. Dies verändert den sichtbaren Panelbereich, nicht ein physisches Cockpit-Tablet."],
    panelSteps: [
      ["Anpassungen aktivieren", "Aktivieren Sie unter VFRNav Settings > EFB > Panel die Anpassungen und stellen Sie Width, Height und Offsets ein."],
      ["Panel verschieben", "Halten Sie diese Taste und ziehen Sie mit der linken Maustaste, um das Panel zu verschieben.", "Ctrl"],
      ["Größe anpassen", "Halten Sie diese Tasten und ziehen Sie mit der linken Maustaste, um die Größe zu ändern.", "Ctrl+Shift"],
      ["Standardgröße wiederherstellen", "Halten Sie diese Tasten und klicken Sie mit rechts, um die Standardgröße wiederherzustellen.", "Ctrl+Shift"]
    ],
    threeD: ["3D-EFB-Erweiterung (neu)", "Fügen Sie Flugzeugen ein 3D-EFB hinzu und platzieren Sie es frei im Cockpit. Mit den Bearbeitungsgriffen ändern Sie Position, Drehung und Skalierung. Dies ist ein bewegliches Cockpit-Objekt, keine Größenänderung des 2D-Panels."],
    setup: "Öffnen Sie im VFRNav-Server Cockpit EFB aircraft patches, dann Scan aircraft, Flugzeuge auswählen, Apply und Confirm. Standard durchsucht entpackte Community-Flugzeuge ohne laufendes MSFS. Deep (VFS projection) benötigt laufendes MSFS mit Developer Mode und VFS-Projektion. Community-Overlays ersetzen vorhandene Tablets, ohne Quelldateien der Flugzeuge auf der Festplatte zu bearbeiten. Neustartaufforderungen beachten; nach Flugzeugupdates erneut scannen und veraltete Patches mit Apply aktualisieren.",
    controls: "Ctrl+T blendet das 3D-Tablet standardmäßig ein/aus. Unter Settings > EFB im integrierten VFRNav erfasst Tablet shortcut eine andere globale Kombination; Tablet joystick button erfasst im Flug eine Taste. Die Sichtbarkeitsbindungen gelten flugzeugübergreifend und ändern nicht die Größe des 2D-Panels."
  },
  es: {
    title: "Dos modos de mejora del EFB",
    summary: "Dos modos EFB: redimensiona el panel 2D en VR o añade una tableta 3D al avión y ajusta libremente su posición, rotación y escala.",
    twoD: ["Mejora del EFB 2D", "Conserva el EFB de panel del simulador y cambia su área visible, incluso en VR. No modifica una tableta física del cockpit."],
    panelSteps: [
      ["Activa los ajustes", "Activa los ajustes en VFRNav Settings > EFB > Panel y modifica Width, Height y desplazamientos."],
      ["Mueve el panel", "Mantén esta tecla y arrastra con el botón izquierdo para colocar el panel.", "Ctrl"],
      ["Ajusta el tamaño", "Mantén estas teclas y arrastra con el botón izquierdo para cambiar el tamaño.", "Ctrl+Shift"],
      ["Restaura el tamaño", "Mantén estas teclas y haz clic derecho para restaurar el tamaño predeterminado.", "Ctrl+Shift"]
    ],
    threeD: ["Mejora del EFB 3D (nuevo)", "Añade un EFB 3D a los aviones y colócalo donde quieras en el cockpit. Los tiradores de edición ajustan posición, rotación y escala. Es un objeto móvil, no el ajuste del panel 2D."],
    setup: "En el servidor VFRNav abre Cockpit EFB aircraft patches, pulsa Scan aircraft, selecciona aviones y usa Apply y Confirm. Standard busca aviones Community descomprimidos sin ejecutar MSFS. Deep (VFS projection) requiere MSFS abierto, Developer Mode y proyección VFS. Las superposiciones Community reemplazan tabletas existentes sin editar los archivos originales del avión en disco. Sigue las solicitudes de reinicio; tras actualizar un avión, vuelve a analizar y aplica Apply a los parches obsoletos.",
    controls: "Ctrl+T muestra/oculta la tableta 3D por defecto. En Settings > EFB del VFRNav integrado, Tablet shortcut captura otra combinación global y Tablet joystick button captura un botón durante un vuelo. Estos atajos de visibilidad se aplican a los aviones y no redimensionan el panel 2D."
  },
  it: {
    title: "Due modalità di miglioramento EFB",
    summary: "Due modalità EFB: ridimensiona il pannello 2D in VR oppure aggiungi un tablet 3D nell'aereo e regolane posizione, rotazione e scala.",
    twoD: ["Miglioramento EFB 2D", "Mantieni l'EFB a pannello del simulatore e ridimensionane l'area visibile, anche in VR. Non modifica un tablet fisico nella cabina."],
    panelSteps: [
      ["Attiva le modifiche", "Attiva le modifiche in VFRNav Settings > EFB > Panel e regola Width, Height e offset."],
      ["Sposta il pannello", "Tieni premuto questo tasto e trascina con il pulsante sinistro per posizionare il pannello.", "Ctrl"],
      ["Regola la dimensione", "Tieni premuti questi tasti e trascina con il pulsante sinistro per ridimensionare il pannello.", "Ctrl+Shift"],
      ["Ripristina la dimensione", "Tieni premuti questi tasti e fai clic destro per ripristinare la dimensione predefinita.", "Ctrl+Shift"]
    ],
    threeD: ["Miglioramento EFB 3D (nuovo)", "Aggiungi un EFB 3D agli aerei e posizionalo dove vuoi nella cabina. Usa le maniglie di modifica per posizione, rotazione e scala. È un oggetto mobile nella cabina, distinto dal pannello 2D."],
    setup: "Nel server VFRNav apri Cockpit EFB aircraft patches, scegli Scan aircraft, seleziona gli aerei, poi Apply e Confirm. Standard cerca aerei Community decompressi senza MSFS in esecuzione. Deep (VFS projection) richiede MSFS aperto, Developer Mode e proiezione VFS attivi. Gli overlay Community generati sostituiscono i tablet esistenti senza modificare i file sorgente degli aerei sul disco. Segui le richieste di riavvio; dopo aggiornamenti degli aerei, ripeti la scansione e Apply per le patch obsolete.",
    controls: "Ctrl+T mostra/nasconde il tablet 3D per impostazione predefinita. In Settings > EFB di VFRNav integrato, Tablet shortcut acquisisce una combinazione globale diversa; Tablet joystick button acquisisce un pulsante durante il volo. Questi comandi valgono per gli aerei e non ridimensionano il pannello 2D."
  },
  ja: {
    title: "2種類のEFB拡張モード",
    summary: "EFBには2つのモードがあります。VRでもサイズ変更できる2Dパネルと、機内で位置・回転・大きさを調整できる3Dタブレットです。",
    twoD: ["2D EFB拡張", "シミュレーターのパネル型EFBを使い、VRでも表示領域を変更できます。機内の物理的なタブレットではなく、パネルの表示領域を変更する機能です。"],
    panelSteps: [
      ["拡張を有効にする", "VFRNav Settings > EFB > Panelで拡張を有効にし、Width、Height、オフセットを調整します。"],
      ["パネルを移動", "このキーを押しながらマウスの左ボタンでドラッグし、パネルを移動します。", "Ctrl"],
      ["サイズを変更", "これらのキーを押しながら左ドラッグして、パネルのサイズを調整します。", "Ctrl+Shift"],
      ["初期サイズに戻す", "これらのキーを押しながら右クリックすると、初期サイズに戻ります。", "Ctrl+Shift"]
    ],
    threeD: ["3D EFB拡張（新機能）", "航空機に3D EFBを追加し、コックピットの好きな場所に配置できます。編集ハンドルで位置・回転・大きさを調整します。2Dパネルのサイズ変更とは異なる、移動可能な機内オブジェクトです。"],
    setup: "VFRNavサーバーでCockpit EFB aircraft patchesを開き、Scan aircraft、航空機の選択、Apply、Confirmの順に操作します。StandardはMSFSを起動せずに展開済みCommunity機体を検索します。Deep (VFS projection)にはMSFSの起動とDeveloper Mode、VFS projectionの有効化が必要です。生成したCommunityオーバーレイで既存タブレットを置き換え、ディスク上の機体ソースファイルは編集しません。再起動の指示に従い、機体更新後は再スキャンして古いパッチにApplyを実行してください。",
    controls: "3Dタブレットの表示切り替えは既定でCtrl+Tです。統合版VFRNavのSettings > EFBでTablet shortcutから共通ショートカットを変更し、Tablet joystick buttonから飛行中にボタンを登録できます。表示切り替え設定は機体共通で、2Dパネルのサイズ変更とは別です。"
  },
  nl: {
    title: "Twee EFB-uitbreidingsmodi",
    summary: "Twee EFB-modi: pas het 2D-paneel aan in VR of voeg een plaatsbare 3D-tablet toe aan je vliegtuig en wijzig positie, rotatie en schaal.",
    twoD: ["2D-EFB-uitbreiding", "Behoud het EFB-paneel van de simulator en wijzig het zichtbare gebied, ook in VR. Dit wijzigt het paneel, niet een fysieke cockpittablet."],
    panelSteps: [
      ["Activeer de aanpassingen", "Activeer de aanpassingen via VFRNav Settings > EFB > Panel en stel Width, Height en offsets in."],
      ["Verplaats het paneel", "Houd deze toets ingedrukt en sleep met de linkermuisknop om het paneel te verplaatsen.", "Ctrl"],
      ["Pas de grootte aan", "Houd deze toetsen ingedrukt en sleep met de linkermuisknop om de grootte te wijzigen.", "Ctrl+Shift"],
      ["Herstel de standaardgrootte", "Houd deze toetsen ingedrukt en klik met rechts om de standaardgrootte te herstellen.", "Ctrl+Shift"]
    ],
    threeD: ["3D-EFB-uitbreiding (nieuw)", "Voeg een 3D-EFB toe aan vliegtuigen en plaats het waar je wilt in de cockpit. De bewerkingsgrepen wijzigen positie, rotatie en schaal. Dit is een beweegbaar cockpitobject, niet het 2D-paneel."],
    setup: "Open Cockpit EFB aircraft patches in de VFRNav-server, kies Scan aircraft, selecteer vliegtuigen en daarna Apply en Confirm. Standard scant uitgepakte Community-vliegtuigen zonder draaiende MSFS. Deep (VFS projection) vereist draaiende MSFS met Developer Mode en VFS-projectie. Community-overlays vervangen bestaande tablets zonder bronbestanden van vliegtuigen op schijf te wijzigen. Volg herstartverzoeken; scan na vliegtuigupdates opnieuw en werk verouderde patches bij met Apply.",
    controls: "Ctrl+T toont/verbergt standaard de 3D-tablet. Via Settings > EFB in geïntegreerd VFRNav legt Tablet shortcut een andere algemene combinatie vast; Tablet joystick button legt tijdens een vlucht een knop vast. De zichtbaarheidsbindingen gelden voor alle vliegtuigen en wijzigen het 2D-paneel niet."
  },
  pl: {
    title: "Dwa tryby ulepszeń EFB",
    summary: "Dwa tryby EFB: zmieniaj rozmiar panelu 2D w VR albo dodaj tablet 3D do samolotu i dostosuj jego pozycję, obrót oraz skalę.",
    twoD: ["Ulepszenie EFB 2D", "Zachowaj panel EFB symulatora i zmieniaj jego widoczny obszar, także w VR. Nie zmienia to fizycznego tabletu w kokpicie."],
    panelSteps: [
      ["Włącz ulepszenia", "W VFRNav Settings > EFB > Panel włącz ulepszenia i ustaw Width, Height oraz przesunięcia."],
      ["Przesuń panel", "Przytrzymaj ten klawisz i przeciągnij lewym przyciskiem myszy, aby ustawić panel.", "Ctrl"],
      ["Zmień rozmiar", "Przytrzymaj te klawisze i przeciągnij lewym przyciskiem myszy, aby zmienić rozmiar.", "Ctrl+Shift"],
      ["Przywróć domyślny rozmiar", "Przytrzymaj te klawisze i kliknij prawym przyciskiem, aby przywrócić domyślny rozmiar.", "Ctrl+Shift"]
    ],
    threeD: ["Ulepszenie EFB 3D (nowość)", "Dodaj EFB 3D do samolotów i umieść je w wybranym miejscu kokpitu. Uchwyty edycji zmieniają pozycję, obrót i skalę. To ruchomy obiekt w kokpicie, a nie zmiana panelu 2D."],
    setup: "W serwerze VFRNav otwórz Cockpit EFB aircraft patches, wybierz Scan aircraft, zaznacz samoloty, potem Apply i Confirm. Standard skanuje rozpakowane samoloty Community bez uruchomionego MSFS. Deep (VFS projection) wymaga działającego MSFS, Developer Mode i projekcji VFS. Nakładki Community zastępują istniejące tablety bez edycji plików źródłowych samolotów na dysku. Wykonaj wymagany restart; po aktualizacjach samolotów ponów skan i Apply dla nieaktualnych poprawek.",
    controls: "Ctrl+T domyślnie pokazuje/ukrywa tablet 3D. W Settings > EFB zintegrowanego VFRNav Tablet shortcut rejestruje inny skrót globalny, a Tablet joystick button przycisk podczas lotu. Powiązania widoczności dotyczą wszystkich samolotów i nie zmieniają rozmiaru panelu 2D."
  },
  pt: {
    title: "Dois modos de melhoria do EFB",
    summary: "Dois modos EFB: redimensione o painel 2D em VR ou adicione um tablet 3D ao avião e ajuste livremente posição, rotação e escala.",
    twoD: ["Melhoria do EFB 2D", "Mantenha o EFB em painel do simulador e redimensione a área visível, incluindo em VR. Isto altera o painel, não um tablet físico no cockpit."],
    panelSteps: [
      ["Ative os ajustes", "Ative os ajustes em VFRNav Settings > EFB > Panel e configure Width, Height e deslocamentos."],
      ["Mova o painel", "Mantenha esta tecla premida e arraste com o botão esquerdo para posicionar o painel.", "Ctrl"],
      ["Ajuste o tamanho", "Mantenha estas teclas premidas e arraste com o botão esquerdo para redimensionar.", "Ctrl+Shift"],
      ["Reponha o tamanho", "Mantenha estas teclas premidas e clique com o botão direito para repor o tamanho original.", "Ctrl+Shift"]
    ],
    threeD: ["Melhoria do EFB 3D (novo)", "Adicione um EFB 3D aos aviões e coloque-o onde quiser no cockpit. As pegas de edição ajustam posição, rotação e escala. É um objeto móvel no cockpit, distinto do painel 2D."],
    setup: "No servidor VFRNav abra Cockpit EFB aircraft patches, escolha Scan aircraft, selecione os aviões e use Apply e Confirm. Standard procura aviões Community descomprimidos sem MSFS em execução. Deep (VFS projection) exige MSFS aberto com Developer Mode e projeção VFS ativos. As sobreposições Community substituem tablets existentes sem editar os ficheiros originais dos aviões no disco. Siga os pedidos de reinício; após atualizar aviões, repita a análise e Apply nas correções desatualizadas.",
    controls: "Ctrl+T mostra/oculta o tablet 3D por predefinição. Em Settings > EFB do VFRNav integrado, Tablet shortcut captura outra combinação global; Tablet joystick button captura um botão durante um voo. Estas associações de visibilidade aplicam-se aos aviões e não redimensionam o painel 2D."
  },
  "pt-BR": {
    title: "Dois modos de melhoria do EFB",
    summary: "Dois modos EFB: redimensione o painel 2D em VR ou adicione um tablet 3D à aeronave e ajuste livremente posição, rotação e escala.",
    twoD: ["Melhoria do EFB 2D", "Mantenha o EFB em painel do simulador e redimensione a área visível, inclusive em VR. Isso altera o painel, não um tablet físico no cockpit."],
    panelSteps: [
      ["Ative os ajustes", "Ative os ajustes em VFRNav Settings > EFB > Panel e configure Width, Height e deslocamentos."],
      ["Mova o painel", "Segure esta tecla e arraste com o botão esquerdo para posicionar o painel.", "Ctrl"],
      ["Ajuste o tamanho", "Segure estas teclas e arraste com o botão esquerdo para redimensionar.", "Ctrl+Shift"],
      ["Restaure o tamanho", "Segure estas teclas e clique com o botão direito para restaurar o tamanho padrão.", "Ctrl+Shift"]
    ],
    threeD: ["Melhoria do EFB 3D (novo)", "Adicione um EFB 3D às aeronaves e posicione-o onde quiser no cockpit. As alças de edição ajustam posição, rotação e escala. É um objeto móvel no cockpit, diferente do painel 2D."],
    setup: "No servidor VFRNav abra Cockpit EFB aircraft patches, escolha Scan aircraft, selecione as aeronaves e use Apply e Confirm. Standard procura aeronaves Community descompactadas sem MSFS em execução. Deep (VFS projection) exige MSFS aberto com Developer Mode e projeção VFS ativos. As sobreposições Community substituem tablets existentes sem editar os arquivos originais das aeronaves no disco. Siga os pedidos de reinicialização; após atualizar aeronaves, repita a análise e Apply nos patches desatualizados.",
    controls: "Ctrl+T mostra/oculta o tablet 3D por padrão. Em Settings > EFB do VFRNav integrado, Tablet shortcut captura outra combinação global; Tablet joystick button captura um botão durante um voo. Esses atalhos de visibilidade se aplicam às aeronaves e não redimensionam o painel 2D."
  },
  ru: {
    title: "Два режима улучшения EFB",
    summary: "Два режима EFB: меняйте размер 2D-панели в VR или добавьте в самолёт 3D-планшет и настройте его положение, поворот и масштаб.",
    twoD: ["Улучшение 2D EFB", "Сохраняется панель EFB симулятора с изменяемой видимой областью, в том числе в VR. Это не физический планшет в кабине."],
    panelSteps: [
      ["Включите улучшения", "Включите улучшения в VFRNav Settings > EFB > Panel и настройте Width, Height и смещения."],
      ["Переместите панель", "Удерживайте эту клавишу и перетащите левой кнопкой мыши, чтобы переместить панель.", "Ctrl"],
      ["Измените размер", "Удерживайте эти клавиши и перетащите левой кнопкой мыши, чтобы изменить размер.", "Ctrl+Shift"],
      ["Восстановите размер", "Удерживайте эти клавиши и щёлкните правой кнопкой, чтобы восстановить размер по умолчанию.", "Ctrl+Shift"]
    ],
    threeD: ["Улучшение 3D EFB (новое)", "Добавьте 3D EFB в самолёты и разместите его в нужном месте кабины. Маркеры редактирования меняют положение, поворот и масштаб. Это подвижный объект кабины, а не изменение размера 2D-панели."],
    setup: "В сервере VFRNav откройте Cockpit EFB aircraft patches, нажмите Scan aircraft, выберите самолёты, затем Apply и Confirm. Standard сканирует распакованные Community-самолёты без запущенного MSFS. Deep (VFS projection) требует работающего MSFS с Developer Mode и проекцией VFS. Накладки Community заменяют существующие планшеты без редактирования исходных файлов самолёта на диске. Выполняйте запросы перезапуска; после обновления самолётов повторите сканирование и Apply для устаревших патчей.",
    controls: "Ctrl+T по умолчанию показывает/скрывает 3D-планшет. В Settings > EFB встроенного VFRNav пункт Tablet shortcut задаёт другую общую комбинацию, а Tablet joystick button позволяет назначить кнопку во время полёта. Назначения видимости действуют для всех самолётов и не меняют размер 2D-панели."
  },
  sv: {
    title: "Två lägen för EFB-förbättringar",
    summary: "Två EFB-lägen: ändra 2D-panelens storlek i VR eller lägg till en placerbar 3D-surfplatta och justera position, rotation och skala.",
    twoD: ["2D-EFB-förbättring", "Behåll simulatorns panel-EFB och ändra dess synliga område, även i VR. Det ändrar panelområdet, inte en fysisk surfplatta i cockpit."],
    panelSteps: [
      ["Aktivera justeringarna", "Aktivera justeringarna i VFRNav Settings > EFB > Panel och ställ in Width, Height och förskjutning."],
      ["Flytta panelen", "Håll denna tangent och dra med vänster musknapp för att placera panelen.", "Ctrl"],
      ["Ändra storleken", "Håll dessa tangenter och dra med vänster musknapp för att ändra storleken.", "Ctrl+Shift"],
      ["Återställ storleken", "Håll dessa tangenter och högerklicka för att återställa standardstorleken.", "Ctrl+Shift"]
    ],
    threeD: ["3D-EFB-förbättring (ny)", "Lägg till ett 3D-EFB i flygplan och placera det var du vill i cockpit. Redigeringshandtagen ändrar position, rotation och skala. Detta är ett flyttbart cockpitobjekt, inte 2D-panelens storleksändring."],
    setup: "Öppna Cockpit EFB aircraft patches i VFRNav-servern, välj Scan aircraft, markera flygplan och sedan Apply och Confirm. Standard söker uppackade Community-flygplan utan att MSFS körs. Deep (VFS projection) kräver MSFS med Developer Mode och VFS-projektion aktiverade. Community-överlägg ersätter befintliga surfplattor utan att ändra flygplanens källfiler på disken. Följ begäran om omstart; skanna om efter flygplansuppdateringar och använd Apply för gamla patchar.",
    controls: "Ctrl+T visar/döljer 3D-surfplattan som standard. I integrerade VFRNav Settings > EFB kan Tablet shortcut fånga en annan global kombination och Tablet joystick button en knapp under flygning. Dessa synlighetsbindningar gäller alla flygplan och ändrar inte 2D-panelens storlek."
  },
  tr: {
    title: "İki EFB iyileştirme modu",
    summary: "İki EFB modu: VR'da 2D paneli yeniden boyutlandırın veya uçağa yerleştirilebilir bir 3D tablet ekleyip konum, dönüş ve ölçeğini ayarlayın.",
    twoD: ["2D EFB iyileştirmesi", "Simülatörün panel EFB'sini koruyup VR dahil görünür alanını yeniden boyutlandırın. Bu, fiziksel kokpit tabletini değil panel alanını değiştirir."],
    panelSteps: [
      ["İyileştirmeleri açın", "VFRNav Settings > EFB > Panel içinde iyileştirmeleri açıp Width, Height ve ofsetleri ayarlayın."],
      ["Paneli taşıyın", "Bu tuşu basılı tutup sol fare düğmesiyle sürükleyerek paneli taşıyın.", "Ctrl"],
      ["Boyutu ayarlayın", "Bu tuşları basılı tutup sol fare düğmesiyle sürükleyerek boyutu değiştirin.", "Ctrl+Shift"],
      ["Varsayılan boyuta dönün", "Bu tuşları basılı tutup sağ tıklayarak varsayılan boyutu geri yükleyin.", "Ctrl+Shift"]
    ],
    threeD: ["3D EFB iyileştirmesi (yeni)", "Uçaklara 3D EFB ekleyip kokpitte istediğiniz yere yerleştirin. Düzenleme tutamaçlarıyla konum, dönüş ve ölçeği ayarlayın. Bu, 2D panel boyutlandırmasından farklı, hareketli bir kokpit nesnesidir."],
    setup: "VFRNav sunucusunda Cockpit EFB aircraft patches bölümünü açıp Scan aircraft, uçak seçimi, Apply ve Confirm adımlarını izleyin. Standard, MSFS çalışmadan açılmış Community uçaklarını tarar. Deep (VFS projection), MSFS'in çalışmasını ve Developer Mode ile VFS yansıtmanın açık olmasını gerektirir. Community katmanları diskteki kaynak uçak dosyalarını düzenlemeden mevcut tabletleri değiştirir. Yeniden başlatma isteklerine uyun; uçak güncellemelerinden sonra tekrar tarayıp eski yamalara Apply uygulayın.",
    controls: "Ctrl+T varsayılan olarak 3D tableti gösterir/gizler. Tümleşik VFRNav Settings > EFB içinde Tablet shortcut başka bir genel kombinasyon, Tablet joystick button uçuş sırasında bir düğme kaydeder. Görünürlük atamaları uçaklar genelinde geçerlidir ve 2D paneli boyutlandırmaz."
  },
  "zh-CN": {
    title: "两种 EFB 增强模式",
    summary: "两种 EFB 模式：在 VR 中调整 2D 面板大小，或向飞机添加可自由摆放的 3D 平板，并调整位置、旋转和缩放。",
    twoD: ["2D EFB 增强", "保留模拟器的面板式 EFB，并调整可见区域，VR 中也可使用。这改变的是面板可见区域，而不是驾驶舱中的实体平板。"],
    panelSteps: [
      ["启用调整", "在 VFRNav Settings > EFB > Panel 启用增强并调整 Width、Height 和偏移。"],
      ["移动面板", "按住此键并用鼠标左键拖动，调整面板的位置。", "Ctrl"],
      ["调整大小", "按住这些键并用鼠标左键拖动，调整面板大小。", "Ctrl+Shift"],
      ["恢复默认大小", "按住这些键并单击鼠标右键，恢复面板的默认大小。", "Ctrl+Shift"]
    ],
    threeD: ["3D EFB 增强（新功能）", "向飞机添加 3D EFB，并放在驾驶舱中您想要的位置。通过编辑手柄调整位置、旋转和缩放。这是可移动的驾驶舱物体，与 2D 面板大小调整不同。"],
    setup: "在 VFRNav 服务器打开 Cockpit EFB aircraft patches，选择 Scan aircraft、勾选飞机，然后 Apply 和 Confirm。Standard 无需运行 MSFS 即可扫描已解压的 Community 飞机。Deep (VFS projection) 要求 MSFS 正在运行，并启用 Developer Mode 和 VFS 投影。生成的 Community 覆盖包会替换现有平板，但不会编辑磁盘上的飞机源文件。请按提示重启；飞机更新后重新扫描，并对过期补丁执行 Apply。",
    controls: "默认按 Ctrl+T 显示或隐藏 3D 平板。在集成版 VFRNav 的 Settings > EFB 中，Tablet shortcut 可设置其他全局快捷键，Tablet joystick button 可在飞行中绑定摇杆按钮。这些显示切换绑定对各飞机通用，不会调整 2D 面板大小。"
  }
};
