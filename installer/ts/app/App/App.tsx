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
 * not, see <https://gnu.org>.
 */

import { useRef, useState } from 'react';

import Logo from '@vfrnav/images/app-icon.svg?react';

import { Button, Select, SelectOption } from '@alx-home/Utils';
import { Popup, PopupContextProvider } from '@common/Popup';
import { Body } from './Body';
import { I18nProvider, useTranslation } from '../i18n/I18nContext';
import { useEvent } from 'react-use-event-hook';

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
  const { t, lang, setLang } = useTranslation();

  const Abort = useEvent(() => {
    window.abort();
  });

  return <div className='flex flex-row shrink bg-slate-800 p-2 shadow-md'>
    <div className='flex-grow flex flex-col items-start'>
      <Select value={lang} active={true} onChange={setLang} expend={'top'} >
        <SelectOption id="de">Deutsch</SelectOption>
        <SelectOption id="en">English</SelectOption>
        <SelectOption id="es">Español</SelectOption>
        <SelectOption id="fr">Français</SelectOption>
        <SelectOption id="it">Italiano</SelectOption>
        <SelectOption id="nl">Nederlands</SelectOption>
        <SelectOption id="pl">Polski</SelectOption>
        <SelectOption id="pt">Português</SelectOption>
        <SelectOption id="pt-BR">Português (Brasil)</SelectOption>
        <SelectOption id="sv">Svenska</SelectOption>
        <SelectOption id="tr">Türkçe</SelectOption>
        <SelectOption id="ru">Русский</SelectOption>
        <SelectOption id="ja">日本語</SelectOption>
        <SelectOption id="zh-CN">中文 (简体)</SelectOption>
      </Select>
    </div>
    <div className='flex flex-row shrink items-center'>
      <Button className='px-4' active={canContinue} disabled={!canContinue} onClick={validate}>{t('trailer.continue')}</Button>
      <div className='[&>*]:bg-red-800 [&>*]:hover:bg-red-500 [&>*]:hover:border-white'>
        <Button className='px-4' active={true} onClick={Abort}>{t('trailer.abort')}</Button>
      </div>
    </div>
  </div>
}

export const App = () => {
  const [canContinue, setCanContinue] = useState(false);
  const validateRef = useRef<(() => void) | null>(null);

  const validate = useEvent(() => {
    validateRef.current?.();
  });

  return <I18nProvider>
    <PopupContextProvider>
      <div className='flex flex-col h-full text-sm '>
        <Header />
        <div className='relative flex flex-col h-full w-full overflow-hidden'>
          <Popup />
          <Body setCanContinue={setCanContinue} validateRef={validateRef} />
          <Trailer canContinue={canContinue} validate={validate} />
        </div>
      </div>
    </PopupContextProvider >
  </I18nProvider>
}
