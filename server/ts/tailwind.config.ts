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
import BaseTailwind from '../../packages/ts-utils/tailwind.config.js';

const Tailwind: Config = {
   ...BaseTailwind, content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./taskbar/**/*.{js,ts,jsx,tsx,mdx}",
      "./taskbar_tooltip/**/*.{js,ts,jsx,tsx,mdx}",
      "../../packages/ts-utils/src/**/*.{js,ts,jsx,tsx,mdx}"
   ]
};
export default Tailwind;
