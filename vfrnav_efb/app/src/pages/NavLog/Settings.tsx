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

import { Tabs } from "@alx-home/Utils"
import { useState, useMemo, RefObject, useEffect } from 'react';
import { Deviation } from "./Settings/Deviation/Deviation";
import { Fuel } from "./Settings/Fuel/Fuel";


const settingsTabs = ['Deviation', 'Fuel'] as const;
export type SettingsTabs = typeof settingsTabs[number];
const settingsTabsStr: Record<SettingsTabs, string> = {
   'Deviation': 'Compass',
   'Fuel': 'Fuel'
}

export const Settings = ({ currentTab: currentPage, active, pageRef }: {
   currentTab: string,
   active: boolean,
   pageRef: RefObject<string | undefined>
}) => {
   const [tab, setTab] = useState<SettingsTabs>('Deviation')
   const tabElems = useMemo(() => [
      <Deviation key="deviation" curentPage={tab} active={(currentPage === 'Settings') && active} />,
      <Fuel key="fuel" curentPage={tab} active={(currentPage === 'Settings') && active} />
   ], [active, currentPage, tab]);

   useEffect(() => {
      if (currentPage === 'Settings') {
         pageRef.current = tab;
      } else {
         pageRef.current = undefined;
      }
   }, [active, currentPage, pageRef, tab])

   return <div className={
      'flex flex-col text-sm [grid-row:1] [grid-column:1] overflow-hidden h-full'
      + (('Settings' === currentPage) ? '' : ' opacity-0 select-none pointer-events-none max-h-0')
   }>
      <div className="flex flex-row pl-4 pt-2">
         <Tabs className="pb-0" tabs={Array.from(settingsTabs)} activeTab={tab} names={settingsTabsStr} switchTab={setTab} />
      </div>
      <div className='relative h-full grow overflow-hidden'>
         {tabElems}
      </div>
   </div>
}