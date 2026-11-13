import type { LocaleMap } from "./types";

type EditingGuide = {
  title: string; setup: string; controls: string; tip: string;
  steps: readonly (readonly [string, string])[];
};

export const efbEditing = {
  en: {
    title: "Make the cockpit tablet your own", setup: "Before your first flight", controls: "Show or hide the tablet",
    tip: "Hold Shift while dragging for 4x faster adjustments. Release Shift for smaller movements. The arrows follow the tablet's own axes, not your camera.",
    steps: [
      ["Enter edit mode", "In a flight with a patched aircraft, show the tablet with Ctrl+T. Right-click its frame once to display the movement arrows. Right-clicking cycles through Move, Rotate, Scale, then normal use."],
      ["Choose its position", "Hold the left mouse button on a red, green or blue arrow and drag, then release. Each arrow moves the tablet along one axis; use another arrow to adjust its depth or height."],
      ["Find a comfortable angle", "Right-click again to show the rotation rings. Left-drag a colored ring to turn or tilt the tablet around that axis, then release."],
      ["Adjust the size", "Right-click again to enter Scale mode. Left-drag the single handle to make the tablet larger or smaller. Scaling is uniform: width and height change together."],
      ["Return to your flight", "Right-click once more to remove the editing handles and use the EFB normally. After a short pause, the position, rotation and size are saved automatically for this aircraft."]
    ]
  },
  fr: {
    title: "Installez la tablette à votre convenance", setup: "Avant votre premier vol", controls: "Afficher ou masquer la tablette",
    tip: "Maintenez Maj pendant le glissement pour un réglage 4 fois plus rapide. Relâchez Maj pour affiner. Les flèches suivent les axes de la tablette, pas ceux de la caméra.",
    steps: [
      ["Passez en mode édition", "En vol avec un avion corrigé, affichez la tablette avec Ctrl+T. Faites un clic droit sur son cadre pour voir les flèches de déplacement. Chaque clic droit passe au mode suivant : déplacement, rotation, échelle, puis utilisation normale."],
      ["Choisissez sa position", "Maintenez le bouton gauche sur une flèche rouge, verte ou bleue, faites glisser puis relâchez. Chaque flèche déplace la tablette sur un axe ; utilisez une autre flèche pour ajuster la profondeur ou la hauteur."],
      ["Trouvez le bon angle", "Faites à nouveau un clic droit pour afficher les anneaux de rotation. Faites glisser un anneau coloré avec le bouton gauche pour orienter ou incliner la tablette sur cet axe, puis relâchez."],
      ["Réglez la taille", "Un nouveau clic droit active le mode échelle. Faites glisser l'unique poignée avec le bouton gauche pour agrandir ou réduire la tablette. La mise à l'échelle est uniforme : largeur et hauteur changent ensemble."],
      ["Reprenez votre vol", "Faites encore un clic droit pour masquer les poignées et utiliser l'EFB normalement. Après une courte pause, la position, la rotation et la taille sont enregistrées automatiquement pour cet avion."]
    ]
  },
  de: {
    title: "Das Cockpit-Tablet passend einrichten", setup: "Vor dem ersten Flug", controls: "Tablet ein- oder ausblenden",
    tip: "Halten Sie beim Ziehen Shift für viermal schnellere Anpassungen. Ohne Shift können Sie feiner justieren. Die Pfeile folgen den Tablet-Achsen, nicht der Kamera.",
    steps: [
      ["Bearbeitung starten", "Zeigen Sie das Tablet im Flug mit einem gepatchten Flugzeug über Ctrl+T an. Ein Rechtsklick auf den Rahmen zeigt die Bewegungspfeile. Weitere Rechtsklicks wechseln zwischen Verschieben, Drehen, Skalieren und normaler Nutzung."],
      ["Position wählen", "Halten Sie die linke Maustaste auf einem roten, grünen oder blauen Pfeil, ziehen Sie und lassen Sie los. Jeder Pfeil verschiebt das Tablet entlang einer Achse; ein anderer Pfeil ändert Tiefe oder Höhe."],
      ["Blickwinkel einstellen", "Ein weiterer Rechtsklick zeigt die Drehringe. Ziehen Sie einen farbigen Ring mit links, um das Tablet um diese Achse zu drehen oder zu neigen."],
      ["Größe anpassen", "Wechseln Sie mit Rechtsklick zur Skalierung. Ziehen Sie den einzelnen Griff mit links zum Vergrößern oder Verkleinern. Breite und Höhe ändern sich immer gemeinsam."],
      ["Weiterfliegen", "Ein weiterer Rechtsklick blendet die Griffe aus und gibt das EFB frei. Nach einer kurzen Pause werden Position, Drehung und Größe automatisch für dieses Flugzeug gespeichert."]
    ]
  },
  es: {
    title: "Coloca la tableta a tu gusto", setup: "Antes del primer vuelo", controls: "Mostrar u ocultar la tableta",
    tip: "Mantén Shift al arrastrar para ajustar 4 veces más rápido. Suéltalo para afinar. Las flechas siguen los ejes de la tableta, no los de la cámara.",
    steps: [
      ["Activa la edición", "En vuelo con un avión parcheado, muestra la tableta con Ctrl+T. Haz clic derecho en el marco para ver las flechas. Cada clic derecho cambia entre mover, rotar, escalar y uso normal."],
      ["Elige la posición", "Mantén el botón izquierdo sobre una flecha roja, verde o azul, arrastra y suelta. Cada flecha mueve la tableta en un eje; utiliza otra para ajustar profundidad o altura."],
      ["Busca un ángulo cómodo", "Haz otro clic derecho para mostrar los anillos. Arrastra un anillo de color con el botón izquierdo para girar o inclinar la tableta sobre ese eje."],
      ["Ajusta el tamaño", "Otro clic derecho activa la escala. Arrastra el único tirador con el botón izquierdo para ampliar o reducir la tableta. Anchura y altura cambian juntas."],
      ["Continúa el vuelo", "Haz otro clic derecho para ocultar los tiradores y volver a usar el EFB. Tras una breve pausa, la posición, rotación y tamaño se guardan automáticamente para este avión."]
    ]
  },
  it: {
    title: "Sistema il tablet come preferisci", setup: "Prima del primo volo", controls: "Mostrare o nascondere il tablet",
    tip: "Tieni premuto Shift durante il trascinamento per regolazioni 4 volte più rapide. Rilascialo per affinare. Le frecce seguono gli assi del tablet, non quelli della telecamera.",
    steps: [
      ["Avvia la modifica", "In volo con un aereo modificato, mostra il tablet con Ctrl+T. Fai clic destro sul bordo per visualizzare le frecce. Ogni clic destro passa tra spostamento, rotazione, scala e uso normale."],
      ["Scegli la posizione", "Tieni il pulsante sinistro su una freccia rossa, verde o blu, trascina e rilascia. Ogni freccia sposta il tablet lungo un asse; usane un'altra per profondità o altezza."],
      ["Trova l'angolo giusto", "Un altro clic destro mostra gli anelli. Trascina un anello colorato con il pulsante sinistro per ruotare o inclinare il tablet attorno a quell'asse."],
      ["Regola la dimensione", "Un altro clic destro attiva la scala. Trascina l'unica maniglia con il pulsante sinistro per ingrandire o ridurre. Larghezza e altezza cambiano insieme."],
      ["Riprendi il volo", "Fai ancora clic destro per nascondere le maniglie e usare normalmente l'EFB. Dopo una breve pausa posizione, rotazione e dimensione vengono salvate automaticamente per questo aereo."]
    ]
  },
  ja: {
    title: "タブレットを使いやすい位置へ", setup: "初めての飛行の前に", controls: "タブレットの表示切り替え",
    tip: "ドラッグ中に Shift を押すと調整速度が4倍になります。細かく調整する際は離してください。矢印はカメラではなくタブレット自身の軸に沿います。",
    steps: [
      ["編集を開始", "パッチ適用済みの機体で飛行中、Ctrl+T でタブレットを表示します。枠を右クリックすると移動矢印が現れます。右クリックごとに移動、回転、拡大縮小、通常操作の順で切り替わります。"],
      ["位置を決める", "赤・緑・青の矢印を左ボタンで押したままドラッグし、離します。各矢印は1つの軸に沿って移動します。別の矢印で奥行きや高さを調整してください。"],
      ["見やすい角度に", "もう一度右クリックすると回転リングが現れます。色付きリングを左ドラッグして、その軸を中心に回転や傾きを調整します。"],
      ["大きさを調整", "さらに右クリックすると拡大縮小モードになります。1つのハンドルを左ドラッグして大きさを変えます。縦横の比率は維持されます。"],
      ["通常操作に戻る", "さらに右クリックしてハンドルを消すと EFB を通常どおり使えます。操作を少し止めると、位置・回転・大きさが機体ごとに自動保存されます。"]
    ]
  },
  nl: {
    title: "Geef de tablet een fijne plek", setup: "Voor je eerste vlucht", controls: "Tablet tonen of verbergen",
    tip: "Houd Shift ingedrukt tijdens slepen om 4 keer sneller aan te passen. Laat los om fijner af te stellen. De pijlen volgen de tabletassen, niet de camera.",
    steps: [
      ["Begin met bewerken", "Toon de tablet tijdens een vlucht met een gepatcht vliegtuig via Ctrl+T. Rechtsklik op de rand voor de verplaatsingspijlen. Elke rechtsklik wisselt tussen verplaatsen, draaien, schalen en normaal gebruik."],
      ["Kies de positie", "Houd de linkermuisknop op een rode, groene of blauwe pijl, sleep en laat los. Elke pijl verplaatst langs één as; gebruik een andere voor diepte of hoogte."],
      ["Kies een prettige hoek", "Rechtsklik opnieuw voor de draairingen. Sleep een gekleurde ring met links om de tablet rond die as te draaien of te kantelen."],
      ["Pas de grootte aan", "Rechtsklik opnieuw om te schalen. Sleep de enkele greep met links om te vergroten of verkleinen. Breedte en hoogte veranderen samen."],
      ["Vlieg verder", "Rechtsklik nogmaals om de grepen te verbergen en het EFB normaal te gebruiken. Na een korte pauze worden positie, rotatie en grootte automatisch voor dit vliegtuig opgeslagen."]
    ]
  },
  pl: {
    title: "Ustaw tablet po swojemu", setup: "Przed pierwszym lotem", controls: "Pokaż lub ukryj tablet",
    tip: "Przytrzymaj Shift podczas przeciągania, aby regulować 4 razy szybciej. Zwolnij go do dokładniejszych zmian. Strzałki odpowiadają osiom tabletu, nie kamery.",
    steps: [
      ["Włącz edycję", "Podczas lotu samolotem z poprawką pokaż tablet skrótem Ctrl+T. Kliknij prawym przyciskiem jego ramkę, aby wyświetlić strzałki. Kolejne kliknięcia przełączają przesuwanie, obrót, skalowanie i zwykłą obsługę."],
      ["Wybierz pozycję", "Przytrzymaj lewy przycisk na czerwonej, zielonej lub niebieskiej strzałce, przeciągnij i zwolnij. Każda strzałka przesuwa w jednej osi; użyj innej do zmiany głębokości lub wysokości."],
      ["Dopasuj kąt", "Kliknij ponownie prawym przyciskiem, aby pokazać pierścienie. Przeciągnij kolorowy pierścień lewym przyciskiem, by obrócić lub pochylić tablet wokół tej osi."],
      ["Zmień rozmiar", "Kolejne kliknięcie prawym przyciskiem włącza skalowanie. Przeciągnij pojedynczy uchwyt lewym przyciskiem. Szerokość i wysokość zmieniają się razem."],
      ["Wróć do lotu", "Kliknij ponownie prawym przyciskiem, aby ukryć uchwyty i używać EFB. Po krótkiej przerwie pozycja, obrót i rozmiar zapisują się automatycznie dla tego samolotu."]
    ]
  },
  pt: {
    title: "Coloque o tablet à sua medida", setup: "Antes do primeiro voo", controls: "Mostrar ou ocultar o tablet",
    tip: "Mantenha Shift ao arrastar para ajustes 4 vezes mais rápidos. Solte para afinar. As setas seguem os eixos do tablet, não os da câmara.",
    steps: [
      ["Entre na edição", "Num voo com um avião corrigido, mostre o tablet com Ctrl+T. Clique com o botão direito na moldura para ver as setas. Cada clique alterna entre mover, rodar, escala e uso normal."],
      ["Escolha a posição", "Mantenha o botão esquerdo numa seta vermelha, verde ou azul, arraste e solte. Cada seta move o tablet num eixo; use outra para ajustar a profundidade ou a altura."],
      ["Encontre o melhor ângulo", "Clique novamente com o botão direito para mostrar os anéis. Arraste um anel colorido com o botão esquerdo para rodar ou inclinar nesse eixo."],
      ["Ajuste o tamanho", "Outro clique direito ativa a escala. Arraste a única pega com o botão esquerdo para aumentar ou reduzir. A largura e a altura mudam em conjunto."],
      ["Continue o voo", "Clique de novo com o botão direito para ocultar as pegas e utilizar o EFB normalmente. Após uma breve pausa, posição, rotação e tamanho são guardados automaticamente para este avião."]
    ]
  },
  "pt-BR": {
    title: "Posicione o tablet do seu jeito", setup: "Antes do primeiro voo", controls: "Mostrar ou ocultar o tablet",
    tip: "Segure Shift ao arrastar para ajustes 4 vezes mais rápidos. Solte para ajustar com precisão. As setas seguem os eixos do tablet, não os da câmera.",
    steps: [
      ["Entre na edição", "Em voo com uma aeronave corrigida, mostre o tablet com Ctrl+T. Clique com o botão direito na moldura para ver as setas. Cada clique alterna entre mover, girar, escala e uso normal."],
      ["Escolha a posição", "Segure o botão esquerdo numa seta vermelha, verde ou azul, arraste e solte. Cada seta move o tablet em um eixo; use outra para ajustar a profundidade ou a altura."],
      ["Encontre o melhor ângulo", "Clique novamente com o botão direito para mostrar os anéis. Arraste um anel colorido com o botão esquerdo para girar ou inclinar nesse eixo."],
      ["Ajuste o tamanho", "Outro clique direito ativa a escala. Arraste a única alça com o botão esquerdo para aumentar ou reduzir. A largura e a altura mudam juntas."],
      ["Continue o voo", "Clique de novo com o botão direito para ocultar as alças e usar o EFB normalmente. Após uma breve pausa, posição, rotação e tamanho são salvos automaticamente para esta aeronave."]
    ]
  },
  ru: {
    title: "Устройте планшет поудобнее", setup: "Перед первым полётом", controls: "Показать или скрыть планшет",
    tip: "Удерживайте Shift при перетаскивании для изменения в 4 раза быстрее. Отпустите для точной настройки. Стрелки следуют осям планшета, а не камеры.",
    steps: [
      ["Начните редактирование", "В полёте на самолёте с патчем покажите планшет через Ctrl+T. Щёлкните правой кнопкой по рамке для появления стрелок. Каждый щелчок переключает перемещение, поворот, масштаб и обычную работу."],
      ["Выберите положение", "Удерживайте левую кнопку на красной, зелёной или синей стрелке, перетащите и отпустите. Каждая стрелка перемещает по одной оси; другой стрелкой меняйте глубину или высоту."],
      ["Подберите угол", "Снова щёлкните правой кнопкой, чтобы появились кольца. Перетаскивайте цветное кольцо левой кнопкой для поворота или наклона вокруг этой оси."],
      ["Измените размер", "Следующий правый щелчок включает масштабирование. Перетаскивайте единственный маркер левой кнопкой для изменения размера. Ширина и высота меняются вместе."],
      ["Продолжайте полёт", "Ещё раз щёлкните правой кнопкой, чтобы убрать маркеры и пользоваться EFB. После короткой паузы положение, поворот и размер автоматически сохраняются для этого самолёта."]
    ]
  },
  sv: {
    title: "Placera surfplattan som du vill", setup: "Före första flygningen", controls: "Visa eller dölj surfplattan",
    tip: "Håll Shift när du drar för 4 gånger snabbare justering. Släpp för finare rörelser. Pilarna följer surfplattans egna axlar, inte kameran.",
    steps: [
      ["Börja redigera", "Visa surfplattan med Ctrl+T under en flygning med ett patchat flygplan. Högerklicka på ramen för att visa pilarna. Varje högerklick växlar mellan flyttning, rotation, skalning och vanlig användning."],
      ["Välj position", "Håll vänster musknapp på en röd, grön eller blå pil, dra och släpp. Varje pil flyttar längs en axel; använd en annan för djup eller höjd."],
      ["Hitta rätt vinkel", "Högerklicka igen för att visa ringarna. Dra en färgad ring med vänster knapp för att vrida eller luta runt den axeln."],
      ["Ändra storlek", "Nästa högerklick aktiverar skalning. Dra det enda handtaget med vänster knapp för att förstora eller förminska. Bredd och höjd ändras tillsammans."],
      ["Fortsätt flyga", "Högerklicka igen för att dölja handtagen och använda EFB normalt. Efter en kort paus sparas position, rotation och storlek automatiskt för flygplanet."]
    ]
  },
  tr: {
    title: "Tableti kendinize göre yerleştirin", setup: "İlk uçuştan önce", controls: "Tableti gösterin veya gizleyin",
    tip: "Sürüklerken Shift basılı tutarsanız ayar 4 kat hızlanır. İnce ayar için bırakın. Oklar kameranın değil, tabletin kendi eksenlerini izler.",
    steps: [
      ["Düzenlemeye girin", "Yama uygulanmış uçakla uçuşta Ctrl+T ile tableti gösterin. Taşıma okları için çerçeveye sağ tıklayın. Her sağ tıklama taşıma, döndürme, ölçek ve normal kullanım arasında geçiş yapar."],
      ["Konumunu seçin", "Kırmızı, yeşil veya mavi ok üzerinde sol düğmeyi basılı tutun, sürükleyin ve bırakın. Her ok bir eksende taşır; derinlik veya yükseklik için başka bir ok kullanın."],
      ["Rahat bir açı bulun", "Döndürme halkaları için yeniden sağ tıklayın. Tableti o eksende döndürmek veya eğmek için renkli halkayı sol düğmeyle sürükleyin."],
      ["Boyutu ayarlayın", "Tekrar sağ tıklayarak ölçek moduna geçin. Büyütmek veya küçültmek için tek tutamacı sol düğmeyle sürükleyin. Genişlik ve yükseklik birlikte değişir."],
      ["Uçuşa devam edin", "Tutamakları kaldırıp EFB'yi normal kullanmak için tekrar sağ tıklayın. Kısa bir duraklamadan sonra konum, dönüş ve boyut bu uçak için otomatik kaydedilir."]
    ]
  },
  "zh-CN": {
    title: "把平板放在顺手的位置", setup: "首次飞行前", controls: "显示或隐藏平板",
    tip: "拖动时按住 Shift 可将调节速度提高到 4 倍，松开后可进行精细调整。箭头沿平板自身的轴移动，而不是摄像机的轴。",
    steps: [
      ["进入编辑模式", "驾驶已应用补丁的飞机飞行时，按 Ctrl+T 显示平板。右键单击边框即可显示移动箭头。每次右键单击依次切换移动、旋转、缩放和正常使用模式。"],
      ["选择位置", "在红色、绿色或蓝色箭头上按住鼠标左键拖动，然后松开。每个箭头沿一个轴移动平板；换用另一个箭头可调整深度或高度。"],
      ["调整舒适的角度", "再次右键单击可显示旋转圆环。用左键拖动彩色圆环，绕该轴旋转或倾斜平板。"],
      ["调整大小", "再次右键单击进入缩放模式。用左键拖动唯一的手柄可放大或缩小平板。缩放保持比例，宽度和高度一起变化。"],
      ["继续飞行", "再次右键单击可隐藏手柄并恢复正常 EFB 操作。停止调节片刻后，位置、旋转和大小会按飞机自动保存。"]
    ]
  }
} satisfies LocaleMap<EditingGuide>;
