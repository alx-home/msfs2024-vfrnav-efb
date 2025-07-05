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

import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Item } from "./Item";
import { CheckBox } from "@alx-home/Utils";

export const CheckItem = ({ children, name, category, value, defaultValue, onChange, disabled }: PropsWithChildren<{
   name: string,
   category?: string,
   defaultValue?: boolean,
   value: boolean,
   onChange: (_checked: boolean) => void,
   disabled?: boolean
}>) => {
   const [reset, setReset] = useState(false);
   const resetCallback = useMemo(() => () => setReset(true), [setReset]);

   useEffect(() => {
      if (reset) {
         setReset(false);
      }
   }, [reset, setReset]);

   return <Item name={name} category={category} onReset={resetCallback}>
      <CheckBox reset={reset} active={!(disabled ?? false)} className="flex flex-row my-auto" value={value} defaultValue={defaultValue} onChange={onChange}>
         <div className="flex grow my-auto">
            {children}
         </div>
      </CheckBox>
   </Item>;
}