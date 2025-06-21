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

import { Button, Tabs } from "@alx-home/Utils";
import { MapContext } from "@pages/Map/MapContext";
import { ReactElement, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { NavData } from "@pages/Map/MapMenu/Menus/Nav";

import { Aircraft } from "./Aircraft";
import { TabElem } from "./Elements";

export const NavLogPage = ({ active }: {
  active: boolean
}) => {
  const { navData } = useContext(MapContext)!;

  const [opacity, setOpacity] = useState(' opacity-0');
  const [tab, setTab] = useState<string>('Aircraft');
  const [edit, setEdit] = useState<boolean>(false);
  const [empty, setEmpty] = useState(true);

  const [tabs, tabElems, tabNames] = useMemo(() => {
    const elems: ReactElement[] = [];
    const tabs: string[] = [];
    const tabNames = {} as Record<string, string>;

    const addTab = (data: NavData) => {
      const id = data.id.toFixed(0)

      elems.push(<TabElem edit={edit} key={id} tab={id} currentTab={tab} coords={data.coords} navData={data} />)
      tabs.push(id)
      tabNames[id] = data.name
    }

    navData.forEach(data => addTab(data))

    if (navData.length === 0) {
      setEmpty(true);
      setEdit(false);

      elems.push(<div key="empty" className="flex text-xl overflow-hidden">
        <div className="flex w-[800px] max-w-full">
          <div className="flex flex-col justify-center m-auto text-center">
            <div className="flex m-auto">
              Navigation path is empty.
            </div>
            <div className="flex m-auto">
              Please draw a path on the map to enable editing of the associated navlog.
            </div>
          </div>
        </div>
      </div>)
    } else {
      setEmpty(false);

      elems.push(<div key="aircraft" className={"absolute top-0 bottom-0 right-0 left-0 overflow-hidden" + (tab === 'Aircraft' ? "" : " opacity-0 h-0")}>
        <Aircraft />
      </div>)
      tabs.push('Aircraft')
      tabNames['Aircraft'] = 'Aircraft'
    }

    return [tabs, elems, tabNames]
  }, [edit, navData, tab]);

  const switchEdit = useCallback(() => {
    setEdit(edit => !edit)
  }, [])

  useEffect(() => {
    if (!tabs.find(value => value === tab)) {
      setTab(tabs.at(0)!)
    }
  }, [tab, tabs]);

  useEffect(() => {
    if (active) {
      setOpacity(' opacity-100');
    } else {
      setOpacity(' opacity-0');
    }
  }, [active]);


  useEffect(() => {
    if (tab === 'Aircraft') {
      setEdit(false);
    }
  }, [tab]);

  return <div className="flex grow justify-center overflow-hidden" style={active ? {} : { display: 'none' }}>
    <div className="flex flex-row w-full justify-center">
      <div className={"flex flex-col shrink transition transition-std py-1 h-full text-left"
        + " justify-start overflow-hidden bg-menu rounded-sm shadow-md"
        + " hocus:border-msfs"
        + opacity
      }>
        <div className={"relative flex flex-col grow overflow-hidden"}>
          <div className="flex text-4xl py-6 px-8">Nav Log</div>
          <div className='flex flex-col overflow-hidden grow  m-4 mt-8 mb-0'>
            <div className="py-6 px-8">
              <Tabs tabs={Array.from(tabs)} activeTab={tab} names={tabNames} switchTab={setTab} />
            </div>
            <div className='relative grid grow overflow-hidden h-[60vh]'>
              {tabElems}
            </div>
          </div>
        </div>
        {
          tab === 'Aircraft' ? <></> :
            <div className="flex shrink-0 min-h-0">
              <Button active={!empty} disabled={empty}
                onClick={switchEdit}>
                {edit ? "Done" : "Edit"}
              </Button>
            </div>
        }
      </div>
    </div>
  </div >;
}