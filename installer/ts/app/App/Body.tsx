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

import { Button, EndSlot, Input, Scroll, SelectOption, Select } from "@alx-home/Utils";
import { PropsWithChildren, RefObject, SetStateAction, useCallback, useEffect, useRef, useState, useContext } from 'react';
import { addPopup, LoadingPopup, PopupContext } from "@common/Popup";

const Elem = ({ children }: PropsWithChildren) => {
   return <div className='flex flex-row bg-slate-800 px-5 py-4 mt-1 text-left h-16'>
      {children}
   </div>
}

const Path = ({ onClick, path, defaultValue, placeholder, onChange, reload, validate: _validate, setIsValid, checkParent }: {
   onClick: (_value: string) => void,
   path: string,
   onChange: (_path: string) => void,
   defaultValue?: string,
   placeholder?: string,
   reload: boolean,
   validate?: (_: string) => void,
   setIsValid?: (_: boolean) => void,
   checkParent?: boolean
}) => {
   const ref = useRef<HTMLInputElement>(null);
   const callback = useCallback(() => onClick(ref.current!.value.length ? ref.current!.value : (defaultValue ?? path)), [onClick, defaultValue, path]);
   const validate = useCallback((path: string) => (
      checkParent ?
         window.parentExists(path) :
         window.exists(path))
      .then((value) => value ? (_validate?.(path) ?? true) : false
      ), [_validate, checkParent]);

   return <div className='flex flex-col grow justify-center'>
      <div className="flex flex-col grow [&:has(.invalid)_:last-child]:opacity-100">
         <div className="flex flex-row transition-all [&>.invalid]:mt-[-10px] justify-end">
            <Input className='peer transition-all pr-0'
               active={true} value={path} ref={ref} defaultValue={defaultValue} placeholder={placeholder} onChange={onChange}
               validate={validate} reload={reload} setIsValid={setIsValid}  >
               <EndSlot>
                  <div className='[&>*]:border-0 [&>*]:hover:border-l-2 [&>*]:bg-slate-600 [&>*]:hover:bg-slate-700 [&>*]:h-full'>
                     <Button active={true} className='px-4'
                        onClick={callback}>...</Button>
                  </div>
               </EndSlot>
            </Input>
         </div>
         <div className="flex flex-row grow opacity-0 transition-all">
            <p className="pt-1 text-red-500 text-sm h-0">
               Invalid path !
            </p>
         </div>
      </div>
   </div>
}


type StartupOption = 'Login' | 'Startup' | 'Never';

const useFolder = ({ placeholder, initPath, autoSub }: {
   placeholder?: string,
   initPath?: string,
   autoSub?: string
}
) => {
   const [path, setPath] = useState(initPath ?? '');
   const [pathValid, setPathValid] = useState(true);
   const [pathReload, setPathReload] = useState(false);
   const forcePath = useCallback((path: string) => {
      setPath(path)
      setPathReload(true);
   }, []);
   const askPath = useCallback(async (value: string) => {
      try {
         const result = await window.openFolder((autoSub && value.lastIndexOf('\\') > 0) ? value.substring(0, value.lastIndexOf('\\') + 1) : value)
         if (result && result !== '') {
            setPath(autoSub ? result + '\\' + autoSub : result);
            setPathReload(true);
            setPathValid(true);
         }
      } catch {
         // Cancel
      }
   }, [autoSub]);

   useEffect(() => {
      if (pathReload) {
         setPathReload(false);
      }
   }, [pathReload]);

   return {
      path: path, valid: pathValid, setValid: setPathValid, ask: askPath, set: forcePath, reload: pathReload, elem:
         <Path onClick={askPath} onChange={setPath} path={path} defaultValue='' reload={pathReload}
            placeholder={placeholder} setIsValid={setPathValid} checkParent={!!autoSub} />
   };
}

export const Body = ({ setCanContinue, validate }: {
   setCanContinue: (_setter: SetStateAction<boolean>) => void,
   validate: RefObject<(() => void) | null>
}) => {
   const { setInstalling } = useContext(PopupContext)!;

   const { path: communityPath, valid: communityValid, set: setCommunityPath, elem: communityElem } = useFolder({ placeholder: 'Location of MSFS 2024 community folder', autoSub: 'alexhome-msfs2024-vfrnav' });
   const { path: installPath, valid: installPathValid, set: setInstallPath, elem: installPathElem } = useFolder({ placeholder: 'MSFS2024 VFRNav\' Server installation path', autoSub: 'MSFS2024 VFRNav\' Server' });

   const [startupOption, setStartupOption] = useState<StartupOption>('Login');

   useEffect(() => {
      (async () => {
         const community = await window.findCommunity();
         if (community) {
            setCommunityPath(community);
         }
      })()
   }, [setCommunityPath])

   useEffect(() => {
      (async () => {
         const installPath = await window.defaultInstallPath();
         if (installPath) {
            setInstallPath(installPath);
         }
      })()
   }, [setInstallPath])

   useEffect(() => {
      setCanContinue(communityValid && installPathValid);
   }, [communityValid, installPathValid, setCanContinue]);

   useEffect(() => {
      validate.current = () => {
         setInstalling(true);
         addPopup(<LoadingPopup title="Installing" message="Installing MSFS2024 VFRNav' Server..." />, 0)

         window.validate(startupOption, communityPath, installPath).then(() => {
            setInstalling(false);
         }).catch(() => { setInstalling(false); });
      }
   }, [communityPath, installPath, startupOption, validate, setInstalling])

   return <div className='flex flex-row grow min-h-0 overflow-hidden'>
      <Scroll className='flex-col grow'>
         <div className='flex flex-col grow mx-auto min-w-[80%] max-w-6xl justify-center px-5 pb-4 gap-1'>
            <h2 className='mt-6 text-lg'>Info</h2>
            <blockquote className="p-4 border-s-4 border-gray-500 bg-gray-800">
               <div className='flex flex-col gap-y-3'>
                  <p className="text-sm italic font-medium leading-relaxed text-white">
                     This program is designed to proxy file browsing requests to the operating system and serve the app through a web server.
                  </p>
                  <p className="text-sm italic font-medium leading-relaxed text-white">
                     Please note that MSFS2024 VFRNav&apos; can function without this program by simply dragging the plugin into the community folder.<br />
                     However, doing so does not allow you to open PDF files from the computer or access the UI via a web browser or an external device.
                  </p>
               </div>
            </blockquote>
            <h2 className='mt-4 text-lg'>Startup</h2>
            <Elem>
               <div className='m-auto mr-5 grow min-w-0'>Auto start MSFS2024 VFRNav&apos; Server :</div>
               <div className='shrink'>
                  <Select value={startupOption} active={true} onChange={setStartupOption} className='pl-3'>
                     <SelectOption<StartupOption> id={'Login'}>Windows login</SelectOption>
                     <SelectOption<StartupOption> id={'Startup'}>MSFS startup</SelectOption>
                     <SelectOption<StartupOption> id={'Never'}>Never</SelectOption>
                  </Select>
               </div>
            </Elem>
            <h2 className='mt-4 text-lg'>Install Path</h2>
            <Elem>
               <div className='m-auto mr-4 w-14'>Addon :</div>
               {communityElem}
            </Elem>
            <Elem>
               <div className='m-auto mr-4 w-14'>Server :</div>
               {installPathElem}
            </Elem>
         </div>
      </Scroll>
   </div>
}

const RunClosePopup = ({ resolve }: {
   resolve: (_: boolean | PromiseLike<boolean>) => void
}) => {
   const abort = useCallback(() => {
      resolve(false);
   }, [resolve]);
   const startServer = useCallback(() => {
      resolve(true);
   }, [resolve]);

   return <div className='flex flex-col gap-y-5 grow'>
      <div className='text-2xl text-blue-400'>Info</div>
      <div className='text-sm gap-y-2 overflow-hidden'>
         <Scroll>
            <div>
               MSFS2024 VFRNav&apos; Server Successfully installed !
            </div>
         </Scroll>
      </div>
      <div className='flex flex-row [&>*>*]:px-14'>
         <Button active={true} className="grow" onClick={startServer}>Start Server</Button>
         <div className='flex flex-row [&>*]:bg-red-800 [&>*]:hover:bg-red-500 [&>*]:hover:border-white'>
            <Button active={true} onClick={abort}>Close</Button>
         </div>
      </div>
   </div>
};

const RunCleanPathPopup = ({ resolve, path, close }: {
   resolve: (_: boolean | PromiseLike<boolean>) => void,
   path: string,
   close?: () => void
}) => {
   const abort = useCallback(() => {
      resolve(false);
      close!();
   }, [close, resolve]);
   const validate = useCallback(() => {
      resolve(true);
      close!();
   }, [close, resolve]);

   return <div className='flex flex-col gap-y-5 grow'>
      <div className='text-2xl text-yellow-500'>Warning</div>
      <div className='text-sm gap-y-2 overflow-hidden'>
         <Scroll>
            <div className="flex flex-col">
               <div>
                  Removing folder :
               </div>
               <div>
                  &ldquo;{path}&ldquo;
               </div>
            </div>
         </Scroll>
      </div>
      <div className='flex flex-row [&>*>*]:px-14'>
         <Button active={true} className="grow" onClick={validate}>Continue</Button>
         <div className='flex flex-row [&>*]:bg-red-800 [&>*]:hover:bg-red-500 [&>*]:hover:border-white'>
            <Button active={true} onClick={abort}>Cancel</Button>
         </div>
      </div>
   </div>
};

window.start_program = async (): Promise<boolean> => {
   let resolve: ((_: boolean | PromiseLike<boolean>) => void) | null = null;
   const promise = new Promise<boolean>((resolve_) => {
      resolve = resolve_;
   });

   addPopup(<RunClosePopup resolve={resolve!} />, 1)

   return promise;
};

window.clean_path = async (path: string): Promise<boolean> => {
   let resolve: ((_: boolean | PromiseLike<boolean>) => void) | null = null;
   const promise = new Promise<boolean>((resolve_) => {
      resolve = resolve_;
   });

   addPopup(<RunCleanPathPopup resolve={resolve!} path={path} />, 1)

   return promise;
}