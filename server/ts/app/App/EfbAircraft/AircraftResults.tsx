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
import type { Aircraft, Operation, Report, Sort, Mode, VfsStatus } from "./types";
import { blocksCareerMode, matchesAircraft, selectable, statusColors, statuses, VfsState, vfsStateKey } from "./types";
import { VfsHelpPopup } from "../VfsHelp";
import { addPopup } from "@common/Popup";
import { useTranslation } from "@vfrnav/i18n";

import helpIcon from "../images/help.svg";
import { formatVfsDetail } from "./useAircraftManager";
/* eslint jsx-a11y/label-has-associated-control: ["error", { "controlComponents": ["Input", "CheckBox"], "depth": 3 }] */
/**
 * @brief Display operation progress, VFS errors, and a dismissible restart reminder.
 *
 * @param props Status details and restart acknowledgement callback.
 *
 * @returns The status panel, or null when there are no messages.
 */
export const OperationStatus = ({ operation, mode, error, vfs, restartRequired, onDismissRestart }: {
   mode: Mode; operation?: Operation; error: string; vfs?: VfsStatus; restartRequired: boolean;
   onDismissRestart: () => void;
}) => {
   const { t } = useTranslation();
   const vfsErrorKey = vfs && vfs.state !== VfsState.OK ? vfsStateKey[vfs.state] : undefined;
   const hasMessages = [operation, error, vfsErrorKey, restartRequired].some(Boolean);
   const showHelp = useEvent(() => addPopup(<VfsHelpPopup />, 0));

   if (!hasMessages) {
      return null;
   }

   return <div className="flex shrink-0 flex-col gap-3 bg-gray-900 shadow-lg shadow-black/40" aria-label={t('aircraftResults.status.ariaLabel')}>
      {
         vfsErrorKey &&
         <p role="alert" className="flex flex-row p-4 bg-gray-800 border-s-4 border-red-500 text-sm text-red-300">
            {t(`aircraftResults.vfs.${vfsErrorKey}`, { error: vfs ? formatVfsDetail(vfs.detail, t) : "" })}
            {
               vfs?.state === VfsState.NOT_ENABLED &&
               <button type="button" aria-label={t('aircraftResults.status.vfsHelpLabel')} title={t('aircraftResults.status.vfsHelpLabel')}
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
         <span>{t(`aircraftResults.operations.${operation}`)}</span>
      </output>}
      {error && <p role="alert" className="p-4 border-s-4 border-red-500 bg-gray-800 text-sm text-red-300 whitespace-pre-wrap break-words">{error}</p>}
      {restartRequired && <div className="flex items-center gap-3 p-3 py-2 border-s-4 border-yellow-500 bg-gray-800 text-sm text-yellow-300">
         <output>{t('aircraftResults.status.restartRequired')}</output>
         <div className="flex flex-1 ml-auto mr-4 max-w-32">
            <Button active={true} onClick={onDismissRestart}>{t('aircraftResults.status.gotIt')}</Button>
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
   const { t } = useTranslation();
   const [expanded, setExpanded] = useState(false);
   const detailsId = useId();
   const changeSelection = useEvent((value: boolean) => onSelection(item.id, value));
   const warningSummary = item.warnings.length > 0
      ? t(item.warnings.length === 1 ? 'aircraftResults.row.warningOne' : 'aircraftResults.row.warningMany', { count: item.warnings.length })
      : "";
   const summary = [
      warningSummary,
      item.reason ? t('aircraftResults.row.reason') : ""
   ].filter(Boolean).join(" / ");
   const selectionLabel = t(item.installedOnly ? 'aircraftResults.row.keepLabel' : 'aircraftResults.row.patchLabel', { name: item.name });

   return <>
      <tr className="border-t border-slate-700 hover:bg-gray-800">
         <td>
            <label className="flex" title={selectionLabel}>
               <span className="sr-only">{selectionLabel}</span>
               <CheckBox value={checked} active={!busy && (item.installedOnly || selectable(item))} onChange={changeSelection} />
            </label>
         </td>
         <td>
            <div className="flex flex-wrap items-center gap-2">
               <span>{item.name}</span>
               {blocksCareerMode(item) && <span className="ml-auto rounded-sm border border-amber-500/60 bg-amber-900 px-2 py-1 text-xs text-amber-100"
                  title={t('aircraftResults.row.blocksCareerTooltip')}>{t('aircraftResults.row.blocksCareerBadge')}</span>}
            </div>
            <div className="text-xs break-all text-slate-400">{item.container}
            </div>
            {item.presetNames.length > 0 && <div className="text-xs break-words text-slate-400">
               {t('aircraftResults.row.presets', { presets: item.presetNames.join(", ") })}
            </div>}
         </td>
         <td>{item.presetCount}</td>
         <td>
            <span className={`inline-block rounded-sm border px-2 py-1 shadow-md shadow-black/40 ${statusColors[item.status]}`} title={item.reason}>
               {t(`aircraftResults.statuses.${item.status}`)}
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

const AircraftHeader = () => {
   const { t } = useTranslation();

   return <thead className="sticky top-0 z-30 bg-gray-800 shadow-lg">
      <tr>
         <th scope="col" className="w-px whitespace-nowrap border-b border-r border-gray-700 shadow-md">{t('aircraftResults.table.patch')}</th>
         <th scope="col" className="w-full min-w-48 border-b border-r border-gray-700 shadow-md">{t('aircraftResults.table.aircraftContainer')}</th>
         <th scope="col" className="w-px whitespace-nowrap border-b border-r border-gray-700 shadow-md">{t('aircraftResults.table.presets')}</th>
         <th scope="col" className="w-px whitespace-nowrap border-b border-r border-gray-700 shadow-md">{t('aircraftResults.table.status')}</th>
         <th scope="col" className="w-px whitespace-nowrap border-b border-gray-700">{t('aircraftResults.table.existingEfb')}</th>
      </tr>
   </thead>;
};

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
   const { t } = useTranslation();
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
      <h2 className="mt-2 text-lg">{t('aircraftResults.title')}</h2>
      <div className="flex flex-row items-end gap-3 bg-slate-800 p-3 text-left">
         <label className="flex flex-col flex-1 gap-2 min-w-0" title={t('aircraftResults.filters.filterTitle')}>
            <span>{t('aircraftResults.filters.filterLabel')}</span>
            <Input active={true} value={filter} onChange={setFilter} placeholder={t('aircraftResults.filters.filterPlaceholder')} className="min-w-0 w-full px-2" />
         </label>
         <div className="flex flex-col flex-1 min-w-0 gap-2">
            <div>{t('aircraftResults.filters.statusLabel')}</div>
            <Select value={statusFilter} active={true} onChange={setStatusFilter} className="min-w-0 w-full">
               <SelectOption id="all">{t('aircraftResults.filters.statusAll')}</SelectOption>
               {statuses.map(status => <SelectOption key={status} id={status}>{t(`aircraftResults.statuses.${status}`)}</SelectOption>)}
            </Select>
         </div>
         <div className="flex flex-col flex-1 min-w-0 gap-2">
            <div>{t('aircraftResults.filters.sortByLabel')}</div>
            <Select<Sort> value={sort} active={true} onChange={setSort} className="min-w-0 w-full">
               <SelectOption<Sort> id="name">{t('aircraftResults.filters.sortName')}</SelectOption>
               <SelectOption<Sort> id="container">{t('aircraftResults.filters.sortContainer')}</SelectOption>
               <SelectOption<Sort> id="status">{t('aircraftResults.filters.sortStatus')}</SelectOption>
               <SelectOption<Sort> id="presetCount">{t('aircraftResults.filters.sortPresets')}</SelectOption>
               <SelectOption<Sort> id="warnings">{t('aircraftResults.filters.sortWarnings')}</SelectOption>
            </Select>
         </div>
         <label className="flex flex-col shrink-0 items-start gap-2" title={t('aircraftResults.filters.descendingTitle')}>
            <span>{t('aircraftResults.filters.descendingLabel')}</span>
            <CheckBox value={descending} active={true} onChange={setDescending} />
         </label>
      </div>
      <div className="relative z-0 flex flex-col min-h-0 shrink-0 bg-slate-800 [&>div>div.absolute]:opacity-100 [&>div>div.absolute]:z-20 [&>div>div.absolute>div]:bg-slate-400">
         <Scroll className="flex-col max-h-96 bg-slate-800 pr-3">
            <table className="w-full border-separate border-spacing-0 text-sm text-left [&_th]:p-3 [&_td]:p-3 [&_tbody_td]:border-t [&_tbody_td]:border-slate-700">
               <AircraftHeader />
               <tbody>
                  {visible.map(item => <AircraftRow key={item.id} item={item} checked={selected.has(item.id)} busy={busy} onSelection={selectAircraft} />)}
               </tbody>
            </table>
         </Scroll>
         {
            visible.length === 0 &&
            <p className="bg-slate-800 p-3 text-left text-sm m-auto">
               {t('aircraftResults.empty')}
            </p>
         }
         <div className="relative shadow-[0_-2px_8px_rgba(0,0,0,0.20)] flex p-2 border-t border-gray-700 gap-3 bg-gray-800">
            <div className="flex flex-1">
               <Button active={!busy} disabled={busy} onClick={selectAll}>{t('aircraftResults.selectAll')}</Button>
            </div>
            <div className="flex flex-1">
               <Button active={!busy} disabled={busy} onClick={selectNone}>{t('aircraftResults.selectNone')}</Button>
            </div>
         </div>
      </div>

   </>;
};
