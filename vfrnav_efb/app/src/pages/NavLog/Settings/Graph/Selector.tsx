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
import { memo } from 'react';

const SelectorComp = ({ hoverPos, selectorCount, editIndex }: {
   hoverPos: [number, number]
   selectorCount: number,
   editIndex: [number, number] | undefined,
}) => {
   return <div className={"absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"}
      style={{
         top: hoverPos[1],
         left: hoverPos[0]
      }}
   >
      <div className={'transition-all rounded-lg bg-msfs border-2 w-full h-full'
         + ((selectorCount && editIndex === undefined) ? '' : ' opacity-0 scale-0')}
      />
   </div>
}

export const Selector = memo(SelectorComp)