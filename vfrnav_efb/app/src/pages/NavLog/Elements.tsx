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
import { PropsWithChildren, ReactElement, useCallback, useContext, useMemo, useState } from "react";

import Arrow from '@alx-home/images/arrow.svg?react';
import { CheckBox, Input, Scroll, Tabs } from "@alx-home/Utils";

const modes = ['Enroute', 'Vor', 'Weather', 'Full'] as const;
type Modes = typeof modes[number];
const modesStr: Record<Modes, string> = {
   'Enroute': 'Enroute',
   'Vor': 'Vor',
   'Weather': 'Weather',
   'Full': 'Full',
}

const gridSize = 16;

const GridElem = ({ children, index, active, edit, mode, currentMode }: PropsWithChildren<{
   index: number
   active: boolean
   edit: boolean,
   mode?: Modes,
   currentMode: Modes
}>) => {
   const row = Math.floor(index / gridSize + 1);
   const col = Math.floor(index - (row - 1) * gridSize + 1);
   const gridSize2 = (gridSize - (edit ? 3 : 1))

   const column = useMemo(() => {
      if (currentMode === "Vor") {
         if (col === 1) {
            return 1
         } if (col === 3) {
            return 2
         } else if (col === 4) {
            return 3
         } else if (col === 6) {
            console.assert(col === 6)
            return 4
         } else {
            return 5
         }
      } else if (currentMode === "Enroute") {
         if (edit) {
            if (col === 1) {
               return 1
            } else if (col === 2) {
               return 2
            } if (col === 7) {
               return 3
            } else if (col === 9) {
               return 4
            } else if (col === 10) {
               return 5
            }
         } else {
            if (col === 1) {
               return 1
            } else if (col === 2) {
               return 2
            } else if (col === 8) {
               return 3
            } if (col === 10) {
               return 4
            } else if (col === 11) {
               return 5
            } else if (col === 12) {
               return 6
            }
         }
      } else if (currentMode === "Weather") {
         if (col === 1) {
            return 1
         } else if (col === 5) {
            return 2
         } if (col === 6) {
            return 4
         } else if (col === 8) {
            return 3
         }
      }

      return col;
   }, [col, currentMode, edit]);

   const sep = useMemo(() => {
      if (currentMode === 'Enroute') {
         if (edit) {
            return [2, 9, 11]
         } else {
            return [2, 5, 10, 13]
         }
      } else if (currentMode === 'Weather') {
         if (edit) {
            return [2, 5, 6, 11]
         } else {
            return [2, 5, 6, 10]
         }
      } else if (currentMode === 'Vor') {
         if (edit) {
            return [3, 4, 11]
         } else {
            return [3, 4, 13]
         }
      } else {
         if (edit) {
            return [2, 5, 9, 11]
         } else {
            return [2, 5, 8, 10, 13]
         }
      }
   }, [currentMode, edit])


   if (!mode || currentMode === mode || currentMode === 'Full') {
      return <div className={"flex border-slate-700 p-2 grow h-16"
         + (col < gridSize2 - 1 ? ' border-r-2 border-b-2 [--tw-shadow-opacity:0.2] shadow-xl' : '')
         + ((col > 1) ? ((row > 1) ? ' -translate-y-1/2' : ' translate-y-1/2') : '')
         + ((col === 1) ? ' border-l-2' : '')
         + (sep.find(index => index === col) ? " ml-2 border-l-2" : "")
         + ((index < gridSize2) ? ' border-t-2' : '')}
         style={{ gridColumn: column, gridRow: row }}>
         <div className={
            "flex justify-center m-auto w-full whitespace-nowrap"
            + ((edit || active || (col === gridSize2 - 1)) ? '' : ' opacity-20')}>
            {children}
         </div>
      </div>
   } else {
      return <></>
   }
}

export const TabElem = ({ tab, currentTab, coords, edit, navData }: {
   currentTab: string,
   tab: string,
   coords: Coordinate[],
   edit: boolean,
   navData: NavData
}) => {
   const { editNavProperties, fuelUnit } = useContext(MapContext)!;
   const { properties, id } = navData;
   const actives = useMemo(() => properties.map(value => edit ? true : value.active), [edit, properties]);
   const toUnit = useCallback((value: number) =>
      fuelUnit === 'gal' ? value : value / 3.785411784
      , [fuelUnit])
   const fromUnit = useCallback((value: number) =>
      fuelUnit === 'gal' ? value : value * 3.785411784
      , [fuelUnit])

   const fuelUnitStr = useMemo(() => fuelUnit === 'gal' ? 'gal' : 'l', [fuelUnit])
   const [loadedFuel, setLoadedFuel] = useState(200);
   const [departureTime, setDepartureTime] = useState(15 * 60 + 30);
   const departureTimeStr = useMemo(() => {
      const hours = Math.floor(departureTime / 60);
      const minutes = Math.round(departureTime - 60 * hours);

      return (hours % 24) + 'h' + (minutes < 10 ? '0' + minutes : minutes)
   }, [departureTime])

   const loadedFuelStr = useMemo(() => toUnit(loadedFuel).toString(), [loadedFuel, toUnit])



   const [mode, setMode] = useState<Modes>('Enroute');

   const setActive = useCallback((index: number) => {
      const value = !actives[index];

      if (value) {
         for (let i = index; i < properties.length; ++i) {
            properties[i].active = value;
         }
      } else {
         for (let i = 0; i <= index; ++i) {
            properties[i].active = value;
         }
      }

      editNavProperties(id, properties);
   }, [actives, editNavProperties, id, properties]);

   const legs = useMemo(() => {
      let time = departureTime * 60;
      let fuel = loadedFuel;
      let deltaFuel = 0;
      let deltaEta = 0;

      return coords.map((_value, index) => {
         let index_ = (index + 1) * gridSize;

         if (index === 0) {
            const name = properties[index].name;

            return [<GridElem key={"Waypoint"} index={index_} active={true} edit={edit} currentMode={mode}>
               {
                  edit ?
                     <Input active={true} className="w-36" value={name} onChange={(value) => {
                        properties[index].name = value;
                        editNavProperties(id, properties);
                     }} />
                     : <div className="w-36 m-auto text-center">{name}</div>
               }
            </GridElem>]
         } else {
            const active = actives[index - 1];
            const navProps = properties[index - 1];
            const { altitude, dist, vor, wind, name, remark, CH, MH, GS, tas, ias, magVar, oat, conso, curFuel, ata } = navProps;
            const { ident: vorIndent, freq: vorFreq, obs: vorObs } = vor;
            const { direction: windDir, speed: windVel } = wind;

            fuel -= conso;
            const estFuel = fuel;
            const lastFuel = (index > 1 ? properties[index - 2].curFuel : loadedFuel);
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

            const lastAta = (index > 1 ? properties[index - 2].ata : -1)
            if (lastAta !== -1) {
               deltaEta = Math.round(time - (lastAta * 60 + navProps.dur.full));
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


            const result: ReactElement[] = [];
            result.push(<GridElem key={"Waypoint"} index={index_} active={true} edit={edit} currentMode={mode}>
               {
                  edit ?
                     <Input active={true} className="w-32" value={name} onChange={(value) => {
                        navProps.name = value;
                        editNavProperties(id, properties);
                     }} />
                     : <div className="w-32 m-auto text-center">{name}</div>
               }
            </GridElem>)
            ++index_;
            result.push(<GridElem key={"Altitude"} index={index_} active={active} edit={edit} mode="Enroute" currentMode={mode}>
               <div className="flex flex-row grow h-full">
                  {((mode !== 'Vor' && mode !== 'Weather')) ? <Arrow className="rotate-180 h-full -ml-8" height={30} width={20} /> : <></>}
                  <div className="flex grow [&_.invalid]:text-red-500">
                     {
                        edit ?
                           <Input active={true} className="w-24" value={altitude.toFixed(0)} validate={async (value) => {
                              return /^\d+$/.test(value);
                           }} onChange={(value) => {
                              navProps.altitude = +value;
                              editNavProperties(id, properties);
                           }} inputMode="decimal" />
                           : <div className="w-24 m-auto text-center">{altitude}</div>
                     }
                  </div>
               </div>
            </GridElem>)
            ++index_;
            result.push(<GridElem key={"VOR"} index={index_} active={active} edit={edit} mode="Vor" currentMode={mode}>
               <div className="flex flex-row grow h-full">
                  {mode === 'Vor' ? <Arrow className="rotate-180 h-full -ml-8" height={30} width={20} /> : <></>}
                  {
                     edit ?
                        <div className="flex flex-row [&_.invalid]:text-red-500">
                           <Input active={true} className="w-16" value={vorIndent} onChange={(value) => {
                              navProps.vor.ident = value;
                              editNavProperties(id, properties);
                           }} />
                           <Input active={true} className="w-16" value={vorFreq.toString()} onChange={(value) => {
                              navProps.vor.freq = +value;
                              editNavProperties(id, properties);
                           }} validate={async (value) => {
                              return /^\d*(\.\d*)?$/.test(value);
                           }} inputMode='decimal' />
                        </div>
                        :
                        <div className="flex flex-col">
                           <div className="w-32 m-auto text-center">{vorIndent}</div>
                           <div className="w-32 m-auto text-center">{vorFreq}</div>
                        </div>
                  }
               </div>
            </GridElem>)
            ++index_;

            result.push(<GridElem key={"OBS"} index={index_} active={active} edit={edit} mode="Vor" currentMode={mode}>
               <div className="[&_.invalid]:text-red-500">
                  {
                     edit ?
                        <Input active={true} className="w-16" value={vorObs.toFixed(0)} onChange={(value) => {
                           navProps.vor.obs = +value;
                           editNavProperties(id, properties);
                        }} validate={async (value) => {
                           return /^[-+]?\d*$/.test(value);
                        }} inputMode='decimal' />
                        : <div className="w-16 m-auto text-center">{vorObs}</div>
                  }
               </div>
            </GridElem>)
            ++index_;

            if (edit) {
               result.push(<GridElem key={"Wind"} index={index_} active={active} edit={edit} mode="Weather" currentMode={mode}>
                  {mode === 'Weather' ? <Arrow className="rotate-180 h-full -ml-8" height={30} width={20} /> : <></>}
                  <div className="flex flex-row [&_.invalid]:text-red-500">
                     <Input active={true} className="w-16" value={windDir.toString()} onChange={(value) => {
                        navProps.wind.direction = +value;
                        editNavProperties(id, properties);
                     }} validate={async (value) => {
                        return /^[-+]?\d*$/.test(value);
                     }} inputMode='decimal' />
                     <Input active={true} className="w-16" value={windVel.toString()} onChange={(value) => {
                        navProps.wind.speed = +value;
                        editNavProperties(id, properties);
                     }} validate={async (value) => {
                        return /^[-+]?\d*$/.test(value);
                     }} inputMode='decimal' />
                  </div>
               </GridElem>)
               ++index_;
               result.push(<GridElem key={"VAR"} index={index_} active={active} edit={edit} mode="Weather" currentMode={mode}>
                  <div className="flex flex-row [&_.invalid]:text-red-500">
                     <Input active={true} className="w-16" value={magVar.toString()} onChange={(value) => {
                        navProps.magVar = +value;
                        editNavProperties(id, properties);
                     }} validate={async (value) => {
                        return /^[-+]?\d*$/.test(value);
                     }} inputMode='decimal' />
                  </div>
               </GridElem>)
               ++index_;
               result.push(<GridElem key={"IAS"} index={index_} active={active} edit={edit} mode="Enroute" currentMode={mode}>
                  <div className="[&_.invalid]:text-red-500">
                     <Input active={true} className="w-16" onChange={(value) => {
                        navProps.ias = +value;
                        editNavProperties(id, properties);
                     }} value={ias.toString()} validate={async (value) => {
                        return /^[+]?\d*$/.test(value) && (+value > 0);
                     }} inputMode='decimal' />
                  </div>
               </GridElem>)
               ++index_;
               result.push(<GridElem key={"OAT"} index={index_} active={active} edit={edit} mode="Weather" currentMode={mode}>
                  <div className="[&_.invalid]:text-red-500">
                     <Input active={true} className="w-16" onChange={(value) => {
                        navProps.oat = +value;
                        editNavProperties(id, properties);
                     }} value={oat.toString()} validate={async (value) => {
                        return /^[-+]?\d*(\.\d*)?$/.test(value);
                     }} inputMode='decimal' />
                  </div>
               </GridElem>)
               ++index_;
               result.push(<GridElem key={"ATA"} index={index_} active={active} edit={edit} mode="Enroute" currentMode={mode}>
                  <div className="[&_.invalid]:text-red-500">
                     <Input active={true} className="w-24" onChange={(value) => {
                        if (value.length) {
                           const data = value.split('h');
                           navProps.ata = +data[0] * 60 + +data[1]
                        } else {
                           navProps.ata = -1
                        }

                        editNavProperties(id, properties);
                     }} value={ataStr}
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
                  </div>
               </GridElem>)
               ++index_;
            } else if (mode === 'Weather') {
               result.push(<GridElem key={"Wind"} index={index_} active={active} edit={edit} mode="Weather" currentMode={mode}>
                  <div className="flex flex-row grow h-full">
                     <Arrow className="rotate-180 h-full -ml-8" height={30} width={20} />
                     <div className="flex flex-row grow justify-center m-auto">{windDir} / {windVel}</div>
                  </div>
               </GridElem>)
               ++index_;
               result.push(<GridElem key={"VAR"} index={index_} active={active} edit={edit} mode="Weather" currentMode={mode}>
                  <div className="flex flex-row">{magVar}</div>
               </GridElem>)
               ++index_;
               ++index_;
               result.push(<GridElem key={"OAT"} index={index_} active={active} edit={edit} mode="Weather" currentMode={mode}>
                  <div className="flex flex-row">{oat + '\u00b0'}</div>
               </GridElem>)
               ++index_;
            } else {
               result.push(<GridElem key={"CH"} index={index_} active={active} edit={edit} mode="Full" currentMode={mode}>
                  <div className="w-16 m-auto text-center">{Math.round(CH).toString() + "\u00b0 "}</div>
               </GridElem>)
               ++index_;
               result.push(<GridElem key={"MH"} index={index_} active={active} edit={edit} mode="Vor" currentMode={mode}>
                  <div className="w-16 m-auto text-center">{Math.round(MH).toString() + "\u00b0 "}</div>
               </GridElem>)
               ++index_;
               result.push(<GridElem key={"Dist"} index={index_} active={active} edit={edit} mode="Full" currentMode={mode}>
                  <div className="w-16 m-auto text-center">{Math.round(dist).toString()}</div>
               </GridElem>)
               ++index_;
               result.push(<GridElem key={"TAS"} index={index_} active={active} edit={edit} mode="Enroute" currentMode={mode}>
                  <div className="w-16 m-auto text-center">{Math.round(tas)}</div>
               </GridElem>)
               ++index_;
               result.push(<GridElem key={"GS"} index={index_} active={active} edit={edit} mode="Full" currentMode={mode}>
                  <div className="w-16 m-auto text-center">{Math.round(GS).toString()}</div>
               </GridElem>)
               ++index_;
               result.push(<GridElem key={"ETE"} index={index_} active={active} edit={edit} mode="Enroute" currentMode={mode}>
                  <div className="m-auto text-center">{dur}</div>
               </GridElem>)
               ++index_;
               result.push(<GridElem key={"ETA"} index={index_} active={active} edit={edit} mode="Enroute" currentMode={mode}>
                  <div className="flex flex-row shrink m-auto justify-center">
                     {
                        deltaEta === 0 ? <></>
                           : <>
                              <div className={"ml-2 justify-end flex shrink" + (deltaEta > 0 ? ' text-green-600' : ' text-red-600')}>
                                 {eta2}
                              </div>
                              <div className="flex flex-shrink mx-1">/</div>
                           </>
                     }
                     <div className="flex grow justify-center">{eta}</div>
                  </div>
               </GridElem>)
               ++index_;
            }

            result.push(<GridElem key={"Fuel"} index={index_} active={active} edit={edit} mode="Enroute" currentMode={mode}>
               {
                  edit ?
                     <div className="[&_.invalid]:text-red-500">
                        <Input active={true} className="w-20" onChange={(value) => {
                           navProps.curFuel = fromUnit(+value);
                           editNavProperties(id, properties);
                        }} value={toUnit(curFuel).toString()} validate={async (value) => {
                           return /^[+]?\d*$/.test(value);
                        }} inputMode='decimal' />
                     </div>
                     : <div className="flex flex-row shrink m-auto justify-center">
                        {
                           deltaFuel === 0 ? <></>
                              : <>
                                 <div className={"ml-2 w-8 justify-end flex shrink" + (deltaFuel > 0 ? ' text-green-600' : ' text-red-600')}>
                                    {Math.round(toUnit(estFuel + deltaFuel))}
                                 </div>
                                 <div className="flex flex-shrink mx-1">/</div>
                              </>
                        }
                        <div className="flex grow justify-center">{Math.round(toUnit(estFuel)) + ''}</div>
                     </div>
               }
            </GridElem>)
            ++index_;
            result.push(<GridElem key={"Remarks"} index={index_} active={active} edit={edit} currentMode={mode}>
               {
                  edit ?
                     <Input active={true} className="w-52" value={remark} onChange={(value) => {
                        navProps.remark = value;
                        editNavProperties(id, properties);
                     }} />
                     : <div className="w-52 m-auto text-center">{remark}</div>
               }
            </GridElem>)

            if (!edit) {
               ++index_;
               result.push(<GridElem key={"checkbox"} index={index_} active={active} edit={edit} mode="Full" currentMode={mode}>
                  <CheckBox value={!active} onChange={() => setActive(index - 1)} />
               </GridElem>)
            }
            return result;
         }
      })
   }, [actives, coords, departureTime, edit, editNavProperties, fromUnit, id, loadedFuel, mode, properties, setActive, toUnit])

   return <div className={'flex flex-col text-xl [grid-row:1] [grid-column:1] overflow-hidden'
      + ((tab === currentTab) ? '' : ' opacity-0 select-none pointer-events-none max-h-0')
   }>
      <div className="flex flex-row px-8 py-6">
         <Tabs tabs={Array.from(modes)} activeTab={mode} names={modesStr} switchTab={setMode} />
      </div>
      <Scroll className={
         'block [&>:not(:first-child)]:mt-8'
      }>
         <div className='flex flex-col mx-5 shadow-sm w-full min-h-max ml-5'>
            <div className={"grid pb-8"}>
               <GridElem index={0} active={true} edit={edit} currentMode={mode}>Waypoint</GridElem>
               <GridElem index={1} active={true} edit={edit} mode="Enroute" currentMode={mode}>Altitude</GridElem>
               <GridElem index={2} active={true} edit={edit} mode="Vor" currentMode={mode}>VOR Ind/Freq</GridElem>
               <GridElem index={3} active={true} edit={edit} mode="Vor" currentMode={mode}>OBS</GridElem>

               {edit ?
                  <>
                     <GridElem index={4} active={true} edit={edit} mode="Weather" currentMode={mode}>Wind Dir/Vel</GridElem>
                     <GridElem index={5} active={true} edit={edit} mode="Weather" currentMode={mode}>VAR</GridElem>
                     <GridElem index={6} active={true} edit={edit} mode="Enroute" currentMode={mode}>IAS</GridElem>
                     <GridElem index={7} active={true} edit={edit} mode="Weather" currentMode={mode}>OAT</GridElem>
                     <GridElem index={8} active={true} edit={edit} mode="Enroute" currentMode={mode}>ATA</GridElem>
                  </>
                  : mode === 'Weather' ? <>
                     <GridElem index={4} active={true} edit={edit} mode="Weather" currentMode={mode}>Wind Dir/Vel</GridElem>
                     <GridElem index={5} active={true} edit={edit} mode="Weather" currentMode={mode}>VAR</GridElem>
                     <GridElem index={7} active={true} edit={edit} mode="Weather" currentMode={mode}>OAT</GridElem>
                  </> : <>
                     <GridElem index={4} active={true} edit={edit} mode="Full" currentMode={mode}>CH</GridElem>
                     <GridElem index={5} active={true} edit={edit} mode="Vor" currentMode={mode}>MH</GridElem>
                     <GridElem index={6} active={true} edit={edit} mode="Full" currentMode={mode}>Dist</GridElem>
                     <GridElem index={7} active={true} edit={edit} mode="Enroute" currentMode={mode}>TAS</GridElem>
                     <GridElem index={8} active={true} edit={edit} mode="Full" currentMode={mode}>GS</GridElem>
                     <GridElem index={9} active={true} edit={edit} mode="Enroute" currentMode={mode}>ETE</GridElem>
                     <GridElem index={10} active={true} edit={edit} mode="Enroute" currentMode={mode}>ETA</GridElem>
                  </>
               }
               <GridElem index={1 + (edit ? 8 : mode === 'Weather' ? 7 : 10)} active={true} edit={edit} mode="Enroute" currentMode={mode}>Fuel ({fuelUnit === 'gal' ? 'gal' : 'l'})</GridElem>
               <GridElem index={2 + (edit ? 8 : mode === 'Weather' ? 7 : 10)} active={true} edit={edit} currentMode={mode}>Remarks</GridElem>
               {legs}
            </div>
            {
               edit ?
                  <div className="flex flex-col m-auto shrink">
                     <div className="flex flex-row text-xl justify-center">
                        <div className="flex mr-4 m-auto grow">Loaded Fuel : </div>
                        <div className="flex flex-row [&_.invalid]:text-red-500 w-24">
                           <Input active={true} className="my-1 w-full" value={loadedFuelStr} inputMode="decimal"
                              onChange={(value) => {
                                 setLoadedFuel(fromUnit(+value));
                              }} validate={async (value) => {
                                 return /^\d*(\.\d*)?$/.test(value);
                              }} >
                           </Input>
                        </div>
                        <div className="flex ml-4 m-auto w-8 shrink">{fuelUnitStr}</div>
                     </div>
                     <div className="flex flex-row text-xl justify-center">
                        <div className="flex mr-4 m-auto grow">Departure Time : </div>
                        <div className="flex flex-row [&_.invalid]:text-red-500 w-24">
                           <Input active={true} className="my-1 w-full" value={departureTimeStr}
                              onChange={(value) => {
                                 const data = value.split('h');
                                 setDepartureTime(+data[0] * 60 + +data[1]);
                              }} validate={async (value) => {
                                 if (/^\d+h\d*$/.test(value)) {
                                    const data = value.split('h');
                                    return (+data[0] < 24) && (+data[1] < 60);
                                 }

                                 return false;
                              }} >
                           </Input>
                        </div>
                        <div className="flex flex-col ml-4 m-auto w-8 shrink">
                        </div>
                     </div>
                  </div>
                  : <></>
            }
            <div className="flex flex-row p-4 pt-12">
               <div className="flex flex-col mx-auto text-lg border-2 border-slate-700 shadow-lg py-4 px-14">
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
                     <div className="flex flex-row mt-2"><div className="w-32">TAS: </div>True Air Speed</div>
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
         </div >
      </Scroll >
   </div >
}
