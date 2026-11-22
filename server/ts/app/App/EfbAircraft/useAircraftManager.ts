/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2026 Alexandre GARCIN
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If
 * not, see <https://www.gnu.org/licenses/>.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useEvent } from "react-use-event-hook";
import type { Aircraft, Confirmation, Entry, Mode, Operation, Report, VfsStatus } from "./types";

import { statuses, VfsState, vfsStateKey } from "./types";
import { useTranslation } from "@vfrnav/i18n";
type TranslateFn = ReturnType<typeof useTranslation>['t'];

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object";

const parseText = (value: unknown, t: TranslateFn): string => {
   if (typeof value !== "string") {
      throw new TypeError(t('aircraftResults.errors.invalidText'));
   }
   return value;
};

const parseCount = (value: unknown, t: TranslateFn): number => {
   if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
      throw new Error(t('aircraftResults.errors.invalidCount'));
   }
   return value;
};

/**
 * @brief Validate and decode an aircraft-management response from the native bridge.
 *
 * @param json Serialized fleet report.
 * @param t Translation function.
 *
 * @returns The validated report.
 *
 * @throws If the JSON is malformed or the response or an aircraft entry has an invalid shape.
 */
const parseReport = (json: string, t: TranslateFn): Report => {
   const value: unknown = JSON.parse(json);
   if (!record(value) || typeof value.restartRequired !== "boolean" || !Array.isArray(value.aircraft) || !Array.isArray(value.entries)) {
      throw new Error(t('aircraftResults.errors.invalidResponse'));
   }

   const aircraft = value.aircraft.map((item: unknown): Aircraft => {
      if (!record(item) || !Array.isArray(item.warnings) || !Array.isArray(item.presetNames)) {
         throw new Error(t('aircraftResults.errors.invalidAircraftEntry'));
      }
      const status = statuses.find(candidate => candidate === item.status);
      if (!status) {
         throw new Error(t('aircraftResults.errors.invalidAircraftStatus'));
      }
      return {
         status,
         id: parseText(item.id, t),
         name: parseText(item.name, t),
         container: parseText(item.container, t),
         presetCount: parseCount(item.presetCount, t),
         efb: parseText(item.efb, t),
         reason: formatOperationError(translateFleetMessage(parseText(item.reason, t), t), t),
         presetNames: item.presetNames.map(entry => parseText(entry, t)),
         warnings: item.warnings.map(entry => translateFleetMessage(parseText(entry, t), t))
      };
   });

   const entries = value.entries.map((item: unknown): Entry => {
      if (!record(item)) {
         throw new Error(t('aircraftResults.errors.invalidOperationEntry'));
      }
      return {
         source: parseText(item.source, t),
         state: parseText(item.state, t),
         message: formatOperationError(translateFleetMessage(parseText(item.message, t), t), t)
      };
   });

   return {
      community: parseText(value.community, t),
      restartRequired: value.restartRequired,
      generated: parseCount(value.generated, t),
      removed: parseCount(value.removed, t),
      aircraft,
      entries
   };
};

/**
 * @brief Watch VFS projection changes until the consuming component unmounts.
 *
 * @returns Current availability and its diagnostic message.
 */
const useVfsStatus = () => {
   const [vfs, setVfs] = useState<VfsStatus>({ available: false, state: VfsState.NOT_ENABLED, detail: "" });

   useEffect(() => {
      let stopped = false;

      const watch = async () => {
         let previous = "";

         try {
            while (!stopped) {
               const json = await globalThis.window.watchVfsProjection(previous);
               const status: unknown = JSON.parse(json);


               if (!record(status)
                  || typeof status.available !== "boolean"
                  || typeof status.detail !== "string"
                  || typeof status.status !== "number"
                  || !(status.status in VfsState)) {
                  throw new Error("Invalid VFS monitoring response.");
               }


               if (stopped) {
                  return;
               }

               setVfs({ available: status.available, state: status.status, detail: status.detail });
               previous = json;
            }
         } catch (reason) {
            console.info("VFS projection monitoring failed:", reason);

            if (!stopped) {
               setVfs({
                  available: false,
                  state: VfsState.ACCESS_ERROR,
                  detail: reason instanceof Error ? reason.message : String(reason)
               });
            }
         }
      };

      void watch();

      return () => { stopped = true; };
   }, []);
   return vfs;
};

let installedRequest: Promise<Report> | null = null;
/**
 * @brief Share an in-flight installed-inventory request across concurrent mounts.
 *
 * @returns A promise for the validated installed inventory.
 *
 * @throws If the native request fails or its response is invalid.
 */
const loadInstalled = (t: TranslateFn): Promise<Report> => {
   installedRequest ??= globalThis.window.manageEfbAircraft("standard", "installed", "[]")
      .then(json => parseReport(json, t))
      .finally(() => { installedRequest = null; });

   return installedRequest;
};

type TranslationKey = Parameters<TranslateFn>[0];

const FLEET_ERROR_KEYS: Record<string, TranslationKey> = {
   msfsNotFound: "aircraftResults.fleet.errors.msfsNotFound",
   communityFromCfgNotFound: "aircraftResults.fleet.errors.communityFromCfgNotFound",
   invalidOperation: "aircraftResults.fleet.errors.invalidOperation",
   operationRunning: "aircraftResults.fleet.errors.operationRunning",
   communityMissing: "aircraftResults.fleet.errors.communityMissing",
   selectionNotArray: "aircraftResults.fleet.errors.selectionNotArray",
   selectionIdsNotStrings: "aircraftResults.fleet.errors.selectionIdsNotStrings",
   sha256InitFailed: "aircraftResults.fleet.errors.sha256InitFailed",
   reparsePathUnsupported: "aircraftResults.fleet.errors.reparsePathUnsupported",
   cannotReadFile: "aircraftResults.fleet.errors.cannotReadFile",
   readFailed: "aircraftResults.fleet.errors.readFailed",
   invalidUtf16File: "aircraftResults.fleet.errors.invalidUtf16File",
   invalidUtf16Config: "aircraftResults.fleet.errors.invalidUtf16Config",
   sha256Failed: "aircraftResults.fleet.errors.sha256Failed",
   emptyVirtualPath: "aircraftResults.fleet.errors.emptyVirtualPath",
   absoluteAttachmentPath: "aircraftResults.fleet.errors.absoluteAttachmentPath",
   attachmentTraversal: "aircraftResults.fleet.errors.attachmentTraversal",
   dependencyNotReadable: "aircraftResults.fleet.errors.dependencyNotReadable",
   cannotWritePatchFile: "aircraftResults.fleet.errors.cannotWritePatchFile",

   malformedIniSection: "aircraftResults.fleet.errors.malformedIniSection",
   duplicateIniSection: "aircraftResults.fleet.errors.duplicateIniSection",
   managedPackageWrongAircraft: "aircraftResults.fleet.errors.managedPackageWrongAircraft",

   invalidTemplateReplacement: "aircraftResults.fleet.errors.invalidTemplateReplacement",
   missingTemplateReplacement: "aircraftResults.fleet.errors.missingTemplateReplacement",
   unusedTemplateReplacement: "aircraftResults.fleet.errors.unusedTemplateReplacement",

   rigDestinationExists: "aircraftResults.fleet.errors.rigDestinationExists",

   cannotWatchVfs: "aircraftResults.fleet.errors.cannotWatchVfs",
   vfsWatcherFailed: "aircraftResults.fleet.errors.vfsWatcherFailed",
   cannotRearmVfsWatcher: "aircraftResults.fleet.errors.cannotRearmVfsWatcher",
   vfsWatchDirNotFound: "aircraftResults.fleet.errors.vfsWatchDirNotFound",

   invalidOwnershipMetadata: "aircraftResults.fleet.errors.invalidOwnershipMetadata",
   invalidOwnershipFileList: "aircraftResults.fleet.errors.invalidOwnershipFileList",
   emptyOwnershipFileList: "aircraftResults.fleet.errors.emptyOwnershipFileList",
   packageModified: "aircraftResults.fleet.errors.packageModified",
   packageIncomplete: "aircraftResults.fleet.errors.packageIncomplete",
   missingGeneratorResource: "aircraftResults.fleet.errors.missingGeneratorResource",
   invalidGeneratorResource: "aircraftResults.fleet.errors.invalidGeneratorResource",

   invalidAttachOffset: "aircraftResults.fleet.errors.invalidAttachOffset",
   nonFiniteAttachOffset: "aircraftResults.fleet.errors.nonFiniteAttachOffset",
   sourceOutsideRoots: "aircraftResults.fleet.errors.sourceOutsideRoots",
   unreadableTabletAttachment: "aircraftResults.fleet.errors.unreadableTabletAttachment",
   multifunctionCockpitEfb: "aircraftResults.fleet.errors.multifunctionCockpitEfb",
   invalidCameraCoordinates: "aircraftResults.fleet.errors.invalidCameraCoordinates",
   missingCameraEyepoint: "aircraftResults.fleet.errors.missingCameraEyepoint",
   nonFiniteCameraPosition: "aircraftResults.fleet.errors.nonFiniteCameraPosition",
   noReadableAttachedObjects: "aircraftResults.fleet.errors.noReadableAttachedObjects",
   tabletNestedTooDeep: "aircraftResults.fleet.errors.tabletNestedTooDeep",
   cannotDetermineNestedPath: "aircraftResults.fleet.errors.cannotDetermineNestedPath",
   noModularPresets: "aircraftResults.fleet.errors.noModularPresets",
   noSelectableModularPresets: "aircraftResults.fleet.errors.noSelectableModularPresets",
   dependencyRequiresDeepScan: "aircraftResults.fleet.errors.dependencyRequiresDeepScan",

   rigPathMustBeRelative: "aircraftResults.fleet.errors.rigPathMustBeRelative",
   rigPathTraversal: "aircraftResults.fleet.errors.rigPathTraversal",
   rigFragmentTerminalLf: "aircraftResults.fleet.errors.rigFragmentTerminalLf",

   unknownAircraftSelection: "aircraftResults.fleet.errors.unknownAircraftSelection",
   cannotPatchAircraft: "aircraftResults.fleet.errors.cannotPatchAircraft",
   unableToAllocateStaging: "aircraftResults.fleet.errors.unableToAllocateStaging",
};
const FLEET_MESSAGE_KEYS: Record<string, TranslationKey> = {
   packageRemoved: "aircraftResults.fleet.messages.packageRemoved",
   duplicateContainer: "aircraftResults.fleet.messages.duplicateContainer",
   vfsMaskStockUpdates: "aircraftResults.fleet.messages.vfsMaskStockUpdates",
   cannotInspectManifest: "aircraftResults.fleet.messages.cannotInspectManifest",
   cannotVerifyOverlay: "aircraftResults.fleet.messages.cannotVerifyOverlay",
   nonOwnedOverlay: "aircraftResults.fleet.messages.nonOwnedOverlay",
   legacyManagedPackage: "aircraftResults.fleet.messages.legacyManagedPackage",
   installedVerifiedLocally: "aircraftResults.fleet.messages.installedVerifiedLocally",

   vfsMonitoringStopped: "aircraftResults.fleet.messages.vfsMonitoringStopped",

   cannotReadPilotCamera: "aircraftResults.fleet.messages.cannotReadPilotCamera",
   positionEstimated: "aircraftResults.fleet.messages.positionEstimated",
   cannotRecoverStockMetadata: "aircraftResults.fleet.messages.cannotRecoverStockMetadata",
   presetNoFltsim0: "aircraftResults.fleet.messages.presetNoFltsim0",
   presetAircraftCfgUnreadable: "aircraftResults.fleet.messages.presetAircraftCfgUnreadable",

};

const translateFleetMessage = (value: string, t: TranslateFn): string => {
   if (value.startsWith("FLEET_MSG:")) {
      try {
         const parsed: unknown = JSON.parse(value.slice("FLEET_MSG:".length));
         if (record(parsed) && typeof parsed.code === "string") {
            const key = FLEET_MESSAGE_KEYS[parsed.code];
            if (key) {
               const params: Record<string, string> = {};
               if (typeof parsed.path === "string") {
                  params.path = parsed.path;
               }
               if (typeof parsed.error === "string") {
                  params.error = formatOperationError(parsed.error, t);
               }
               if (typeof parsed.name === "string") {
                  params.name = parsed.name;
               }
               return t(key, params);
            }
         }
      } catch {
         // Fallback to raw message
      }
   }
   return value;
};

const formatFleetError = (raw: string, t: TranslateFn): string => {
   try {
      const parsed: unknown = JSON.parse(raw);
      if (record(parsed) && typeof parsed.code === "string") {
         const key = FLEET_ERROR_KEYS[parsed.code];
         if (key) {
            const params: Record<string, string> = {};
            if (typeof parsed.path === "string") {
               params.path = parsed.path;
            }
            if (typeof parsed.error === "string") {
               params.error = formatOperationError(translateFleetMessage(parsed.error, t), t);
            }
            if (typeof parsed.section === "string") {
               params.section = parsed.section;
            }
            if (typeof parsed.name === "string") {
               params.name = parsed.name;
            }
            return t(key, params);
         }
      }
   } catch {
      // Fallback to raw message
   }
   return `FLEET_ERR:${raw}`;
};

const formatOperationError = (reason: unknown, t: TranslateFn): string => {
   const message = reason instanceof Error ? reason.message : String(reason);

   if (message.startsWith("FLEET_ERR:")) {
      return formatFleetError(message.slice("FLEET_ERR:".length), t);
   }

   if (message.startsWith("VFS_STATUS:")) {
      try {
         const parsed: unknown = JSON.parse(message.slice("VFS_STATUS:".length));
         if (
            record(parsed)
            && typeof parsed.status === "number"
            && parsed.status !== VfsState.OK
            && parsed.status in vfsStateKey
            && typeof parsed.detail === "string"
         ) {
            return t(`aircraftResults.vfs.${vfsStateKey[parsed.status as Exclude<VfsState, VfsState.OK>]}`, {
               error: parsed.detail
            });
         }
      } catch {
         // Fallback to raw message
      }
   }

   return message;
};

export const formatVfsDetail = (detail: string, t: TranslateFn): string =>
   formatOperationError(translateFleetMessage(detail, t), t);

/**
 * @brief Coordinate scans, selections, VFS availability, and managed patch operations.
 *
 * @returns State and actions for the aircraft management view.
 */
export const useAircraftManager = () => {
   const { t } = useTranslation();
   const [mode, setMode] = useState<Mode>("deep");
   const [operation, setOperation] = useState<Operation>();
   const [loadingInstalled, setLoadingInstalled] = useState(true);
   const busy = operation !== undefined || loadingInstalled;
   const [error, setError] = useState("");
   const [installed, setInstalled] = useState<Report>();
   const [reports, setReports] = useState<Partial<Record<Mode, Report>>>({});
   const [selections, setSelections] = useState<Record<Mode, Set<string>>>({
      standard: new Set(), deep: new Set()
   });
   const scanned = reports[mode];
   // Keep installed-only entries visible even when the current scan did not discover them.
   const missing = useMemo(() => (installed?.aircraft ?? []).filter(item => !scanned?.aircraft.some(candidate => candidate.id === item.id)), [installed, scanned]);
   const report = useMemo(() => scanned ? { ...scanned, aircraft: [...scanned.aircraft, ...missing] } : installed,
      [scanned, missing, installed]);
   const selected = selections[mode];
   const setSelected = useEvent((selection: Set<string>) =>
      setSelections(previous => ({ ...previous, [mode]: selection })));
   const [confirmation, setConfirmation] = useState<Confirmation>();
   const vfs = useVfsStatus();
   const deepBlocked = mode === "deep" && !vfs.available;

   const tRef = useRef(t);
   tRef.current = t;

   useEffect(() => {
      let stopped = false;

      const load = async () => {
         try {
            const result = await loadInstalled(tRef.current);
            if (!stopped) {
               const aircraft = result.aircraft.map(item => ({ ...item, installedOnly: true }));
               const ids = aircraft.map(item => item.id);
               setInstalled({ ...result, aircraft });
               setSelections(previous => ({
                  standard: new Set([...previous.standard, ...ids]),
                  deep: new Set([...previous.deep, ...ids])
               }));
            }
         } catch (reason) {
            console.info(tRef.current('aircraftResults.errors.inventoryLoadLog'), reason);

            if (!stopped) {
               setError(tRef.current('aircraftResults.errors.inventoryLoadFailed', {
                  error: reason instanceof Error ? reason.message : String(reason)
               }));
            }
         } finally {
            if (!stopped) {
               setLoadingInstalled(false);
            }
         }
      };
      void load();

      return () => { stopped = true; };
   }, []);

   const updateReport = useEvent((result: Report) => {
      setReports(previous => ({ ...previous, [mode]: result }));
      const installedIds = new Set((installed?.aircraft ?? []).map(item => item.id));
      const scannedIds = new Set(result.aircraft.map(item => item.id));
      setSelections(previous => {
         const selectedIds = result.aircraft
            .filter(item => (item.status === "patched" || item.status === "outdated")
               && (!installedIds.has(item.id) || previous[mode].has(item.id)))
            .map(item => item.id);
         const missingSelected = [...previous[mode]].filter(id => installedIds.has(id) && !scannedIds.has(id));
         return { ...previous, [mode]: new Set([...selectedIds, ...missingSelected]) };
      });
   });

   const refreshInstalled = useEvent(async (result: Report) => {
      try {
         const inventory = await loadInstalled(t);
         const aircraft = inventory.aircraft.map(item => ({ ...item, installedOnly: true }));
         setInstalled({ ...inventory, ...result, aircraft });
         const ids = aircraft.map(item => item.id);
         setSelections({ standard: new Set(ids), deep: new Set(ids) });
      } catch (reason) {
         console.info(t('aircraftResults.errors.inventoryRefreshLog'), reason);
         setError(t('aircraftResults.errors.inventoryRefreshFailed', {
            error: reason instanceof Error ? reason.message : String(reason)
         }));
      }
   });

   const run = useEvent(async (action: Operation) => {
      if (busy) {
         return;
      }

      const applyInstalled = action === "apply" && !scanned;
      if (deepBlocked && action !== "remove" && !applyInstalled) {
         if (vfs.state !== VfsState.OK) {
            setError(t(`aircraftResults.vfs.${vfsStateKey[vfs.state]}`, { error: formatVfsDetail(vfs.detail, t) }));
         }
         return;
      }

      setOperation(action);
      setError("");
      setConfirmation(undefined);

      try {
         const operationMode = applyInstalled ? "standard" : mode;
         const result = parseReport(
            await globalThis.window.manageEfbAircraft(operationMode, action, JSON.stringify([...selected])),
            t
         );

         if (action === "scan") {
            updateReport(result);
         } else {
            setReports({});
            setSelections({ standard: new Set(), deep: new Set() });
            await refreshInstalled(result);
         }
      } catch (reason) {
         console.info(t('aircraftResults.errors.managementFailedLog'), reason);
         setError(formatOperationError(reason, t));
      } finally {
         setOperation(undefined);
      }
   });

   const changeMode = useEvent((next: Mode) => { setMode(next); setConfirmation(undefined); setError(""); });
   return {
      mode, operation, busy, loadingInstalled, error,
      installed, report, selected, setSelected, confirmation,
      setConfirmation, vfs, deepBlocked, hasScanned: !!scanned, run, changeMode
   };
};