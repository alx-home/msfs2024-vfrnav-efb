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

import { EfbAircraft } from "./EfbAircraft";
import { Settings } from "./Settings"
import { useState } from "react";
import settingsImg from '@alx-home/images/settings.svg';
import tabletImg from '@vfrnav/images/COCKPIT_TABLET_OUTLINE.svg';

export type Tabs = 'settings' | '3dtablet';

export const Body = () => {
   const [tab, setTab] = useState<Tabs>('settings');

   return <div className='flex flex-row grow min-h-0 overflow-hidden'>
      <div className='flex flex-col shrink-0 w-16 h-full gap-2 p-2 bg-menu border-r border-slate-700/50 shadow-lg'>
         {([
            { id: 'settings', label: 'Settings', icon: settingsImg },
            { id: '3dtablet', label: '3D tablet', icon: tabletImg }
         ] as const).map(({ id, label, icon }) =>
            <button key={id} type='button' title={label} aria-label={label}
               aria-pressed={tab === id}
               className={`group flex shrink-0 items-center justify-center w-full h-12 border-l-2 rounded-sm shadow-md transition-colors
                  hover:bg-item-hocus focus-visible:outline focus-visible:outline-2 focus-visible:outline-msfs
                  ${tab === id ? 'bg-active-item border-white' : 'bg-item border-msfs'}`}
               onClick={() => setTab(id)}>
               <img src={icon} alt='' className={id === 'settings'
                  ? 'w-6 h-6 invert group-hover:invert-0'
                  : 'w-9 h-9 group-hover:invert'} />
            </button>
         )}
      </div>
      <div className='flex grow min-w-0 h-full'>
         <div className={'flex w-full h-full' + (tab === 'settings' ? '' : ' hidden')}>
            <Settings />
         </div>
         <div className={'flex w-full h-full' + (tab === '3dtablet' ? '' : ' hidden')}>
            <EfbAircraft />
         </div>
      </div>
   </div>
}