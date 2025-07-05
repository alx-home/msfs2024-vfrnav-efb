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

import { Color } from "@shared/Settings";
import { PropsWithChildren, useCallback } from "react";
import { Legend } from "./Legend";
import { Items } from "./Items";
import { Slider } from "@alx-home/Utils";

export const ColorPicker = ({ defaultColor, value, setColor, name, category, children }: PropsWithChildren<{
   defaultColor: Color,
   value: Color,
   name: string,
   category: string,
   setColor: (_setter: (_old: Color) => Color) => void
}>) => {
   const setRed = useCallback((value: number) => {
      setColor((old) => ({ ...old, red: value }))
   }, [setColor]);
   const setGreen = useCallback((value: number) => {
      setColor((old) => ({ ...old, green: value }))
   }, [setColor]);
   const setBlue = useCallback((value: number) => {
      setColor((old) => ({ ...old, blue: value }))
   }, [setColor]);
   const setAlpha = useCallback((value: number) => {
      setColor((old) => ({ ...old, alpha: value }))
   }, [setColor]);

   return <Items name={name} category={category}>
      <Legend>
         {children}
      </Legend>
      <Slider className="max-w-3xl"
         range={{ min: 0, max: 255 }}
         defaultValue={defaultColor.red}
         value={value.red}
         onChange={setRed}
      >
         <div className="flex flex-row w-20">
            Red:
         </div>
      </Slider>
      <Slider className="max-w-3xl"
         range={{ min: 0, max: 255 }}
         defaultValue={defaultColor.green}
         value={value.green}
         onChange={setGreen}
      >
         <div className="flex flex-row w-20">
            Green:
         </div>
      </Slider>
      <Slider className="max-w-3xl"
         range={{ min: 0, max: 255 }}
         defaultValue={defaultColor.blue}
         value={value.blue}
         onChange={setBlue}
      >
         <div className="flex flex-row w-20">
            Blue:
         </div>
      </Slider>
      <Slider className="max-w-3xl"
         range={{ min: 0, max: 1 }}
         defaultValue={defaultColor.alpha}
         value={value.alpha}
         onChange={setAlpha}>
         <div className="flex flex-row w-20">
            Alpha:
         </div>
      </Slider>
   </Items>
}