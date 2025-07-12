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

import { PropsWithChildren } from "react";

export const Group = ({ children, name, className }: PropsWithChildren<{
   name: string,
   className?: string
}>) => {
   return <div className={"flex-col pl-0 " + className}>
      <div className="flex text-2xl p-2 pl-6 hover:bg-white hover:text-slate-700">{name}</div>
      <div className="content flex-col">
         {children}
      </div>
   </div>;
}
