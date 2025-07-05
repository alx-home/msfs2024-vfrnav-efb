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

import { Settings } from "./Settings";
import { TabElem } from "./Elements";
import { messageHandler } from "@Settings/SettingsProvider";
import { useEFBServer } from "@Utils/useServer";

export const NavLogPage = ({ active }: {
  active: boolean
}) => {
  const { navData, deviations, fuelUnit, fuelConsumption } = useContext(MapContext)!;

  const [opacity, setOpacity] = useState(' opacity-0');
  const [tab, setTab] = useState<string>('Settings');
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
        <div className="flex w-full -mt-20">
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

      elems.push(<div key="aircraft" className={"absolute top-0 bottom-0 right-0 left-0 overflow-hidden" + (tab === 'Settings' ? "" : " opacity-0 h-0")}>
        <Settings />
      </div>)
      tabs.push('Settings')
      tabNames['Settings'] = 'Settings'
    }

    return [tabs, elems, tabNames]
  }, [edit, navData, tab]);

  const switchEdit = useCallback(() => {
    setEdit(edit => !edit)
  }, [])

  const efbConnected = useEFBServer();
  const exportNav = useCallback(() => {
    messageHandler.send({
      __EXPORT_NAV__: true,

      data: navData.map(data => ({
        name: data.name,
        order: data.order,
        shortName: data.shortName,
        coords: data.coords,
        properties: data.properties,
        waypoints: data.waypoints,
        loadedFuel: data.loadedFuel,
        departureTime: data.departureTime,
      })),
      deviations: deviations,
      fuelUnit: fuelUnit,
      fuelConsumption: fuelConsumption
    })
  }, [deviations, fuelConsumption, fuelUnit, navData]);

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


  return <div className="flex grow justify-center overflow-hidden" style={active ? {} : { display: 'none' }}>
    <div className="flex flex-row w-full justify-center">
      <div className={"flex flex-col shrink transition transition-std py-1 h-full text-left"
        + " justify-start overflow-hidden bg-menu rounded-sm shadow-md"
        + " hocus:border-msfs"
        + opacity + " min-w-[70%]"
      }>
        <div className={"relative flex flex-col grow overflow-hidden"}>
          <div className="flex text-4xl pt-6 px-8">Nav Log</div>
          <div className='flex flex-col overflow-hidden grow m-4 mt-8 mb-0'>
            <div className="pt-6 pl-4">
              <Tabs tabs={Array.from(tabs)} activeTab={tab} names={tabNames} switchTab={setTab} className="hidden" />
            </div>
            <div className='relative grid grow overflow-hidden h-[78vh]'>
              {tabElems}
            </div>
          </div>
        </div>
        <div className="flex flex-row shrink-0 min-h-0 px-4">
          {
            __MSFS_EMBEDED__ ? <></> :
              <div className="flex flex-row mr-2 grow">
                <Button active={!empty} disabled={empty || !efbConnected || __MSFS_EMBEDED__} onClick={exportNav}>
                  Upload
                </Button>
              </div>
          }
          <Button active={!empty} disabled={empty}
            onClick={switchEdit}>
            {edit ? "Done" : "Edit"}
          </Button>
        </div>
      </div>
    </div>
  </div >;
}