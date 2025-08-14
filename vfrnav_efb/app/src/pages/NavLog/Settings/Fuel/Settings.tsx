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

import { MapContext } from '@pages/Map/MapContext';
import { messageHandler, SettingsContext } from '@Settings/SettingsProvider';
import { useContext, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { EditPresetPopup, PresetPopup } from './PresetPopup';
import { Select, SelectOption } from '@alx-home/Utils';
import { FuelUnit } from '@shared/NavData';

import EditImg from '@alx-home/images/edit.svg?react';
import DeleteImg from '@alx-home/images/delete.svg?react';
import { DeleteFuelPreset, GetFuelCurve, SetFuelCurve } from '@shared/Fuel';


export const useSettings = ({ setOat }: {
   setOat: (_value: number) => void
}) => {
   const { fuelUnit, setFuelUnit, savedFuelCurves, setSavedFuelCurves, setFuelCurve, fuelCurve } = useContext(MapContext)!;
   const { setPopup } = useContext(SettingsContext)!;

   const hardPresets = useMemo(() => (['simple']), [])
   const [preset, setPreset] = useState(savedFuelCurves.length ? savedFuelCurves[0][0] : 'custom')
   const notifyFuelPresets = useRef<() => void>(null);

   const [closePreset, setClosePreset] = useState(false);

   const updatePreset = useCallback((value: string) => {
      if (value === 'simple') {
         setPopup(<PresetPopup validate={(fuel) => {
            setFuelCurve([
               [100, [
                  [[20, 0, fuel]],
                  [[20, 25000, fuel]]
               ]],
            ])
            setOat(20)
            setPreset('custom')
         }} />)
      } else if (value !== 'custom') {
         setPreset(value)
         setFuelCurve(savedFuelCurves.find(e => e[0] === value)![2])
      }
   }, [savedFuelCurves, setFuelCurve, setOat, setPopup])

   useEffect(() => {
      const callback = ({ name }: GetFuelCurve) => {
         messageHandler.send({
            __FUEL_CURVE__: true,

            name: name,
            date: savedFuelCurves.find(curve => curve[0] === name)![1],
            curve: savedFuelCurves.find(curve => curve[0] === name)![2].map(curve => ({
               thrust: curve[0],
               points: curve[1].map(elem => elem.map(point => ({
                  temp: point[0],
                  alt: point[1],
                  conso: point[2]
               })))
            }))
         })
      }

      messageHandler.subscribe('__GET_FUEL_CURVE__', callback)
      return () => { messageHandler.unsubscribe('__GET_FUEL_CURVE__', callback) }
   }, [savedFuelCurves])

   useEffect(() => {
      notifyFuelPresets.current = () => {
         messageHandler.send({
            __FUEL_PRESETS__: true,

            data: savedFuelCurves
               .filter(elem => (elem[0] !== 'custom') && (!hardPresets.find(name => name === elem[0])))
               .map(elem => ({
                  name: elem[0],
                  date: elem[1],
                  remove: elem[2].length === 0
               })),
         })
      }

      messageHandler.subscribe('__GET_FUEL_PRESETS__', notifyFuelPresets.current)
      return () => messageHandler.unsubscribe('__GET_FUEL_PRESETS__', notifyFuelPresets.current!)
   }, [hardPresets, preset, savedFuelCurves])


   useEffect(() => {
      notifyFuelPresets.current?.()
   }, [savedFuelCurves])

   useEffect(() => {
      const callback = ({ name, curve, date }: SetFuelCurve) => {
         const curentDate = savedFuelCurves.find(elem => elem[0] === name)?.[1] ?? 0

         if (date > curentDate) {
            setSavedFuelCurves(curves => {
               const index = curves.findIndex(curve => curve[0] === name);

               if (index === -1) {
                  if (curve.length) {
                     return curves.toSpliced(curves.length, 0,
                        [name, date, curve.map(elem => ([
                           elem.thrust,
                           elem.points.map(elem => elem
                              .map(elem => [elem.temp, elem.alt, elem.conso]))
                        ]))]);
                  } else {
                     return curves
                  }
               }

               if (curve.length) {
                  return curves.toSpliced(index, 1,
                     [name, date, curve.map(elem => ([
                        elem.thrust,
                        elem.points.map(elem => elem
                           .map(elem => [elem.temp, elem.alt, elem.conso]))
                     ]))]);
               } else {
                  return curves.toSpliced(index, 1)
               }
            })

            if (name === preset) {
               setPreset('custom')
            }
         } else if (date < curentDate) {
            notifyFuelPresets.current?.()
         }
      }

      messageHandler.subscribe('__FUEL_CURVE__', callback)
      return () => messageHandler.unsubscribe('__FUEL_CURVE__', callback)
   }, [preset, savedFuelCurves, setSavedFuelCurves])


   useEffect(() => {
      const callback = ({ name, date }: DeleteFuelPreset) => {
         const savedCurve = savedFuelCurves.find(curve => curve[0] === name);

         if (savedCurve) {
            if (date > savedCurve[1]) {
               if (preset === name) {
                  setPreset('custom')
               }
               setSavedFuelCurves(curves => curves.filter(elem => elem[0] !== name))
            } else if (date < savedCurve[1]) {
               notifyFuelPresets.current?.()
            }
         }
      }

      messageHandler.subscribe('__DELETE_FUEL_PRESET__', callback)
      return () => messageHandler.unsubscribe('__DELETE_FUEL_PRESET__', callback)
   }, [preset, savedFuelCurves, setSavedFuelCurves])

   useEffect(() => {
      if (closePreset) {
         setClosePreset(false);
      }
   }, [closePreset])

   return {
      setPreset: setPreset,
      Settings: <div className="flex flex-row shrink text-sm justify-center m-auto mb-4 pt-2" >
         <div className="flex flex-col pr-2 text-sm justify-center w-[17.4rem]">
            <div className="flex flex-row">
               <Select active={true} value={preset} close={closePreset} className="[&_.option:hover_.edit]:w-full [&_.option]:p-0"
                  onChange={updatePreset}>
                  {[...savedFuelCurves.filter(curve => curve[2].length).map(elem => elem[0]), ...hardPresets, ...(preset === 'custom' ? ['custom'] : [])].map(name => <SelectOption<string> key={name} id={name}>
                     <div className='relative flex flex-row px-2 grow'>
                        <div className="flex flex-row grow justify-center min-w-0 py-1 px-1">
                           {name === 'custom' ? '*unsaved' : name}
                        </div>
                        {
                           (hardPresets.find(value => name === value) === undefined)
                              ? <div className="absolute flex flex-row w-full h-full justify-end pr-2">
                                 <div className='edit transition-all justify-end flex flex-row w-0 max-h-full'>
                                    <EditImg className="bg-msfs mr-1 hover:brightness-125 focus:border-2 focus:border-with w-6 h-6 mt-auto mb-auto justify-center cursor-pointer"
                                       onClick={e => {
                                          setClosePreset(true);
                                          e.stopPropagation()
                                          setPopup(<EditPresetPopup current={name} hardPresets={hardPresets} validate={(newName) => {
                                             setSavedFuelCurves(saved => {
                                                const oldIndex = saved.findIndex(value => value[0] === name)
                                                const newCurves = (oldIndex === -1 ? saved : saved.toSpliced(oldIndex, 1, [name, (new Date()).getTime(), []]))
                                                const index = newCurves.findIndex(value => value[0] === newName)

                                                const values = name === preset ? fuelCurve : savedFuelCurves[oldIndex][2];

                                                if (index === -1) {
                                                   return newCurves.toSpliced(saved.length, 0, [
                                                      newName, (new Date()).getTime(), values
                                                   ])
                                                }

                                                return newCurves.toSpliced(index, 1, [
                                                   newName, (new Date()).getTime(), values
                                                ])
                                             })
                                             setPreset(newName)
                                          }} />)
                                       }} />
                                    {
                                       (name !== 'custom')
                                          ? <DeleteImg className="bg-red-600 hover:brightness-125 focus:border-2 focus:border-with w-6 h-6 mt-auto mb-auto justify-center cursor-pointer"
                                             onClick={e => {
                                                setClosePreset(true);
                                                if (preset === name) {
                                                   setPreset('custom')
                                                }
                                                setSavedFuelCurves(saved => {
                                                   const index = saved.findIndex(value => value[0] === name)

                                                   if (index !== -1) {
                                                      // Mark curve to be removed
                                                      return saved.toSpliced(index, 1, [saved[index][0], (new Date()).getTime(), []])
                                                   }

                                                   return saved
                                                })
                                                e.stopPropagation()
                                             }} />
                                          : <></>
                                    }
                                 </div>
                              </div>
                              : <></>
                        }
                     </div>
                  </SelectOption>)}
               </Select>
            </div>
         </div>
         <div className="flex flex-col text-sm justify-center w-24">
            <div className="flex flex-row">
               <Select active={true} value={fuelUnit} onChange={(value) => {
                  setFuelUnit(value)
               }}>
                  <SelectOption<FuelUnit> id={'gal'}>Galon</SelectOption>
                  <SelectOption<FuelUnit> id={'liter'}>Liter</SelectOption>
               </Select>
            </div>
         </div>
      </div >
   }
}