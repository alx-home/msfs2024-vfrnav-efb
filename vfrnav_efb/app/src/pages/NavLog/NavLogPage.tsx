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

import { Button, CheckBox, Input, Tabs } from "@alx-home/Utils";
import { MapContext } from "@pages/Map/MapContext";
import { ReactElement, useCallback, useContext, useEffect, useMemo, useState, useRef, memo } from 'react';

import { NavData } from "@pages/Map/MapMenu/Menus/Nav";

import { Settings } from "./Settings";
import { messageHandler, SettingsContext } from "@Settings/SettingsProvider";
import { useEFBServer } from "@Utils/useServer";
import { Navlog } from "./NavLog";
import { useKeyUp } from "@alx-home/Events";
import { FuelPoint, Properties } from "@shared/NavData";
import { Coordinate } from "ol/coordinate";

const ExportPopup = ({ navData, settingPage, deviationCurve, fuelCurve }: {
  navData: NavData[],
  settingPage?: string,
  deviationCurve: [number, number][],
  fuelCurve: [number, FuelPoint[]][]
}) => {
  const { setPopup, emptyPopup } = useContext(SettingsContext)!;
  const key = useKeyUp();
  const [exportDev, setExportDev] = useState(settingPage === "Deviation")
  const [exportDevName, setExportDevName] = useState("")
  const [exportFuel, setExportFuel] = useState(settingPage === "Fuel")
  const [exportFuelName, setExportFuelName] = useState("")
  const [exportNav, setExportNav] = useState(navData.map(() => !settingPage))
  const [exportNavName, setExportNavName] = useState(navData.map(() => ""))
  const [devValid, setDevValid] = useState(false);
  const [fuelValid, setFuelValid] = useState(false);

  const ok = useMemo((): boolean =>
    (!exportDev || devValid)
    && (!exportFuel || fuelValid)
    && (exportDev || exportFuel || (exportNav.find(elem => elem) !== undefined))
    , [devValid, exportDev, exportFuel, exportNav, fuelValid])

  const validate = useCallback(() => {
    if (ok) {
      const navs = exportNav.map((elem, index) => elem ? {
        name: exportNavName[index].length ? exportNavName[index] : navData[index].name,
        data: {
          id: navData[index].id,
          order: navData[index].order,
          active: navData[index].active,
          shortName: navData[index].shortName,
          coords: navData[index].coords,
          properties: navData[index].properties,
          waypoints: navData[index].waypoints,
          loadedFuel: navData[index].loadedFuel,
          departureTime: navData[index].departureTime,
          taxiTime: navData[index].taxiTime,
          taxiConso: navData[index].taxiConso,
          link: navData[index].link,
        }
      } : undefined).filter(elem => elem !== undefined);


      (async () => {

        const result = {
          ...(navs.length ? { navs: navs } : {}),
          ...(exportDev ? {
            dev: {
              name: exportDevName,
              data: deviationCurve
            }
          } : {}),
          ...(exportFuel ? {
            fuel: {
              name: exportFuelName,
              data: fuelCurve
            }
          } : {})
        }

        const blob = new Blob([JSON.stringify(result, undefined, "   ")], { type: "application/json" });
        if (window.showSaveFilePicker) {
          const handle = await window.showSaveFilePicker({
            suggestedName:
              navs.reduce((result, elem, index) => result + (index ? "-" : "") + elem.name, "")
              + (exportDev ? (navs.length ? "+" : "") + exportDevName : '')
              + (exportFuel ? ((navs.length || exportDev) ? "+" : "") + exportFuelName : '')
              + ".json",
            types: [{
              description: 'Navlog',
              accept: { 'application/json': ['.json'] },
            }],
          });

          const writableStream = await handle.createWritable();
          await writableStream.write(blob);
          await writableStream.close();
        } else {
          const a = document.createElement("a")
          const url = URL.createObjectURL(blob);
          a.href = url;
          a.download = "navlog.json";
          document.body.appendChild(a);
          a.click();
          setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 0);
        }
      })()

      setPopup(emptyPopup);
    }
  }, [deviationCurve, emptyPopup, exportDev, exportDevName, exportFuel, exportFuelName, exportNav, exportNavName, fuelCurve, navData, ok, setPopup])

  const exportNavElems = useMemo(() => navData.map((elem, index) => <div key={elem.id} className="flex flex-row">
    <CheckBox value={exportNav[index]} onChange={(value) => {
      setExportNav(data => data.toSpliced(index, 1, value))
    }} />
    <div className="flex ml-2 m-auto mr-4 w-36">{elem.name}</div>
    <Input active={exportNav[index]} placeholder={elem.name} onValidate={validate}
      onChange={(value) => setExportNavName(names => names.toSpliced(index, 1, value))} />
  </div>), [exportNav, navData, validate])


  useEffect(() => {
    if (key == 'Escape') {
      setPopup(emptyPopup);
    }
  }, [emptyPopup, key, setPopup])


  return <div className='flex flex-col p-2 w-full max-h-full'>
    <div className='text-2xl mt-4 mb-6 flex flex-row'>
      Export Navlog
    </div>
    <div className="flex flex-row w-full justify-center [&_.invalid]:text-red-500">
      <div className="flex flex-col text-base w-full px-10">
        <div className="flex flex-col [&>*]:mb-1">
          {exportNavElems}
          <div className="flex flex-row mt-2">
            <CheckBox value={exportDev} onChange={setExportDev} />
            <div className="flex ml-2 m-auto mr-4 w-36">Deviation</div>
            <Input active={exportDev} onChange={setExportDevName}
              onValidate={validate}
              validate={async (value) => {
                const result = (value !== 'none') && (value !== 'custom')
                setDevValid(result && value.length !== 0)
                return result
              }}
              placeholder="name" />
          </div>
          <div className="flex flex-row">
            <CheckBox value={exportFuel} onChange={setExportFuel} />
            <div className="flex ml-2 m-auto mr-4 w-36">Fuel Consumption</div>
            <Input active={exportFuel} onChange={setExportFuelName}
              validate={async (value) => {
                const result = (value !== 'simple') && (value !== 'custom')
                setFuelValid(result && value.length !== 0)
                return result
              }}
              onValidate={validate}
              placeholder="name" />
          </div>
        </div>
      </div>
    </div>
    <div className='flex flex-row w-full min-h-0 shrink-0 pt-8 justify-end [&>*]:mx-1' >
      <Button active={true} className='px-2'
        onClick={() => {
          setPopup(emptyPopup);
        }}>Cancel</Button>
      <Button active={ok} disabled={!ok} className='px-2'
        onClick={validate}>Export</Button>
    </div>
  </div >;
}

const NavLogPageElem = ({ active }: {
  active: boolean
}) => {
  const {
    navData, deviationCurve, fuelUnit, fuelCurve, importNav,
    setSavedDeviationCurves, setSavedFuelCurves, deviationPreset, fuelPreset,
    updateDeviationPreset, updateFuelPreset
  } = useContext(MapContext)!;
  const { setPopup, emptyPopup } = useContext(SettingsContext)!;

  const [opacity, setOpacity] = useState(' opacity-0');
  const [tab, setTab] = useState<string>('Settings');
  const [edit, setEdit] = useState<boolean>(false);
  const [empty, setEmpty] = useState(true);
  const settingPage = useRef<string>(undefined)
  const exportCb = useCallback(() => {
    setPopup(<ExportPopup navData={navData} deviationCurve={deviationCurve} fuelCurve={fuelCurve} settingPage={settingPage.current} />)
  }, [deviationCurve, fuelCurve, navData, setPopup])
  const importCb = useCallback(() => {
    const input = document.createElement('input');
    input.accept = 'application/json'
    input.multiple = false
    input.type = 'file';

    input.onchange = (e) => {
      document.body.removeChild(input);

      const target = e.target as HTMLInputElement | null

      const diplayError = () => setPopup(<div className='flex flex-col p-2 w-full max-h-full'>
        <div className='text-2xl mt-4 mb-6 flex flex-row text-red-600'>
          Error
        </div>
        <div className="flex ml-8 text-base">
          An error occurred, couldn&apos;t import navlog !
        </div>
        <div className='flex flex-row w-full min-h-0 shrink-0 pt-8 justify-end [&>*]:mx-1' >
          <Button active={true} className='px-2'
            onClick={() => {
              setPopup(emptyPopup);
            }}>Ok</Button>
        </div>
      </div>)

      if (target?.files?.length) {
        const file = target.files[0];

        const reader = new FileReader();
        reader.readAsText(file);

        if (reader) {
          reader.onload = e => {
            if (e.target?.result) {
              const result = JSON.parse(e.target.result as string);

              if (result['navs'] !== undefined) {
                importNav((result['navs'] as {
                  id?: number,
                  name: string,
                  data: {
                    order: number,
                    active?: boolean,
                    shortName: string,
                    coords: Coordinate[],
                    properties: Properties[],
                    waypoints: string[],
                    loadedFuel: number,
                    departureTime: number,
                    link?: string,
                    taxiTime?: number,
                    taxiConso?: number,
                  }
                }[]).map(elem => ({
                  name: elem.name,
                  // Retro-compatibility
                  id: elem.id ?? 0,
                  taxiTime: 15,
                  taxiConso: 30,
                  link: 'None',
                  ...elem.data,
                })))
              }

              if (result['dev'] !== undefined) {
                const dev = result['dev'] as {
                  name: string,
                  data: [number, number][]
                };

                setSavedDeviationCurves(saved => {
                  const index = saved.findIndex(value => value[0] === dev.name)

                  return (index === -1 ? saved.toSpliced(saved.length, 0, [
                    dev.name, (new Date()).getTime(), dev.data
                  ]) : saved.toSpliced(index, 1, [
                    dev.name, (new Date()).getTime(), dev.data
                  ]))
                })

                setTimeout(() => updateDeviationPreset(dev.name), 100);
              }

              if (result['fuel'] !== undefined) {
                const fuel = result['fuel'] as {
                  name: string,
                  data: [number, FuelPoint[]][]
                };

                setSavedFuelCurves(saved => {
                  const index = saved.findIndex(value => value[0] === fuel.name)

                  return (index === -1 ? saved.toSpliced(saved.length, 0, [
                    fuel.name, (new Date()).getTime(), fuel.data
                  ]) : saved.toSpliced(index, 1, [
                    fuel.name, (new Date()).getTime(), fuel.data
                  ]))
                })

                setTimeout(() => updateFuelPreset(fuel.name), 100);
              }

            } else {
              diplayError()
            }
          }
        } else {
          diplayError()
        }
      } else {
        diplayError()
      }
    };

    input.oncancel = () => {
      document.body.removeChild(input);
    }

    document.body.appendChild(input);
    input.click();
  }, [emptyPopup, importNav, setPopup, setSavedDeviationCurves, setSavedFuelCurves, updateDeviationPreset, updateFuelPreset])

  const [tabs, tabElems, tabNames] = useMemo(() => {
    const elems: ReactElement[] = [];
    const tabs: string[] = [];
    const tabNames = {} as Record<string, string>;

    const addTab = (data: NavData) => {
      const id = data.id.toFixed(0)

      elems.push(<Navlog edit={edit} key={id} tab={id} currentTab={tab} coords={data.coords} navData={data} />)
      tabs.push(id)
      tabNames[id] = data.name
    }

    navData.toSorted((a, b) => a.order - b.order).forEach(data => addTab(data))

    if (navData.length === 0) {
      setEmpty(true);
      setEdit(false);

      elems.push(<div key="empty" className="flex text-sm overflow-hidden h-full">
        <div className="flex w-full">
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

      elems.push(<div key="aircraft" className={"flex flex-col text-sm overflow-hidden h-full"
        + (tab === 'Settings' ? "" : " opacity-0 select-none pointer-events-none max-h-0")}>
        <Settings currentTab={tab} active={active} pageRef={settingPage} />
      </div>)
      tabs.push('Settings')
      tabNames['Settings'] = 'Settings'
    }

    return [tabs, elems, tabNames]
  }, [active, edit, navData, tab]);

  const switchEdit = useCallback(() => {
    setEdit(edit => !edit)
  }, [])

  const efbConnected = useEFBServer();
  const exportNav = useCallback(() => {
    messageHandler.send({
      __EXPORT_NAV__: true,

      data: navData.map(data => ({
        id: data.id,
        name: data.name,
        order: data.order,
        active: data.active,
        shortName: data.shortName,
        coords: data.coords,
        properties: data.properties,
        waypoints: data.waypoints,
        loadedFuel: data.loadedFuel,
        departureTime: data.departureTime,
        taxiTime: data.taxiTime,
        taxiConso: data.taxiConso,
        link: data.link
      })),
      deviationCurve: deviationPreset === 'custom' ? deviationCurve : [],
      deviationPreset: deviationPreset,
      fuelUnit: fuelUnit,
      fuelCurve: fuelPreset === 'custom' ? fuelCurve.map(elem => ({
        thrust: elem[0],
        curves: elem[1].map(curve => ({
          alt: curve[0],
          values: curve[1]
        }))
      })) : [],
      fuelPreset: fuelPreset
    })
  }, [deviationCurve, deviationPreset, fuelCurve, fuelPreset, fuelUnit, navData]);

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


  return <div className="flex grow justify-center overflow-hidden h-full" style={active ? {} : { display: 'none' }}>
    <div className="flex flex-row w-full h-full justify-center">
      <div className={"flex flex-col shrink transition transition-std py-1 h-full text-left"
        + " justify-start overflow-hidden bg-menu rounded-sm shadow-md"
        + " hocus:border-msfs"
        + opacity + " max-w-full w-[77rem]"
      }>
        <div className={"relative flex flex-col grow overflow-hidden h-full"}>
          <div className="flex text-2xl pt-6 px-8">Nav Log</div>
          <div className='flex flex-col overflow-hidden grow m-4 mt-5 mb-0 h-full'>
            <div className="pl-4">
              <Tabs tabs={Array.from(tabs)} activeTab={tab} names={tabNames} switchTab={setTab} className="hidden" />
            </div>
            <div className='relative grow overflow-hidden h-full'>
              {tabElems}
            </div>
          </div>
        </div>
        <div className="flex flex-row shrink-0 min-h-0 px-4">
          {
            __MSFS_EMBEDED__ ? <></> :
              <div className="flex flex-row mr-2 grow [&>*:not(:first-child)]:ml-1">
                <Button active={!empty} disabled={empty || !efbConnected || __MSFS_EMBEDED__} onClick={exportNav}>
                  Upload
                </Button>
                <Button active={!empty} disabled={empty}
                  onClick={exportCb}>
                  Export
                </Button>
                <Button active={true}
                  onClick={importCb}>
                  Import
                </Button>
              </div>
          }
          {
            tab === 'Settings'
              ? <></>
              : <Button active={!empty} disabled={empty}
                onClick={switchEdit}>
                {edit ? "Done" : "Edit"}
              </Button>
          }
        </div>
      </div>
    </div>
  </div >;
}

export const NavLogPage = memo(NavLogPageElem);