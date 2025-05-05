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


import { Button, Scroll } from "@alx-home/ts-utils";
import { Dispatch, ReactElement, SetStateAction, useEffect, useMemo, useState } from "react";

let popupRef: Dispatch<SetStateAction<ReactElement | undefined>> | undefined = undefined;

let popupProm = Promise.resolve();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addPopup = (elem_: ReactElement<any>) => {
   popupProm = popupProm.then(() =>
      new Promise<void>((resolve) =>
         popupRef?.(<elem_.type {...elem_.props} close={elem_.props.close ? () => {
            elem_.props.close()
            resolve()
         } : resolve} />)
      )
   ).then(() => {
      popupRef?.(undefined)
   })
};

export const MessagePopup = ({ message, close, title }: {
   title: ReactElement
   message: string,
   close?: (() => void) | 'steady',
}) => {
   const Footer = useMemo(() =>
      close != 'steady' ?
         <div className='flex flex-row grow'>
            <Button active={true} onClick={close}>OK</Button>
         </div> :
         <></>
      , [close]);

   return <div className='flex flex-col gap-y-6 grow'>
      {title}
      <div className='text-xl gap-y-2 overflow-hidden'>
         <Scroll>
            <div className="mb-4" dangerouslySetInnerHTML={{ __html: message }}></div>
         </Scroll>
      </div>
      {Footer}
   </div>
};

const WarningPopup = ({ message, close, onClose }: {
   message: string,
   onClose?: (() => void) | 'steady',
   // Do not use close : managed by AddPopup
   close?: (() => void)
}) => {
   return <MessagePopup title={<div className='text-3xl text-yellow-500'>Warning !</div>} message={message} close={onClose ?? close} />
};

const ErrorPopup = ({ message, close, onClose }: {
   message: string,
   onClose?: (() => void) | 'steady',
   // Do not use close : managed by AddPopup
   close?: (() => void)
}) => {
   return <MessagePopup title={<div className='text-3xl text-red-700'>Error !</div>} message={message} close={onClose ?? close} />
};

const FatalPopup = ({ message, close, onClose }: {
   message: string,
   onClose?: (() => void) | 'steady',
   // Do not use close : managed by AddPopup
   close?: (() => void)
}) => {
   return <MessagePopup title={<div className='text-3xl text-red-700'>Fatal Error !</div>} message={message} close={onClose ?? close} />
};

const InfoPopup = ({ message, close, onClose }: {
   message: string,
   onClose?: (() => void) | 'steady',
   // Do not use close : managed by AddPopup
   close?: (() => void)
}) => {
   return <MessagePopup title={<div className='text-3xl text-blue-400'>Info</div>} message={message} close={onClose ?? close} />
};

window.display_appstopping = () => {
   addPopup(<InfoPopup message="App is stopping !" onClose="steady" />)
}

window.display_warning = (message: string) => {
   addPopup(<WarningPopup message={message} />)
};

window.display_error = (message: string) => {
   addPopup(<ErrorPopup message={message} />)
};

window.display_fatal = (message: string) => {
   addPopup(<FatalPopup message={message} />)
};

window.display_info = (message: string) => {
   addPopup(<InfoPopup message={message} />)
};

export const Popup = () => {
   const [popup, setPopup] = useState<ReactElement | undefined>(undefined);

   useEffect(() => {
      popupRef = setPopup;
      return () => popupRef = undefined
   }, []);

   return <div className={'absolute flex flex-col w-full h-full bg-opacity-80 bg-slate-600 z-50 justify-center'
      + (popup === undefined ? ' hidden' : '')
   }>
      <div className='flex flex-row box-border relative m-auto w-full max-w-4xl max-h-full'>
         <div className='flex flex-row grow bg-menu border-2 hover:border-msfs px-8 py-5 shadow-slate-950 shadow-md m-8 max-h-full'>
            <div className='flex flex-row grow overflow-hidden'>
               {popup ?? <></>}
            </div>
         </div>
      </div>
   </div>
}