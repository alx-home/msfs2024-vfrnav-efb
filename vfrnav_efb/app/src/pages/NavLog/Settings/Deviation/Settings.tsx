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

import { useContext, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Select, SelectOption } from "@alx-home/Utils";
import { messageHandler, SettingsContext } from "@Settings/SettingsProvider";
import { EditPresetPopup } from "./PresetPopup";

import EditImg from "@alx-home/images/edit.svg?react";
import DeleteImg from "@alx-home/images/delete.svg?react";
import { MapContext } from '@pages/Map/MapContext';
import { DefaultDeviationPreset, DeleteDeviationPreset, GetDeviationCurve, SetDeviationCurve } from '@shared/Deviation';

export const useSettings = () => {
   const { setPopup } = useContext(SettingsContext)!;
   const { savedDeviationCurves, setSavedDeviationCurves, deviationCurve, setDeviationCurve } = useContext(MapContext)!;

   const hardPresets = useMemo(() => (['none']), [])
   const [defaultPreset, setDefaultPreset] = useState<string | undefined>(undefined)
   const [preset, setPreset] = useState(savedDeviationCurves.length ? savedDeviationCurves[0][0] : 'none')
   const notifyPresets = useRef<() => void>(null);

   const [closePreset, setClosePreset] = useState(false);

   const updatePreset_ = useRef<(_value: string, _user?: boolean) => void>(null)
   const updatePreset = useCallback((value: string, user?: boolean) => {
      updatePreset_.current?.(value, user)
   }, [])

   useEffect(() => {
      updatePreset_.current = (value: string, user?: boolean) => {
         if (user ?? true) {
            messageHandler.send({
               __DEFAULT_DEVIATION_PRESET__: true,

               name: value,
               date: (new Date()).getTime()
            })
         }

         if (value === 'none') {
            setDeviationCurve([[0, 0], [360, 0]])
            setPreset(value)
         } else if (value !== 'custom') {
            const curve = savedDeviationCurves.find(e => e[0] === value);

            if (curve) {
               setPreset(value)
               setDeviationCurve(curve[2])
            }
         }
      }
   }, [savedDeviationCurves, setDeviationCurve])


   useEffect(() => {
      const callback = ({ name }: GetDeviationCurve) => {
         messageHandler.send({
            __DEVIATION_CURVE__: true,

            name: name,
            date: savedDeviationCurves.find(curve => curve[0] === name)![1],
            curve: savedDeviationCurves.find(curve => curve[0] === name)![2]
         })
      }

      messageHandler.subscribe('__GET_DEVIATION_CURVE__', callback)
      return () => { messageHandler.unsubscribe('__GET_DEVIATION_CURVE__', callback) }
   }, [savedDeviationCurves])

   useEffect(() => {
      notifyPresets.current = () => {
         messageHandler.send({
            __DEVIATION_PRESETS__: true,

            data: savedDeviationCurves
               .filter(elem => (elem[0] !== 'custom') && (!hardPresets.find(name => name === elem[0])))
               .map(elem => ({
                  name: elem[0],
                  date: elem[1],
                  remove: elem[2].length === 0
               })),
         })
      }

      messageHandler.subscribe('__GET_DEVIATION_PRESETS__', notifyPresets.current)
      return () => messageHandler.unsubscribe('__GET_DEVIATION_PRESETS__', notifyPresets.current!)
   }, [hardPresets, preset, savedDeviationCurves])


   useEffect(() => {
      notifyPresets.current?.()
   }, [savedDeviationCurves])

   useEffect(() => {
      const callback = ({ name, curve, date }: SetDeviationCurve) => {
         const curentDate = savedDeviationCurves.find(elem => elem[0] === name)?.[1] ?? 0

         if (date > curentDate) {
            setSavedDeviationCurves(curves => {
               const index = curves.findIndex(curve => curve[0] === name);

               if (index === -1) {
                  if (curve.length) {
                     return curves.toSpliced(curves.length, 0, [name, date, curve]);
                  } else {
                     return curves
                  }
               }

               if (curve.length) {
                  return curves.toSpliced(index, 1, [name, date, curve]);
               } else {
                  return curves.toSpliced(index, 1)
               }
            })

            if (name === preset) {
               setPreset('custom')
            }
         } else if (date < curentDate) {
            notifyPresets.current?.()
         }
      }

      messageHandler.subscribe('__DEVIATION_CURVE__', callback)
      return () => messageHandler.unsubscribe('__DEVIATION_CURVE__', callback)
   }, [preset, savedDeviationCurves, setSavedDeviationCurves])


   useEffect(() => {
      const callback = ({ name, date }: DeleteDeviationPreset) => {
         const savedCurve = savedDeviationCurves.find(curve => curve[0] === name);

         if (savedCurve) {
            if (date > savedCurve[1]) {
               if (preset === name) {
                  setPreset('custom')
               }
               setSavedDeviationCurves(curves => curves.filter(elem => elem[0] !== name))
            } else if (date < savedCurve[1]) {
               notifyPresets.current?.()
            }
         }
      }

      messageHandler.subscribe('__DELETE_DEVIATION_PRESET__', callback)
      return () => messageHandler.unsubscribe('__DELETE_DEVIATION_PRESET__', callback)
   }, [preset, savedDeviationCurves, setSavedDeviationCurves])

   useEffect(() => {
      const callback: { current: (((_msg: DefaultDeviationPreset) => void) | undefined) } = {
         current: ({ name }: DefaultDeviationPreset) => {
            if (callback.current) {
               messageHandler.unsubscribe('__DEFAULT_DEVIATION_PRESET__', callback.current)
               callback.current = undefined;
            }
            setDefaultPreset(name);
         }
      }
      messageHandler.subscribe('__DEFAULT_DEVIATION_PRESET__', callback.current!)

      setTimeout(() => {
         if (callback.current) {
            messageHandler.unsubscribe('__DEFAULT_DEVIATION_PRESET__', callback.current)
            callback.current = undefined;
         }
      }, 5000);
      return () => {
         if (callback.current) {
            messageHandler.unsubscribe('__DEFAULT_DEVIATION_PRESET__', callback.current)
            callback.current = undefined;
         }
      }
   }, [updatePreset])

   useEffect(() => {
      if (defaultPreset) {
         updatePreset(defaultPreset, false)
      }
   }, [defaultPreset, updatePreset])

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
                  {[...savedDeviationCurves
                     .filter(curve => curve[2].length).map(elem => elem[0]), ...hardPresets, ...(preset === 'custom' ? ['custom'] : [])]
                     .map(name => <SelectOption<string> key={name} id={name}>
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
                                             setPopup(<EditPresetPopup current={name} validate={(newName) => {
                                                setSavedDeviationCurves(saved => {
                                                   const oldIndex = saved.findIndex(value => value[0] === name)
                                                   const newCurves = (oldIndex === -1 ? saved : saved.toSpliced(oldIndex, 1, [name, (new Date()).getTime(), []]))
                                                   const index = newCurves.findIndex(value => value[0] === newName)

                                                   const values = name === preset ? deviationCurve : savedDeviationCurves[oldIndex][2];

                                                   if (index === -1) {
                                                      return newCurves.toSpliced(saved.length, 0, [
                                                         newName, (new Date()).getTime(), values
                                                      ])
                                                   }

                                                   return newCurves.toSpliced(index, 1, [
                                                      newName, (new Date()).getTime(), values
                                                   ])
                                                })

                                                if (name === preset) {
                                                   setPreset(newName)

                                                   messageHandler.send({
                                                      __DEFAULT_DEVIATION_PRESET__: true,

                                                      name: newName,
                                                      date: (new Date()).getTime()
                                                   })
                                                }
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
                                                   setSavedDeviationCurves(saved => {
                                                      const index = saved.findIndex(value => value[0] === name)

                                                      if (index !== -1) {
                                                         // Mark curve to be removed
                                                         return saved.toSpliced(saved.length, 1, [saved[index][0], (new Date()).getTime(), []])
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
      </div>
   }
}