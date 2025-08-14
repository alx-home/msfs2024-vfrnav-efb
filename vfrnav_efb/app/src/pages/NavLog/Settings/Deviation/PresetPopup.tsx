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

import { useKeyUp } from "@alx-home/Events";
import { Button, Input } from "@alx-home/Utils";
import { SettingsContext } from "@Settings/SettingsProvider";
import { useContext, useEffect, useState, useCallback } from 'react';

export const EditPresetPopup = ({ validate, current }: {
   validate: (_name: string) => void,
   current: string
}) => {
   const { setPopup, emptyPopup } = useContext(SettingsContext)!;
   const [name, setName] = useState('')
   const key = useKeyUp();

   const done = useCallback(() => {
      validate(name)
      setPopup(emptyPopup);
   }, [emptyPopup, name, setPopup, validate])

   useEffect(() => {
      if (key == 'Escape') {
         setPopup(emptyPopup);
      }
   }, [emptyPopup, key, setPopup])


   return <div className='flex flex-col p-2 w-full max-h-full'>
      <div className='text-2xl mt-4 mb-6 flex flex-row'>
         Deviation Preset
      </div>
      <div className="flex flex-row justify-center [&_.invalid]:text-red-500">
         <div className="flex shrink text-base my-auto">Preset Name:</div>
         <Input className="ml-4 max-w-64" active={true} placeholder={current} inputMode="text"
            validate={async (value) => {
               return (value.length !== 0) && ('custom' !== value);
            }}
            onChange={value => setName(value)}
            onValidate={done} />
      </div>
      <div className='flex flex-row w-full min-h-0 shrink-0 pt-8 justify-end [&>*]:mx-1' >
         <Button active={true} className='px-2'
            onClick={() => {
               setPopup(emptyPopup);
            }}>Cancel</Button>
         <Button active={true} className='px-2'
            onClick={done}>Validate</Button>
      </div>
   </div >;
};