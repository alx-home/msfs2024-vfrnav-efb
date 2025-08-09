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

import StreetView from '@efb-images/street-view.svg?react';
import { Menu } from './MapMenu/MapMenu';
import { useContext, useState } from 'react';
import { MapContext } from './MapContext';

export const RecordViewpoint = ({ menu }: {
   menu: Menu
}) => {
   const { recordsCenter, setRecordsCenter } = useContext(MapContext)!;
   const [dragOffset, setDragOffset] = useState<{ x: number, y: number } | undefined>()

   return <div className={"absolute w-full h-full" + (menu === Menu.records ? '' : ' hidden')}
      onDragEnter={(e) => {
         e.preventDefault();
      }}
      onDragOver={(e) => {
         e.preventDefault();
      }}>
      <button className="absolute" style={{
         top: (recordsCenter.y * 100) + "%",
         left: (recordsCenter.x * 100) + "%"
      }}
         draggable={true}
         onDragStart={(event) => {
            const bounding = event.currentTarget.getBoundingClientRect();
            setDragOffset({ x: bounding.x - event.clientX, y: bounding.y - event.clientY })
         }}
         onDrag={(event) => {
            if (event.clientX !== 0 && event.clientY !== 0) {
               const bounding = event.currentTarget.getBoundingClientRect();
               const parentBounding = event.currentTarget.parentElement!.getBoundingClientRect();

               const posX = Math.min(parentBounding.x + parentBounding.width - bounding.width, Math.max(parentBounding.x, event.clientX + dragOffset!.x))
               const posY = Math.min(parentBounding.y + parentBounding.height - bounding.height, Math.max(parentBounding.y, event.clientY + dragOffset!.y))
               setRecordsCenter({
                  x: Math.max(0, Math.min(1, (posX - parentBounding.x) / parentBounding.width)),
                  y: Math.max(0, Math.min(1, (posY - parentBounding.y) / parentBounding.height))
               });
            }
         }}>
         <StreetView className="w-8 h-8 transition-all filter-icon opacity-50 hocus:opacity-100 pointer-events-auto cursor-move" />
      </button>
   </div>
}
