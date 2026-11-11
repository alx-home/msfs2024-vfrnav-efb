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

import { useId, useState } from "react";
import { Button, CheckBox, Input, Scroll, Select, SelectOption } from "@alx-home/Utils";
import { useEvent } from "react-use-event-hook";
import loadingIcon from "@alx-home/images/loading.svg";
import type { Aircraft, Operation, Report, Sort, Mode } from "./types";
import { matchesAircraft, operationText, selectable, statusColors, statuses } from "./types";
import { VfsHelpPopup } from "../VfsHelp";
import { addPopup } from "@common/Popup";

import helpIcon from "../images/help.svg";

/* eslint jsx-a11y/label-has-associated-control: ["error", { "controlComponents": ["Input", "CheckBox"], "depth": 3 }] */
/**
 * @brief Display operation progress, VFS errors, and a dismissible restart reminder.
 *
 * @param props Status details and restart acknowledgement callback.
 *
 * @returns The status panel, or null when there are no messages.
 */
export const OperationStatus = ({ operation, mode, error, vfsMessage, restartRequired, onDismissRestart }: {
   mode: Mode; operation?: Operation; error: string; vfsMessage: string; restartRequired: boolean;
   onDismissRestart: () => void;
}) => {
   const hasMessages = [operation, error, vfsMessage, restartRequired].some(Boolean);
   const showHelp = useEvent(() => addPopup(<VfsHelpPopup />, 0));

   if (!hasMessages) {
      return null;
   }

   return <div className="flex shrink-0 flex-col gap-3 bg-gray-900 shadow-lg shadow-black/40" aria-label="Aircraft operation status">
      {
         vfsMessage &&
         <p role="alert" className="flex flex-row p-4 bg-gray-800 border-s-4 border-red-500 text-sm text-red-300">
            {vfsMessage}
            {
               vfsMessage.startsWith('VFS projection is not enabled') &&
               <button type="button" aria-label="How to enable VFS projection" title="How to enable VFS projection"
                  aria-haspopup="dialog"
                  onClick={showHelp}
                  className={`-mt-5 flex shrink-0 items-center justify-center text-white opacity-60 animate-breathe`
                     + ` hover:animate-none hover:opacity-100`
                     + ` transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline`
                     + ` focus-visible:outline-2 focus-visible:outline-msfs${mode === "deep" ? "" : " hidden"}`}>
                  <img src={helpIcon} alt="" className="w-5 h-5" />
               </button>
            }
         </p>
      }
      {operation && <output className="flex items-center gap-3 p-4 border-s-4 border-sky-500 bg-gray-800 text-sm text-sky-200">
         <img src={loadingIcon} alt="" className="w-12 h-6 shrink-0" />
         <span>{operationText[operation]}</span>
      </output>}
      {error && <p role="alert" className="p-4 border-s-4 border-red-500 bg-gray-800 text-sm text-red-300 whitespace-pre-wrap break-words">{error}</p>}
      {restartRequired && <div className="flex items-center gap-3 p-3 py-2 border-s-4 border-yellow-500 bg-gray-800 text-sm text-yellow-300">
         <output>Restart MSFS for package changes to take effect.</output>
         <div className="flex flex-1 ml-auto mr-4 max-w-32">
            <Button active={true} onClick={onDismissRestart}>Got it</Button>
         </div>
      </div>}
   </div>;
};

/**
 * @brief Render an aircraft and its independently expandable warnings and reason.
 *
 * @param props Aircraft, selection state, busy state, and selection callback.
 *
 * @returns The aircraft table rows.
 */
const AircraftRow = ({ item, checked, busy, onSelection }: {
   item: Aircraft;
   checked: boolean;
   busy: boolean;
   onSelection: (_id: string, _checked: boolean) => void;
}) => {
   const [expanded, setExpanded] = useState(false);
   const detailsId = useId();
   const changeSelection = useEvent((value: boolean) => onSelection(item.id, value));
   const warningLabel = item.warnings.length === 1 ? "warning" : "warnings";
   const summary = [
      item.warnings.length > 0 ? `${item.warnings.length} ${warningLabel}` : "",
      item.reason ? "reason" : ""
   ].filter(Boolean).join(" / ");
   const selectionAction = item.installedOnly ? "Keep" : "Patch";

   return <>
      <tr className="border-t border-slate-700 hover:bg-gray-800">
         <td>
            <label className="flex" title={`${selectionAction} ${item.name}`}>
               <span className="sr-only">{selectionAction} {item.name}</span>
               <CheckBox value={checked} active={!busy && (item.installedOnly || selectable(item))} onChange={changeSelection} />
            </label>
         </td>
         <td>
            <span>{item.name}</span>
            <div className="text-xs break-all text-slate-400">{item.container}
            </div>
            {item.presetNames.length > 0 && <div className="text-xs break-words text-slate-400">
               Presets: {item.presetNames.join(", ")}
            </div>}
         </td>
         <td>{item.presetCount}</td>
         <td>
            <span className={`inline-block rounded-sm border px-2 py-1 shadow-md shadow-black/40 ${statusColors[item.status]}`} title={item.reason}>{item.status}
            </span>
         </td>
         <td>{item.efb}</td>
      </tr>
      {summary && <tr>
         <td colSpan={5}>
            <button type="button" className="flex items-center gap-2 text-left" aria-expanded={expanded} aria-controls={detailsId}
               onClick={() => setExpanded(value => !value)}>
               <span aria-hidden="true" className={`inline-block border-y-4 border-y-transparent border-l-[6px] border-l-current transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-90" : ""}`} />
               {summary}
            </button>
            <div id={detailsId} inert={!expanded} aria-hidden={!expanded}
               className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out motion-reduce:transition-none ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
               <div className="min-h-0 overflow-hidden">
                  <p className="whitespace-pre-wrap break-words">
                     {[item.reason, ...item.warnings].filter(Boolean).join("\n")}
                  </p>
               </div>
            </div>
         </td>
      </tr>}
   </>;
};

/**
 * @brief Keep the separate header and scrollable body columns aligned.
 *
 * @param props Column group options.
 * @param props.header Include the body scrollbar allowance in the last header column.
 *
 * @returns The shared column definitions.
 */
const AircraftColumns = ({ header = false }: { header?: boolean }) =>
   <colgroup>
      <col className="w-16" />
      <col />
      <col className="w-20" />
      <col className="w-28" />
      <col className={header ? "w-[6.75rem]" : "w-24"} />
   </colgroup>;

const AircraftHeader = ({ hidden = false }: { hidden?: boolean }) =>
   <thead className={hidden ? "sr-only" : "bg-gray-800 border-b border-gray-700"}>
      <tr>
         <th scope="col" className="border-r border-gray-700 shadow-md">Patch</th>
         <th scope="col" className="border-r border-gray-700 shadow-md">Aircraft / container</th>
         <th scope="col" className="border-r border-gray-700 shadow-md">Presets</th>
         <th scope="col" className="border-r border-gray-700 shadow-md">Status</th>
         <th scope="col">Existing EFB</th>
      </tr>
   </thead>;

/**
 * @brief Filter, sort, and select aircraft from the current fleet report.
 *
 * @param props Report, selection, selection setter, and busy state.
 *
 * @returns The aircraft results controls and table.
 */
export const AircraftResults = ({ report, selected, setSelected, busy }: {
   report?: Report; selected: Set<string>; setSelected: (_selection: Set<string>) => void; busy: boolean;
}) => {
   const [filter, setFilter] = useState("");
   const [statusFilter, setStatusFilter] = useState("all");
   const [sort, setSort] = useState<Sort>("name");
   const [descending, setDescending] = useState(false);
   const visible = (report?.aircraft ?? []).filter(item => (statusFilter === "all" || item.status === statusFilter)
      && matchesAircraft(item, filter))
      .sort((left, right) => {
         const a = sort === "warnings" ? left.warnings.length : left[sort];
         const b = sort === "warnings" ? right.warnings.length : right[sort];
         const order = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
         return descending ? -order : order;
      });
   const selectAll = useEvent(() => setSelected(new Set([...selected, ...visible.filter(item => item.installedOnly || selectable(item)).map(item => item.id)])));
   const selectNone = useEvent(() => setSelected(new Set([...selected].filter(id => !visible.some(item => item.id === id)))));
   const selectAircraft = useEvent((id: string, checked: boolean) => {
      const next = new Set(selected);
      if (checked) {
         next.add(id);
      } else {
         next.delete(id);
      }
      setSelected(next);
   });

   return <>
      <h2 className="mt-2 text-lg">Aircraft</h2>
      <div className="flex flex-row items-end gap-3 bg-slate-800 p-3 text-left">
         <label className="flex flex-col flex-1 gap-2 min-w-0" title="Filter aircraft">
            <span>Filter aircraft :</span>
            <Input active={true} value={filter} onChange={setFilter} placeholder="Aircraft, container or preset" className="min-w-0 w-full px-2" />
         </label>
         <div className="flex flex-col flex-1 min-w-0 gap-2">
            <div>Status :</div>
            <Select value={statusFilter} active={true} onChange={setStatusFilter} className="min-w-0 w-full">
               <SelectOption id="all">All</SelectOption>
               {statuses.map(status => <SelectOption key={status} id={status}>{status}</SelectOption>)}
            </Select>
         </div>
         <div className="flex flex-col flex-1 min-w-0 gap-2">
            <div>Sort by :</div>
            <Select<Sort> value={sort} active={true} onChange={setSort} className="min-w-0 w-full">
               <SelectOption<Sort> id="name">Aircraft</SelectOption>
               <SelectOption<Sort> id="container">Container</SelectOption>
               <SelectOption<Sort> id="status">Status</SelectOption>
               <SelectOption<Sort> id="presetCount">Presets</SelectOption>
               <SelectOption<Sort> id="warnings">Warnings</SelectOption>
            </Select>
         </div>
         <label className="flex flex-col shrink-0 items-start gap-2" title="Descending order">
            <span>Descending order :</span>
            <CheckBox value={descending} active={true} onChange={setDescending} />
         </label>
      </div>
      <div className="relative z-0 flex flex-col min-h-0 shrink-0 bg-slate-800 [&>div>div.absolute]:opacity-100 [&>div>div.absolute]:z-20 [&>div>div.absolute>div]:bg-slate-400">
         <div className="relative z-30 shrink-0 bg-gray-800 shadow-lg" aria-hidden="true">
            <table className="w-full table-fixed text-sm text-left [&_th]:p-3">
               <AircraftColumns header />
               <AircraftHeader />
            </table>
         </div>
         <Scroll className="flex-col max-h-96 bg-slate-800 pr-3">
            <table className="w-full table-fixed text-sm text-left [&_td]:p-3">
               <AircraftColumns />
               <AircraftHeader hidden />
               <tbody>
                  {visible.map(item => <AircraftRow key={item.id} item={item} checked={selected.has(item.id)} busy={busy} onSelection={selectAircraft} />)}
               </tbody>
            </table>
         </Scroll>
         {
            visible.length === 0 &&
            <p className="bg-slate-800 p-3 text-left text-sm m-auto">
               No aircraft found (Start by scanning for installed/available aircraft patches).
            </p>
         }
         <div className="relative shadow-[0_-2px_8px_rgba(0,0,0,0.20)] flex p-2 border-t border-gray-700 gap-3 bg-gray-800">
            <div className="flex flex-1">
               <Button active={!busy} disabled={busy} onClick={selectAll}>Select all shown</Button>
            </div>
            <div className="flex flex-1">
               <Button active={!busy} disabled={busy} onClick={selectNone}>Select none shown</Button>
            </div>
         </div>
      </div >
   </>;
};
