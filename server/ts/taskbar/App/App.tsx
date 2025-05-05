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

import { useCallback } from "react";
import { useServer } from '@server-common/Hooks';

export const Element = ({ label, onClick, disabled, hideTaskbar }: {
  label: string,
  disabled?: boolean,
  hideTaskbar?: boolean,
  onClick?: () => void
}) => {
  return <button className="flex flex-row p-2 transition-all hocus:bg-gray-800 hocus:shadow-xl rounded-sm  hocus:pl-6 disabled:opacity-20"
    disabled={disabled}
    onClick={e => {
      e.currentTarget.blur()

      if (hideTaskbar ?? true) {
        window.hideTaskbar()
      }

      onClick?.()
    }}
  >
    {label}
  </button>
};

export const Separator = () => {
  return <div className="flex flex-row w-full h-[2px] bg-slate-500 bg-opacity-30 shadow-black shadow-opacity-1/4 shadow-sm my-2"></div>
}

export const App = () => {
  const exit = useCallback(() => { window.abort() }, []);
  const showSettings = useCallback(() => { window.showSettings() }, []);
  const { serverState, serverStateStr, switchServer, serverLock } = useServer();

  return <div className='flex flex-col h-full text-xl '>
    <div className='relative flex flex-col h-full w-full border-2 overflow-hidden p-4'>
      <Element onClick={window.openEFB} label="Open In App" />
      <Element disabled={serverState != 'running'} label="Open In Browser" onClick={window.openWebEFB} />
      {/* todo */}
      <Separator />
      <Element label={
        serverStateStr
      } disabled={serverLock} hideTaskbar={false} onClick={switchServer} />
      <Element label="Configure" onClick={showSettings} />
      <Separator />
      <Element label="Close" onClick={exit} />
    </div>
  </div>
}