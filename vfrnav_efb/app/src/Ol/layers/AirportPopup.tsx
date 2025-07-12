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

import { PropsWithChildren, useContext, useEffect, useMemo, useState, ReactElement } from 'react';
import { messageHandler, SettingsContext } from "@Settings/SettingsProvider.jsx";

import { Tabs, Button, Scroll } from '@alx-home/Utils';
import { useKeyUp } from "@alx-home/Events";

import { AirportFacility, Frequency, FrequencyTypeStr, Metar as MetarT, Runway, RunwaySurfaceTypeStr } from '@shared/Facilities';

import toweredImg from '@efb-images/towered.svg';
import notToweredImg from '@efb-images/nottowered.svg';


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

const FrequencyField = ({ name, frequencies }: {
   name: string,
   frequencies: Frequency[]
}) => {
   const values = useMemo(() => frequencies.reduce((last, value) => last === "" ? value.value.toFixed(3) : last + ", " + value.value.toFixed(3), ""), [frequencies]);

   return <SubCategory title={name.length !== 4 ? name.toLowerCase() : name}>
      <div>{values}</div>
   </SubCategory>
}

const FrequencyType = ({ type, groups }: {
   type: string,
   groups: Map<string, Frequency[]>
}) => {
   const child = useMemo(() => Array.from(groups, ([name, frequencies]) =>
      <FrequencyField key={name} name={name} frequencies={frequencies} />
   ), [groups]);

   return <Category title={type}>
      {child}
   </Category>
}

const Frequencies = ({ data }: {
   data: AirportFacility
}) => {
   const frequencies = useMemo(() => FrequencyTypeStr.filter((elem) => elem !== "Other").concat(...["Other"]).map(type => {
      const frequencies = data.frequencies.filter(frequency => FrequencyTypeStr[frequency.type] === type);
      const groups = new Map<string, Frequency[]>;

      if (frequencies.length === 0) {
         return undefined
      }

      frequencies.forEach(value => {
         if (!groups.get(value.name)?.push(value)) {
            groups.set(value.name, [value])
         }
      })

      return { type: type, groups: groups };
   }).filter(value => value !== undefined), [data.frequencies])

   const child = useMemo(() => frequencies.map(({ type, groups }) => {
      return <FrequencyType key={type} type={type} groups={groups} />
   }), [frequencies]);

   return child
}

const toDms = (dd: number) => {
   const degrees = Math.floor(dd);
   const minutes = (dd - degrees) * 60;
   const seconds = (minutes - Math.floor(minutes)) * 60;

   return [
      degrees,
      Math.floor(minutes),
      seconds,
      `${degrees.toString()}° ${Math.floor(minutes)}' ${seconds.toFixed(3)}"`
   ]
}

const RunwayField = ({ runway }: {
   runway: Runway
}) => {
   const latitude = useMemo(() => toDms(runway.latitude), [runway.latitude]);
   const longitude = useMemo(() => toDms(runway.longitude), [runway.longitude]);

   return <SubCategory title={runway.designation} key={JSON.stringify(runway)}>
      <div>
         {`Size: ${runway.width.toFixed(0)} x ${runway.length.toFixed(0)}`}
      </div>
      <div>
         {`Elevation: ${runway.elevation.toFixed(0)}`}
      </div>
      <div>
         {`Direction: ${runway.direction.toFixed(0)}`}
      </div>
      <div>
         {`Latitude: ${latitude[3]}`}
      </div>
      <div>
         {`Longitude: ${longitude[3].toString()}`}
      </div>
   </SubCategory>
}

const Runways = ({ data }: {
   data: AirportFacility
}) => {
   const groups = useMemo(() => {
      const result = new Map<string, Runway[]>();

      data.runways.forEach(value => {
         if (!result.get(RunwaySurfaceTypeStr[value.surface])?.push(value)) {
            result.set(RunwaySurfaceTypeStr[value.surface], [value])
         }
      });

      return result
   }, [data.runways])
   const child = useMemo(() => Array.from(groups).map(([type, runways]) => {
      return <Category key={type} title={type}>
         {runways.map(runway => <RunwayField key={JSON.stringify(runway)} runway={runway} />)}
      </Category>
   }), [groups]);

   return <div className='flex flex-col [&>:not(:first-child)]:my-8'>{child}</div>
}

const Fuels = ({ data }: {
   data: AirportFacility
}) => {
   const body = useMemo(() => <Category title="">
      {data.fuel1 ?
         <Category title='Fuel1'>
            <div className='!ml-5 text-base'>
               {data.fuel1}
            </div>
         </Category> :
         <></>
      }
      {data.fuel2 ?
         <Category title='Fuel2'>
            <div className='!ml-5 text-base'>
               {data.fuel2}
            </div>
         </Category>
         :
         <></>
      }
   </Category>, [data.fuel1, data.fuel2]);

   return body
}

const Transitions = ({ data }: {
   data: AirportFacility
}) => {
   return <>
      {
         data.transitionAlt !== 0 ?
            <Category title="Altitude">
               <div className='!ml-5 text-base'>
                  {data.transitionAlt.toFixed(0)}
               </div>
            </Category>
            : <></>
      }
      {
         data.transitionLevel !== 0 ?
            <Category title="Level">
               <div className='!ml-5 text-base'>
                  {data.transitionLevel.toFixed(0)}
               </div>
            </Category>
            : <></>
      }
   </>
};

const Metar = ({ data }: {
   data: AirportFacility
}) => {
   const [metar, setMetar] = useState<MetarT | undefined>(undefined);

   useEffect(() => {
      const callback = (message: MetarT) => {
         if (message.icao === data.icao)
            setMetar(message)
      };

      messageHandler.subscribe("__METAR__", callback)

      messageHandler.send({
         __GET_METAR__: true,

         icao: data.icao,
         lat: data.lat,
         lon: data.lon
      })

      return () => messageHandler.unsubscribe("__METAR__", callback)
   }, [data.icao, data.lat, data.lon])

   return <>{
      (metar ? <>
         {(metar.metar || metar.taf) ?
            <Category title="Airport">
               {metar.metar ?
                  <SubCategory title="Metar">
                     {metar.metar}
                  </SubCategory>
                  : <></>
               }
               {metar.taf ?
                  <SubCategory title="Taf">
                     {metar.taf}
                  </SubCategory>
                  : <></>}
            </Category>
            : <></>
         }
         {((!metar.metar && metar.localMetar) || (!metar.taf && metar.localTaf)) ?
            <Category title='Nearest Airport'>
               {(!metar.metar && metar.localMetar) ?
                  <SubCategory title="Metar">
                     {metar.localMetar}
                  </SubCategory>
                  : <></>
               }
               {(!metar.taf && metar.localTaf) ?
                  <SubCategory title="Taf">
                     {metar.localTaf}
                  </SubCategory>
                  : <></>}
            </Category>
            : <></>
         }
      </ >
         : <h2 className='text-lg'>Loading...</h2>)
   }</>
};


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tabs = ['Frequencies', 'Transitions', 'Runways', 'Fuels', 'Metar'] as const;
type Tab = typeof tabs[number];
const TabStr: Record<Tab, string> = {
   'Frequencies': 'Frequencies',
   'Transitions': 'Transitions',
   'Runways': 'Runways',
   'Fuels': 'Fuels',
   'Metar': 'Metar / Taf',
}

const TabElem = ({ tab, currentTab, children }: PropsWithChildren<{
   currentTab: Tab,
   tab: Tab
}>) => {
   return <div className={'flex flex-row [grid-row:1] [grid-column:1] overflow-hidden'
      + ((tab === currentTab) ? '' : ' opacity-0 select-none pointer-events-none')
   }>
      <Scroll className={
         'block ml-5 [&>:not(:first-child)]:mt-8'
      }>
         <div className='flex flex-col mx-5 shadow-sm w-full'>
            <div className='flex flex-col [&>:not(:first-child)]:my-7 pb-8'>
               {children}
            </div>
         </div>
      </Scroll>
   </div>
}

export const AirportPopup = ({ data }: {
   data: AirportFacility
}) => {
   const { setPopup, emptyPopup } = useContext(SettingsContext)!;
   const key = useKeyUp();

   console.assert(data.airspaceType > 1 && data.airspaceType < 9 || data.airspaceType === 0)
   const airportClass = useMemo(() => data.airspaceType === 0 ? '' : ` (${String.fromCharCode('A'.charCodeAt(0) + (data.airspaceType - 2))})`, [data]);

   useEffect(() => {
      if (key == 'Escape') {
         setPopup(emptyPopup);
      }
   }, [emptyPopup, key, setPopup])

   const [tab, setTab] = useState<Tab>('Metar');

   const [tabs, tabElems] = useMemo(() => {
      const elems: ReactElement[] = [];
      const tabs: Tab[] = [];

      const addTab = (Elem: React.JSXElementConstructor<{ data: AirportFacility }>, name: Tab) => {
         elems.push(<TabElem key={name} tab={name} currentTab={tab}>
            <Elem data={data} />
         </TabElem>)
         tabs.push(name)
      }

      addTab(Metar, 'Metar')

      if (data.frequencies.length) {
         addTab(Frequencies, 'Frequencies')
      }

      if (data.runways.length) {
         addTab(Runways, 'Runways')
      }

      if ((data.transitionAlt !== 0 || data.transitionLevel !== 0)) {
         addTab(Transitions, 'Transitions')
      }

      if (data.fuel1 !== '' || data.fuel2 !== '') {
         addTab(Fuels, 'Fuels')
      }

      return [tabs, elems]
   }, [data, tab]);

   useEffect(() => {
      if (!tabs.find(value => value === tab)) {
         setTab(tabs.at(0)!)
      }
   }, [tab, tabs]);

   return <div className='flex flex-col p-2 w-full max-h-full'>
      <div className='text-2xl mt-4 mb-10 flex flex-row'>
         <div><img src={data.towered ? toweredImg : notToweredImg} alt={data.towered ? 'towered' : 'not towered'} width={20} className='invert' /></div>
         <div className='ml-2'>{data.icao}{airportClass}</div>
      </div>
      <div className='flex flex-col overflow-hidden'>
         <Tabs tabs={Array.from(tabs)} names={TabStr} activeTab={tab} switchTab={setTab} />
         <div className='grid shrink overflow-hidden h-[60vh]'>
            {tabElems}
         </div>
      </div>
      <div className='flex flex-row w-full min-h-0 shrink-0 [&>:not(:first-child)]:ml-2 pt-10 justify-end' >
         <Button active={true} className='px-2'
            onClick={() => {
               setPopup(emptyPopup);
            }}>Close</Button>
      </div>
   </div >;
};