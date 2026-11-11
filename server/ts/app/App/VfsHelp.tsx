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

const VfsHelp = () => <ol id="vfs-help" className="flex flex-col gap-4 text-sm">
   <li className="flex flex-col gap-3 p-4 rounded border border-slate-600 bg-slate-800">
      <h3 className="text-base font-semibold text-blue-400 border-b border-slate-600 pb-2">1. Enable Developer Mode</h3>
      <p>In MSFS, open Settings &gt; General &gt; Advanced Options and enable Developer Mode.</p>
      <img src={developerModeImage} alt="General settings: select Advanced Options, then check Developer Mode"
         className="w-full max-w-xl" />
   </li>
   <li className="flex flex-col gap-3 p-4 rounded border border-slate-600 bg-slate-800">
      <h3 className="text-base font-semibold text-blue-400 border-b border-slate-600 pb-2">2. Open Virtual File System</h3>
      <p>From the developer toolbar at the top, choose Tools &gt; Virtual File System.</p>
      <img src={toolsMenuImage} alt="Developer toolbar: open Tools and choose Virtual File System"
         className="w-full max-w-xl" />
   </li>
   <li className="flex flex-col gap-3 p-4 rounded border border-slate-600 bg-slate-800">
      <h3 className="text-base font-semibold text-blue-400 border-b border-slate-600 pb-2">3. Start projection</h3>
      <p>In the VFS Projector section, click Start. Wait for Projection started. Keep MSFS running; Deep scanning becomes available automatically.</p>
      <img src={projectorImage} alt="VFS Projector: click Start and wait for Projection started"
         className="w-full max-w-xl" />
   </li>
</ol>;

/** @brief Explain VFS projection setup and restore focus when the dialog closes.
 *
 * @param props Dialog close callback.
 *
 * @returns The VFS setup help dialog. */
export const VfsHelpPopup = ({ close }: { close?: () => void }) => {
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
         <h2 id="vfs-help-title" className="m-auto text-2xl text-white shrink-0 [text-shadow:0_2px_4px_rgba(0,0,0,0.4)]">Enable VFS projection</h2>
      </div>
      <div className="flex min-h-0 overflow-hidden">
         <Scroll className="flex-col py-4"><VfsHelp /></Scroll>
      </div>
      <div className="flex shrink-0 justify-end mt-2">
         <Button active={true} onClick={close}>Close</Button>
      </div>
   </dialog>;
};
