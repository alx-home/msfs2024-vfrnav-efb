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

import { Children, isValidElement, PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Item } from "./Item";
import { Slider } from "@alx-home/Utils";

export const SliderItem = ({ name, category, className, onChange, defaultValue, value, range, bounds, children }: PropsWithChildren<{
   name: string,
   category?: string,
   className?: string,
   defaultValue?: number,
   value: number,
   bounds?: {
      min: number,
      max: number
   },
   range: { min: number, max: number },
   onChange: (_value: number) => void
}>) => {
   const [reset, setReset] = useState(false);
   const resetCallback = useMemo(() => () => setReset(true), [setReset]);
   const childs = useMemo(() => Children.toArray(children), [children]);

   useEffect(() => {
      if (reset) {
         setReset(false);
      }
   }, [reset, setReset]);

   return <Item name={name} category={category} onReset={resetCallback}>
      {childs.filter(child => isValidElement<{ type: string }>(child) ? child.props.type !== 'Error' : true)}
      <Slider reset={reset} defaultValue={defaultValue} value={value} className={"max-w-3xl peer " + (className ?? '')}
         onChange={onChange} bounds={bounds} active={true} range={range} />
   </Item>;
}
