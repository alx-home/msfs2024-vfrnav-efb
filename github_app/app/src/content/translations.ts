import type { LocaleMap, Translation } from './types';
import { efbModes } from './efbModes';

export const translations: LocaleMap<Translation> = {
         en: {
            title: "VFRNav EFB Guide - MSFS 2024",
            description: "Learn how to install and use MSFS2024 VFRNav for maps, charts, flight plans, navlogs, airport weather and flight review.",
            language: "Language",
            navLabel: "Main navigation",
            nav: ["Overview", "Features", "Install", "How to use", "Controls", "Support"],
            hero: [
               "A cockpit companion for VFR",
               "Plan the route. Fly the view.",
               "VFRNav adds maps, airport charts, PDFs and flight-planning tools to the Microsoft Flight Simulator 2024 EFB. It is designed for VFR flying and also supports IFR.",
               "Download on Flightsim.to",
               "How to use VFRNav",
               "Free and community-built. Install either the Community package or the Installer, not both."
            ],
            route: ["FLIGHT PLAN / VFR MAP", "Route overview", "Map + navlog together", "PLAN / FLY / REVIEW"],
            workflow: ["Start here", "Choose one package on Flightsim.to, open VFRNav from the simulator EFB, and use the tools that fit your flight."],
            steps: [
               "Choose either the Legacy Community package or Installer from the Flightsim.to download section.",
               "Start MSFS 2024, open the EFB app launcher, and select VFRNav.",
               "Prepare your route, map layers, charts and navlog before or during the flight.",
               "Use airport information in flight, then review the recorded route after landing."
            ],
            features: ["What the EFB can do", "Plan flights, access cockpit references, and review routes with one integrated tool.", "VFR maps from OACI, Google, OpenStreetMap and elevation sources, with VFR layers enabled by default.", "View VAC charts and PDFs in the cockpit; download French VAC charts from SIA or add local files with the server.", "Overlay the flight plan on the map, create navlogs, and transfer flight plans through the VFRNav server.", "Record flights and inspect the route afterwards; navlogs and aircraft performance data can also be imported or exported.", "Check airport details and weather information such as METAR and TAF from the EFB.", efbModes["en"].summary],
            install: [
               "Installation options",
               "Get the package from Flightsim.to and follow the instructions included with that version.",
               "Legacy Community package: place the package in the MSFS 2024 Community folder, then start the simulator and open its EFB.",
               "Installer: run the installer and follow its prompts. It includes the VFRNav server and enables extra file and external-EFB features.",
               "Important: install only one version at a time. External browser/device access is still in development, and external EFB settings are not yet persistent."
            ],
            using: [
               "Using the EFB",
               "A practical text guide to the add-on's main tasks and features.",
               [
                  ["Open and configure VFRNav", "Launch VFRNav from the simulator's EFB app launcher. General EFB settings include display size, orientation, brightness, units and favorite apps. For VR, the listing recommends Large size and Horizontal orientation."],
                  ["Plan with the map", "Choose map layers and adjust their visibility. Follow the aircraft position, add a flight-plan route and waypoints, and use chart detail or range overlays to understand the area ahead."],
                  ["Find and read documents", "The document panel offers sources such as Local, SIA, TEMSI and Weather Fronts. For a French SIA VAC chart, enter the aerodrome ICAO code and download it. Open PDFs in the viewer; the server is required for local file upload."],
                  ["Use the navlog", "Review waypoints, altitude, estimated time and fuel. The performance view includes compass-deviation and fuel-consumption data. The server supports file import/export and transferring plans between VFRNav and the MSFS EFB."],
                  ["Check weather and airspace", "Open airport information for METAR and TAF. The map can show AZBA activity areas; select a zone to check its activity time, upper and lower altitude limits, and notes."],
                  ["Review the flight", "Open a recorded flight to see its track and saved records. In the review map, Alt + Shift + drag rotates the view, the map-person control changes viewpoint, and sliders adjust the display. The server also offers an external app/browser EFB."]
               ]
            ],
            controls: [
               "Mouse and PDF controls",
               "The EFB gestures below apply in 2D mode. PDF gestures apply while a document is open.",
               [
                  "Ctrl + left-drag: move the EFB in 2D mode.",
                  "Ctrl + Shift + left-drag: adjust the visible EFB area.",
                  "Alt + drag: move the EFB in the simulator area.",
                  "Ctrl + Shift + right-click: restore the default EFB size. Ctrl + Alt + right-click: reload the EFB operating system.",
                  "PDFs: use the mouse wheel to scroll vertically, Ctrl + wheel to scroll horizontally, and Alt or Shift + wheel or the +/- buttons to zoom. Click and drag with the wheel button to pan."
               ]
            ],
            notes: [
               "Limitations and transparency",
               "Read these notes before installing or using the PDF and resizing features.",
               [
                  ["PDF rendering", "The simulator uses an older embedded browser, so PDFs may occasionally render incorrectly. Zoom in or out to force a redraw. Avoid very large PDFs, such as manuals, because they may crash the simulator."],
                  ["EFB resizing", "Resizing is a workaround that changes the visible area rather than the actual EFB size. Items behind the EFB may remain unclickable."],
                  ["Antivirus reports", "Some heuristic antivirus engines may flag the compressed installer as a false positive. Review the per-release VirusTotal results and the public source code before deciding whether to install."],
                  ["External EFB", "External browser/device support is still in development. Settings in the external EFB are not yet persistent."]
               ]
            ],
            support: [
               "Downloads and support",
               "Download from Flightsim.to. Use the project links for documentation, feedback, community and source code.",
               ["Download on Flightsim.to", "Installation and usage wiki", "Report a problem or suggest an improvement", "Community Discord", "Source code", "Share feedback about the standalone app"],
               "MSFS2024 VFRNav is a free community project. Microsoft Flight Simulator is a trademark of Microsoft.",
               "VirusTotal reports"
            ]
         },
         fr: {
            title: "Guide VFRNav EFB - MSFS 2024",
            description: "Apprenez à installer et utiliser MSFS2024 VFRNav pour les cartes, plans de vol, journaux de navigation et informations météo.",
            language: "Langue",
            navLabel: "Navigation principale",
            nav: ["Aperçu", "Fonctionnalités", "Installation", "Utilisation", "Commandes", "Assistance"],
            hero: [
               "Un compagnon de cockpit pour le VFR",
               "Préparez la route. Gardez le cap.",
               "VFRNav ajoute des cartes, cartes d'aérodrome, PDF et outils de préparation au planificateur de vol intégré de Microsoft Flight Simulator 2024. Conçu pour le VFR, il prend aussi en charge l'IFR.",
               "Télécharger sur Flightsim.to",
               "Utiliser VFRNav",
               "Gratuit et développé par la communauté. Installez soit le package Community, soit l'installeur, mais pas les deux."
            ],
            route: ["PLAN DE VOL / CARTE VFR", "Aperçu de la route", "Carte et journal de navigation", "PRÉPARER / VOLER / REVOIR"],
            workflow: ["Commencer ici", "Choisissez un package sur Flightsim.to, ouvrez VFRNav depuis l'EFB du simulateur et utilisez les outils adaptés à votre vol."],
            steps: [
               "Choisissez le package Legacy Community ou l'installeur dans la section de téléchargement Flightsim.to.",
               "Lancez MSFS 2024, ouvrez le lanceur d'applications de l'EFB et sélectionnez VFRNav.",
               "Préparez votre route, les calques cartographiques, les cartes et le journal avant ou pendant le vol.",
               "Consultez les informations d'aérodrome en vol, puis revoyez la route enregistrée après l'atterrissage."
            ],
            features: ["Fonctionnalités de l'EFB", "Préparez vos vols, consultez vos références en cockpit et analysez vos routes avec un outil intégré.", "Cartes VFR OACI, Google, OpenStreetMap et relief ; les calques VFR sont activés par défaut.", "Consultez les cartes VAC et PDF dans le cockpit ; téléchargez les VAC françaises via le SIA ou ajoutez des fichiers locaux avec le serveur.", "Superposez le plan de vol sur la carte, créez un journal de navigation et transférez les plans avec le serveur VFRNav.", "Enregistrez les vols et revoyez la route ensuite ; les journaux et données de performance peuvent aussi être importés ou exportés.", "Consultez les informations d'aérodrome et la météo, notamment METAR et TAF, depuis l'EFB.", efbModes["fr"].summary],
            install: [
               "Options d'installation",
               "Téléchargez le package sur Flightsim.to et suivez les instructions fournies avec cette version.",
               "Package Legacy Community : placez-le dans le dossier Community de MSFS 2024, puis lancez le simulateur et ouvrez son EFB.",
               "Installeur : exécutez-le et suivez les étapes. Il inclut le serveur VFRNav et active des fonctions supplémentaires pour les fichiers et l'EFB externe.",
               "Important : n'installez qu'une seule version à la fois. L'accès externe via navigateur/appareil est encore en développement et ses paramètres ne sont pas encore conservés."
            ],
            using: [
               "Utiliser l'EFB",
               "Un guide textuel pratique des principales fonctions et tâches de l'extension.",
               [
                  ["Ouvrir et configurer VFRNav", "Lancez VFRNav depuis le lanceur d'applications de l'EFB du simulateur. Les paramètres généraux incluent taille, orientation, luminosité, unités et favoris. En VR, la fiche recommande Large et Horizontal."],
                  ["Préparer la route sur la carte", "Choisissez les calques et réglez leur visibilité. Suivez la position de l'avion, ajoutez une route et des points de passage, puis utilisez les détails cartographiques et les zones circulaires pour comprendre le secteur."],
                  ["Trouver et lire des documents", "Le panneau propose Local, SIA, TEMSI et fronts météo. Pour une carte VAC française du SIA, saisissez le code OACI de l'aérodrome puis téléchargez-la. Les PDF s'ouvrent dans le lecteur ; le serveur est requis pour importer un fichier local."],
                  ["Utiliser le journal de navigation", "Consultez les points de passage, altitudes, heures estimées et carburant. La page performances affiche la déviation du compas et la consommation. Le serveur gère l'import/export de fichiers et le transfert des plans."],
                  ["Consulter météo et espaces aériens", "Ouvrez les informations d'aérodrome pour le METAR et le TAF. La carte peut afficher les zones d'activité AZBA ; sélectionnez une zone pour voir ses horaires, limites d'altitude et remarques."],
                  ["Revoir le vol", "Ouvrez un vol enregistré pour afficher sa trace et les enregistrements sauvegardés. Dans la carte de revue, Alt + Maj + glisser fait pivoter la vue, le personnage sur la carte change le point de vue et les curseurs règlent l'affichage. Le serveur propose aussi une EFB externe." ]
               ]
            ],
            controls: [
               "Commandes souris et PDF",
               "Les gestes EFB ci-dessous s'appliquent en mode 2D. Les gestes PDF s'appliquent lorsqu'un document est ouvert.",
               [
                  "Ctrl + glisser avec le bouton gauche : déplacer l'EFB en 2D.",
                  "Ctrl + Maj + glisser avec le bouton gauche : ajuster la zone visible de l'EFB.",
                  "Alt + glisser : déplacer l'EFB dans la zone du simulateur.",
                  "Ctrl + Maj + clic droit : rétablir la taille par défaut. Ctrl + Alt + clic droit : recharger le système de l'EFB.",
                  "PDF : molette pour défiler verticalement, Ctrl + molette horizontalement, Alt ou Maj + molette ou boutons +/- pour zoomer. Cliquez et glissez avec le bouton molette pour déplacer la page."
               ]
            ],
            notes: [
               "Limites et transparence",
               "Lisez ces remarques avant d'utiliser les fonctions PDF et de redimensionnement.",
               [
                  ["Affichage PDF", "Le simulateur utilise un navigateur intégré ancien ; l'affichage PDF peut parfois être incorrect. Zoomez pour forcer le rafraîchissement. Évitez les PDF très volumineux, comme les manuels, qui peuvent faire planter le simulateur."],
                  ["Redimensionnement de l'EFB", "Ce contournement modifie la zone visible, pas la taille réelle de l'EFB. Les éléments situés derrière peuvent rester impossibles à cliquer."],
                  ["Rapports antivirus", "Certains antivirus heuristiques peuvent signaler à tort l'installeur compressé. Consultez les résultats VirusTotal par version et le code source public avant de décider de l'installation."],
                  ["EFB externe", "La prise en charge du navigateur et des appareils externes est encore en développement. Les paramètres de l'EFB externe ne sont pas encore persistants."]
               ]
            ],
            support: [
               "Téléchargements et assistance",
               "Téléchargez depuis Flightsim.to. Utilisez les liens du projet pour la documentation, les retours, la communauté et le code source.",
               ["Télécharger sur Flightsim.to", "Wiki d'installation et d'utilisation", "Signaler un problème ou proposer une amélioration", "Discord communautaire", "Code source", "Donner votre avis sur l'application autonome"],
               "MSFS2024 VFRNav est un projet communautaire gratuit. Microsoft Flight Simulator est une marque de Microsoft.",
               "Rapports VirusTotal"
            ]
         },
         de: {
            title: "VFRNav EFB-Anleitung - MSFS 2024",
            description: "Erfahren Sie, wie Sie MSFS2024 VFRNav für Karten, Flugpläne, Navigationsprotokolle und Wetterinformationen installieren und verwenden.",
            language: "Sprache",
            navLabel: "Hauptnavigation",
            nav: ["Übersicht", "Funktionen", "Installation", "Verwendung", "Steuerung", "Support"],
            hero: [
               "Ein Cockpit-Begleiter für VFR",
               "Route planen. Überblick behalten.",
               "VFRNav ergänzt das integrierte EFB von Microsoft Flight Simulator 2024 um Karten, Flugplatzkarten, PDFs und Flugplanungstools. Es ist für VFR ausgelegt und unterstützt auch IFR.",
               "Auf Flightsim.to herunterladen",
               "VFRNav verwenden",
               "Kostenlos und von der Community entwickelt. Installieren Sie entweder das Community-Paket oder den Installer, nicht beide."
            ],
            route: ["FLUGPLAN / VFR-KARTE", "Routenübersicht", "Karte und Navigationsprotokoll", "PLANEN / FLIEGEN / AUSWERTEN"],
            workflow: ["Erste Schritte", "Wählen Sie ein Paket auf Flightsim.to, öffnen Sie VFRNav über das EFB des Simulators und nutzen Sie die passenden Werkzeuge für Ihren Flug."],
            steps: [
               "Wählen Sie im Downloadbereich von Flightsim.to entweder das Legacy-Community-Paket oder den Installer.",
               "Starten Sie MSFS 2024, öffnen Sie den EFB-App-Launcher und wählen Sie VFRNav.",
               "Bereiten Sie Route, Kartenebenen, Karten und Navigationsprotokoll vor oder während des Flugs vor.",
               "Nutzen Sie Flugplatzinformationen während des Flugs und prüfen Sie nach der Landung die aufgezeichnete Route."
            ],
            features: ["EFB-Funktionen", "Flüge planen, Cockpit-Referenzen abrufen und Routen mit einem integrierten Werkzeug auswerten.", "VFR-Karten von OACI, Google, OpenStreetMap und Höhenquellen; VFR-Ebenen sind standardmäßig aktiviert.", "VAC-Karten und PDFs im Cockpit ansehen; französische VAC-Karten über SIA herunterladen oder lokale Dateien mit dem Server hinzufügen.", "Flugplan auf der Karte einblenden, Navigationsprotokolle erstellen und Flugpläne über den VFRNav-Server übertragen.", "Flüge aufzeichnen und die Route später prüfen; Navigationsprotokolle und Flugzeugleistungsdaten lassen sich importieren und exportieren.", "Flugplatzinformationen sowie METAR- und TAF-Wetterdaten im EFB ansehen.", efbModes["de"].summary],
            install: [
               "Installationsoptionen",
               "Laden Sie das Paket von Flightsim.to herunter und befolgen Sie die Hinweise der jeweiligen Version.",
               "Legacy Community: Paket in den Community-Ordner von MSFS 2024 legen, dann den Simulator starten und das EFB öffnen.",
               "Installer: ausführen und den Installationsschritten folgen. Er enthält den VFRNav-Server und zusätzliche Datei- und externe-EFB-Funktionen.",
               "Wichtig: Installieren Sie immer nur eine Version. Der externe Zugriff per Browser/Gerät befindet sich noch in Entwicklung; externe EFB-Einstellungen werden noch nicht gespeichert."
            ],
            using: [
               "Das EFB verwenden",
               "Ein praktischer Textleitfaden zu den wichtigsten Funktionen und Aufgaben des Add-ons.",
               [
                  ["VFRNav öffnen und einrichten", "Starten Sie VFRNav über den EFB-App-Launcher des Simulators. Die allgemeinen EFB-Einstellungen umfassen Größe, Ausrichtung, Helligkeit, Einheiten und Favoriten. Für VR empfiehlt der Eintrag Groß und Horizontal."],
                  ["Route auf der Karte planen", "Wählen Sie Kartenebenen und passen Sie deren Sichtbarkeit an. Verfolgen Sie die Flugzeugposition, blenden Sie Route und Wegpunkte ein und nutzen Sie Kartendetails oder Bereichskreise zur Orientierung."],
                  ["Dokumente finden und lesen", "Das Dokumentfenster bietet Local, SIA, TEMSI und Weather Fronts. Für eine französische SIA-VAC-Karte den ICAO-Code des Flugplatzes eingeben und herunterladen. PDFs im Viewer öffnen; für lokale Uploads ist der Server erforderlich."],
                  ["Navigationsprotokoll nutzen", "Prüfen Sie Wegpunkte, Höhe, geschätzte Zeit und Kraftstoff. Die Leistungsansicht enthält Kompassabweichung und Kraftstoffverbrauch. Der Server unterstützt Dateiimport/-export und Flugplanübertragung."],
                  ["Wetter und Luftraum prüfen", "Öffnen Sie Flugplatzinformationen für METAR und TAF. Die Karte kann AZBA-Aktivitätsgebiete anzeigen; wählen Sie ein Gebiet aus, um Zeitfenster, Höhenbegrenzungen und Hinweise zu prüfen."],
                  ["Flug nachbereiten", "Öffnen Sie einen aufgezeichneten Flug, um Track und gespeicherte Aufzeichnungen anzusehen. Alt + Umschalt + Ziehen dreht die Karte, die Kartenfigur ändert den Blickwinkel und Schieberegler passen die Anzeige an. Der Server bietet auch ein externes EFB."]
               ]
            ],
            controls: [
               "Maus- und PDF-Steuerung",
               "Die folgenden EFB-Gesten gelten im 2D-Modus. PDF-Gesten gelten bei geöffnetem Dokument.",
               [
                  "Strg + Ziehen mit linker Maustaste: EFB im 2D-Modus verschieben.",
                  "Strg + Umschalt + Ziehen mit linker Maustaste: sichtbaren EFB-Bereich anpassen.",
                  "Alt + Ziehen: EFB im Simulatorbereich verschieben.",
                  "Strg + Umschalt + Rechtsklick: Standardgröße wiederherstellen. Strg + Alt + Rechtsklick: EFB-Betriebssystem neu laden.",
                  "PDFs: Mausrad für vertikales Scrollen, Strg + Rad für horizontales Scrollen und Alt/Umschalt + Rad oder +/- zum Zoomen. Zum Verschieben mit der Rad-Taste klicken und ziehen."
               ]
            ],
            notes: [
               "Einschränkungen und Transparenz",
               "Beachten Sie diese Hinweise zu PDF-Ansicht und Größenänderung.",
               [
                  ["PDF-Darstellung", "Der Simulator verwendet einen älteren integrierten Browser; PDFs können gelegentlich falsch dargestellt werden. Zoomen Sie zum erneuten Rendern. Sehr große PDFs wie Handbücher können den Simulator zum Absturz bringen."],
                  ["EFB-Größe", "Die Umgehungslösung ändert nur den sichtbaren Bereich, nicht die tatsächliche EFB-Größe. Elemente hinter dem EFB können weiterhin nicht anklickbar sein."],
                  ["Antivirus-Berichte", "Heuristische Virenscanner können den komprimierten Installer fälschlich melden. Prüfen Sie vor der Installation die VirusTotal-Ergebnisse der Versionen und den öffentlichen Quellcode."],
                  ["Externes EFB", "Die Unterstützung externer Browser und Geräte ist noch in Entwicklung. Einstellungen im externen EFB bleiben derzeit nicht erhalten."]
               ]
            ],
            support: [
               "Downloads und Support",
               "Laden Sie VFRNav bei Flightsim.to herunter. Projektlinks führen zu Dokumentation, Feedback, Community und Quellcode.",
               ["Auf Flightsim.to herunterladen", "Installations- und Nutzungshandbuch", "Problem melden oder Verbesserung vorschlagen", "Community-Discord", "Quellcode", "Feedback zur Standalone-App geben"],
               "MSFS2024 VFRNav ist ein kostenloses Community-Projekt. Microsoft Flight Simulator ist eine Marke von Microsoft.",
               "VirusTotal-Berichte"
            ]
         },
         es: {
            title: "Guía de VFRNav EFB - MSFS 2024",
            description: "Aprende a instalar y usar MSFS2024 VFRNav con mapas, cartas, planes de vuelo, diarios de navegación y meteorología.",
            language: "Idioma",
            navLabel: "Navegación principal",
            nav: ["Resumen", "Funciones", "Instalación", "Uso", "Controles", "Soporte"],
            hero: [
               "Un compañero de cabina para VFR",
               "Planifica la ruta. Vuela con contexto.",
               "VFRNav añade mapas, cartas de aeródromo, PDF y herramientas de planificación al EFB integrado de Microsoft Flight Simulator 2024. Está diseñado para VFR y también admite IFR.",
               "Descargar en Flightsim.to",
               "Cómo usar VFRNav",
               "Gratis y creado por la comunidad. Instala el paquete Community o el instalador, pero no ambos."
            ],
            route: ["PLAN DE VUELO / MAPA VFR", "Vista de la ruta", "Mapa y diario de navegación", "PLANIFICAR / VOLAR / REVISAR"],
            workflow: ["Empieza aquí", "Elige un paquete en Flightsim.to, abre VFRNav desde el EFB del simulador y usa las herramientas adecuadas para tu vuelo."],
            steps: [
               "Elige el paquete Legacy Community o el instalador en la sección de descargas de Flightsim.to.",
               "Inicia MSFS 2024, abre el lanzador de aplicaciones del EFB y selecciona VFRNav.",
               "Prepara la ruta, las capas del mapa, las cartas y el diario de navegación antes o durante el vuelo.",
               "Consulta información del aeródromo durante el vuelo y revisa la ruta grabada después de aterrizar."
            ],
            features: ["Funciones del EFB", "Planifica vuelos, consulta referencias en cabina y revisa rutas con una herramienta integrada.", "Mapas VFR de OACI, Google, OpenStreetMap y elevación; las capas VFR se muestran de forma predeterminada.", "Consulta cartas VAC y PDF en cabina; descarga cartas VAC francesas desde SIA o añade archivos locales con el servidor.", "Superpone el plan de vuelo en el mapa, genera diarios de navegación y transfiere planes mediante el servidor VFRNav.", "Graba vuelos y revisa la ruta después; también puedes importar o exportar diarios y datos de rendimiento del avión.", "Consulta datos del aeródromo e información meteorológica METAR y TAF desde el EFB.", efbModes["es"].summary],
            install: [
               "Opciones de instalación",
               "Descarga el paquete desde Flightsim.to y sigue las instrucciones incluidas con esa versión.",
               "Legacy Community: coloca el paquete en la carpeta Community de MSFS 2024, inicia el simulador y abre su EFB.",
               "Instalador: ejecútalo y sigue los pasos. Incluye el servidor VFRNav y añade funciones para archivos y EFB externo.",
               "Importante: instala solo una versión a la vez. El acceso desde navegador/dispositivo externo sigue en desarrollo y sus ajustes aún no se guardan."
            ],
            using: [
               "Cómo usar el EFB",
               "Guía práctica en texto sobre las principales funciones y tareas del complemento.",
               [
                  ["Abrir y configurar VFRNav", "Inicia VFRNav desde el lanzador de aplicaciones del EFB del simulador. Los ajustes generales incluyen tamaño, orientación, brillo, unidades y favoritos. Para VR, la ficha recomienda Grande y Horizontal."],
                  ["Planificar con el mapa", "Elige capas y ajusta su visibilidad. Sigue la posición del avión, añade una ruta y puntos de paso, y usa los detalles cartográficos o círculos de alcance para entender la zona."],
                  ["Buscar y leer documentos", "El panel ofrece fuentes Local, SIA, TEMSI y Weather Fronts. Para una carta VAC francesa de SIA, introduce el código OACI del aeródromo y descárgala. Abre PDF en el visor; subir archivos locales requiere el servidor."],
                  ["Usar el diario de navegación", "Consulta puntos de paso, altitud, hora estimada y combustible. La vista de rendimiento incluye desviación de brújula y consumo. El servidor permite importar/exportar archivos y transferir planes."],
                  ["Consultar meteorología y espacio aéreo", "Abre la información del aeródromo para ver METAR y TAF. El mapa puede mostrar zonas AZBA; selecciona una para consultar el horario de actividad, límites de altitud y notas."],
                  ["Revisar el vuelo", "Abre un vuelo grabado para ver su trayectoria y registros guardados. En el mapa de revisión, Alt + Mayús + arrastrar gira la vista; el icono de persona cambia el punto de vista y los controles deslizantes ajustan la presentación. El servidor también ofrece un EFB externo."]
               ]
            ],
            controls: [
               "Controles del ratón y PDF",
               "Los gestos del EFB se aplican al modo 2D. Los gestos de PDF se aplican con un documento abierto.",
               [
                  "Ctrl + arrastrar con el botón izquierdo: mover el EFB en modo 2D.",
                  "Ctrl + Mayús + arrastrar con el botón izquierdo: ajustar el área visible del EFB.",
                  "Alt + arrastrar: mover el EFB en el área del simulador.",
                  "Ctrl + Mayús + clic derecho: restaurar el tamaño predeterminado. Ctrl + Alt + clic derecho: recargar el sistema operativo del EFB.",
                  "PDF: rueda para desplazamiento vertical, Ctrl + rueda para horizontal y Alt o Mayús + rueda o botones +/- para zoom. Haz clic y arrastra con el botón de la rueda para mover la página."
               ]
            ],
            notes: [
               "Limitaciones y transparencia",
               "Ten en cuenta estas notas sobre PDF y cambio de tamaño.",
               [
                  ["Visualización de PDF", "El simulador usa un navegador integrado antiguo, por lo que algunos PDF pueden mostrarse mal. Haz zoom para volver a dibujarlos. Los archivos muy grandes, como manuales, pueden bloquear el simulador."],
                  ["Cambio de tamaño del EFB", "Esta solución cambia el área visible, no el tamaño real del EFB. Es posible que no se pueda hacer clic en elementos situados detrás."],
                  ["Informes antivirus", "Algunos antivirus heurísticos pueden marcar erróneamente el instalador comprimido. Revisa los resultados de VirusTotal por versión y el código fuente público antes de instalar."],
                  ["EFB externo", "La compatibilidad con navegadores y dispositivos externos sigue en desarrollo. Los ajustes del EFB externo aún no son persistentes."]
               ]
            ],
            support: [
               "Descargas y soporte",
               "Descarga VFRNav en Flightsim.to. Usa los enlaces del proyecto para documentación, comentarios, comunidad y código fuente.",
               ["Descargar en Flightsim.to", "Wiki de instalación y uso", "Informar de un problema o sugerir una mejora", "Discord de la comunidad", "Código fuente", "Enviar comentarios sobre la aplicación independiente"],
               "MSFS2024 VFRNav es un proyecto gratuito de la comunidad. Microsoft Flight Simulator es una marca comercial de Microsoft.",
               "Informes de VirusTotal"
            ]
         },
         it: {
            title: "Guida VFRNav EFB - MSFS 2024",
            description: "Scopri come installare e usare MSFS2024 VFRNav con mappe, carte, piani di volo, navlog e informazioni meteo.",
            language: "Lingua",
            navLabel: "Navigazione principale",
            nav: ["Panoramica", "Funzioni", "Installazione", "Uso", "Comandi", "Assistenza"],
            hero: [
               "Un assistente di cabina per il VFR",
               "Pianifica la rotta. Vola con consapevolezza.",
               "VFRNav aggiunge mappe, carte aeroportuali, PDF e strumenti di pianificazione all'EFB integrato di Microsoft Flight Simulator 2024. È pensato per il VFR e supporta anche l'IFR.",
               "Scarica da Flightsim.to",
               "Come usare VFRNav",
               "Gratuito e sviluppato dalla community. Installa il pacchetto Community oppure l'installer, non entrambi."
            ],
            route: ["PIANO DI VOLO / MAPPA VFR", "Panoramica rotta", "Mappa e navlog insieme", "PIANIFICA / VOLA / RIVEDI"],
            workflow: ["Per iniziare", "Scegli un pacchetto su Flightsim.to, apri VFRNav dall'EFB del simulatore e usa gli strumenti adatti al tuo volo."],
            steps: [
               "Scegli il pacchetto Legacy Community oppure l'installer nella sezione download di Flightsim.to.",
               "Avvia MSFS 2024, apri il launcher delle app EFB e seleziona VFRNav.",
               "Prepara rotta, livelli mappa, carte e navlog prima o durante il volo.",
               "Consulta le informazioni aeroportuali in volo e rivedi la traccia registrata dopo l'atterraggio."
            ],
            features: ["Funzioni dell'EFB", "Pianifica i voli, consulta i riferimenti in cabina e rivedi le rotte con uno strumento integrato.", "Mappe VFR OACI, Google, OpenStreetMap e altimetriche; i livelli VFR sono attivi per impostazione predefinita.", "Consulta carte VAC e PDF in cabina; scarica le VAC francesi dal SIA o aggiungi file locali tramite il server.", "Sovrapponi il piano di volo alla mappa, genera navlog e trasferisci i piani con il server VFRNav.", "Registra i voli e rivedi la rotta in seguito; puoi importare o esportare navlog e dati sulle prestazioni dell'aeromobile.", "Consulta informazioni aeroportuali e meteo METAR/TAF dall'EFB.", efbModes["it"].summary],
            install: [
               "Opzioni di installazione",
               "Scarica il pacchetto da Flightsim.to e segui le istruzioni incluse nella versione scelta.",
               "Legacy Community: inserisci il pacchetto nella cartella Community di MSFS 2024, avvia il simulatore e apri il suo EFB.",
               "Installer: eseguilo e segui le istruzioni. Include il server VFRNav e abilita funzioni aggiuntive per file ed EFB esterno.",
               "Importante: installa una sola versione per volta. L'accesso esterno via browser/dispositivo è ancora in sviluppo e le relative impostazioni non sono persistenti."
            ],
            using: [
               "Usare l'EFB",
               "Guida pratica alle principali funzioni e attività dell'add-on.",
               [
                  ["Aprire e configurare VFRNav", "Avvia VFRNav dal launcher delle app EFB del simulatore. Le impostazioni generali includono dimensione, orientamento, luminosità, unità e preferiti. In VR la pagina consiglia Grande e Orizzontale."],
                  ["Pianificare con la mappa", "Scegli i livelli e regola la visibilità. Segui la posizione dell'aeromobile, aggiungi rotta e waypoint e usa i dettagli cartografici o i cerchi di raggio per valutare l'area."],
                  ["Trovare e leggere documenti", "Il pannello offre le fonti Local, SIA, TEMSI e Weather Fronts. Per una carta VAC francese SIA, inserisci il codice ICAO dell'aeroporto e scaricala. Apri i PDF nel visualizzatore; per caricare file locali serve il server."],
                  ["Usare il navlog", "Consulta waypoint, quota, orario stimato e carburante. La vista prestazioni include deviazione della bussola e consumo. Il server supporta import/export di file e trasferimento dei piani."],
                  ["Controllare meteo e spazio aereo", "Apri le informazioni aeroportuali per METAR e TAF. La mappa può mostrare le zone di attività AZBA; seleziona una zona per verificarne orari, limiti verticali e note."],
                  ["Rivedere il volo", "Apri un volo registrato per visualizzare traccia e registrazioni salvate. Nella mappa di revisione, Alt + Maiusc + trascinamento ruota la vista, l'omino cambia il punto di osservazione e i cursori regolano la visualizzazione. Il server offre anche un EFB esterno."]
               ]
            ],
            controls: [
               "Comandi del mouse e PDF",
               "I gesti EFB seguenti valgono in modalità 2D. I gesti PDF si applicano quando è aperto un documento.",
               [
                  "Ctrl + trascina con il tasto sinistro: sposta l'EFB in modalità 2D.",
                  "Ctrl + Maiusc + trascina con il tasto sinistro: regola l'area visibile dell'EFB.",
                  "Alt + trascina: sposta l'EFB nell'area del simulatore.",
                  "Ctrl + Maiusc + clic destro: ripristina la dimensione predefinita. Ctrl + Alt + clic destro: ricarica il sistema operativo dell'EFB.",
                  "PDF: rotella per scorrere in verticale, Ctrl + rotella in orizzontale, Alt o Maiusc + rotella o pulsanti +/- per zoomare. Clicca e trascina con la rotella premuta per spostare la pagina."
               ]
            ],
            notes: [
               "Limiti e trasparenza",
               "Leggi queste note sulle funzioni PDF e ridimensionamento.",
               [
                  ["Visualizzazione PDF", "Il simulatore usa un browser integrato datato, quindi alcuni PDF possono essere visualizzati in modo errato. Zooma per forzare il ridisegno. I PDF molto grandi, come i manuali, possono bloccare il simulatore."],
                  ["Ridimensionamento EFB", "Questa soluzione modifica l'area visibile, non la dimensione effettiva dell'EFB. Gli elementi dietro l'EFB potrebbero restare non cliccabili."],
                  ["Rapporti antivirus", "Alcuni antivirus euristici possono segnalare erroneamente l'installer compresso. Prima di installare, consulta i risultati VirusTotal per versione e il codice sorgente pubblico."],
                  ["EFB esterno", "Il supporto per browser e dispositivi esterni è ancora in sviluppo. Le impostazioni dell'EFB esterno non sono ancora persistenti."]
               ]
            ],
            support: [
               "Download e assistenza",
               "Scarica VFRNav da Flightsim.to. Usa i link del progetto per documentazione, feedback, community e codice sorgente.",
               ["Scarica da Flightsim.to", "Wiki di installazione e utilizzo", "Segnala un problema o suggerisci un miglioramento", "Discord della community", "Codice sorgente", "Invia feedback sull'app standalone"],
               "MSFS2024 VFRNav è un progetto gratuito della community. Microsoft Flight Simulator è un marchio di Microsoft.",
               "Rapporti VirusTotal"
            ]
         },
         ja: {
            title: "VFRNav EFB ガイド - MSFS 2024",
            description: "MSFS2024 VFRNav のインストール方法と、地図、チャート、フライトプラン、ナブログ、気象情報の使い方を紹介します。",
            language: "言語",
            navLabel: "メインナビゲーション",
            nav: ["概要", "機能", "インストール", "使い方", "操作", "サポート"],
            hero: [
               "VFRフライトのためのコックピットツール",
               "ルートを計画し、景色を楽しむ。",
               "VFRNav は Microsoft Flight Simulator 2024 の統合 EFB に、地図、空港チャート、PDF、フライト計画ツールを追加します。VFR向けに設計され、IFRにも対応します。",
               "Flightsim.to からダウンロード",
               "VFRNav の使い方",
               "無料のコミュニティ製アドオンです。Community パッケージかインストーラーのどちらか一方をインストールしてください。"
            ],
            route: ["フライトプラン / VFR地図", "ルート概要", "地図とナブログ", "計画 / 飛行 / 振り返り"],
            workflow: ["まずはこちら", "Flightsim.to でパッケージを選び、シミュレーターの EFB から VFRNav を開いて、フライトに必要なツールを使います。"],
            steps: [
               "Flightsim.to のダウンロード欄で Legacy Community パッケージまたはインストーラーを選びます。",
               "MSFS 2024 を起動し、EFB アプリランチャーから VFRNav を選択します。",
               "フライトの前または最中に、ルート、地図レイヤー、チャート、ナブログを準備します。",
               "飛行中に空港情報を確認し、着陸後に記録したルートを振り返ります。"
            ],
            features: ["EFBの機能", "統合ツールでフライトを計画し、コックピットで資料を確認して、ルートを振り返ることができます。", "OACI、Google、OpenStreetMap、標高などのVFR地図を利用できます。初期状態ではVFRレイヤーが表示されます。", "コックピットでVACチャートやPDFを表示できます。SIAからフランスのVACを取得したり、サーバー経由でローカルファイルを追加できます。", "地図にフライトプランを重ね、ナブログを作成し、VFRNavサーバー経由でプランを転送できます。", "フライトを記録して後からルートを確認できます。ナブログや機体性能データのインポート/エクスポートにも対応します。", "EFBで空港情報やMETAR、TAFなどの気象情報を確認できます。", efbModes["ja"].summary],
            install: [
               "インストール方法",
               "Flightsim.to からパッケージをダウンロードし、同梱の手順に従ってください。",
               "Legacy Community: MSFS 2024 の Community フォルダーに配置し、シミュレーターを起動してEFBを開きます。",
               "Installer: 実行して画面の指示に従います。VFRNavサーバーが含まれ、ファイル連携や外部EFB機能を利用できます。",
               "重要: 同時にインストールするのは1種類だけです。外部ブラウザー/デバイス対応は開発中で、外部EFBの設定はまだ保存されません。"
            ],
            using: [
               "EFBの使い方",
               "アドオンの主な機能と操作をテキストで説明します。",
               [
                  ["VFRNavを開いて設定する", "シミュレーターのEFBアプリランチャーからVFRNavを起動します。一般設定では表示サイズ、向き、明るさ、単位、お気に入りを設定できます。VRでは「Large」と「Horizontal」が推奨されています。"],
                  ["地図でルートを計画する", "地図レイヤーを選び、表示を調整します。機体位置を確認し、ルートやウェイポイントを表示して、チャートの詳細や範囲表示で周辺を把握します。"],
                  ["チャートや書類を開く", "書類パネルには Local、SIA、TEMSI、Weather Fronts などのソースがあります。フランスのSIA VACは空港のICAOコードを入力してダウンロードします。PDFをビューアーで開きます。ローカルファイルのアップロードにはサーバーが必要です。"],
                  ["ナブログを使う", "ウェイポイント、高度、到着予定時刻、燃料を確認します。性能画面にはコンパス偏差と燃料消費データがあります。サーバーではファイルのインポート/エクスポートとプラン転送ができます。"],
                  ["気象と空域を確認する", "空港情報からMETARとTAFを確認します。地図にはAZBA活動区域が表示され、選択すると活動時間、高度上限/下限、備考を確認できます。"],
                  ["フライトを振り返る", "記録済みフライトを開くと航跡と保存記録を確認できます。レビュー地図では Alt + Shift + ドラッグで回転し、地図上の人物アイコンで視点を変更、スライダーで表示を調整します。サーバーから外部EFBも利用できます。"]
               ]
            ],
            controls: [
               "マウスとPDFの操作",
               "以下のEFB操作は2Dモード用です。PDF操作は文書を開いているときに使用します。",
               [
                  "Ctrl + 左ドラッグ: 2DモードでEFBを移動します。",
                  "Ctrl + Shift + 左ドラッグ: EFBの表示範囲を調整します。",
                  "Alt + ドラッグ: シミュレーター内でEFBを移動します。",
                  "Ctrl + Shift + 右クリック: 既定サイズに戻します。Ctrl + Alt + 右クリック: EFBのOSを再読み込みします。",
                  "PDF: ホイールで縦スクロール、Ctrl + ホイールで横スクロール、Alt/Shift + ホイールまたは +/- ボタンでズームします。ホイールボタンを押しながらドラッグすると移動できます。"
               ]
            ],
            notes: [
               "制限事項と透明性",
               "PDF表示とサイズ変更について、次の注意点をご確認ください。",
               [
                  ["PDFの表示", "シミュレーターの内蔵ブラウザーは古いため、PDFが正しく表示されない場合があります。ズームすると再描画されます。マニュアルなど大きなPDFはシミュレーターがクラッシュする可能性があります。"],
                  ["EFBのサイズ変更", "この回避策はEFB自体ではなく表示範囲を変更します。EFBの背後にある項目をクリックできない場合があります。"],
                  ["ウイルス対策レポート", "一部のヒューリスティック型ウイルス対策ソフトが圧縮インストーラーを誤検知する場合があります。インストール前に各バージョンのVirusTotal結果と公開ソースコードをご確認ください。"],
                  ["外部EFB", "外部ブラウザーやデバイスへの対応は開発中です。外部EFBの設定はまだ保持されません。"]
               ]
            ],
            support: [
               "ダウンロードとサポート",
               "Flightsim.to からダウンロードしてください。ドキュメント、フィードバック、コミュニティ、ソースコードはプロジェクトリンクをご利用ください。",
               ["Flightsim.to からダウンロード", "インストールと使用方法のWiki", "問題の報告・改善提案", "コミュニティDiscord", "ソースコード", "スタンドアロン版について意見を送る"],
               "MSFS2024 VFRNav は無料のコミュニティプロジェクトです。Microsoft Flight Simulator は Microsoft の商標です。",
               "VirusTotal レポート"
            ]
         },
         nl: {
            title: "VFRNav EFB-handleiding - MSFS 2024",
            description: "Leer MSFS2024 VFRNav installeren en gebruiken voor kaarten, vliegplannen, navigatielogboeken en weersinformatie.",
            language: "Taal",
            navLabel: "Hoofdnavigatie",
            nav: ["Overzicht", "Functies", "Installeren", "Gebruik", "Bediening", "Support"],
            hero: [
               "Een cockpitmaatje voor VFR",
               "Plan de route. Houd overzicht.",
               "VFRNav voegt kaarten, luchthavenkaarten, pdf's en vluchtplanning toe aan de geïntegreerde EFB van Microsoft Flight Simulator 2024. Het is gemaakt voor VFR en ondersteunt ook IFR.",
               "Downloaden op Flightsim.to",
               "VFRNav gebruiken",
               "Gratis en gemaakt door de community. Installeer het Community-pakket of de installer, niet allebei."
            ],
            route: ["VLIEGPLAN / VFR-KAART", "Routeoverzicht", "Kaart en navigatielogboek", "PLANNEN / VLIEGEN / TERUGKIJKEN"],
            workflow: ["Aan de slag", "Kies een pakket op Flightsim.to, open VFRNav vanuit de EFB van de simulator en gebruik de hulpmiddelen voor je vlucht."],
            steps: [
               "Kies in het downloadgedeelte van Flightsim.to het Legacy Community-pakket of de installer.",
               "Start MSFS 2024, open de EFB-appstarter en selecteer VFRNav.",
               "Bereid route, kaartlagen, kaarten en navigatielogboek voor of tijdens de vlucht voor.",
               "Bekijk luchthaveninformatie tijdens de vlucht en controleer na de landing de opgenomen route."
            ],
            features: ["EFB-functies", "Plan vluchten, raadpleeg cockpitinformatie en bekijk routes met een geïntegreerd hulpmiddel.", "VFR-kaarten van OACI, Google, OpenStreetMap en hoogtebronnen; VFR-lagen zijn standaard ingeschakeld.", "Bekijk VAC-kaarten en pdf's in de cockpit; download Franse VAC-kaarten via SIA of voeg lokale bestanden toe met de server.", "Toon het vliegplan op de kaart, maak navigatielogboeken en draag plannen over via de VFRNav-server.", "Neem vluchten op en bekijk de route achteraf; logboeken en prestatiegegevens kunnen ook worden geïmporteerd en geëxporteerd.", "Bekijk luchthavengegevens en METAR-/TAF-weerinformatie in de EFB.", efbModes["nl"].summary],
            install: [
               "Installatieopties",
               "Download het pakket op Flightsim.to en volg de instructies bij die versie.",
               "Legacy Community: plaats het pakket in de Community-map van MSFS 2024, start daarna de simulator en open de EFB.",
               "Installer: voer deze uit en volg de stappen. De VFRNav-server is inbegrepen voor extra bestands- en externe-EFB-functies.",
               "Belangrijk: installeer slechts één versie tegelijk. Externe toegang via browser/apparaat is nog in ontwikkeling en externe EFB-instellingen worden nog niet bewaard."
            ],
            using: [
               "De EFB gebruiken",
               "Een praktische tekstgids voor de belangrijkste functies en taken van de add-on.",
               [
                  ["VFRNav openen en instellen", "Start VFRNav vanuit de EFB-appstarter van de simulator. Algemene instellingen omvatten formaat, richting, helderheid, eenheden en favorieten. Voor VR raadt de pagina Groot en Horizontaal aan."],
                  ["De route op de kaart plannen", "Kies kaartlagen en stel de zichtbaarheid in. Volg de vliegtuigpositie, toon de route en waypoints en gebruik kaartdetails of bereikcirkels om het gebied te beoordelen."],
                  ["Documenten vinden en lezen", "Het documentenpaneel biedt Local, SIA, TEMSI en Weather Fronts. Voer voor een Franse SIA-VAC-kaart de ICAO-code van het vliegveld in en download de kaart. Pdf's openen in de viewer; voor lokale uploads is de server nodig."],
                  ["Het navigatielogboek gebruiken", "Bekijk waypoints, hoogte, verwachte tijd en brandstof. De prestatiepagina toont kompasafwijking en brandstofverbruik. De server ondersteunt bestandsimport/export en planoverdracht."],
                  ["Weer en luchtruim controleren", "Open luchthaveninformatie voor METAR en TAF. De kaart kan AZBA-activiteitsgebieden tonen; selecteer een zone voor tijdvenster, hoogtegrenzen en opmerkingen."],
                  ["De vlucht terugkijken", "Open een opgenomen vlucht voor de track en opgeslagen registraties. In de kaartweergave draait Alt + Shift + slepen de kaart, het kaartmannetje verandert het standpunt en schuifregelaars passen de weergave aan. De server biedt ook een externe EFB."]
               ]
            ],
            controls: [
               "Muis- en pdf-bediening",
               "De EFB-bewegingen hieronder gelden in 2D-modus. Pdf-bewegingen gelden wanneer een document geopend is.",
               [
                  "Ctrl + slepen met de linkermuisknop: verplaats de EFB in 2D.",
                  "Ctrl + Shift + slepen met de linkermuisknop: pas het zichtbare EFB-gebied aan.",
                  "Alt + slepen: verplaats de EFB in het simulatorgebied.",
                  "Ctrl + Shift + rechtsklik: herstel de standaardgrootte. Ctrl + Alt + rechtsklik: herlaad het EFB-besturingssysteem.",
                  "Pdf's: muiswiel voor verticaal scrollen, Ctrl + wiel voor horizontaal scrollen en Alt/Shift + wiel of +/- knoppen om te zoomen. Klik en sleep met de wielknop om te pannen."
               ]
            ],
            notes: [
               "Beperkingen en transparantie",
               "Lees deze opmerkingen over pdf's en het aanpassen van het formaat.",
               [
                  ["Pdf-weergave", "De simulator gebruikt een oudere ingebouwde browser, waardoor pdf's soms verkeerd worden weergegeven. Zoom in of uit om opnieuw te tekenen. Zeer grote pdf's, zoals handleidingen, kunnen de simulator laten vastlopen."],
                  ["EFB-formaat", "Deze workaround verandert het zichtbare gebied, niet de werkelijke EFB-grootte. Elementen achter de EFB zijn mogelijk niet aanklikbaar."],
                  ["Antivirusrapporten", "Sommige heuristische antivirusprogramma's kunnen de gecomprimeerde installer ten onrechte markeren. Bekijk de VirusTotal-resultaten per versie en de openbare broncode voordat je installeert."],
                  ["Externe EFB", "Ondersteuning voor externe browsers en apparaten is nog in ontwikkeling. Instellingen in de externe EFB worden nog niet bewaard."]
               ]
            ],
            support: [
               "Downloads en support",
               "Download VFRNav op Flightsim.to. Gebruik de projectlinks voor documentatie, feedback, community en broncode.",
               ["Downloaden op Flightsim.to", "Installatie- en gebruikswiki", "Probleem melden of verbetering voorstellen", "Community-Discord", "Broncode", "Feedback over de standalone-app geven"],
               "MSFS2024 VFRNav is een gratis communityproject. Microsoft Flight Simulator is een handelsmerk van Microsoft.",
               "VirusTotal-rapporten"
            ]
         },
         pl: {
            title: "Przewodnik VFRNav EFB - MSFS 2024",
            description: "Dowiedz się, jak zainstalować i używać MSFS2024 VFRNav: mapy, plany lotu, navlogi i informacje pogodowe.",
            language: "Język",
            navLabel: "Nawigacja główna",
            nav: ["Przegląd", "Funkcje", "Instalacja", "Obsługa", "Sterowanie", "Pomoc"],
            hero: [
               "Kokpitowy pomocnik do lotów VFR",
               "Zaplanuj trasę. Zachowaj orientację.",
               "VFRNav dodaje mapy, karty lotnisk, pliki PDF i narzędzia planowania lotu do wbudowanego EFB w Microsoft Flight Simulator 2024. Jest przeznaczony do VFR, obsługuje też IFR.",
               "Pobierz z Flightsim.to",
               "Jak używać VFRNav",
               "Bezpłatny dodatek tworzony przez społeczność. Zainstaluj pakiet Community albo instalator, nie oba."
            ],
            route: ["PLAN LOTU / MAPA VFR", "Przegląd trasy", "Mapa i navlog razem", "PLANUJ / LEC / SPRAWDŹ"],
            workflow: ["Zacznij tutaj", "Wybierz pakiet na Flightsim.to, otwórz VFRNav z EFB symulatora i korzystaj z narzędzi przydatnych podczas lotu."],
            steps: [
               "W sekcji pobierania Flightsim.to wybierz pakiet Legacy Community albo instalator.",
               "Uruchom MSFS 2024, otwórz launcher aplikacji EFB i wybierz VFRNav.",
               "Przygotuj trasę, warstwy mapy, karty i navlog przed lotem lub w jego trakcie.",
               "Podczas lotu sprawdzaj informacje o lotnisku, a po lądowaniu przejrzyj zapisaną trasę."
            ],
            features: ["Możliwości EFB", "Planuj loty, korzystaj z materiałów w kokpicie i analizuj trasy w jednym zintegrowanym narzędziu.", "Mapy VFR OACI, Google, OpenStreetMap i wysokościowe; warstwy VFR są domyślnie włączone.", "Wyświetlaj karty VAC i PDF w kokpicie; pobieraj francuskie karty VAC z SIA lub dodawaj pliki lokalne przez serwer.", "Nakładaj plan lotu na mapę, twórz navlogi i przesyłaj plany przez serwer VFRNav.", "Nagrywaj loty i później sprawdzaj trasę; navlogi i dane osiągów samolotu można importować i eksportować.", "Sprawdzaj informacje o lotnisku oraz pogodę METAR i TAF w EFB.", efbModes["pl"].summary],
            install: [
               "Opcje instalacji",
               "Pobierz pakiet z Flightsim.to i postępuj zgodnie z instrukcjami dołączonymi do danej wersji.",
               "Legacy Community: umieść pakiet w folderze Community MSFS 2024, uruchom symulator i otwórz jego EFB.",
               "Instalator: uruchom go i wykonaj podane kroki. Zawiera serwer VFRNav oraz dodatkowe funkcje plików i zewnętrznego EFB.",
               "Ważne: instaluj tylko jedną wersję naraz. Obsługa zewnętrznej przeglądarki/urządzeń jest w trakcie rozwoju, a ustawienia zewnętrznego EFB nie są jeszcze zapisywane."
            ],
            using: [
               "Korzystanie z EFB",
               "Praktyczny tekstowy przewodnik po najważniejszych funkcjach i zadaniach dodatku.",
               [
                  ["Otwieranie i konfiguracja VFRNav", "Uruchom VFRNav z launchera aplikacji EFB symulatora. Ustawienia ogólne obejmują rozmiar, orientację, jasność, jednostki i ulubione aplikacje. W VR opis zaleca ustawienia duży i poziomy."],
                  ["Planowanie trasy na mapie", "Wybierz warstwy mapy i ustaw ich widoczność. Śledź pozycję samolotu, wyświetl trasę i punkty nawigacyjne, korzystaj ze szczegółów mapy i okręgów zasięgu."],
                  ["Wyszukiwanie i czytanie dokumentów", "Panel dokumentów oferuje źródła Local, SIA, TEMSI i Weather Fronts. Aby pobrać francuską kartę VAC z SIA, wpisz kod ICAO lotniska. PDF otwiera się w czytniku; lokalne przesyłanie plików wymaga serwera."],
                  ["Korzystanie z navlogu", "Sprawdzaj punkty nawigacyjne, wysokość, szacowany czas i paliwo. Widok osiągów zawiera wykres odchylenia kompasu i zużycie paliwa. Serwer obsługuje import/eksport plików i przesyłanie planów."],
                  ["Pogoda i przestrzeń powietrzna", "Otwórz informacje o lotnisku, aby sprawdzić METAR i TAF. Mapa może pokazywać obszary aktywności AZBA; wybierz strefę, aby sprawdzić czas, dolną i górną granicę oraz uwagi."],
                  ["Przegląd lotu", "Otwórz nagrany lot, aby zobaczyć ślad i zapisane dane. Na mapie przeglądu Alt + Shift + przeciągnięcie obraca widok, ikona osoby zmienia punkt widzenia, a suwaki regulują wyświetlanie. Serwer udostępnia też zewnętrzne EFB."]
               ]
            ],
            controls: [
               "Sterowanie myszą i PDF",
               "Poniższe gesty EFB działają w trybie 2D. Gesty PDF dotyczą otwartego dokumentu.",
               [
                  "Ctrl + przeciągnięcie lewym przyciskiem: przesuń EFB w trybie 2D.",
                  "Ctrl + Shift + przeciągnięcie lewym przyciskiem: zmień widoczny obszar EFB.",
                  "Alt + przeciągnięcie: przesuń EFB w obszarze symulatora.",
                  "Ctrl + Shift + prawy przycisk: przywróć domyślny rozmiar. Ctrl + Alt + prawy przycisk: przeładuj system EFB.",
                  "PDF: kółko myszy przewija pionowo, Ctrl + kółko poziomo, Alt/Shift + kółko lub przyciski +/- zmieniają powiększenie. Kliknij i przeciągnij kółkiem, aby przesunąć stronę."
               ]
            ],
            notes: [
               "Ograniczenia i przejrzystość",
               "Przeczytaj uwagi dotyczące PDF i zmiany rozmiaru.",
               [
                  ["Wyświetlanie PDF", "Symulator korzysta ze starszej wbudowanej przeglądarki, więc PDF może czasem wyświetlać się niepoprawnie. Zmień powiększenie, aby wymusić odświeżenie. Bardzo duże pliki, np. instrukcje, mogą zawiesić symulator."],
                  ["Zmiana rozmiaru EFB", "To obejście zmienia widoczny obszar, a nie rzeczywisty rozmiar EFB. Elementy za EFB mogą pozostać nieklikalne."],
                  ["Raporty antywirusowe", "Niektóre heurystyczne programy antywirusowe mogą błędnie oznaczyć skompresowany instalator. Przed instalacją sprawdź raporty VirusTotal dla wersji i publiczny kod źródłowy."],
                  ["Zewnętrzne EFB", "Obsługa zewnętrznych przeglądarek i urządzeń jest w trakcie rozwoju. Ustawienia zewnętrznego EFB nie są jeszcze trwałe."]
               ]
            ],
            support: [
               "Pobieranie i pomoc",
               "Pobierz VFRNav z Flightsim.to. Linki projektu prowadzą do dokumentacji, opinii, społeczności i kodu źródłowego.",
               ["Pobierz z Flightsim.to", "Wiki instalacji i obsługi", "Zgłoś problem lub zaproponuj ulepszenie", "Discord społeczności", "Kod źródłowy", "Przekaż opinię o aplikacji standalone"],
               "MSFS2024 VFRNav to bezpłatny projekt społeczności. Microsoft Flight Simulator jest znakiem towarowym Microsoft.",
               "Raporty VirusTotal"
            ]
         },
         pt: {
            title: "Guia VFRNav EFB - MSFS 2024",
            description: "Saiba como instalar e utilizar o MSFS2024 VFRNav com mapas, cartas, planos de voo, navlogs e meteorologia.",
            language: "Idioma",
            navLabel: "Navegação principal",
            nav: ["Visão geral", "Funcionalidades", "Instalação", "Utilização", "Controlos", "Suporte"],
            hero: [
               "Um companheiro de cockpit para VFR",
               "Planeie a rota. Mantenha o contexto.",
               "O VFRNav adiciona mapas, cartas de aeródromo, PDFs e ferramentas de planeamento ao EFB integrado do Microsoft Flight Simulator 2024. Foi concebido para VFR e também suporta IFR.",
               "Transferir em Flightsim.to",
               "Como utilizar o VFRNav",
               "Gratuito e desenvolvido pela comunidade. Instale o pacote Community ou o instalador, nunca ambos."
            ],
            route: ["PLANO DE VOO / MAPA VFR", "Visão da rota", "Mapa e navlog em conjunto", "PLANEAR / VOAR / REVER"],
            workflow: ["Comece aqui", "Escolha um pacote em Flightsim.to, abra o VFRNav no EFB do simulador e use as ferramentas adequadas ao seu voo."],
            steps: [
               "Escolha o pacote Legacy Community ou o instalador na secção de transferências do Flightsim.to.",
               "Inicie o MSFS 2024, abra o launcher de aplicações do EFB e selecione VFRNav.",
               "Prepare a rota, as camadas do mapa, as cartas e o navlog antes ou durante o voo.",
               "Consulte informações do aeródromo durante o voo e reveja a rota gravada depois de aterrar."
            ],
            features: ["Funcionalidades do EFB", "Planeie voos, consulte referências no cockpit e reveja rotas com uma ferramenta integrada.", "Mapas VFR OACI, Google, OpenStreetMap e de elevação; as camadas VFR são apresentadas por predefinição.", "Consulte cartas VAC e PDFs no cockpit; transfira cartas VAC francesas do SIA ou adicione ficheiros locais com o servidor.", "Sobreponha o plano de voo no mapa, gere navlogs e transfira planos através do servidor VFRNav.", "Grave voos e reveja a rota mais tarde; também pode importar e exportar navlogs e dados de desempenho da aeronave.", "Consulte informações do aeródromo e meteorologia METAR/TAF no EFB.", efbModes["pt"].summary],
            install: [
               "Opções de instalação",
               "Transfira o pacote em Flightsim.to e siga as instruções incluídas nessa versão.",
               "Legacy Community: coloque o pacote na pasta Community do MSFS 2024, inicie o simulador e abra o EFB.",
               "Instalador: execute-o e siga os passos. Inclui o servidor VFRNav e funcionalidades adicionais para ficheiros e EFB externo.",
               "Importante: instale apenas uma versão de cada vez. O acesso externo por browser/dispositivo ainda está em desenvolvimento e as definições do EFB externo ainda não são persistentes."
            ],
            using: [
               "Utilizar o EFB",
               "Guia prático em texto sobre as principais funções e tarefas do complemento.",
               [
                  ["Abrir e configurar o VFRNav", "Abra o VFRNav no launcher de aplicações do EFB do simulador. As definições gerais incluem tamanho, orientação, brilho, unidades e favoritos. Para VR, a página recomenda Grande e Horizontal."],
                  ["Planear com o mapa", "Escolha camadas e ajuste a respetiva visibilidade. Acompanhe a posição da aeronave, apresente a rota e os pontos de passagem e use detalhes cartográficos ou círculos de alcance."],
                  ["Encontrar e ler documentos", "O painel oferece as fontes Local, SIA, TEMSI e Weather Fronts. Para uma carta VAC francesa do SIA, introduza o código ICAO do aeródromo e transfira-a. Abra PDFs no visualizador; o carregamento de ficheiros locais requer o servidor."],
                  ["Utilizar o navlog", "Consulte pontos de passagem, altitude, hora prevista e combustível. A vista de desempenho inclui desvio da bússola e consumo. O servidor permite importar/exportar ficheiros e transferir planos."],
                  ["Consultar meteorologia e espaço aéreo", "Abra as informações do aeródromo para consultar METAR e TAF. O mapa pode apresentar zonas AZBA; selecione uma zona para ver horários de atividade, limites de altitude e notas."],
                  ["Rever o voo", "Abra um voo gravado para ver a trajetória e os registos guardados. Na revisão do mapa, Alt + Shift + arrastar roda a vista, o ícone de pessoa altera o ponto de vista e os controlos deslizantes ajustam a apresentação. O servidor também oferece um EFB externo."]
               ]
            ],
            controls: [
               "Controlos do rato e PDF",
               "Os gestos do EFB aplicam-se ao modo 2D. Os gestos PDF aplicam-se com um documento aberto.",
               [
                  "Ctrl + arrastar com o botão esquerdo: mover o EFB no modo 2D.",
                  "Ctrl + Shift + arrastar com o botão esquerdo: ajustar a área visível do EFB.",
                  "Alt + arrastar: mover o EFB na área do simulador.",
                  "Ctrl + Shift + clique direito: restaurar o tamanho predefinido. Ctrl + Alt + clique direito: recarregar o sistema operativo do EFB.",
                  "PDF: roda para deslocar verticalmente, Ctrl + roda para horizontalmente e Alt/Shift + roda ou botões +/- para ampliar. Clique e arraste com o botão da roda para mover a página."
               ]
            ],
            notes: [
               "Limitações e transparência",
               "Leia estas notas sobre PDFs e redimensionamento.",
               [
                  ["Apresentação de PDF", "O simulador utiliza um browser integrado antigo, pelo que alguns PDFs podem ser apresentados incorretamente. Altere o zoom para forçar uma nova apresentação. PDFs muito grandes, como manuais, podem bloquear o simulador."],
                  ["Redimensionar o EFB", "Esta solução altera a área visível, não o tamanho real do EFB. Os elementos por trás do EFB podem continuar sem aceitar cliques."],
                  ["Relatórios antivírus", "Alguns antivírus heurísticos podem sinalizar incorretamente o instalador comprimido. Consulte os resultados VirusTotal por versão e o código-fonte público antes de instalar."],
                  ["EFB externo", "O suporte para browsers e dispositivos externos ainda está em desenvolvimento. As definições do EFB externo ainda não são guardadas."]
               ]
            ],
            support: [
               "Transferências e suporte",
               "Transfira o VFRNav em Flightsim.to. Utilize as ligações do projeto para documentação, feedback, comunidade e código-fonte.",
               ["Transferir em Flightsim.to", "Wiki de instalação e utilização", "Comunicar um problema ou sugerir uma melhoria", "Discord da comunidade", "Código-fonte", "Enviar feedback sobre a aplicação autónoma"],
               "O MSFS2024 VFRNav é um projeto gratuito da comunidade. Microsoft Flight Simulator é uma marca registada da Microsoft.",
               "Relatórios VirusTotal"
            ]
         },
         "pt-BR": {
            title: "Guia do VFRNav EFB - MSFS 2024",
            description: "Saiba como instalar e usar o MSFS2024 VFRNav com mapas, cartas, planos de voo, navlogs e informações meteorológicas.",
            language: "Idioma",
            navLabel: "Navegação principal",
            nav: ["Visão geral", "Recursos", "Instalação", "Como usar", "Controles", "Suporte"],
            hero: [
               "Um companheiro de cockpit para VFR",
               "Planeje a rota. Voe com contexto.",
               "O VFRNav adiciona mapas, cartas de aeródromo, PDFs e ferramentas de planejamento ao EFB integrado do Microsoft Flight Simulator 2024. Foi criado para VFR e também oferece suporte a IFR.",
               "Baixar no Flightsim.to",
               "Como usar o VFRNav",
               "Gratuito e feito pela comunidade. Instale o pacote Community ou o instalador, nunca os dois."
            ],
            route: ["PLANO DE VOO / MAPA VFR", "Visão da rota", "Mapa e navlog juntos", "PLANEJAR / VOAR / REVISAR"],
            workflow: ["Comece por aqui", "Escolha um pacote no Flightsim.to, abra o VFRNav pelo EFB do simulador e use as ferramentas adequadas ao seu voo."],
            steps: [
               "Escolha o pacote Legacy Community ou o instalador na área de downloads do Flightsim.to.",
               "Inicie o MSFS 2024, abra o launcher de aplicativos do EFB e selecione VFRNav.",
               "Prepare a rota, as camadas do mapa, as cartas e o navlog antes ou durante o voo.",
               "Consulte informações do aeródromo durante o voo e revise a rota gravada após o pouso."
            ],
            features: ["Recursos do EFB", "Planeje voos, consulte referências no cockpit e revise rotas com uma ferramenta integrada.", "Mapas VFR OACI, Google, OpenStreetMap e de elevação; as camadas VFR são exibidas por padrão.", "Consulte cartas VAC e PDFs no cockpit; baixe cartas VAC francesas do SIA ou adicione arquivos locais com o servidor.", "Sobreponha o plano de voo no mapa, gere navlogs e transfira planos pelo servidor VFRNav.", "Grave voos e revise a rota depois; também é possível importar e exportar navlogs e dados de desempenho da aeronave.", "Consulte informações do aeródromo e meteorologia METAR/TAF no EFB.", efbModes["pt-BR"].summary],
            install: [
               "Opções de instalação",
               "Baixe o pacote no Flightsim.to e siga as instruções incluídas na versão escolhida.",
               "Legacy Community: coloque o pacote na pasta Community do MSFS 2024, inicie o simulador e abra o EFB.",
               "Instalador: execute-o e siga as etapas. Ele inclui o servidor VFRNav e libera recursos extras para arquivos e EFB externo.",
               "Importante: instale apenas uma versão por vez. O acesso externo por navegador/dispositivo ainda está em desenvolvimento e as configurações do EFB externo ainda não são persistentes."
            ],
            using: [
               "Como usar o EFB",
               "Guia prático em texto sobre os principais recursos e tarefas do complemento.",
               [
                  ["Abrir e configurar o VFRNav", "Abra o VFRNav pelo launcher de aplicativos do EFB do simulador. As configurações gerais incluem tamanho, orientação, brilho, unidades e favoritos. Para VR, a página recomenda Grande e Horizontal."],
                  ["Planejar com o mapa", "Escolha as camadas e ajuste a visibilidade. Acompanhe a posição da aeronave, mostre a rota e os pontos de passagem e use detalhes cartográficos ou círculos de alcance para entender a região."],
                  ["Encontrar e ler documentos", "O painel oferece as fontes Local, SIA, TEMSI e Weather Fronts. Para uma carta VAC francesa do SIA, informe o código ICAO do aeródromo e baixe a carta. Abra PDFs no visualizador; o envio de arquivos locais exige o servidor."],
                  ["Usar o navlog", "Consulte pontos de passagem, altitude, horário estimado e combustível. A tela de desempenho inclui desvio de bússola e consumo. O servidor permite importar/exportar arquivos e transferir planos."],
                  ["Consultar meteorologia e espaço aéreo", "Abra as informações do aeródromo para ver METAR e TAF. O mapa pode mostrar áreas AZBA; selecione uma zona para consultar horários, limites de altitude e observações."],
                  ["Revisar o voo", "Abra um voo gravado para ver a trajetória e os registros salvos. Na revisão do mapa, Alt + Shift + arrastar gira a visualização, o ícone de pessoa muda o ponto de vista e os controles deslizantes ajustam a exibição. O servidor também oferece um EFB externo."]
               ]
            ],
            controls: [
               "Controles do mouse e PDF",
               "Os gestos do EFB abaixo se aplicam ao modo 2D. Os gestos de PDF valem quando um documento está aberto.",
               [
                  "Ctrl + arrastar com o botão esquerdo: mover o EFB no modo 2D.",
                  "Ctrl + Shift + arrastar com o botão esquerdo: ajustar a área visível do EFB.",
                  "Alt + arrastar: mover o EFB na área do simulador.",
                  "Ctrl + Shift + clique com o botão direito: restaurar o tamanho padrão. Ctrl + Alt + clique direito: recarregar o sistema operacional do EFB.",
                  "PDF: roda do mouse para rolagem vertical, Ctrl + roda para horizontal e Alt/Shift + roda ou botões +/- para zoom. Clique e arraste com o botão da roda para mover a página."
               ]
            ],
            notes: [
               "Limitações e transparência",
               "Leia estas observações sobre PDF e redimensionamento.",
               [
                  ["Exibição de PDF", "O simulador usa um navegador integrado antigo, então alguns PDFs podem ser exibidos incorretamente. Altere o zoom para redesenhar. PDFs muito grandes, como manuais, podem travar o simulador."],
                  ["Redimensionamento do EFB", "Essa solução altera a área visível, não o tamanho real do EFB. Os itens atrás do EFB podem continuar sem receber cliques."],
                  ["Relatórios de antivírus", "Alguns antivírus heurísticos podem sinalizar incorretamente o instalador compactado. Consulte os resultados do VirusTotal por versão e o código-fonte público antes de instalar."],
                  ["EFB externo", "O suporte a navegadores e dispositivos externos ainda está em desenvolvimento. As configurações do EFB externo ainda não são salvas."]
               ]
            ],
            support: [
               "Downloads e suporte",
               "Baixe o VFRNav no Flightsim.to. Use os links do projeto para documentação, feedback, comunidade e código-fonte.",
               ["Baixar no Flightsim.to", "Wiki de instalação e uso", "Relatar um problema ou sugerir uma melhoria", "Discord da comunidade", "Código-fonte", "Enviar feedback sobre o app independente"],
               "O MSFS2024 VFRNav é um projeto gratuito da comunidade. Microsoft Flight Simulator é uma marca da Microsoft.",
               "Relatórios do VirusTotal"
            ]
         },
         ru: {
            title: "Руководство VFRNav EFB - MSFS 2024",
            description: "Узнайте, как установить и использовать MSFS2024 VFRNav: карты, планы полёта, навлоги и метеоданные.",
            language: "Язык",
            navLabel: "Основная навигация",
            nav: ["Обзор", "Возможности", "Установка", "Использование", "Управление", "Поддержка"],
            hero: [
               "Помощник в кабине для полётов VFR",
               "Планируйте маршрут. Следите за обстановкой.",
               "VFRNav добавляет карты, аэродромные схемы, PDF и инструменты планирования во встроенную EFB Microsoft Flight Simulator 2024. Дополнение создано для VFR и также поддерживает IFR.",
               "Скачать на Flightsim.to",
               "Как пользоваться VFRNav",
               "Бесплатный проект сообщества. Установите Community-пакет или установщик, но не оба варианта."
            ],
            route: ["ПЛАН ПОЛЁТА / КАРТА VFR", "Обзор маршрута", "Карта и навлог", "ПЛАН / ПОЛЁТ / АНАЛИЗ"],
            workflow: ["Начало работы", "Выберите пакет на Flightsim.to, откройте VFRNav через EFB симулятора и используйте нужные инструменты во время полёта."],
            steps: [
               "В разделе загрузок Flightsim.to выберите Legacy Community-пакет или установщик.",
               "Запустите MSFS 2024, откройте меню приложений EFB и выберите VFRNav.",
               "Подготовьте маршрут, слои карты, схемы и навлог до полёта или во время него.",
               "Проверяйте данные аэродрома в полёте, а после посадки изучите записанный маршрут."
            ],
            features: ["Возможности EFB", "Планируйте полёты, просматривайте материалы в кабине и анализируйте маршруты в одном инструменте.", "Карты VFR OACI, Google, OpenStreetMap и высотные данные; слои VFR включены по умолчанию.", "Просматривайте схемы VAC и PDF в кабине; загружайте французские VAC с SIA или добавляйте локальные файлы через сервер.", "Показывайте план полёта на карте, создавайте навлоги и передавайте планы через сервер VFRNav.", "Записывайте полёты и анализируйте маршрут после посадки; навлоги и данные характеристик самолёта можно импортировать и экспортировать.", "Проверяйте сведения об аэродроме и погоду METAR/TAF в EFB.", efbModes["ru"].summary],
            install: [
               "Варианты установки",
               "Скачайте пакет на Flightsim.to и следуйте инструкциям для выбранной версии.",
               "Legacy Community: поместите пакет в папку Community MSFS 2024, запустите симулятор и откройте его EFB.",
               "Установщик: запустите и выполните указанные шаги. Он включает сервер VFRNav и дополнительные функции для файлов и внешней EFB.",
               "Важно: устанавливайте только один вариант. Поддержка внешнего браузера/устройств ещё разрабатывается; настройки внешней EFB пока не сохраняются."
            ],
            using: [
               "Работа с EFB",
               "Практическое текстовое руководство по основным функциям и задачам дополнения.",
               [
                  ["Запуск и настройка VFRNav", "Запустите VFRNav из меню приложений EFB симулятора. В общих настройках доступны размер, ориентация, яркость, единицы и избранное. Для VR рекомендуется Large и горизонтальная ориентация."],
                  ["Планирование по карте", "Выбирайте слои карты и настраивайте их видимость. Следите за положением самолёта, показывайте маршрут и точки пути, используйте детали схем и круги дальности для оценки района."],
                  ["Поиск и просмотр документов", "В панели документов доступны источники Local, SIA, TEMSI и Weather Fronts. Для французской схемы VAC SIA введите код ICAO аэродрома и загрузите файл. PDF открываются в просмотрщике; для локальной загрузки файлов нужен сервер."],
                  ["Использование навлога", "Проверяйте точки маршрута, высоту, расчётное время и топливо. На странице характеристик показаны отклонение компаса и расход топлива. Сервер поддерживает импорт/экспорт файлов и передачу планов."],
                  ["Погода и воздушное пространство", "Откройте сведения об аэродроме, чтобы посмотреть METAR и TAF. На карте могут отображаться зоны AZBA; выберите зону, чтобы увидеть время активности, верхнюю и нижнюю границы и примечания."],
                  ["Анализ полёта", "Откройте запись полёта, чтобы посмотреть трек и сохранённые данные. На карте анализа Alt + Shift + перетаскивание вращает карту, значок человека меняет точку обзора, а ползунки настраивают отображение. Сервер также предоставляет внешнюю EFB."]
               ]
            ],
            controls: [
               "Управление мышью и PDF",
               "Жесты EFB ниже действуют в режиме 2D. Жесты PDF работают при открытом документе.",
               [
                  "Ctrl + перетаскивание левой кнопкой: переместить EFB в режиме 2D.",
                  "Ctrl + Shift + перетаскивание левой кнопкой: изменить видимую область EFB.",
                  "Alt + перетаскивание: переместить EFB в области симулятора.",
                  "Ctrl + Shift + правая кнопка: восстановить размер по умолчанию. Ctrl + Alt + правая кнопка: перезагрузить ОС EFB.",
                  "PDF: колесо прокручивает вертикально, Ctrl + колесо — горизонтально, Alt/Shift + колесо или +/- — масштаб. Нажмите и перетаскивайте колесом, чтобы перемещать страницу."
               ]
            ],
            notes: [
               "Ограничения и прозрачность",
               "Ознакомьтесь с особенностями PDF и изменения размера.",
               [
                  ["Отображение PDF", "В симуляторе используется устаревший встроенный браузер, поэтому PDF иногда отображаются неправильно. Измените масштаб, чтобы обновить страницу. Очень большие PDF, например руководства, могут вызвать сбой симулятора."],
                  ["Изменение размера EFB", "Этот обходной способ меняет видимую область, а не фактический размер EFB. Элементы за окном EFB могут оставаться недоступными для нажатия."],
                  ["Антивирусные отчёты", "Некоторые эвристические антивирусы могут ошибочно помечать сжатый установщик. Перед установкой проверьте результаты VirusTotal для версии и открытый исходный код."],
                  ["Внешняя EFB", "Поддержка внешних браузеров и устройств ещё разрабатывается. Настройки внешней EFB пока не сохраняются."]
               ]
            ],
            support: [
               "Загрузки и поддержка",
               "Скачивайте VFRNav на Flightsim.to. Ссылки проекта ведут к документации, обратной связи, сообществу и исходному коду.",
               ["Скачать на Flightsim.to", "Вики по установке и использованию", "Сообщить о проблеме или предложить улучшение", "Discord сообщества", "Исходный код", "Оставить отзыв о standalone-приложении"],
               "MSFS2024 VFRNav — бесплатный проект сообщества. Microsoft Flight Simulator является товарным знаком Microsoft.",
               "Отчёты VirusTotal"
            ]
         },
         sv: {
            title: "VFRNav EFB-guide - MSFS 2024",
            description: "Lär dig installera och använda MSFS2024 VFRNav för kartor, flygplaner, navloggar och väderinformation.",
            language: "Språk",
            navLabel: "Huvudnavigering",
            nav: ["Översikt", "Funktioner", "Installation", "Användning", "Kontroller", "Support"],
            hero: [
               "En cockpitpartner för VFR",
               "Planera rutten. Behåll överblicken.",
               "VFRNav lägger till kartor, flygplatskort, PDF-filer och planeringsverktyg i den integrerade EFB:n i Microsoft Flight Simulator 2024. Tillägget är utformat för VFR och stöder även IFR.",
               "Ladda ner från Flightsim.to",
               "Så använder du VFRNav",
               "Gratis och skapat av communityn. Installera Community-paketet eller installationsprogrammet, inte båda."
            ],
            route: ["FLGPLAN / VFR-KARTA", "Ruttöversikt", "Karta och navlogg", "PLANERA / FLYG / GRANSKA"],
            workflow: ["Kom igång", "Välj ett paket på Flightsim.to, öppna VFRNav från simulatorns EFB och använd verktygen som passar flygningen."],
            steps: [
               "Välj Legacy Community-paketet eller installationsprogrammet i Flightsim.tos nedladdningsdel.",
               "Starta MSFS 2024, öppna EFB-appstartaren och välj VFRNav.",
               "Förbered rutten, kartlager, kort och navlogg före eller under flygningen.",
               "Kontrollera flygplatsinformation under flygningen och granska den inspelade rutten efter landning."
            ],
            features: ["EFB-funktioner", "Planera flygningar, använd cockpitunderlag och granska rutter med ett integrerat verktyg.", "VFR-kartor från OACI, Google, OpenStreetMap och höjdkällor; VFR-lager visas som standard.", "Visa VAC-kort och PDF-filer i cockpit; hämta franska VAC-kort från SIA eller lägg till lokala filer med servern.", "Visa flygplanen på kartan, skapa navloggar och överför planer via VFRNav-servern.", "Spela in flygningar och granska rutten efteråt; navloggar och flygplansdata kan också importeras och exporteras.", "Kontrollera flygplatsinformation och METAR/TAF-väder i EFB:n.", efbModes["sv"].summary],
            install: [
               "Installationsalternativ",
               "Ladda ner paketet från Flightsim.to och följ instruktionerna som medföljer versionen.",
               "Legacy Community: placera paketet i MSFS 2024:s Community-mapp, starta simulatorn och öppna dess EFB.",
               "Installationsprogram: kör det och följ stegen. Det innehåller VFRNav-servern och extra funktioner för filer och extern EFB.",
               "Viktigt: installera bara en version åt gången. Extern åtkomst via webbläsare/enhet utvecklas fortfarande och inställningar i extern EFB sparas ännu inte."
            ],
            using: [
               "Använda EFB:n",
               "En praktisk textguide till tilläggets viktigaste funktioner och uppgifter.",
               [
                  ["Öppna och konfigurera VFRNav", "Starta VFRNav från simulatorns EFB-appstartare. Allmänna inställningar omfattar storlek, orientering, ljusstyrka, enheter och favoriter. För VR rekommenderas Large och liggande orientering."],
                  ["Planera med kartan", "Välj kartlager och justera synligheten. Följ flygplanets position, visa rutten och brytpunkter och använd kartdetaljer eller räckviddscirklar för att förstå området."],
                  ["Hitta och läsa dokument", "Dokumentpanelen erbjuder Local, SIA, TEMSI och Weather Fronts. För ett franskt SIA-VAC-kort anger du flygplatsens ICAO-kod och laddar ner kortet. Öppna PDF i visaren; servern krävs för lokal filuppladdning."],
                  ["Använda navloggen", "Granska brytpunkter, höjd, beräknad tid och bränsle. Prestandavyn visar kompassavvikelse och bränsleförbrukning. Servern stöder filimport/export och planöverföring."],
                  ["Kontrollera väder och luftrum", "Öppna flygplatsinformationen för METAR och TAF. Kartan kan visa AZBA-aktivitetsområden; välj ett område för tider, höjdgränser och information."],
                  ["Granska flygningen", "Öppna en inspelad flygning för att se spår och sparade poster. I kartvyn roterar Alt + Shift + dra kartan, kartpersonen ändrar utsiktspunkt och reglagen justerar visningen. Servern erbjuder även en extern EFB."]
               ]
            ],
            controls: [
               "Mus- och PDF-kontroller",
               "EFB-gesterna nedan gäller i 2D-läge. PDF-gester gäller när ett dokument är öppet.",
               [
                  "Ctrl + dra med vänster musknapp: flytta EFB:n i 2D-läge.",
                  "Ctrl + Shift + dra med vänster musknapp: justera det synliga EFB-området.",
                  "Alt + dra: flytta EFB:n i simulatorområdet.",
                  "Ctrl + Shift + högerklick: återställ standardstorleken. Ctrl + Alt + högerklick: ladda om EFB-operativsystemet.",
                  "PDF: mushjulet rullar lodrätt, Ctrl + hjul vågrätt och Alt/Shift + hjul eller +/- knappar zoomar. Klicka och dra med hjulknappen för att panorera."
               ]
            ],
            notes: [
               "Begränsningar och transparens",
               "Läs dessa anmärkningar om PDF och storleksändring.",
               [
                  ["PDF-visning", "Simulatorn använder en äldre inbyggd webbläsare, så PDF-filer kan ibland visas fel. Zooma in eller ut för att rita om. Mycket stora PDF-filer, till exempel manualer, kan krascha simulatorn."],
                  ["Ändra EFB-storlek", "Den här lösningen ändrar det synliga området, inte EFB:ns faktiska storlek. Innehåll bakom EFB:n kan fortfarande vara oklickbart."],
                  ["Antivirusrapporter", "Vissa heuristiska antivirusprogram kan felaktigt flagga det komprimerade installationsprogrammet. Granska VirusTotal-resultat per version och den offentliga källkoden före installation."],
                  ["Extern EFB", "Stöd för externa webbläsare och enheter utvecklas fortfarande. Inställningar i den externa EFB:n sparas ännu inte."]
               ]
            ],
            support: [
               "Nedladdning och support",
               "Ladda ner VFRNav från Flightsim.to. Projektlänkarna går till dokumentation, feedback, community och källkod.",
               ["Ladda ner från Flightsim.to", "Wiki för installation och användning", "Rapportera ett problem eller föreslå en förbättring", "Community-Discord", "Källkod", "Skicka feedback om standalone-appen"],
               "MSFS2024 VFRNav är ett kostnadsfritt communityprojekt. Microsoft Flight Simulator är ett varumärke som tillhör Microsoft.",
               "VirusTotal-rapporter"
            ]
         },
         tr: {
            title: "VFRNav EFB Rehberi - MSFS 2024",
            description: "Haritalar, uçuş planları, navloglar ve hava durumu için MSFS2024 VFRNav'ı kurmayı ve kullanmayı öğrenin.",
            language: "Dil",
            navLabel: "Ana gezinme",
            nav: ["Genel bakış", "Özellikler", "Kurulum", "Kullanım", "Kontroller", "Destek"],
            hero: [
               "VFR için kokpit yardımcısı",
               "Rotanı planla. Çevreni takip et.",
               "VFRNav, Microsoft Flight Simulator 2024'ün tümleşik EFB'sine haritalar, meydan kartları, PDF'ler ve uçuş planlama araçları ekler. VFR için tasarlanmıştır ve IFR'ı da destekler.",
               "Flightsim.to'dan indir",
               "VFRNav nasıl kullanılır",
               "Ücretsiz ve topluluk tarafından geliştirildi. Community paketini veya yükleyiciyi kurun; ikisini birden kurmayın."
            ],
            route: ["UÇUŞ PLANI / VFR HARİTASI", "Rota özeti", "Harita ve navlog birlikte", "PLANLA / UÇ / İNCELE"],
            workflow: ["Buradan başlayın", "Flightsim.to'dan bir paket seçin, simülatörün EFB'sinden VFRNav'ı açın ve uçuşunuza uygun araçları kullanın."],
            steps: [
               "Flightsim.to indirme bölümünden Legacy Community paketini veya yükleyiciyi seçin.",
               "MSFS 2024'ü başlatın, EFB uygulama başlatıcısını açın ve VFRNav'ı seçin.",
               "Uçuştan önce veya uçuş sırasında rotayı, harita katmanlarını, kartları ve navlogu hazırlayın.",
               "Uçuş sırasında meydan bilgilerini kontrol edin, inişten sonra kaydedilen rotayı inceleyin."
            ],
            features: ["EFB özellikleri", "Uçuşları planlayın, kokpit kaynaklarına erişin ve rotaları tek bir tümleşik araçla inceleyin.", "OACI, Google, OpenStreetMap ve yükselti kaynaklarından VFR haritaları; VFR katmanları varsayılan olarak açıktır.", "Kokpitte VAC kartlarını ve PDF'leri görüntüleyin; Fransız VAC kartlarını SIA'dan indirin veya sunucuyla yerel dosya ekleyin.", "Uçuş planını haritaya yerleştirin, navlog oluşturun ve planları VFRNav sunucusuyla aktarın.", "Uçuşları kaydedip rotayı sonradan inceleyin; navlogları ve uçak performans verilerini içe/dışa aktarın.", "EFB'den meydan bilgilerini ve METAR/TAF hava durumu verilerini kontrol edin.", efbModes["tr"].summary],
            install: [
               "Kurulum seçenekleri",
               "Paketi Flightsim.to'dan indirin ve seçtiğiniz sürümün talimatlarını izleyin.",
               "Legacy Community: paketi MSFS 2024 Community klasörüne yerleştirin, simülatörü başlatın ve EFB'yi açın.",
               "Yükleyici: çalıştırıp adımları izleyin. VFRNav sunucusunu içerir; dosya ve harici EFB özelliklerini ekler.",
               "Önemli: aynı anda yalnızca bir sürüm kurun. Harici tarayıcı/cihaz desteği geliştirme aşamasındadır ve harici EFB ayarları henüz kaydedilmez."
            ],
            using: [
               "EFB'yi kullanma",
               "Eklentinin temel özellikleri ve görevleri için pratik bir metin kılavuzu.",
               [
                  ["VFRNav'ı açma ve ayarlama", "Simülatörün EFB uygulama başlatıcısından VFRNav'ı açın. Genel ayarlar ekran boyutu, yön, parlaklık, birimler ve favorileri içerir. VR için Büyük ve Yatay önerilir."],
                  ["Haritayla rota planlama", "Harita katmanlarını seçip görünürlüğünü ayarlayın. Uçağın konumunu izleyin, rota ve ara noktaları gösterin; bölgeyi anlamak için harita ayrıntılarını veya menzil dairelerini kullanın."],
                  ["Belgeleri bulma ve okuma", "Belge panelinde Local, SIA, TEMSI ve Weather Fronts kaynakları bulunur. Fransız SIA VAC kartı için meydanın ICAO kodunu girip indirin. PDF'leri görüntüleyicide açın; yerel dosya yüklemek için sunucu gerekir."],
                  ["Navlog kullanma", "Ara noktaları, irtifayı, tahmini zamanı ve yakıtı inceleyin. Performans görünümünde pusula sapması ve yakıt tüketimi yer alır. Sunucu dosya aktarımını ve planları taşımayı destekler."],
                  ["Hava durumu ve hava sahasını kontrol etme", "METAR ve TAF için meydan bilgilerini açın. Haritada AZBA etkinlik alanları gösterilebilir; etkinlik saatleri, alt/üst irtifa sınırları ve notlar için alanı seçin."],
                  ["Uçuşu inceleme", "Kaydedilmiş uçuşu açarak izi ve kayıtları görüntüleyin. İnceleme haritasında Alt + Shift + sürükleme görünümü döndürür, haritadaki kişi bakış açısını değiştirir, kaydırıcılar görünümü ayarlar. Sunucu ayrıca harici EFB sunar."]
               ]
            ],
            controls: [
               "Fare ve PDF kontrolleri",
               "Aşağıdaki EFB hareketleri 2D modda geçerlidir. PDF hareketleri belge açıkken kullanılır.",
               [
                  "Ctrl + sol tıklayıp sürükleme: EFB'yi 2D modda taşıyın.",
                  "Ctrl + Shift + sol tıklayıp sürükleme: EFB'nin görünen alanını ayarlayın.",
                  "Alt + sürükleme: EFB'yi simülatör alanında taşıyın.",
                  "Ctrl + Shift + sağ tıklama: varsayılan boyutu geri yükleyin. Ctrl + Alt + sağ tıklama: EFB işletim sistemini yeniden yükleyin.",
                  "PDF: dikey kaydırma için fare tekerleği, yatay için Ctrl + tekerlek, yakınlaştırma için Alt/Shift + tekerlek veya +/- düğmeleri. Sayfayı kaydırmak için tekerlek düğmesine basıp sürükleyin."
               ]
            ],
            notes: [
               "Sınırlamalar ve şeffaflık",
               "PDF ve boyutlandırma özellikleriyle ilgili notları okuyun.",
               [
                  ["PDF görüntüleme", "Simülatör eski bir yerleşik tarayıcı kullanır; PDF'ler bazen hatalı görüntülenebilir. Yeniden çizmek için yakınlaştırıp uzaklaştırın. Kılavuz gibi çok büyük PDF'ler simülatörün çökmesine neden olabilir."],
                  ["EFB boyutlandırma", "Bu geçici çözüm EFB'nin gerçek boyutunu değil, görünür alanı değiştirir. EFB'nin arkasındaki öğelere tıklanamayabilir."],
                  ["Antivirüs raporları", "Bazı sezgisel antivirüsler sıkıştırılmış yükleyiciyi yanlışlıkla işaretleyebilir. Kurmadan önce sürüm bazındaki VirusTotal sonuçlarını ve herkese açık kaynak kodunu inceleyin."],
                  ["Harici EFB", "Harici tarayıcı ve cihaz desteği geliştirme aşamasındadır. Harici EFB ayarları henüz kalıcı değildir."]
               ]
            ],
            support: [
               "İndirme ve destek",
               "VFRNav'ı Flightsim.to'dan indirin. Belge, geri bildirim, topluluk ve kaynak kodu için proje bağlantılarını kullanın.",
               ["Flightsim.to'dan indir", "Kurulum ve kullanım wiki'si", "Sorun bildir veya iyileştirme öner", "Topluluk Discord'u", "Kaynak kodu", "Bağımsız uygulama için geri bildirim gönder"],
               "MSFS2024 VFRNav ücretsiz bir topluluk projesidir. Microsoft Flight Simulator, Microsoft'un ticari markasıdır.",
               "VirusTotal raporları"
            ]
         },
         "zh-CN": {
            title: "VFRNav EFB 指南 - MSFS 2024",
            description: "了解如何安装和使用 MSFS2024 VFRNav：地图、航图、飞行计划、导航日志和天气信息。",
            language: "语言",
            navLabel: "主导航",
            nav: ["概览", "功能", "安装", "使用方法", "操作", "支持"],
            hero: [
               "VFR 飞行的座舱助手",
               "规划航线，掌握周边信息。",
               "VFRNav 为 Microsoft Flight Simulator 2024 集成 EFB 添加地图、机场航图、PDF 和飞行规划工具。它面向 VFR 飞行，也支持 IFR。",
               "在 Flightsim.to 下载",
               "VFRNav 使用方法",
               "免费社区项目。请只安装 Community 包或安装程序其中一个，不要同时安装。"
            ],
            route: ["飞行计划 / VFR 地图", "航线概览", "地图与导航日志", "规划 / 飞行 / 回顾"],
            workflow: ["从这里开始", "在 Flightsim.to 选择一个安装包，从模拟器 EFB 打开 VFRNav，并使用适合本次飞行的工具。"],
            steps: [
               "在 Flightsim.to 下载区选择 Legacy Community 包或安装程序。",
               "启动 MSFS 2024，打开 EFB 应用启动器并选择 VFRNav。",
               "在飞行前或飞行中准备航线、地图图层、航图和导航日志。",
               "飞行中查看机场信息，着陆后回顾已记录的航线。"
            ],
            features: ["EFB 功能", "使用集成工具规划飞行、查阅座舱资料并回顾航线。", "提供 OACI、Google、OpenStreetMap 和高程等 VFR 地图；默认显示 VFR 图层。", "在座舱中查看 VAC 航图和 PDF；从 SIA 下载法国 VAC 航图，或通过服务器添加本地文件。", "在地图上叠加飞行计划、生成导航日志，并通过 VFRNav 服务器传输计划。", "记录飞行并在之后查看航迹；也可导入/导出导航日志和飞机性能数据。", "在 EFB 中查看机场信息以及 METAR、TAF 等天气数据。", efbModes["zh-CN"].summary],
            install: [
               "安装选项",
               "从 Flightsim.to 下载软件包，并按照该版本附带的说明操作。",
               "Legacy Community：将软件包放入 MSFS 2024 的 Community 文件夹，启动模拟器并打开 EFB。",
               "安装程序：运行并按照提示操作。安装包包含 VFRNav 服务器，并提供额外的文件及外部 EFB 功能。",
               "重要：一次只能安装一个版本。外部浏览器/设备支持仍在开发中，外部 EFB 设置目前不会持久保存。"
            ],
            using: [
               "使用 EFB",
               "以文字介绍插件的主要功能和操作。",
               [
                  ["打开并设置 VFRNav", "从模拟器的 EFB 应用启动器打开 VFRNav。常规设置包含显示尺寸、方向、亮度、单位和收藏项。VR 建议使用 Large 和 Horizontal。"],
                  ["使用地图规划航线", "选择地图图层并调整可见性。查看飞机位置，显示航线和航路点，并利用航图细节或范围圆圈了解周边区域。"],
                  ["查找并阅读文档", "文档面板提供 Local、SIA、TEMSI 和 Weather Fronts 等来源。下载法国 SIA VAC 航图时，输入机场 ICAO 代码后下载。PDF 可在查看器中打开；上传本地文件需要服务器。"],
                  ["使用导航日志", "查看航路点、高度、预计时间和燃油。性能页面显示罗盘偏差和燃油消耗。服务器支持文件导入/导出及飞行计划传输。"],
                  ["查看天气和空域", "打开机场信息查看 METAR 和 TAF。地图可显示 AZBA 活动区域；选择区域可查看活动时间、高度上限/下限和说明。"],
                  ["回顾飞行", "打开已记录的飞行查看航迹和记录。在回顾地图中，Alt + Shift + 拖动可旋转地图，地图上的人物图标可更改视角，滑块可调整显示。服务器还提供外部 EFB。"]
               ]
            ],
            controls: [
               "鼠标和 PDF 操作",
               "以下 EFB 手势适用于 2D 模式。PDF 手势适用于文档打开时。",
               [
                  "Ctrl + 鼠标左键拖动：在 2D 模式下移动 EFB。",
                  "Ctrl + Shift + 鼠标左键拖动：调整 EFB 可见区域。",
                  "Alt + 拖动：在模拟器区域移动 EFB。",
                  "Ctrl + Shift + 右键：恢复默认 EFB 尺寸。Ctrl + Alt + 右键：重新加载 EFB 操作系统。",
                  "PDF：滚轮垂直滚动，Ctrl + 滚轮水平滚动，Alt/Shift + 滚轮或 +/- 按钮缩放。按住滚轮键拖动可平移页面。"
               ]
            ],
            notes: [
               "限制与透明度",
               "使用 PDF 和调整 EFB 尺寸时请注意以下事项。",
               [
                  ["PDF 显示", "模拟器使用较旧的内置浏览器，PDF 有时可能显示异常。缩放可强制重新绘制。大型 PDF（如手册）可能导致模拟器崩溃。"],
                  ["调整 EFB 尺寸", "此变通方法改变可见区域，而不是 EFB 的实际尺寸。EFB 后面的内容可能仍无法点击。"],
                  ["杀毒报告", "某些启发式杀毒软件可能误报压缩后的安装程序。安装前请查看各版本的 VirusTotal 结果和公开源代码。"],
                  ["外部 EFB", "外部浏览器和设备支持仍在开发中。外部 EFB 设置目前不会保存。"]
               ]
            ],
            support: [
               "下载与支持",
               "请从 Flightsim.to 下载 VFRNav。使用项目链接查看文档、反馈渠道、社区和源代码。",
               ["在 Flightsim.to 下载", "安装和使用 Wiki", "报告问题或提出改进建议", "社区 Discord", "源代码", "反馈独立版使用情况"],
               "MSFS2024 VFRNav 是免费的社区项目。Microsoft Flight Simulator 是 Microsoft 的商标。",
               "VirusTotal 报告"
            ]
         }
      };

