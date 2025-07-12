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

import { PropsWithChildren, useCallback, useContext, useEffect, useMemo } from 'react';

import { Azba } from '@Settings/SIAAZBA';
import { Button, Scroll } from '@alx-home/Utils';
import { useKeyUp } from "@alx-home/Events";

import { SettingsContext } from "@Settings/SettingsProvider";



const Category = ({ title, children }: PropsWithChildren<{
  title: string
}>) => {
  return <div className='[&>:not(:first-child)]:ml-5 shadow-xl border-slate-700 border-1 p-6 grow'>
    <div className='text-lg mb-3'>{title}</div>
    {children}
  </div>
};

const SubCategory = ({ children, title }: PropsWithChildren<{
  title: string
}>) => {
  return <div className='mb-3 [&>:not(:first-child)]:ml-8'>
    <div className='text-base mb-3 capitalize'>{title}</div>
    <div>
      {children}
    </div>
  </div>
}

export const AZBAPopup = ({ data }: {
  data: Azba
}) => {
  const { setPopup, emptyPopup } = useContext(SettingsContext)!;
  const key = useKeyUp();

  useEffect(() => {
    if (key == 'Escape') {
      setPopup(emptyPopup);
    }
  }, [emptyPopup, key, setPopup])

  const slots = useMemo(() => {
    const slots = data.timeslots.filter(slot => slot.endTime > new Date());
    const result = new Map<string, string[][]>();

    slots.forEach(slot => {
      const startTime = slot.startTime.toLocaleTimeString("en-US", { timeZoneName: 'short' });
      const startDate = slot.startTime.toLocaleDateString("en-US", { month: 'long', year: 'numeric', day: 'numeric' });
      const endDate = slot.endTime.toLocaleDateString("en-US", { month: 'long', year: 'numeric', day: 'numeric' });
      const endTime = slot.endTime.toLocaleTimeString("en-US", { timeZoneName: 'short' });

      if (!result.has(startDate)) {
        result.set(startDate, []);
      }

      if (endDate === startDate) {
        result.get(startDate)!.push([startTime, endTime]);
      } else {
        result.get(startDate)!.push([startTime, '-']);

        if (!result.has(endDate)) {
          result.set(endDate, []);
        }

        result.get(endDate)!.push(['-', endTime]);
      }
    })

    return result;
  }, [data.timeslots]);

  const Activation = useMemo(() => slots.size ?

    <Category title='Activity'>
      {[...slots.keys().map(date =>
        <SubCategory key={date} title={date} >
          <div className="grid [grid-template-columns:repeat(3,minmax(max-content,1fr))]">
            {slots.get(date)!.map(time =>
              <>
                <div className='px-3'>
                  {time[0]}
                </div>
                <div className='flex flex-row shrink-0 justify-center'>-</div>
                <div className='px-3'>
                  {time[1]}
                </div>
              </>
            )}
          </div>
        </SubCategory>
      )]}
    </Category>
    :
    <></>, [slots]);

  const parseAlt = useCallback((value: number) => Math.floor(value / 100) * 100 === value ? (value >= 10000 ? 'FL' + value / 1000 : value) : 'FL' + value, []);

  return <div className='relative flex flex-col p-2 w-full max-h-full overflow-hidden'>
    <div className='text-2xl mt-4 mb-10'>
      {data.name}
    </div>
    <div className='flex flex-col grow overflow-hidden'>
      <Scroll className='flex flex-row justify-center'>
        <div className='flex flex-col mx-5 shadow-sm w-full'>
          <div className='flex flex-col [&>:not(:first-child)]:my-7 pb-8'>
            {Activation}
            <Category title='Altitude'>
              <SubCategory title={"Upper: " + parseAlt(data.upper)}>
              </SubCategory>
              <SubCategory title={"Lower: " + parseAlt(data.lower)}>
              </SubCategory>
            </Category>
            <Category title='Info'>
              <div className='!ml-6'>
                <div className='flex flex-row justify-start' dangerouslySetInnerHTML={{ __html: data.remark.replaceAll('#', '<br />') }}>
                </div>
              </div>
            </Category>
          </div>
        </div>
      </Scroll>
    </div>
    <div className='flex flex-row grow shrink-0 w-full min-h-0 [&>:not(:first-child)]:ml-2 pt-10 justify-end' >
      <Button active={true} className='px-2'
        onClick={() => {
          setPopup(emptyPopup);
        }}>Close</Button>
    </div>
  </div >;
};