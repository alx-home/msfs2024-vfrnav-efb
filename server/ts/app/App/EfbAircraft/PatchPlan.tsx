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

import { Scroll } from "@alx-home/Utils";
import type { Aircraft, Confirmation, Report } from "./types";
import { pendingAircraftChanges } from "./types";

const PlannedAircraft = ({ title, aircraft }: { title: string; aircraft: Aircraft[] }) =>
   <details>
      <summary className="sticky top-0 z-10 bg-gray-800 py-2 font-semibold cursor-pointer">{title} ({aircraft.length})</summary>
      {aircraft.length === 0 ? <p className="mt-2 text-slate-400">None.</p> : <ul className="mt-2 flex flex-col gap-2">
         {aircraft.map(item => <li key={item.id}>
            <span>{item.name}</span>
            <div className="text-xs text-slate-400 break-all">{item.container}</div>
         </li>)}
      </ul>}
   </details>;

/**
 * @brief Preview aircraft affected by the requested patch or managed removal.
 *
 * @param props Requested action, current report, and selected aircraft IDs.
 *
 * @returns The patch or removal preview.
 */
export const PatchPlan = ({ action, report, installed, selected }: {
   action: Confirmation; report?: Report; installed?: Report; selected: Set<string>;
}) => {
   const aircraft = report?.aircraft ?? [];
   const pending = pendingAircraftChanges(aircraft, selected);
   const managed = (action === "remove" ? installed?.aircraft ?? [] : aircraft)
      .filter(item => item.status === "patched" || item.status === "outdated");
   const toRemove = action === "remove" ? managed : pending.toRemove;

   return <>
      <h2 className="text-base font-semibold">Pending aircraft changes</h2>
      <Scroll className="flex-col max-h-64">
         <div className="flex flex-col gap-4 p-1 pr-3">
            {action === "apply" && <PlannedAircraft title="Aircraft to patch/update" aircraft={pending.toPatch} />}
            <PlannedAircraft title="Aircraft to unpatch" aircraft={toRemove} />
         </div>
      </Scroll>
      {action === "remove" && <p>Remove all verified managed EFB packages, including packages outside the current scan. Modified or foreign packages will not be touched.</p>}
   </>;
};
