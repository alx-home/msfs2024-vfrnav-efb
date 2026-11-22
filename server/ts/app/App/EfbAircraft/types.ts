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

/** @brief Select unpacked Community scanning or simulator VFS projection scanning. */
export type Mode = "standard" | "deep";

/** @brief Ownership and compatibility state of a scanned aircraft. */
export type Status = "available" | "patched" | "outdated" | "unsupported" | "foreign";

/** @brief Aircraft container and patch state returned by the fleet manager. */
export type Aircraft = {
   id: string;
   name: string;
   container: string;
   presetCount: number;
   presetNames: string[];
   status: Status;
   efb: string;
   reason: string;
   warnings: string[];
   installedOnly?: boolean; /**< Present in installed inventory but absent from the current scan. */
};

/** @brief Per-source result emitted by a fleet operation. */
export type Entry = { source: string; state: string; message: string };

/** @brief Fleet operation results and restart requirement displayed by the UI. */
export type Report = {
   community: string;
   restartRequired: boolean;
   generated: number;
   removed: number;
   aircraft: Aircraft[];
   entries: Entry[];
};

export type Sort = "name" | "container" | "status" | "presetCount" | "warnings";

export const operationText = {
   scan: "Scanning aircraft...",
   apply: "Applying aircraft patches...",
   remove: "Removing managed patches..."
};

export type Operation = keyof typeof operationText;
export type Confirmation = Exclude<Operation, "scan">;

export enum VfsState {
   OK = 0,
   NOT_ENABLED = 1,
   NO_AIRCRAFT = 2,
   ACCESS_ERROR = 3,
   READ_ERROR = 4
};

export type VfsStatus = {
   available: boolean;
   state: VfsState;
   detail: string;
};

export const vfsStateKey: Record<Exclude<VfsState, VfsState.OK>, 'NOT_ENABLED' | 'NO_AIRCRAFT' | 'ACCESS_ERROR' | 'READ_ERROR'> = {
   [VfsState.NOT_ENABLED]: 'NOT_ENABLED',
   [VfsState.NO_AIRCRAFT]: 'NO_AIRCRAFT',
   [VfsState.ACCESS_ERROR]: 'ACCESS_ERROR',
   [VfsState.READ_ERROR]: 'READ_ERROR'
};

export const statuses: Status[] = ["available", "patched", "outdated", "unsupported", "foreign"];
export const statusColors: Record<Status, string> = {
   available: "bg-sky-900 text-sky-100 border-sky-500/60",
   patched: "bg-emerald-900 text-emerald-100 border-emerald-500/60",
   outdated: "bg-amber-900 text-amber-100 border-amber-500/60",
   unsupported: "bg-slate-700 text-slate-100 border-slate-500/60",
   foreign: "bg-rose-900 text-rose-100 border-rose-500/60"
};

/**
 * @brief Determine whether an aircraft may be included in a patch selection.
 *
 * @param aircraft Aircraft to check.
 *
 * @returns Whether it is eligible for selection.
 */
export const selectable = (aircraft: Aircraft) =>
   !aircraft.installedOnly && aircraft.status !== "unsupported" && aircraft.status !== "foreign";

/** @brief Identify aircraft patches known to block the entire Career mode (the simulator
 * additionally excludes every patched aircraft from Career missions). */
export const blocksCareerMode = (aircraft: Aircraft) => {
   const identity = `${aircraft.name} ${aircraft.container}`.toLowerCase().replace(/[^a-z0-9]/g, "");
   return identity.includes("c172spg1000")
      || identity.includes("microsofta320neo")
      || identity.includes("microsoftaircrafta320neo");
};

export const selectedCareerRisks = (aircraft: Aircraft[], selected: ReadonlySet<string>) =>
   aircraft.filter(item => selected.has(item.id) && selectable(item) && blocksCareerMode(item));

export const pendingAircraftChanges = (aircraft: Aircraft[], selected: ReadonlySet<string>) => ({
   toPatch: aircraft.filter(item => selected.has(item.id) && selectable(item) && item.status !== "patched"),
   toRemove: aircraft.filter(item => !selected.has(item.id) && (item.status === "patched" || item.status === "outdated"))
});

/**
 * @brief Match a case-insensitive filter against aircraft metadata and presets.
 *
 * @param aircraft Aircraft whose metadata is searched.
 * @param filter Search text; surrounding whitespace is ignored.
 *
 * @returns Whether the filter occurs in the searchable metadata.
 */
export const matchesAircraft = (aircraft: Aircraft, filter: string) =>
   [aircraft.name, aircraft.container, aircraft.reason, ...aircraft.presetNames]
      .join(" ").toLowerCase().includes(filter.trim().toLowerCase());
