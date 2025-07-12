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

import { PropsWithChildren, useEffect, useState } from "react";

import undoImg from '@alx-home/images/undo.svg';

export const Item = ({ children, name, category, className, onReset }: PropsWithChildren<{
   name: string,
   category?: string,
   className?: string,
   onReset?: () => void
}>) => {
   const [reset, setReset] = useState(false);

   useEffect(() => {
      if (reset) {
         onReset?.();
         setReset(false);
      }
   }, [onReset, reset, setReset]);

   return <div className="group flex flex-row py-4 pl-6 hover:bg-menu [&>*:not(:first-child)]:ml-[22px] pr-4">
      <div className="flex flex-col grow basis-0">
         <div className="flex text-base ">
            {(category ? <div className="flex text-slate-500">{category}:&nbsp;</div> : <></>)}
            {name}
         </div>
         <div className={"flex flex-col my-auto [&>*:not(:first-child,.no-margin)]:mt-[11px] p-2 pl-0 text-sm text-slate-500 pb-5 "
            + (className ?? '')
         }>
            {children}
         </div>
      </div>
      <div className="w-8">
         <button className="p-1 bg-transparent" tabIndex={-1}
            onClick={() => { setReset(true) }} >
            <img className="invert hover:filter-msfs cursor-pointer" src={undoImg} alt='undo' />
         </button>
      </div>
   </div>;
}
