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

import { Input, Scroll, Select, CheckBox, SelectOption } from "@alx-home/Utils";
import { StartupOption } from "@server-common/env";
import { PropsWithChildren, useCallback, useEffect, useState } from "react";

const Elem = ({ children }: PropsWithChildren) => {
   return <div className='flex flex-row bg-slate-800 p-3 text-left h-14'>
      {children}
   </div>
}

type Language = 'English';

export const Body = () => {
   const [startupOption, setStartupOption] = useState<StartupOption>('Login');
   const [startServer, setStartServer] = useState(true);
   const [port, setPort] = useState<number | undefined>(undefined);
   const [invalidPort, setInvalidPort] = useState<boolean>(true);
   const [reloadPort, setReloadPort] = useState(true);

   useEffect(() => {
      (async () => {
         setStartServer(await window.autostartServer());
      })()
   }, []);

   useEffect(() => {
      (async () => {
         const port = await window.serverPort();
         setInvalidPort(port == 0);

         // Enforce input port (Initial value)
         if (port != 0) {
            setPort(port);
            setReloadPort(true);
         }
      })()
   }, []);

   const _setPort = useCallback((value: string) => {
      (async () => {
         const port = await window.serverPort(+value);
         setInvalidPort(port == 0);

         // Port was enforced by server, reset input
         if (port != +value) {
            if (port != 0) {
               setPort(port);
            } else {
               setPort(undefined);
            }
            setReloadPort(true);
         }
      })()
   }, []);
   const _setStartServer = useCallback((value: boolean) => {
      (async () => {
         setStartServer(await window.autostartServer(value));
      })()
   }, []);
   const _setStartupOption = useCallback((value: StartupOption) => {
      (async () => {
         setStartupOption(await window.startupOption(value));
      })()
   }, []);

   const validatePort = useCallback((value: string) => {
      const result = /^\d+$/.test(value) && +value > 999 && +value < 65536;
      if (!result) {
         _setPort("0");
      }

      return Promise.resolve(result);
   }, [_setPort])

   useEffect(() => {
      if (port) {
         setPort(undefined);
      }
   }, [port]);

   return <div className='flex flex-row grow min-h-0 overflow-hidden'>
      <Scroll className='flex-col grow'>
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
                  <Select value={'English'} disabled={true} active={false} className='min-w-40' onChange={() => { }}>
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
                        <Input className='peer transition-all max-w-40 px-2' inputClass='text-right' value={port?.toString()}
                           active={true} placeholder={
                              "Server listening port"
                           } inputMode={'decimal'} reload={reloadPort}
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
   </div>
}