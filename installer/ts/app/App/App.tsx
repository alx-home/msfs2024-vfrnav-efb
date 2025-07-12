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

import { useCallback, useRef, useState } from 'react';

import Logo from '@vfrnav/images/app-icon.svg?react';

import { Button } from '@alx-home/Utils';
import { Popup, PopupContextProvider } from '@common/Popup';
import { Body } from './Body';

const Header = () => {
  return <div className='flex flex-row shrink bg-msfs px-5 pb-5 shadow-color-default/80 shadow-md [&>*]:drop-shadow-xl'>
    <Logo height={"2.5rem"} width={"2.5rem"} />
    <h1 className='text-2xl ml-2'>MSFS2024 VFRNav&apos; Server</h1>
  </div>
}

const Trailer = ({ canContinue, validate }: {
  canContinue: boolean,
  validate: () => void
}) => {
  return <div className='flex flex-row shrink bg-slate-800 p-2 shadow-md justify-end'>
    <div className='flex flex-row shrink'>
      <Button className='px-4' active={canContinue} disabled={!canContinue} onClick={validate}>Continue</Button>
      <div className='[&>*]:bg-red-800 [&>*]:hover:bg-red-500 [&>*]:hover:border-white'>
        <Button className='px-4' active={true} onClick={() => { window.abort() }}>Abort</Button>
      </div>
    </div>
  </div>
}
export const App = () => {
  const [canContinue, setCanContinue] = useState(false);
  const validateRef = useRef<() => void>(null)

  const validate = useCallback(() => {
    validateRef.current?.();
  }, []);

  return <PopupContextProvider>
    <div className='flex flex-col h-full text-sm '>
      <Header />
      <div className='relative flex flex-col h-full w-full overflow-hidden'>
        <Popup />
        <Body setCanContinue={setCanContinue} validate={validateRef} />
        <Trailer canContinue={canContinue} validate={validate} />
      </div>
    </div>
  </PopupContextProvider >
}