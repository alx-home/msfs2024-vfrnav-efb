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

import { useContext, useMemo, useCallback, useState } from 'react';
import { Select, SelectOption } from "@alx-home/Utils";
import { SettingsContext } from "@Settings/SettingsProvider";
import { EditPresetPopup } from "./PresetPopup";

import EditImg from "@alx-home/images/edit.svg?react";
import DeleteImg from "@alx-home/images/delete.svg?react";
import { MapContext } from '@pages/Map/MapContext';

export const useSettings = () => {
   const { setPopup } = useContext(SettingsContext)!;
   const { savedDeviationCurves, setSavedDeviationCurves, deviationCurve, setDeviationCurve } = useContext(MapContext)!;

   const hardPresets = useMemo(() => (['none']), [])
   const [presets, setPresets] = useState<string[]>([...hardPresets, ...savedDeviationCurves.map(e => e[0])])
   const [preset, setPreset] = useState(savedDeviationCurves.length ? savedDeviationCurves[0][0] : 'none')

   const updatePreset = useCallback((value: string) => {
      if (value === 'none') {
         setPresets(presets => presets.filter(elem => elem !== 'custom'))
         setPreset(value)
         setDeviationCurve([[0, 0], [360, 0]])
      } else if (value !== 'custom') {
         setPresets(presets => presets.filter(elem => elem !== 'custom'))
         setPreset(value)
         setDeviationCurve(savedDeviationCurves.find(e => e[0] === value)![1])
      }
   }, [savedDeviationCurves, setDeviationCurve])

   return {
      setPreset: setPreset,
      setPresets: setPresets,
      Settings: <div className="flex flex-row shrink text-sm justify-center m-auto mb-4 pt-2" >
         <div className="flex flex-col pr-2 text-sm justify-center w-[17.4rem]">
            <div className="flex flex-row">
               <Select active={true} value={preset} className="[&_.option:hover_.edit]:w-full [&_.option]:p-0"
                  onChange={updatePreset}>
                  {presets.map(elem => <SelectOption<string> key={elem} id={elem}>
                     <div className='relative flex flex-row px-2 grow'>
                        <div className="flex flex-row grow justify-center min-w-0 py-1 px-1">
                           {elem === 'custom' ? '*unsaved' : elem}
                        </div>
                        {
                           (hardPresets.find(value => elem === value) === undefined)
                              ? <div className="absolute flex flex-row w-full h-full justify-end pr-2">
                                 <div className='edit transition-all justify-end flex flex-row w-0 max-h-full'>
                                    <EditImg className="bg-msfs mr-1 hover:brightness-125 focus:border-2 focus:border-with w-6 h-6 mt-auto mb-auto justify-center cursor-pointer"
                                       onClick={e => {
                                          e.stopPropagation()
                                          setPopup(<EditPresetPopup current={elem} validate={(name) => {
                                             setSavedDeviationCurves(saved => {
                                                const oldIndex = saved.findIndex(value => value[0] === elem)
                                                const newCurves = (oldIndex === -1 ? saved : saved.toSpliced(oldIndex, 1))
                                                const index = newCurves.findIndex(value => value[0] === name)

                                                const values = elem === preset ? deviationCurve : savedDeviationCurves[oldIndex][1];

                                                if (index === -1) {
                                                   return newCurves.toSpliced(saved.length, 0, [
                                                      name, values
                                                   ])
                                                }

                                                return newCurves.toSpliced(index, 1, [
                                                   name, values
                                                ])
                                             })
                                             setPresets(presets => presets.find(e => e === name) ? presets.toSpliced(presets.findIndex(e => e === elem), 1) : presets.toSpliced(presets.findIndex(e => e === elem), 1, name))
                                             if (elem === 'custom') {
                                                setPreset(name)
                                             }
                                          }} />)
                                       }} />
                                    {
                                       (elem !== 'custom')
                                          ? <DeleteImg className="bg-red-600 hover:brightness-125 focus:border-2 focus:border-with w-6 h-6 mt-auto mb-auto justify-center cursor-pointer"
                                             onClick={e => {
                                                if (preset === elem) {
                                                   setPresets(presets => presets.find(elem => elem === 'custom') ? presets : presets.toSpliced(presets.length, 0, 'custom'))
                                                   setPreset('custom')
                                                }
                                                setPresets(presets => presets.toSpliced(presets.findIndex(e => e === elem), 1))
                                                setSavedDeviationCurves(saved => {
                                                   const index = saved.findIndex(value => value[0] === elem)

                                                   if (index !== -1) {
                                                      return saved.toSpliced(saved.length, 1)
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