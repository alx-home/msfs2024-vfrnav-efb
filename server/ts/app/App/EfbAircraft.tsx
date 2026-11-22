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

import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { Button, Scroll, Select, SelectOption } from "@alx-home/Utils";
import loadingIcon from "@alx-home/images/loading.svg";
import { useEvent } from "react-use-event-hook";
import { AircraftResults, OperationStatus } from "./EfbAircraft/AircraftResults";
import { PatchPlan } from "./EfbAircraft/PatchPlan";
import { useAircraftManager } from "./EfbAircraft/useAircraftManager";
import type { Mode, Report } from "./EfbAircraft/types";
import { pendingAircraftChanges, selectedCareerRisks } from "./EfbAircraft/types";
import { useTranslation } from "@vfrnav/i18n";

const Elem = ({ children }: PropsWithChildren) =>
   <div className='flex flex-row bg-slate-800 p-3 text-left h-14'>{children}</div>;

/** @brief Coordinate aircraft scanning, patch confirmation, and operation feedback.
 *
 * @returns The aircraft management view. */
export const EfbAircraft = () => {
   const { t } = useTranslation();
   const { mode, operation, busy, loadingInstalled, error, installed, report, selected, setSelected, confirmation, setConfirmation, hasScanned,
      vfs, deepBlocked, run, changeMode } = useAircraftManager();
   const blocked = busy || deepBlocked;
   const pending = pendingAircraftChanges(report?.aircraft ?? [], selected);
   const careerRisk = selectedCareerRisks(report?.aircraft ?? [], selected);
   const hasPendingChanges = pending.toPatch.length > 0 || pending.toRemove.length > 0;
   const confirmationBlocked = busy || (deepBlocked && hasScanned && confirmation !== "remove")
      || (confirmation === "apply" && !hasPendingChanges);
   // A new report may require a fresh acknowledgement after later package changes.
   const [dismissedRestartReport, setDismissedRestartReport] = useState<Report>();
   // Acknowledged notices persist in the registry; start hidden until the stored state loads.
   const [careerNoticeDismissed, setCareerNoticeDismissed] = useState(true);
   const [restartNoticeDismissed, setRestartNoticeDismissed] = useState(true);

   const applyBlocked = busy || (hasScanned && deepBlocked) || !hasPendingChanges;
   const restartRequired = (report?.restartRequired ?? false) && report !== dismissedRestartReport
      && !restartNoticeDismissed;
   const dismissRestart = useEvent(() => {
      setDismissedRestartReport(report);
      setRestartNoticeDismissed(true);
      void globalThis.window.restartNoticeDismissed(true);
   });
   const dismissCareerNotice = useEvent(() => {
      setCareerNoticeDismissed(true);
      void globalThis.window.careerNoticeDismissed(true);
   });
   const scan = useEvent(() => { void run("scan"); });
   const requestApply = useEvent(() => setConfirmation("apply"));
   const cancel = useEvent(() => setConfirmation(undefined));
   const confirm = useEvent(() => {
      if (confirmation && !confirmationBlocked) {
         void run(confirmation);
      }
   });
   const reports = useMemo(() =>
      report?.entries
         .filter(value => value.state !== "ok")
         .map(entry =>
            <li key={entry.source} className="whitespace-pre-wrap break-words">
               <strong>{entry.source}</strong>: {entry.state} — {entry.message}
            </li>) ?? [], [report]);

   const installedCount = useMemo(() => report?.aircraft.filter(item => item.status === "patched" || item.status === "outdated").length ?? 0, [report]);
   const outdatedCount = useMemo(() => report?.aircraft.filter(item => item.status === "outdated").length ?? 0, [report]);

   useEffect(() => {
      void (async () => {
         setCareerNoticeDismissed(await globalThis.window.careerNoticeDismissed());
         setRestartNoticeDismissed(await globalThis.window.restartNoticeDismissed());
      })();
   }, []);

   return <Scroll className='flex-col grow'>
      <div className='flex flex-col grow w-full min-w-0 box-border justify-center p-5 gap-3 py-6'>
         <section className="flex flex-col gap-3" aria-label={t('efbAircraft.title')} aria-busy={busy}>
            <h2 className="mt-1 text-lg">{t('efbAircraft.title')}</h2>
            <blockquote className="p-4 border-s-4 border-gray-500 bg-gray-800">
               <p className="text-sm italic font-medium leading-relaxed text-white">
                  {t('efbAircraft.introLine1')}<br />
                  {t('efbAircraft.introLine2')}
               </p>
            </blockquote>
            <div className="flex items-center gap-3 mt-2">
               <h2 className="text-lg">{t('efbAircraft.scanSettings')}</h2>
            </div>
            <Elem>
               <div className="m-auto mr-5 grow min-w-0">{t('efbAircraft.aircraftSource')}</div>
               <div className="shrink">
                  <Select<Mode> value={mode} active={!busy} disabled={busy} onChange={changeMode} className="min-w-40">
                     <SelectOption<Mode> id="standard">{t('efbAircraft.modeStandard')}</SelectOption>
                     <SelectOption<Mode> id="deep">{t('efbAircraft.modeDeep')}</SelectOption>
                  </Select>
               </div>
            </Elem>
            <blockquote className="p-4 border-s-4 border-gray-500 bg-gray-800">
               <p className="text-sm italic font-medium leading-relaxed text-white">{mode === "standard"
                  ? t('efbAircraft.modeStandardDesc')
                  : t('efbAircraft.modeDeepDesc')}</p>
            </blockquote>
            <blockquote className="p-4 border-s-4 border-gray-500 bg-gray-800">
               <p className="text-sm italic font-medium leading-relaxed text-white">
                  {t('efbAircraft.scanNoteLine1')}<br />
                  {t('efbAircraft.scanNoteLine2')}
               </p>
            </blockquote>
            {loadingInstalled && <output className="flex items-center gap-3 p-4 border-s-4 border-sky-500 bg-gray-800 text-sm text-sky-200">
               <img src={loadingIcon} alt="" className="w-12 h-6 shrink-0" />
               <span>{t('efbAircraft.loadingInstalled')}</span>
            </output>}
            <div className="sticky top-0 z-30 flex shrink-0 flex-col gap-3">
               {!careerNoticeDismissed && <div className="flex items-center gap-3 p-4 border-s-4 border-yellow-500 bg-gray-800 text-sm text-yellow-300 shadow-lg shadow-black/40">
                  <output>
                     {t('efbAircraft.careerNoticeLine1')}<br />
                     {t('efbAircraft.careerNoticeLine2')}
                  </output>
                  <div className="flex flex-1 ml-auto mr-4 max-w-32">
                     <Button active={true} onClick={dismissCareerNotice}>{t('efbAircraft.gotIt')}</Button>
                  </div>
               </div>}
               {careerRisk.length > 0 && <p role="alert" className="p-4 border-s-4 border-yellow-500 bg-gray-800 text-sm text-yellow-300 shadow-lg shadow-black/40">
                  {t(careerRisk.length === 1 ? 'efbAircraft.careerRiskWarningOne' : 'efbAircraft.careerRiskWarningMany', {
                     aircraft: careerRisk.map(item => item.name).join(t('efbAircraft.listSeparator'))
                  })}
               </p>}
               <OperationStatus mode={mode} operation={operation} error={error} vfs={deepBlocked ? vfs : undefined} restartRequired={restartRequired} onDismissRestart={dismissRestart} />
               {confirmation && <div role="alert" className="flex flex-col gap-3 p-4 border-s-4 border-yellow-500 bg-gray-800 text-sm shadow-lg shadow-black/40">
                  <PatchPlan action={confirmation} report={report} installed={installed} selected={selected} />
                  <div className="flex gap-2">
                     <Button active={!confirmationBlocked} disabled={confirmationBlocked} onClick={confirm}>{t('efbAircraft.confirm')}</Button>
                     <Button active={!busy} disabled={busy} onClick={cancel}>{t('efbAircraft.cancel')}</Button>
                  </div>
               </div>}
            </div>
            <AircraftResults report={report} selected={selected} setSelected={setSelected} busy={busy} />
            <div className="flex flex-col gap-3 bg-gray-800 p-2">
               <div className="flex flex-row gap-3">
                  <div className="flex flex-1">
                     <Button active={!blocked} disabled={blocked} onClick={scan}>{t('efbAircraft.scanButton')}</Button>
                  </div>
                  <div className="flex flex-1">
                     <Button active={!applyBlocked} disabled={applyBlocked} onClick={requestApply}>{t('efbAircraft.applyButton')}</Button>
                  </div>
               </div>
               {report && <div className="flex flex-col gap-2 bg-slate-800 p-3 text-left text-sm border border-slate-700 shadow-md">
                  <p className="break-all">{report.community}</p>
                  <p>{t('efbAircraft.reportSummary', {
                     total: report.aircraft.length,
                     selected: selected.size,
                     patched: installedCount,
                     outdated: outdatedCount
                  })}</p>
                  {report.restartRequired && <p>{t('efbAircraft.lastOperationSummary', {
                     generated: report.generated,
                     removed: report.removed
                  })}</p>}
               </div>
               }
            </div>
            {(reports.length > 0) &&
               <div className="flex flex-col bg-slate-800">
                  <div className="flex flex-col pl-4 p-2 w-full shadow-black/20 shadow-lg border-b border-slate-700">
                     {t('efbAircraft.reportsTitle')}
                  </div>
                  <Scroll className="max-h-32 gap-2">
                     <ul aria-label={t('efbAircraft.reportsAriaLabel')} className="flex flex-col w-full gap-2 pl-8 p-4 h-fit text-sm">
                        {reports}
                     </ul>
                  </Scroll>
               </div>
            }
         </section>
      </div>
   </Scroll>;
};
