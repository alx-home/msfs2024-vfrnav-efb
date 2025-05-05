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

import { Button, Scroll } from "@alx-home/Utils";
import { Dispatch, createContext, ReactElement, SetStateAction, useEffect, useState, useContext, useMemo, PropsWithChildren } from 'react';

export type State = {
   installing: boolean,
   setInstalling: Dispatch<SetStateAction<boolean>>
};
export const PopupContext = createContext<State | undefined>(undefined);


let popupRef: Dispatch<SetStateAction<ReactElement | undefined>> | undefined = undefined;


const currentPopup: {
   ref: ReactElement<unknown> | null,
   level: 0 | 1 | 2 | 3 | null
} = { ref: null, level: null };

const popupProms = [{
   ref: Promise.resolve(),
   stack: null as ReactElement<unknown> | null,
   queue_size: 0
}, {
   ref: Promise.resolve(),
   stack: null as ReactElement<unknown> | null,
   queue_size: 0
}, {
   ref: Promise.resolve(),
   stack: null as ReactElement<unknown> | null,
   queue_size: 0
}, {
   ref: Promise.resolve(),
   stack: null as ReactElement<unknown> | null,
   queue_size: 0
}];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addPopup = (elem_: ReactElement<any>, priority: 0 | 1 | 2 | 3) => {
   const proms = popupProms[priority];

   ++proms.queue_size
   proms.ref = proms.ref.then(() =>
      new Promise<void>((resolve) => {
         const popup = <elem_.type {...elem_.props} close={elem_.props.close ? () => {
            elem_.props.close()
            resolve()
         } : resolve} />;

         if (priority < (currentPopup.level ?? 0)) {
            // There is a higher priority popup ongoing go to the stack will be resume later by one of them
            console.assert(!proms.stack);
            proms.stack = popup
         } else {
            // We are the highest priority one 

            if (currentPopup.ref) {
               // There is already a lowest priority Popup : Get out !
               //  => it will be resumed later
               const proms = popupProms[currentPopup.level!];
               console.assert(!proms.stack);
               proms.stack = currentPopup.ref;
            }

            // => let's be displayed !
            currentPopup.level = priority;
            currentPopup.ref = popup;
            popupRef?.(popup)
         }
      }
      )
   ).then(() => {
      let level = currentPopup.level!;
      const proms = popupProms[level];

      if (--proms.queue_size || level == 0) {
         // Nothing to do there is other promise with equal priority as ours queued
      } else {
         // Check if a lower priority popup has been stacked

         for (--level; level >= 0; --level) {
            const proms = popupProms[level];

            if (proms.stack) {
               // Found one => display it

               currentPopup.ref = proms.stack;
               currentPopup.level = level as 0 | 1 | 2 | 3;
               proms.stack = null;
               popupRef?.(currentPopup.ref)
               return;
            }
         }
      }

      // No popup => clean everything up
      currentPopup.ref = null;
      currentPopup.level = null;
      popupRef!(undefined);
   })
};

export const MessagePopup = ({ messages, close, title }: {
   title: ReactElement
   messages: string[] | string,
   close?: (() => void) | 'steady'
}) => {
   const Footer = useMemo(() =>
      close != 'steady' ?
         <div className='flex flex-row grow'>
            <Button active={true} onClick={close}>OK</Button>
         </div> :
         <></>
      , [close]);

   const message = useMemo(() =>
      (Array.isArray(messages) ? messages : [messages])
         .map((message, line) => <div className="flex flex-row grow" key={message + "_" + line}>
            {message}
         </div>)
      , [messages]);

   return <div className='flex flex-col [&>:not(:first-child)]:my-6 grow'>
      {title}
      <div className='text-xl [&>:not(:first-child)]:my-2 overflow-hidden ml-2'>
         <Scroll>
            <div className="flex flex-col m-auto mb-4">
               {message}
            </div>
         </Scroll>
      </div>
      {Footer}
   </div>
};

export const LoadingPopup = ({ message, close, title }: {
   title: string
   message: string,
   close?: () => void
}) => {
   const { installing } = useContext(PopupContext)!;

   useEffect(() => {
      if (!installing) {
         close!()
      }
   }, [close, installing])

   return <div className='flex flex-col [&>:not(:first-child)]:my-6 grow'>
      <div className='text-3xl text-blue-400'>{title}</div>
      <div className='text-xl [&>:not(:first-child)]:my-2 overflow-hidden'>
         <Scroll>
            <div className="mb-4" dangerouslySetInnerHTML={{ __html: message }}></div>
         </Scroll>
      </div>
   </div>
};

window.display_warning = (messages: string[]) => {
   addPopup(<MessagePopup
      title={<div className='text-3xl text-yellow-500'>Warning !</div>}
      messages={messages}
   />, 1)
};

window.display_error = (messages: string[]) => {
   addPopup(<MessagePopup
      title={<div className='text-3xl text-red-700'>Error !</div>}
      messages={messages}
   />, 2)
};

window.display_fatal = (messages: string[]) => {
   addPopup(<MessagePopup
      title={<div className='text-3xl text-red-700'>Fatal Error !</div>}
      messages={messages}
   />, 3)
};

window.display_info = (messages: string[]) => {
   addPopup(<MessagePopup
      title={<div className='text-3xl text-blue-400'>Info</div>}
      messages={messages}
   />, 0)
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

export const PopupContextProvider = ({ children }: PropsWithChildren) => {
   const [installing, setInstalling] = useState(false);

   const PopupState = useMemo(() => ({
      installing: installing,
      setInstalling: setInstalling
   }), [installing]);

   return <PopupContext.Provider
      value={PopupState}
   >
      {children}
   </PopupContext.Provider>
}