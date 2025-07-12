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

import { Children, HTMLInputTypeAttribute, isValidElement, PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Item } from "./Item";
import { Input } from "@alx-home/Utils";

export const InputItem = ({ children, name, category, placeholder, pattern, className, type, inputMode, validate, onChange, defaultValue, value }: PropsWithChildren<{
   name: string,
   category?: string,
   placeholder?: string,
   pattern?: string,
   className?: string,
   defaultValue?: string,
   value?: string,
   inputMode?: "email" | "search" | "tel" | "text" | "url" | "none" | "numeric" | "decimal",
   validate?: (_value: string, _blur: boolean) => Promise<boolean>,
   type?: HTMLInputTypeAttribute,
   onChange?: (_value: string) => void
}>) => {
   const childs = useMemo(() => Children.toArray(children), [children]);
   const [reset, setReset] = useState(false);
   const resetCallback = useMemo(() => () => setReset(true), [setReset]);

   useEffect(() => {
      if (reset) {
         setReset(false);
      }
   }, [reset, setReset]);

   return <Item name={name} category={category} onReset={resetCallback}>
      {childs.filter(child => isValidElement<{ type: string }>(child) ? child.props.type !== 'Error' : true)}
      <Input reset={reset} defaultValue={defaultValue} value={value} className={"max-w-3xl peer " + (className ?? '')} validate={validate}
         onChange={onChange} inputMode={inputMode} type={type} active={true} placeholder={placeholder} pattern={pattern} />
      <div className="no-margin hidden h-0 peer-[.invalid]:flex">
         <p className="pl-8 pt-1 text-red-500 text-sm">
            {childs.filter(child => isValidElement<{ type: string }>(child) && child.props.type === 'Error')}
         </p>
      </div>
   </Item>;
}