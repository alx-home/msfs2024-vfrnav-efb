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

import { Button, Scroll } from "@alx-home/Utils";
import { useEffect, useRef } from "react";
import developerModeImage from "./images/vfs-developer-mode.svg";
import toolsMenuImage from "./images/vfs-tools-menu.svg";
import projectorImage from "./images/vfs-projector.svg";
import { useTranslation } from "@vfrnav/i18n";

const VfsHelp = () => {
   const { t } = useTranslation();

   return <ol id="vfs-help" className="flex flex-col gap-4 text-sm">
      <li className="flex flex-col gap-3 p-4 rounded border border-slate-600 bg-slate-800">
         <h3 className="text-base font-semibold text-blue-400 border-b border-slate-600 pb-2">{t('vfsHelp.step1.title')}</h3>
         <p>{t('vfsHelp.step1.description')}</p>
         <img src={developerModeImage} alt={t('vfsHelp.step1.alt')}
            className="w-full max-w-xl" />
      </li>
      <li className="flex flex-col gap-3 p-4 rounded border border-slate-600 bg-slate-800">
         <h3 className="text-base font-semibold text-blue-400 border-b border-slate-600 pb-2">{t('vfsHelp.step2.title')}</h3>
         <p>{t('vfsHelp.step2.description')}</p>
         <img src={toolsMenuImage} alt={t('vfsHelp.step2.alt')}
            className="w-full max-w-xl" />
      </li>
      <li className="flex flex-col gap-3 p-4 rounded border border-slate-600 bg-slate-800">
         <h3 className="text-base font-semibold text-blue-400 border-b border-slate-600 pb-2">{t('vfsHelp.step3.title')}</h3>
         <p>{t('vfsHelp.step3.description')}</p>
         <img src={projectorImage} alt={t('vfsHelp.step3.alt')}
            className="w-full max-w-xl" />
      </li>
   </ol>;
};

/** @brief Explain VFS projection setup and restore focus when the dialog closes.
 *
 * @param props Dialog close callback.
 *
 * @returns The VFS setup help dialog. */
export const VfsHelpPopup = ({ close }: { close?: () => void }) => {
   const { t } = useTranslation();
   const dialog = useRef<HTMLDialogElement>(null);

   useEffect(() => {
      const trigger = document.activeElement;
      const element = dialog.current;

      const handleKey = (event: KeyboardEvent) => {
         if (event.key === "Escape") { event.stopPropagation(); close?.(); }
         if (event.key === "Tab") {
            event.preventDefault();
            element?.querySelector("button")?.focus();
         }
      };

      element?.querySelector("button")?.focus();
      element?.addEventListener("keydown", handleKey);

      return () => {
         element?.removeEventListener("keydown", handleKey);

         if (trigger instanceof HTMLElement && trigger.isConnected) {
            trigger.focus();
         }
      };
   }, [close]);

   return <dialog open ref={dialog} aria-modal="true" aria-labelledby="vfs-help-title"
      className="static m-0 p-0 border-0 bg-transparent text-inherit w-full max-w-none max-h-full flex flex-col grow min-w-0 min-h-0">
      <div className="relative z-10 flex shrink-0 py-2 shadow-lg border-b-2 border-slate-700/45">
         <h2 id="vfs-help-title" className="m-auto text-2xl text-white shrink-0 [text-shadow:0_2px_4px_rgba(0,0,0,0.4)]">{t('vfsHelp.title')}</h2>
      </div>
      <div className="flex min-h-0 overflow-hidden">
         <Scroll className="flex-col py-4"><VfsHelp /></Scroll>
      </div>
      <div className="flex shrink-0 justify-end mt-2">
         <Button active={true} onClick={close}>{t('vfsHelp.close')}</Button>
      </div>
   </dialog>;
};
