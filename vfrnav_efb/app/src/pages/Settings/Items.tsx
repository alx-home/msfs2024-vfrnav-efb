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

import { Children, isValidElement, PropsWithChildren, ReactElement, useEffect, useMemo, useState } from "react";
import { isLegend } from "./Legend";
import { Item } from "./Item";

export const isItem = <T,>(child: unknown): child is ReactElement<PropsWithChildren<T>> => {
   if (!isValidElement(child)) {
      return false;
   }

   return true
};

type Props = PropsWithChildren<{
   name: string,
   category?: string
}>;
export const Items = ({ children, name, category }: Props) => {
   const [reset, setReset] = useState(false);
   const resetCallback = useMemo(() => () => setReset(true), [setReset]);
   const childs = useMemo(() =>
      Children.toArray(children).filter(child => isItem(child)).map((child) => {
         if (isLegend(child)) {
            return child
         } else {
            return <child.type key={child.key} reset={reset} className="flex flex-row my-auto" {...child.props}>
               {child.props.children}
            </child.type>
         }
      }
      ), [children, reset]);

   useEffect(() => {
      if (reset) {
         setReset(false);
      }
   }, [reset, setReset]);

   return <Item name={name} category={category} onReset={resetCallback}>
      {childs}
   </Item>;
}