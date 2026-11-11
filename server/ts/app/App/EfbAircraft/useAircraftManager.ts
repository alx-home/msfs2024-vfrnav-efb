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

import { useEffect, useMemo, useState } from "react";
import { useEvent } from "react-use-event-hook";
import type { Aircraft, Confirmation, Entry, Mode, Operation, Report } from "./types";
import { statuses } from "./types";
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object";

const text = (value: unknown): string => {
   if (typeof value !== "string") {
      throw new TypeError("Invalid aircraft manager text.");
   }
   return value;
};

const count = (value: unknown): number => {
   if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
      throw new Error("Invalid aircraft manager count.");
   }
   return value;
};

/**
 * @brief Validate and decode an aircraft-management response from the native bridge.
 *
 * @param json Serialized fleet report.
 *
 * @returns The validated report.
 *
 * @throws If the JSON is malformed or the response or an aircraft entry has an invalid shape.
 */
const parseReport = (json: string): Report => {
   const value: unknown = JSON.parse(json);
   if (!record(value) || typeof value.restartRequired !== "boolean" || !Array.isArray(value.aircraft) || !Array.isArray(value.entries)) {
      throw new Error("Invalid aircraft manager response.");
   }

   const aircraft = value.aircraft.map((item: unknown): Aircraft => {
      if (!record(item) || !Array.isArray(item.warnings) || !Array.isArray(item.presetNames)) {
         throw new Error("Invalid aircraft entry.");
      }
      const status = statuses.find(candidate => candidate === item.status);
      if (!status) {
         throw new Error("Invalid aircraft status.");
      }
      return {
         status,
         id: text(item.id), name: text(item.name), container: text(item.container), presetCount: count(item.presetCount),
         efb: text(item.efb), reason: text(item.reason), presetNames: item.presetNames.map(text),
         warnings: item.warnings.map(text)
      };
   });

   const entries = value.entries.map((item: unknown): Entry => {
      if (!record(item)) {
         throw new Error("Invalid operation entry.");
      }
      return { source: text(item.source), state: text(item.state), message: text(item.message) };
   });

   return {
      community: text(value.community), restartRequired: value.restartRequired,
      generated: count(value.generated), removed: count(value.removed), aircraft, entries
   };
};

/**
 * @brief Watch VFS projection changes until the consuming component unmounts.
 *
 * @returns Current availability and its diagnostic message.
 */
const useVfsStatus = () => {
   const [vfs, setVfs] = useState({ available: false, message: "Checking VFS projection..." });

   useEffect(() => {
      let stopped = false;

      const watch = async () => {
         let previous = "";

         try {
            while (!stopped) {
               const json = await globalThis.window.watchVfsProjection(previous);
               const status: unknown = JSON.parse(json);

               if (!record(status) || typeof status.available !== "boolean" || typeof status.message !== "string") {
                  throw new Error("Invalid VFS monitoring response.");
               }

               if (stopped) {
                  return;
               }

               setVfs({ available: status.available, message: status.message });
               previous = json;
            }
         } catch (reason) {
            console.info("VFS projection monitoring failed:", reason);

            if (!stopped) {
               setVfs({ available: false, message: `VFS monitoring failed: ${reason instanceof Error ? reason.message : String(reason)}` });
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
const loadInstalled = (): Promise<Report> => {
   installedRequest ??= globalThis.window.manageEfbAircraft("standard", "installed", "[]")
      .then(parseReport)
      .finally(() => { installedRequest = null; });

   return installedRequest;
};

/**
 * @brief Coordinate scans, selections, VFS availability, and managed patch operations.
 *
 * @returns State and actions for the aircraft management view.
 */
export const useAircraftManager = () => {
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

   useEffect(() => {
      let stopped = false;

      const load = async () => {
         try {
            const result = await loadInstalled();
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
            console.info("Installed EFB patch inventory failed:", reason);

            if (!stopped) {
               setError(`Cannot load installed aircraft patches: ${reason instanceof Error ? reason.message : String(reason)}`);
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

   const run = useEvent(async (action: Operation) => {
      if (busy) {
         return;
      }

      const applyInstalled = action === "apply" && !scanned;
      if (deepBlocked && action !== "remove" && !applyInstalled) {
         setError(vfs.message);
         return;
      }

      setOperation(action);
      setError("");
      setConfirmation(undefined);

      try {
         const operationMode = applyInstalled ? "standard" : mode;
         const result = parseReport(await globalThis.window.manageEfbAircraft(operationMode, action, JSON.stringify([...selected])));

         if (action === "scan") {
            updateReport(result);
         } else {
            setReports({});
            setSelections({ standard: new Set(), deep: new Set() });

            try {
               const inventory = await loadInstalled();
               const aircraft = inventory.aircraft.map(item => ({ ...item, installedOnly: true }));
               setInstalled({
                  ...inventory, ...result,
                  aircraft
               });
               const ids = aircraft.map(item => item.id);
               setSelections({ standard: new Set(ids), deep: new Set(ids) });
            } catch (reason) {
               console.info("Installed EFB patch inventory refresh failed:", reason);
               setError(`Aircraft operation completed, but installed patch inventory could not be refreshed: ${reason instanceof Error ? reason.message : String(reason)}`);
            }
         }
      } catch (reason) {
         console.info("EFB aircraft management failed:", reason);
         setError(reason instanceof Error ? reason.message : String(reason));
      } finally {
         setOperation(undefined);
      }
   });

   const changeMode = useEvent((next: Mode) => { setMode(next); setConfirmation(undefined); setError(""); });
   return { mode, operation, busy, loadingInstalled, error, installed, report, selected, setSelected, confirmation, setConfirmation, vfs, deepBlocked, hasScanned: !!scanned, run, changeMode };
};
