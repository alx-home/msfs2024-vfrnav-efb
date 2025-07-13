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

import Logo from '@vfrnav/images/app-icon.svg?react';
import { Button } from '@alx-home/Utils';
import { Body } from './Body';
import { useCallback } from 'react';
import { useServer } from '@server-common/Hooks';
import { Popup, PopupContextProvider } from '@common/Popup';

const Header = () => {
  return <div className='flex flex-row shrink bg-msfs px-5 pb-5 shadow-color-default/80 shadow-md [&>*]:drop-shadow-xl'>
    <Logo height={"2.5rem"} width={"2.5rem"} />
    <h1 className='text-2xl ml-2'>MSFS2024 VFRNav&apos; Server</h1>
  </div>
}

const Trailer = () => {
  const { serverState, serverStateStr, switchServer, serverLock } = useServer();
  const abort = useCallback(() => {
    window.abort();
  }, []);

  const openEFB = useCallback(() => { window.openEFB(); }, [])
  const openWebEFB = useCallback(() => { window.openWebEFB(); }, [])

  return <div className='flex flex-row shrink bg-slate-800 p-2 shadow-md justify-end'>
    <Button className='px-4' active={!serverLock} disabled={serverLock} onClick={switchServer}
    >
      {serverStateStr}
    </Button>
    <Button className='px-4' active={serverState == 'running'} disabled={serverState != 'running'}
      onClick={openWebEFB}>Open In Browser</Button>
    <Button className='px-4' active={true} onClick={openEFB}>Open In App</Button>
    <div className='[&>*]:bg-red-800 [&>*]:hover:bg-red-500 [&>*]:hover:border-white'>
      <Button className='px-4' active={true} onClick={abort}>Terminate</Button>
    </div>
  </div>
}

export const App = () => {
  return <PopupContextProvider>
    <div className='flex flex-col h-full text-sm '>
      <Header />
      <div className='relative flex flex-col h-full w-full overflow-hidden'>
        <Popup />
        <Body />
        <Trailer />
      </div>
    </div>
  </PopupContextProvider>
}