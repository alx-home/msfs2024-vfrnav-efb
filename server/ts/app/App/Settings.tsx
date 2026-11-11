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

import { CheckBox, Input, Scroll, Select, SelectOption } from "@alx-home/Utils";
import { StartupOption } from "@server-common/env";
import { PropsWithChildren, useEffect, useRef, useState } from "react";

import { useEvent } from 'react-use-event-hook';


const Elem = ({ children }: PropsWithChildren) => {
   return <div className='flex flex-row bg-slate-800 p-3 text-left h-14'>
      {children}
   </div>
}

type Language = 'English';
const MIN_PORT = 1000;
const MAX_PORT = 65535;

export const Settings = () => {
   const [startupOption, setStartupOption] = useState<StartupOption>('Login');
   const [startServer, setStartServer] = useState(true);
   const portInput = useRef<HTMLInputElement>(null);
   const [invalidPort, setInvalidPort] = useState<boolean>(true);

   const _setPort = useEvent((value: string) => {
      (async () => {
         const currentPort = await globalThis.window.serverPort(+value);
         setInvalidPort(currentPort === 0);

         // Port was enforced by server, reset input
         if (currentPort !== +value && currentPort !== 0 && portInput.current) {
            portInput.current.value = currentPort.toString();
         }
      })()
   });

   const _setStartServer = useEvent((value: boolean) => {
      (async () => {
         setStartServer(await globalThis.window.autostartServer(value));
      })()
   });

   const _setStartupOption = useEvent((value: StartupOption) => {
      (async () => {
         setStartupOption(await globalThis.window.startupOption(value));
      })()
   });

   const validatePort = useEvent((value: string) => {
      const result = /^\d+$/.test(value) && +value >= MIN_PORT && +value <= MAX_PORT;
      if (!result) {
         _setPort("0");
      }

      return Promise.resolve(result);
   })

   const doNothing = useEvent(() => { });

   useEffect(() => {
      (async () => {
         setStartServer(await globalThis.window.autostartServer());
      })()
   }, []);

   useEffect(() => {
      (async () => {
         const port = await globalThis.window.serverPort();
         setInvalidPort(port === 0);

         // Enforce input port (Initial value)
         if (port !== 0 && portInput.current) {
            portInput.current.value = port.toString();
         }
      })()
   }, []);

   return <Scroll className='flex-col grow'>
      <div className='flex flex-col grow mx-auto min-w-[80%] justify-center p-5 gap-3 py-6'>
         <h2 className='mt-1 text-lg'>Startup</h2>
         <Elem>
            <div className='m-auto mr-5 grow min-w-0'>Auto start MSFS2024 VFRNav&apos; Server :</div>
            <div className='shrink'>
               <Select value={startupOption} active={true} onChange={_setStartupOption} className='min-w-40'>
                  <SelectOption<StartupOption> id={'Login'}>Windows login</SelectOption>
                  <SelectOption<StartupOption> id={'Startup'}>MSFS startup</SelectOption>
                  <SelectOption<StartupOption> id={'Never'}>Never</SelectOption>
               </Select>
            </div>
         </Elem>
         <h2 className='mt-2 text-lg'>Settings</h2>
         <Elem>
            <div className='m-auto mr-5 grow min-w-0'>Language :</div>
            <div className='shrink'>
               <Select value={'English'} disabled={true} active={false} className='min-w-40' onChange={doNothing}>
                  <SelectOption<Language> id={'English'}>English</SelectOption>
               </Select>
            </div>
         </Elem>
         <h2 className='mt-2 text-lg'>Embed server</h2>
         <blockquote className="p-4  border-s-4 border-gray-500 bg-gray-800">
            <p className="text-sm italic font-medium leading-relaxed text-white">
               The embed server is required when opening the EFB via an external device or web browser.<br />
               Additionally, even when accessing the EFB directly within the app, it must be launched to ensure synchronization with the simulator.
            </p>
         </blockquote>
         <Elem>
            <div className='flex flex-row grow m-auto mr-5'>Start server at launch :</div>
            <CheckBox value={startServer} active={!invalidPort} onChange={_setStartServer} />
         </Elem>
         <Elem>
            <div className="peer flex flex-row grow">
               <div className='flex flex-row m-auto mr-5 grow drop-shadow-md'>Port :</div>
               {/* peer-[.invalid]:flex peer-[.invalid]:opacity-100 */}
               <div className="flex flex-col grow [&:has(.invalid)_:last-child]:opacity-100">
                  <div className="flex flex-row transition-all [&>.invalid]:mt-[-10px] justify-end">
                     <Input ref={portInput} className='peer transition-all max-w-40 px-2' inputClass='text-right'
                        active={true} placeholder={
                           "Server listening port"
                        } inputMode={'decimal'}
                        validate={validatePort} onChange={_setPort} />
                  </div>
                  <div className="flex flex-row grow opacity-0 transition-all justify-end">
                     <p className="pt-1 text-red-500 text-xs h-0">
                        Invalid port (999 {'<'} value {'<'} 65&apos;536) !
                     </p>
                  </div>
               </div>
            </div>
         </Elem>
      </div>
   </Scroll>
}