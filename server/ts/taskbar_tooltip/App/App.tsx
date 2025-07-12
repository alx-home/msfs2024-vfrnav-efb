/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
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

import { Button } from "@alx-home/Utils";

import Logo from '@vfrnav/images/app-icon.svg?react';
import Arrow from "@alx-home/images/arrow.svg?react";

import { useCallback } from "react";

export const App = () => {
  const close = useCallback(() => {
    window.hideTaskbarToolTip();
  }, []);

  return <div className='flex flex-col h-full text-sm'>
    <div className="relative flex flex-col grow min-h-0 border-x-2 rounded-t-xl bg-[var(--background)] [&>:not(:last-child)]:p-4 [&>:last-child)]:pt-2 z-50 overflow-hidden">
      <div className="flex flex-row bg-msfs shadow-color-default/80 shadow-md [&>*]:drop-shadow-xl rounded-t-xl border-t-2 overflow-hidden">
        <Logo height={"2rem"} width={"2rem"} />
        <h1 className="text-xl ml-2">VFR Nav&apos; server</h1>
      </div>
      <blockquote className="flex flex-col p-2 grow text-center justify-center">
        <p className="text-sm italic font-medium leading-relaxed text-white">
          App will stays minimized
        </p>
      </blockquote>
      <div className="flex flex-row grow bg-slate-800 p-3 px-5 pb-0 h-12 max-h-12">
        <Button active={true} onClick={close}>Got it</Button>
      </div>
    </div>
    <div className="relative flex flex-row shrink grow-0 w-full h-4 bg-slate-800 overflow-visible z-0">
      <div className="flex grow border-b-2 border-l-2 rounded-bl-md"></div>
      <div className="border-t-2 border-slate-800 w-6 h-0">
      </div>
      <div className="flex grow border-b-2 border-r-2 rounded-br-md"></div>
    </div>
    <div className="m-auto [&_#inner-arrow]:!fill-slate-800 [&_#inner-arrow]:[fill-opacity:1!important] drop-shadow-md h-4">
      <Arrow className="-rotate-90 -my-3 overflow-hidden" width={30} height={30} title="arrow" />
    </div>
  </div>
}