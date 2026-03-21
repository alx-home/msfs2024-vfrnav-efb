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

import type { Config } from "tailwindcss";
import BaseTailwind from '../../submodules/ts-utils/tailwind.config';
import { PluginAPI } from "tailwindcss/types/config";

const Tailwind: Config = {
   ...BaseTailwind, content: [
      "./src/**/*.{js,ts,jsx,tsx,mdx}",
      "../../common/ts/**/*.{js,ts,jsx,tsx,mdx}",
      "../../submodules/ts-utils/src/**/*.{js,ts,jsx,tsx,mdx}"
   ],
   theme: {
      ...BaseTailwind.theme, extend: {
         ...BaseTailwind.theme?.extend,
         invert: {
            0: "0%",
            25: "25%",
            50: "50%",
            75: "75%",
            100: "100%",
         }
      }
   },
   corePlugins: {
      filter: false,
      invert: false,
   },
   plugins: [
      ...BaseTailwind.plugins || [],
      ({ matchUtilities, theme }: PluginAPI) => {
         matchUtilities(
            {
               invert: (value) => ({
                  filter: `invert(${value})`,
               }),
            },
            {
               values: theme('invert'),
               supportsNegativeValues: false,
            }
         )
      }
   ]
};
export default Tailwind;