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
import BaseTailwind from '../../submodules/ts-utils/tailwind.config.js';

const Tailwind: Config = {
   ...BaseTailwind, content: [
      "../../common/ts/**/*.{js,ts,jsx,tsx,mdx}",
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./taskbar/**/*.{js,ts,jsx,tsx,mdx}",
      "./taskbar_tooltip/**/*.{js,ts,jsx,tsx,mdx}",
      "../../submodules/ts-utils/src/**/*.{js,ts,jsx,tsx,mdx}"
   ],
   theme: {
      ...BaseTailwind.theme,
      extend: {
         ...BaseTailwind.theme?.extend,
         animation: {
            breathe: 'breathe 2s ease-in-out infinite',
         },
         keyframes: {
            breathe: {
               '0%, 100%': {
                  opacity: '0.6',
                  transform: 'scale(1)',
                  filter: 'brightness(1)',
               },
               '50%': {
                  opacity: '1',
                  transform: 'scale(1.1)',
                  filter: 'brightness(1.3)',
               },
            },
         },
      },
   },
};
export default Tailwind;
