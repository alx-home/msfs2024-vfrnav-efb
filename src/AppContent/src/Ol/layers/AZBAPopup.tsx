import { useCallback, useContext, useEffect, useMemo } from 'react';
import { Azba, SettingsContext } from "@Settings";

import useKeyUp from "@Events/KeyUp";
import { Button } from '@Utils/Button';
import { Scroll } from '@Utils/Scroll';


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
      <div className='flex flex-col'>
         <div className='text-2xl font-semibold mb-3'>
            Activity
         </div>
         <div className='flex flex-col grow ml-8'>
            {[...slots.keys().map(date => <div key={date}>
               <div className="flex flex-col justify-start grow text-lg font-semibold">
                  {date}
               </div>
               <div className='flex flex-row grow ml-4'>
                  <div className="flex flex-col mr-3 shrink">
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
                  </div>
               </div>
            </div>)]
            }
         </div>
      </div> :
      <></>, [slots]);

   const parseAlt = useCallback((value: number) => Math.floor(value / 100) * 100 === value ? (value >= 10000 ? 'FL' + value / 1000 : value) : 'FL' + value, []);

   return <div className='relative flex flex-col p-2 w-full max-h-full overflow-hidden'>
      <div className='text-4xl font-semibold mt-4 mb-10'>
         {data.name}
      </div>
      <Scroll className='flex flex-row justify-center'>
         <div className="flex flex-col [&>:not(:first-child)]:mt-8">
            {Activation}
            <div className='flex flex-col'>
               <div className='text-2xl font-semibold mb-3'>
                  Altitude
               </div>
               <div className='flex flex-col ml-8 shadow-sm'>
                  <div className='flex flex-col'>
                     <div>
                        Upper: {parseAlt(data.upper)}
                     </div>
                     <div>
                        Lower: {parseAlt(data.lower)}
                     </div>
                  </div>
               </div>
            </div>
            <div className='flex flex-col'>
               <div className='text-2xl font-semibold mb-3'>
                  Info
               </div>
               <div className='flex flex-col ml-8 shadow-sm'>
                  <div className='flex flex-row justify-start' dangerouslySetInnerHTML={{ __html: data.remark.replaceAll('#', '<br />') }}>
                  </div>
               </div>
            </div>
         </div>
      </Scroll>
      <div className='flex flex-row grow w-full [&>:not(:first-child)]:ml-2 pt-10 justify-end' >
         <Button active={true} className='px-2'
            onClick={() => {
               setPopup(emptyPopup);
            }}>Close</Button>
      </div>
   </div >;
};