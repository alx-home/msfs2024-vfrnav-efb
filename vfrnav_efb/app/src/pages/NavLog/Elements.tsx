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

import { MapContext } from "@pages/Map/MapContext";
import { NavData } from "@pages/Map/MapMenu/Menus/Nav";
import { Coordinate } from "ol/coordinate";
import { PropsWithChildren, useCallback, useContext, useMemo, useState, useEffect, useRef } from 'react';

import Arrow from '@alx-home/images/arrow.svg?react';
import { CheckBox, Input, Scroll, Tabs } from "@alx-home/Utils";
import { JSX } from "react/jsx-runtime";

import UndoImg from '@alx-home/images/undo.svg?react';
import { messageHandler } from "@Settings/SettingsProvider";
import { Fuel } from "@shared/Fuel";

const modes = ['Enroute', 'Vor', 'Weather', 'Remarks', 'Full'] as const;
type Modes = typeof modes[number];
const modesStr: Record<Modes, string> = {
   'Enroute': 'Enroute',
   'Vor': 'Vor',
   'Weather': 'Weather',
   'Full': 'Full',
   'Remarks': 'Remarks'
}

const GridElem = ({ children, className, col: col_, row: row_, size, active, edit, currentMode }: PropsWithChildren<{
   col?: number,
   size?: number,
   row?: number,
   className?: string,
   active: boolean
   edit: boolean,
   mode?: Modes,
   currentMode: Modes
}>) => {
   const row = row_ ?? 0;
   const col = col_ ?? 0;
   const sep = (() => {
      if (currentMode === "Full") {
         if (edit) {
            return [2, 4, 7, 8, 10].find(elem => elem === col)
         } else {
            return [3, 5, 7, 9, 12].find(elem => elem === col)
         }
      } else if (currentMode === "Weather") {
         return [3].find(elem => elem === col)
      } else if (currentMode === "Enroute") {
         if (edit) {
            return [2, 3].find(elem => elem === col)
         } else {
            return [3, 4].find(elem => elem === col)
         }
      }

      return false;
   })()

   return <div className={"flex border-slate-700 p-2 grow h-14"
      + (((row === 0) || (col < (size ?? 0) - 1) || (size === 1) || edit) ? ' border-r-2 border-b-2 [--tw-shadow-opacity:0.2] shadow-xl' : '')
      + ((col > 0) ? ((row > 0) ? ' -translate-y-1/2' : ' translate-y-1/2') : '')
      + (((col === 1) || (col === 0)) ? ' border-l-2' : '')
      + ((sep || (col === 1)) ? " ml-1 border-l-2" : "")
      + ((row === 0) ? ' border-t-2' : '')
      + (className ?? "")}
      style={{ gridColumn: col + 1, gridRow: row + 1 }}>
      <div className={
         "flex justify-center m-auto w-full whitespace-nowrap"
         + ((edit || active || col === (size ?? 0) - 1) ? '' : ' opacity-20')}>
         {(col === 1 && row > 1) ? <Arrow className="rotate-180 h-8 -ml-5" height={30} width={20} /> : <></>}
         <div className={"flex flex-row justify-center m-auto grow" + (edit ? "" : " [&_*]:overflow-hidden [&_*]:text-ellipsis")}>
            {children}
         </div>
      </div>
   </div>
}

const Reset = ({ onReset, children, className }: PropsWithChildren<{
   className?: string,
   onReset?: () => void
}>) => {
   const [reset, setReset] = useState(false);

   useEffect(() => {
      if (reset) {
         onReset?.();
         setReset(false);
      }
   }, [onReset, reset, setReset]);

   return <div className={'relative flex flex-row grow ' + className}>
      {children}
      <div className="absolute right-0 top-0 -mt-2 -mr-3">
         <button className="p-1 bg-transparent" tabIndex={-1}
            onClick={() => { setReset(true) }} >
            <UndoImg className="w-5 h-5 invert hover:filter-msfs cursor-pointer" />
         </button>
      </div>
   </div>
}

const useFuel = () => {
   const [fuel, setFuel] = useState(0);
   const promises = useRef<((_value: number) => void)[]>([])
   const getFuel = useCallback(async () => {
      const promise = new Promise<number>((resolve) => {
         promises.current.push(resolve);
      })
      messageHandler.send({ __GET_FUEL__: true });
      return await promise
   }, [])

   useEffect(() => {
      const onFuel = (fuel: Fuel) => {
         const value = fuel.tanks.reduce((result, tank) => result + tank.value, 0) * 3.785411784;
         setFuel(value);
         promises.current.forEach(resolve => resolve(value))
         promises.current = []
      }

      messageHandler.subscribe("__FUEL__", onFuel);
      return () => messageHandler.unsubscribe("__FUEL__", onFuel)
   }, [setFuel]);

   return { fuel, getFuel }
}

export const TabElem = ({ tab, currentTab, coords, edit, navData }: {
   currentTab: string,
   tab: string,
   coords: Coordinate[],
   edit: boolean,
   navData: NavData
}) => {
   const { editNavProperties, updateWaypoints, fuelUnit, setLoadedFuel, setDepartureTime } = useContext(MapContext)!;
   const { properties, waypoints, departureTime, loadedFuel, id } = navData;
   const actives = useMemo(() => properties.map(value => edit ? true : value.active), [edit, properties]);
   const toUnit = useCallback((value: number) =>
      fuelUnit === 'gal' ? value * 3.785411784 : value
      , [fuelUnit])
   const fromUnit = useCallback((value: number) =>
      fuelUnit === 'gal' ? value / 3.785411784 : value
      , [fuelUnit])

   const fuelUnitStr = useMemo(() => fuelUnit === 'gal' ? 'gal' : 'l', [fuelUnit])
   const departureTimeStr = useMemo(() => {
      const hours = Math.floor(departureTime / 60);
      const minutes = Math.round(departureTime - 60 * hours);

      return (hours % 24) + 'h' + (minutes < 10 ? '0' + minutes : minutes)
   }, [departureTime])

   const loadedFuelStr = useMemo(() => toUnit(loadedFuel).toString(), [loadedFuel, toUnit])
   const { getFuel } = useFuel();

   const [mode, setMode] = useState<Modes>('Enroute');
   const [reset, setReset] = useState(false);
   const [collapseWaypoints, setCollapseWaypoints] = useState(false);

   const setActive = useCallback(async (index: number) => {
      const value = !actives[index];

      if (value) {
         for (let i = index; i < properties.length; ++i) {
            properties[i].active = value;
            properties[i].ata = -1;
            properties[i].curFuel = 0;
         }
      } else {
         for (let i = 0; i <= index; ++i) {
            properties[i].active = value;
         }

         if (properties[index].ata === -1) {
            const now = new Date();
            properties[index].ata = now.getHours() * 60 + now.getMinutes()

         }

         if (properties[index].curFuel === 0) {
            properties[index].curFuel = fromUnit(await getFuel());
            editNavProperties(id, properties);
            setReset(true)
         }
      }

      editNavProperties(id, properties);
   }, [actives, editNavProperties, id, properties, fromUnit, getFuel]);

   const getHeader = useCallback((mode: Modes, edit: boolean) => {
      return [
         <GridElem key="Waypoint" active={true} edit={edit} currentMode={mode}>{collapseWaypoints ? "" : "Waypoint"}</GridElem>,
         <GridElem key="Altitude" active={true} edit={edit} mode="Enroute" currentMode={mode}>Altitude</GridElem>,
         ...(edit ? [] : [<GridElem key="Dist" active={true} edit={edit} mode="Enroute" currentMode={mode}>Dist</GridElem>]),
         <GridElem key="VOR Ind/Freq" active={true} edit={edit} mode="Vor" currentMode={mode}>VOR Ind/Freq</GridElem>,
         <GridElem key="OBS" active={true} edit={edit} mode="Vor" currentMode={mode}>OBS</GridElem>,

         ...(edit ?
            [
               <GridElem key="Wind Dir/Vel" active={true} edit={edit} mode="Weather" currentMode={mode}>Wind Dir/Vel</GridElem>,
               <GridElem key="OAT" active={true} edit={edit} mode="Weather" currentMode={mode}>OAT</GridElem>,
               <GridElem key="VAR" active={true} edit={edit} mode="Weather" currentMode={mode}>VAR</GridElem>,
               <GridElem key="IAS" active={true} edit={edit} mode="Enroute" currentMode={mode}>IAS</GridElem>,
               <GridElem key="ATA" active={true} edit={edit} mode="Enroute" currentMode={mode}>ATA</GridElem>
            ]
            : (mode === 'Weather') ? [
               <GridElem key="Wind Dir/Vel" active={true} edit={edit} mode="Weather" currentMode={mode}>Wind Dir/Vel</GridElem>,
               <GridElem key="OAT" active={true} edit={edit} mode="Weather" currentMode={mode}>OAT</GridElem>,
               <GridElem key="VAR" active={true} edit={edit} mode="Weather" currentMode={mode}>VAR</GridElem>,
            ] : [
               <GridElem key="CH" active={true} edit={edit} mode="Full" currentMode={mode}>CH</GridElem>,
               <GridElem key="MH" active={true} edit={edit} mode="Vor" currentMode={mode}>MH</GridElem>,
               <GridElem key="IAS" active={true} edit={edit} mode="Enroute" currentMode={mode}>IAS</GridElem>,
               <GridElem key="GS" active={true} edit={edit} mode="Full" currentMode={mode}>GS</GridElem>,
               <GridElem key="ETE" active={true} edit={edit} mode="Full" currentMode={mode}>ETE</GridElem>,
               <GridElem key="ETA" active={true} edit={edit} mode="Enroute" currentMode={mode}>ETA</GridElem>
            ]
         ),
         <GridElem key="Fuel" active={true} edit={edit} mode="Enroute" currentMode={mode}>Fuel ({fuelUnit === 'gal' ? 'gal' : 'l'})</GridElem>,
         <GridElem key="Remarks" active={true} edit={edit} mode="Remarks" currentMode={mode}>Remarks</GridElem>
      ].filter(elem => !elem.props.mode || mode === elem.props.mode || mode === 'Full').map((elem, index, all) => <elem.type key={elem.key} {...elem.props} col={index} size={all.length} />)
   }, [fuelUnit, collapseWaypoints]);

   const header = useMemo(() => getHeader(mode, edit), [edit, getHeader, mode]);
   const fullHeader = useMemo(() => getHeader("Full", false), [getHeader]);

   const getLegs = useCallback((mode: Modes, edit: boolean) => {
      let time = departureTime * 60;
      let fuel = loadedFuel;
      let deltaFuel = 0;
      let deltaEta = 0;

      return coords.map((_value, row) => {
         const name = waypoints[row];
         const result: JSX.Element[] = [];

         result.push(<GridElem key={"Waypoint"} active={true} edit={edit} currentMode={mode}>
            {
               edit ?
                  <Input active={true} className="w-36" value={name} onChange={(value) => {
                     waypoints[row] = value
                     updateWaypoints(id, waypoints);
                  }} />
                  : <div className={"m-auto text-center transition-all " + (collapseWaypoints ? "w-0" : "w-36")}>{name}</div>
            }
         </GridElem>)

         if (row > 0) {
            const active = actives[row - 1];
            const navProps = properties[row - 1];
            const { altitude, dist, vor, wind, remark, CH, MH, GS, ias, magVar, oat, conso, curFuel, ata } = navProps;
            const { ident: vorIndent, freq: vorFreq, obs: vorObs } = vor;
            const { direction: windDir, speed: windVel } = wind;

            fuel -= conso;
            const estFuel = fuel;
            const lastFuel = (row > 1 ? properties[row - 2].curFuel : loadedFuel);
            const estFuel2 = lastFuel - conso;
            if (lastFuel) {
               deltaFuel = Math.round(estFuel2 - estFuel);
            }

            const ataStr = (() => {
               if (ata == -1) {
                  return ''
               }
               const hours = Math.floor(ata / 60);
               const minutes = Math.round(ata - 60 * hours);

               return hours + 'h' + (minutes < 10 ? '0' + minutes : minutes)
            })()

            const dur = (() => {
               const { days, hours, minutes, seconds } = navProps.dur;

               return (days ? days + 'd' : '')
                  + ((days || hours) ? (hours < 10 ? '0' : '') + hours + 'h' : '')
                  + ((days || hours || minutes) ? (minutes < 10 ? '0' : '') + minutes + ':' : '')
                  + ((seconds < 10 ? '0' : '') + seconds)
            })()

            time += navProps.dur.full;

            const eta = (() => {
               let h = Math.floor(time / 3600);
               const m = Math.floor((time / 60 - h * 60))
               h %= 24;

               return (h < 10 ? '0' : '') + h + "h" + ((h || m) ? (m < 10 ? '0' : '') + m : '')
            })()

            if (ata !== -1) {
               deltaEta = Math.round(time - ata * 60);

               //Past Midnight
               if (deltaEta > 43200) {
                  deltaEta = deltaEta - 86400
               } else if (deltaEta < -43200) {
                  deltaEta = deltaEta + 86400
               }
            }

            const eta2 = (() => {
               if (deltaEta === 0) {
                  return ''
               }

               const time2 = time - deltaEta;
               let h = Math.floor(time2 / 3600);
               const m = Math.floor((time2 / 60 - h * 60))
               h %= 24;

               return (h < 10 ? '0' : '') + h + "h" + ((h || m) ? (m < 10 ? '0' : '') + m : '')
            })()

            result.push(<GridElem key={"Altitude"} active={active} edit={edit} mode="Enroute" currentMode={mode}>
               <div className="flex flex-row grow h-full">
                  <div className="flex grow [&_.invalid]:text-red-500">
                     {
                        edit ?
                           <Input active={true} className="w-16" value={altitude.toFixed(0)} validate={async (value) => {
                              return /^\d+$/.test(value);
                           }} onChange={(value) => {
                              navProps.altitude = +value;
                              editNavProperties(id, properties);
                           }} inputMode="decimal" />
                           : <div className="w-16 m-auto text-center">{altitude}</div>
                     }
                  </div>
               </div>
            </GridElem>)

            if (!edit) {
               result.push(<GridElem key={"Dist"} active={active} edit={edit} mode="Enroute" currentMode={mode}>
                  <div className="w-10 m-auto text-center">{Math.round(dist).toString()}</div>
               </GridElem>)
            }

            result.push(<GridElem key={"VOR"} active={active} edit={edit} mode="Vor" currentMode={mode}>
               <div className="flex flex-row grow">
                  {
                     edit ?
                        <div className="flex flex-row [&_.invalid]:text-red-500">
                           <Input active={true} className="w-14" value={vorIndent} onChange={(value) => {
                              navProps.vor.ident = value;
                              editNavProperties(id, properties);
                           }} />
                           <Input active={true} className="w-14" value={vorFreq.toString()} onChange={(value) => {
                              navProps.vor.freq = +value;
                              editNavProperties(id, properties);
                           }} validate={async (value) => {
                              return /^\d*(\.\d*)?$/.test(value);
                           }} inputMode='decimal' />
                        </div>
                        :
                        <div className="flex flex-col grow">
                           <div className="w-full m-auto text-center">{vorIndent}</div>
                           <div className="w-full m-auto text-center">{vorFreq}</div>
                        </div>
                  }
               </div>
            </GridElem>)

            result.push(<GridElem key={"OBS"} active={active} edit={edit} mode="Vor" currentMode={mode}>
               <div className="[&_.invalid]:text-red-500">
                  {
                     edit ?
                        <Input active={true} className="w-11" value={vorObs.toFixed(0)} onChange={(value) => {
                           navProps.vor.obs = +value;
                           editNavProperties(id, properties);
                        }} validate={async (value) => {
                           return /^[-+]?\d*$/.test(value);
                        }} inputMode='decimal' />
                        : <div className="w-11 m-auto text-center">{vorObs}</div>
                  }
               </div>
            </GridElem>)

            if (edit) {
               result.push(<GridElem key={"Wind"} active={active} edit={edit} mode="Weather" currentMode={mode}>
                  <div className="flex flex-row [&_.invalid]:text-red-500">
                     <Input active={true} className="w-12" value={windDir.toString()} onChange={(value) => {
                        navProps.wind.direction = +value;
                        editNavProperties(id, properties);
                     }} validate={async (value) => {
                        return /^[-+]?\d*$/.test(value);
                     }} inputMode='decimal' />
                     <Input active={true} className="w-12" value={windVel.toString()} onChange={(value) => {
                        navProps.wind.speed = +value;
                        editNavProperties(id, properties);
                     }} validate={async (value) => {
                        return /^[-+]?\d*$/.test(value);
                     }} inputMode='decimal' />
                  </div>
               </GridElem>)

               result.push(<GridElem key={"OAT"} active={active} edit={edit} mode="Weather" currentMode={mode}>
                  <div className="[&_.invalid]:text-red-500">
                     <Input active={true} className="w-10" onChange={(value) => {
                        navProps.oat = +value;
                        editNavProperties(id, properties);
                     }} value={oat.toString()} validate={async (value) => {
                        return /^[-+]?\d*(\.\d*)?$/.test(value);
                     }} inputMode='decimal' />
                  </div>
               </GridElem>)

               result.push(<GridElem key={"VAR"} active={active} edit={edit} mode="Weather" currentMode={mode}>
                  <div className="flex flex-row [&_.invalid]:text-red-500">
                     <Input active={true} className="w-12" value={magVar.toString()} onChange={(value) => {
                        navProps.magVar = +value;
                        editNavProperties(id, properties);
                     }} validate={async (value) => {
                        return /^[-+]?\d*$/.test(value);
                     }} inputMode='decimal' />
                  </div>
               </GridElem>)

               result.push(<GridElem key={"IAS"} active={active} edit={edit} mode="Enroute" currentMode={mode}>
                  <div className="[&_.invalid]:text-red-500">
                     <Input active={true} className="w-12" onChange={(value) => {
                        navProps.ias = +value;
                        editNavProperties(id, properties);
                     }} value={ias.toString()} validate={async (value) => {
                        return /^[+]?\d*$/.test(value) && (+value > 0);
                     }} inputMode='decimal' />
                  </div>
               </GridElem>)

               result.push(<GridElem key={"ATA"} active={active} edit={edit} mode="Enroute" currentMode={mode}>
                  <div className="[&_.invalid]:text-red-500">

                     <Reset className="flex-row justify-end" onReset={() => {
                        navProps.ata = -1;
                        setReset(true)
                     }}>
                        <Input active={true} className="w-16" onChange={(value) => {
                           if (value.length) {
                              const data = value.split('h');
                              navProps.ata = +data[0] * 60 + +data[1]
                           } else {
                              navProps.ata = -1
                           }

                           editNavProperties(id, properties);
                        }} reload={reset} value={ataStr}
                           validate={async (value) => {
                              if (!value.length) {
                                 return true
                              }

                              if (/^\d+h\d*$/.test(value)) {
                                 const data = value.split('h');
                                 return (+data[0] < 24) && (+data[1] < 60);
                              }

                              return false;
                           }} />
                     </Reset>
                  </div>
               </GridElem>)

            } else if (mode === 'Weather') {
               result.push(<GridElem key={"Wind"} active={active} edit={edit} mode="Weather" currentMode={mode}>
                  <div className="flex flex-row grow h-full">
                     <div className="flex flex-row grow justify-center m-auto">{windDir} / {windVel}</div>
                  </div>
               </GridElem>)

               result.push(<GridElem key={"VAR"} active={active} edit={edit} mode="Weather" currentMode={mode}>
                  <div className="flex flex-row">{magVar}</div>
               </GridElem>)

               result.push(<GridElem key={"OAT"} active={active} edit={edit} mode="Weather" currentMode={mode}>
                  <div className="flex flex-row">{oat + '\u00b0'}</div>
               </GridElem>)
            } else {
               result.push(<GridElem key={"CH"} active={active} edit={edit} mode="Full" currentMode={mode}>
                  <div className="w-10 m-auto text-center">{Math.round(CH).toString() + "\u00b0 "}</div>
               </GridElem>)

               result.push(<GridElem key={"MH"} active={active} edit={edit} mode="Vor" currentMode={mode}>
                  <div className="w-10 m-auto text-center">{Math.round(MH).toString() + "\u00b0 "}</div>
               </GridElem>)

               result.push(<GridElem key={"IAS"} active={active} edit={edit} mode="Enroute" currentMode={mode}>
                  <div className="w-10 m-auto text-center">{Math.round(ias)}</div>
               </GridElem>)

               result.push(<GridElem key={"GS"} active={active} edit={edit} mode="Full" currentMode={mode}>
                  <div className="w-10 m-auto text-center">{Math.round(GS).toString()}</div>
               </GridElem>)

               result.push(<GridElem key={"ETE"} active={active} edit={edit} mode="Full" currentMode={mode}>
                  <div className="m-auto text-center">{dur}</div>
               </GridElem>)

               result.push(<GridElem key={"ETA"} active={active} edit={edit} mode="Enroute" currentMode={mode}>
                  <div className="flex flex-col shrink m-auto justify-center">
                     <div className="flex grow justify-center">{eta}</div>
                     {
                        deltaEta === 0 ? <></>
                           :
                           <div className="flex flex-col grow">
                              <div className={"text-center justify-center" + (deltaEta < 0 ? ' text-red-600' : ' text-green-600')}>
                                 {eta2}
                              </div>
                           </div>
                     }
                  </div>
               </GridElem>)
            }

            result.push(<GridElem key={"Fuel"} active={active} edit={edit} mode="Enroute" currentMode={mode}>
               {
                  edit ?
                     <div className="[&_.invalid]:text-red-500">
                        <Reset className="flex-row justify-end" onReset={() => {
                           navProps.curFuel = 0;
                           editNavProperties(id, properties);
                           setReset(true)
                        }}>
                           <Input active={true} className="w-12" onChange={(value) => {
                              navProps.curFuel = fromUnit(+value);
                              editNavProperties(id, properties);
                           }} value={toUnit(curFuel).toString()} reload={reset} validate={async (value) => {
                              return /^[+]?\d*$/.test(value);
                           }} inputMode='decimal' />
                        </Reset>
                     </div>
                     : <div className="flex flex-col shrink m-auto justify-center">
                        <div className="flex grow justify-center">{Math.round(toUnit(estFuel)) + ''}</div>
                        {
                           deltaFuel === 0 ? <></>
                              :
                              <div className="flex flex-col grow">
                                 <div className={"text-center justify-center" + (deltaFuel > 0 ? ' text-green-600' : ' text-red-600')}>
                                    {Math.round(toUnit(estFuel + deltaFuel))}
                                 </div>
                              </div>
                        }
                     </div>
               }
            </GridElem>)

            result.push(<GridElem key={"Remarks"} active={active} edit={edit} mode="Remarks" currentMode={mode}>
               <div className="flex flex-row grow h-full">
                  {
                     edit ?
                        <Input active={true} className="w-32" value={remark} onChange={(value) => {
                           navProps.remark = value;
                           editNavProperties(id, properties);
                        }} />
                        : <div className="min-w-32 m-auto text-center">{remark}</div>
                  }
               </div>
            </GridElem>)

            if (!edit) {
               result.push(<GridElem key={"checkbox"} active={active} edit={edit} currentMode={mode}>
                  <CheckBox value={!active} onChange={() => setActive(row - 1)} />
               </GridElem>)
            }
         }

         return result
            .filter(elem => !elem.props.mode || mode === elem.props.mode || mode === 'Full')
            .map((elem, index, all) => <elem.type key={elem.key} {...elem.props} row={row + 1} col={index} size={all.length} />);
      })
   }, [actives, coords, departureTime, editNavProperties, fromUnit, id, loadedFuel, properties, setActive, toUnit, updateWaypoints, waypoints, reset, collapseWaypoints])

   const legs = useMemo(() => getLegs(mode, edit), [edit, getLegs, mode]);
   const fullLegs = useMemo(() => getLegs("Full", false), [getLegs]);

   useEffect(() => {
      setReset(true)
   }, [fuelUnit])

   useEffect(() => {
      if (reset) {
         setReset(false)
      }
   }, [reset])

   return <div className={'flex flex-col text-sm [grid-row:1] [grid-column:1] overflow-hidden [&>:last-child]:h-full'
      + ((tab === currentTab) ? '' : ' opacity-0 select-none pointer-events-none max-h-0')
   }>
      <div className="flex flex-row pl-4 pt-2">
         <Tabs tabs={Array.from(modes)} activeTab={mode} names={modesStr} switchTab={setMode} />
      </div>
      <Scroll className={
         'block [&>:not(:first-child)]:mt-8'
      }>
         <div className="flex flex-col w-full min-h-max">
            <div className="flex flex-row w-full">
               <div className='flex flex-col mx-5 shadow-sm min-h-max ml-5 min-w-max'>
                  <div className={"grid pb-8"}>
                     <div className="relative [grid-row:1] [grid-column:1] opacity-0 pointer-events-none select-none" inert={true}>
                        <div className="grid">
                           {fullHeader}
                           {fullLegs}
                        </div>
                     </div>
                     <div className={"relative [grid-row:1] [grid-column:1] max-w-min"}>
                        <div className={"absolute top-0 bottom-0 left-0 w-4 bg-slate-900 hocus:bg-msfs shadow-md m-[0.1rem] "
                           + (edit ? "hidden " : '')
                           + "select-none transition-all cursor-pointer opacity-40 hocus:opacity-100"}>
                           <button className="flex bg-slate-900 w-4 h-full hocus:bg-msfs select-none transition-all cursor-pointer justify-center text-center"
                              onClick={(e) => {
                                 setCollapseWaypoints(value => !value)
                                 e.currentTarget.blur()
                              }}
                           >
                              <Arrow width={20} height={15} className={'transition-all m-auto' + (collapseWaypoints ? ' rotate-180' : ' ')} />
                           </button>
                        </div>
                        <div className="grid">
                           {header}
                           {legs}
                        </div>
                     </div>
                  </div>
               </div>
            </div >
            {
               edit ?
                  <div className="flex flex-col mx-auto shrink">
                     <div className="flex flex-row text-sm justify-center">
                        <div className="flex m-auto grow">Loaded Fuel : </div>
                        <Reset className="flex-row justify-end min-w-20" onReset={async () => {
                           setLoadedFuel(id, await getFuel())
                        }}>
                           <div className="flex flex-row shrink [&_.invalid]:text-red-500 w-16">
                              <Input active={true} className="my-1 max-w-16" value={loadedFuelStr} reload={reset} inputMode="decimal"
                                 onChange={(value) => {
                                    setLoadedFuel(id, fromUnit(+value));
                                 }} validate={async (value) => {
                                    return /^\d*(\.\d*)?$/.test(value);
                                 }} />
                           </div>
                        </Reset>
                        <div className="flex shrink ml-1 my-auto w-3">{fuelUnitStr}</div>
                     </div>
                     <div className="flex flex-row text-sm justify-center">
                        <div className="flex mr-2 m-auto grow">Departure Time : </div>
                        <Reset className="justify-end min-w-20" onReset={() => {
                           const date = new Date();
                           setDepartureTime(id, date.getHours() * 60 + date.getMinutes());
                           setReset(true)
                        }}>
                           <div className="flex flex-row [&_.invalid]:text-red-500 w-16">
                              <Input active={true} className="my-1 max-w-16" reload={reset} value={departureTimeStr}
                                 onChange={(value) => {
                                    const data = value.split('h');
                                    setDepartureTime(id, +data[0] * 60 + +data[1]);
                                 }} validate={async (value) => {
                                    if (/^\d+h\d*$/.test(value)) {
                                       const data = value.split('h');
                                       return (+data[0] < 24) && (+data[1] < 60);
                                    }

                                    return false;
                                 }} />
                           </div>
                        </Reset>
                        <div className="flex ml-1 m-auto w-3"></div>
                     </div>
                  </div>
                  : <></>
            }
            <div className="flex flex-row p-4 pt-4">
               <div className="flex flex-col mx-auto text-sm border-2 border-slate-700 shadow-lg py-4 px-14 whitespace-nowrap">
                  {edit ? <>
                     <div className="flex flex-row"><div className="w-32">OBS: </div>Omni Beer Selector</div>
                     <div className="flex flex-row"><div className="w-32">VAR: </div>Variation</div>
                     <div className="flex flex-row"><div className="w-32">IAS: </div>Indicated Air Speed</div>
                     <div className="flex flex-row"><div className="w-32">OAT: </div>Outside Air Temperature</div>
                     <div className="flex flex-row"><div className="w-32">ATA: </div>Actual Time of Arrival</div>
                     <div className="flex flex-row"><div className="w-32">Fuel: </div>Fuel Level at Leg Completion</div>
                  </> : <>
                     <div className="flex flex-row"><div className="w-32">OBS: </div>Omni Beer Selector</div>
                     <div className="flex flex-row"><div className="w-32">CH: </div>Compass Heading</div>
                     <div className="flex flex-row"><div className="w-32">MH: </div>Magnetic Heading</div>
                     <div className="flex flex-row mt-2"><div className="w-32">IAS: </div>Indicated Air Speed</div>
                     <div className="flex flex-row"><div className="w-32">GS: </div>Ground Speed</div>
                     <div className="flex flex-row mt-2"><div className="w-32">ETE: </div>Estimated Time Enroute</div>
                     <div className="flex flex-row"><div className="w-32">ETA: </div>Estimated Time of Arrival</div>
                     <div className="flex flex-row mt-2"><div className="w-32">Fuel: </div>
                        <div className="flex flex-col">
                           <div>Estimated Fuel Level at Leg Completion</div>
                           <div>&#40;Based on last input / departure fuel&#41;</div>
                        </div>
                     </div>
                  </>
                  }
               </div>
            </div>
         </div>
      </Scroll >
   </div >
}
