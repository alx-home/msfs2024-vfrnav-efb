import type { ChangeId } from "./types";

export type ReleaseComponent = "all" | "server" | "efb";
export type ReleaseGroup = { component: ReleaseComponent; improvements?: readonly ChangeId[]; fixes?: readonly ChangeId[] };
type Release = { version: string; date: string; groups: readonly ReleaseGroup[] };

export const releaseManifest: readonly Release[] = [
  { version: "1.5.0", date: "2026-11-12", groups: [
    { component: "all", improvements: ["allAircraftTablet"] },
    { component: "server", improvements: ["donationPage", "simplifiedStop"], fixes: ["reopenSettings", "installerSimConnect", "websocketClose"] },
    { component: "efb", improvements: ["headingFollow", "disable2dResize", "performance", "scrollbarBehavior"], fixes: ["siaV3", "desktopFontSize", "movable2dPanel"] }
  ] },
  { version: "1.4.0", date: "2026-03-21", groups: [
    { component: "server", fixes: ["reconnectAfterCrash"] },
    { component: "efb", improvements: ["performance", "compactMapMenu", "displayPolish"], fixes: ["mapStutters"] }
  ] },
  { version: "1.3.2", date: "2026-03-11", groups: [{ component: "efb", improvements: ["exportCooldown", "minGroundOffset", "recordTooltips", "rulerPivot"], fixes: ["recordAltitudeMeters"] }] },
  { version: "1.3.1", date: "2026-03-08", groups: [{ component: "efb", improvements: ["performance"], fixes: ["restoreOpenFlightMap"] }] },
  { version: "1.3.0", date: "2026-03-07", groups: [{ component: "efb", improvements: ["chunkedPdf", "simTimeNavlog", "tailNumberNavlog", "performance"], fixes: ["concurrentRecords"] }] },
  { version: "1.2.0", date: "2026-03-02", groups: [{ component: "efb", improvements: ["localRecords", "chunkedRecords", "compactRecords"], fixes: ["cloudError2047", "longFlightStutters", "cleanLegacyRecords"] }] },
  { version: "1.1.1", date: "2026-01-31", groups: [{ component: "efb", improvements: ["captionToggle", "panelPosition", "sliderScrollConflict", "shortcutMove", "shortcutResize", "shortcutReset", "shortcutReload", "shortcutAltMove", "removeBorderClicks"] }] },
  { version: "1.1.0", date: "2026-01-17", groups: [{ component: "efb", improvements: ["ctrlResize", "ctrlAltReload", "ctrlShiftReset"], fixes: ["startup2dResize"] }] },
  { version: "1.0.3", date: "2026-01-15", groups: [{ component: "efb", improvements: ["borderResize"], fixes: ["simConnectJitter"] }] },
  { version: "1.0.2", date: "2026-01-11", groups: [{ component: "efb", fixes: ["lateMsfsConnect"] }] },
  { version: "1.0.1", date: "2025-12-08", groups: [{ component: "efb", improvements: ["borderScale", "no3dScale", "scalingRecovery", "persistScale"], fixes: ["detachedPanelResize"] }] },
  { version: "1.0.0", date: "2025-12-06", groups: [{ component: "efb", improvements: ["panelResize", "altReload", "dpiSetting"] }] },
  { version: "alpha-1.7.1", date: "2025-10-04", groups: [{ component: "efb", improvements: ["stackedMapLabels", "completedRouteSwitch"] }] },
  { version: "alpha-1.7.0", date: "2025-08-31", groups: [
    { component: "server", improvements: ["navlogFileDialog"] },
    { component: "efb", improvements: ["linkedNavlogs", "decimalVariation"] }
  ] },
  { version: "alpha-1.6.2", date: "2025-08-24", groups: [
    { component: "server", improvements: ["confirmDeletion"] },
    { component: "efb", improvements: ["inactiveRoutes"], fixes: ["navlogHoverPerformance"] }
  ] },
  { version: "alpha-1.6.1", date: "2025-08-23", groups: [{ component: "server", fixes: ["protectCommunity"] }] },
  { version: "alpha-1.6.0", date: "2025-08-23", groups: [
    { component: "server", improvements: ["profileFiles"] },
    { component: "efb", improvements: ["curvePresets", "fuelAltitudeTemperature", "deviationChart"], fixes: ["navdataButtons"] }
  ] },
  { version: "alpha-1.5.3", date: "2025-08-09", groups: [{ component: "efb", improvements: ["openFlightMapBackground"], fixes: ["fuelHandling", "restoreOpenFlightMap"] }] },
  { version: "alpha-1.5.2", date: "2025-08-09", groups: [{ component: "efb", fixes: ["validatedFuel"] }] },
  { version: "alpha-1.5.1", date: "2025-08-09", groups: [
    { component: "server", improvements: ["mapConnectionStatus"], fixes: ["serverStability"] },
    { component: "efb", improvements: ["viewpointSelector", "displayPolish"], fixes: ["lowZoomLegLabels"] }
  ] },
  { version: "alpha-1.5.0", date: "2025-08-09", groups: [
    { component: "server", improvements: ["serverMsfsLink"] },
    { component: "efb", fixes: ["navlogOffscreenRevisited"] }
  ] },
  { version: "alpha-1.4.6", date: "2025-08-07", groups: [{ component: "efb", improvements: ["legViewportLabels"], fixes: ["installerAntivirus", "navlogOffscreen"] }] },
  { version: "alpha-1.4.5", date: "2025-08-07", groups: [{ component: "efb", improvements: ["navlogMapLabels"], fixes: ["rotatedRouteCalculations"] }] },
  { version: "alpha-1.4.4", date: "2025-08-06", groups: [{ component: "efb", improvements: ["relativeRulers", "autoAta", "aircraftFuelTime", "scrollbarAccess", "hideWaypointLabels"], fixes: ["midnightAta"] }] },
  { version: "alpha-1.4.3", date: "2025-08-05", groups: [{ component: "efb", improvements: ["rulerSlope", "recordToolbarDisplay", "partialRecords"] }] },
  { version: "alpha-1.4.2", date: "2025-08-05", groups: [{ component: "efb", improvements: ["rotateRoute", "recordDisplay"] }] },
  { version: "alpha-1.4.1", date: "2025-08-04", groups: [{ component: "efb", improvements: ["rotateRecords", "recordOffset"] }] },
  { version: "alpha-1.4.0", date: "2025-08-04", groups: [{ component: "efb", improvements: ["records3d", "recordsPerformance", "recordRulers"], fixes: ["icaoSuggestions"] }] },
  { version: "alpha-1.3.2", date: "2025-07-14", groups: [{ component: "efb", improvements: ["airportPopup", "siaPdfDownload"], fixes: ["azbaTime"] }] },
  { version: "alpha-1.3.1", date: "2025-07-13", groups: [
    { component: "efb", improvements: ["adaptiveDpi"], fixes: ["waypointInsertion", "deleteLastWaypoint"] },
    { component: "server", improvements: ["exportPdf"] }
  ] },
  { version: "alpha-1.3.0", date: "2025-07-06", groups: [
    { component: "efb", improvements: ["recordToolbar", "sliderWheel", "navlog", "airportSearch"] },
    { component: "server", improvements: ["simConnectPort"], fixes: ["serverMemory"] }
  ] },
  { version: "alpha-1.2.0", date: "2025-06-15", groups: [{ component: "efb", improvements: ["openApiPreview"] }] },
  { version: "alpha-1.1.0", date: "2025-05-27", groups: [{ component: "server", improvements: ["transferNavData", "generalFixes"] }] },
  { version: "alpha-1.0.1", date: "2025-05-26", groups: [{ component: "efb", improvements: ["pdfServerStatus", "siaInputValidation"] }] },
  { version: "alpha-1.0.0", date: "2025-05-25", groups: [
    { component: "all", improvements: ["menuDpi"], fixes: ["su12Fix"] },
    { component: "server", improvements: ["localPdf", "openEfbFromApp"] },
    { component: "efb", improvements: ["popupTextSize", "popupLayout"] }
  ] },
  { version: "alpha-0.4.1", date: "2025-03-19", groups: [{ component: "efb", improvements: ["hideGround"], fixes: ["touchdownLabels", "recordMemory", "airportTabEncoding"] }] },
  { version: "alpha-0.4.0", date: "2025-03-17", groups: [{ component: "efb", improvements: ["airportLayer", "openFlightMap", "aircraftPosition", "flightReview"], fixes: ["preserveSettingsUpdates"] }] },
  { version: "alpha-0.3.3", date: "2025-02-24", groups: [{ component: "efb", improvements: ["favoriteApp"], fixes: ["nativeSliderFix"] }] },
  { version: "alpha-0.3.2", date: "2025-02-17", groups: [{ component: "efb", fixes: ["legDistanceFix"] }] },
  { version: "alpha-0.3.1", date: "2025-02-16", groups: [{ component: "efb", fixes: ["legHeadingFix", "legTimeFix"] }] },
  { version: "alpha-0.3.0", date: "2025-02-09", groups: [{ component: "efb", improvements: ["icaoBackground", "azbaLayer", "pdfZoomButtons", "layerZoomSettings", "performance"] }] },
  { version: "alpha-0.2.2", date: "2025-02-05", groups: [{ component: "efb", improvements: ["performance"], fixes: ["multipleDocumentsFix", "pdfFontDetection"] }] },
  { version: "alpha-0.2.1", date: "2025-02-01", groups: [{ component: "efb", improvements: ["appearanceSettings", "persistentSettings", "closeRouteMenu", "performance"] }] },
  { version: "alpha-0.2.0", date: "2025-01-26", groups: [{ component: "efb", improvements: ["performance", "pdfPreview", "layerToggles"] }] },
  { version: "alpha-0.1.2", date: "2025-01-21", groups: [{ component: "efb", improvements: ["performance"], fixes: ["scrollbarGlitches"] }] },
  { version: "alpha-0.1.1", date: "2025-01-05", groups: [{ component: "efb", improvements: ["mapText", "layerZoomVisibility"], fixes: ["dragClickFix", "fontLoading", "waypointHover"] }] }
];
