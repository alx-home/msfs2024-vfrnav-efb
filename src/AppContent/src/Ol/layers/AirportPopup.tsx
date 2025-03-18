import { PropsWithChildren, useContext, useEffect, useMemo, useState, ReactElement } from 'react';

import { Button } from '@Utils/Button';
import { Scroll } from '@Utils/Scroll';
import { messageHandler, SettingsContext } from "@Settings/SettingsProvider";
import useKeyUp from "@Events/KeyUp";
import { AirportFacility, Frequency, FrequencyTypeStr, Metar as MetarT, Runway, RunwaySurfaceTypeStr } from '@shared/Facilities';

import toweredImg from '@images/towered.svg';
import notToweredImg from '@images/nottowered.svg';
import { Tabs } from '@Utils/Tabs';


const FrequencyField = ({ name, frequencies }: {
   name: string,
   frequencies: Frequency[]
}) => {
   const values = useMemo(() => frequencies.reduce((last, value) => last === "" ? value.value.toFixed(3) : last + ", " + value.value.toFixed(3), ""), [frequencies]);

   return <div className='ml-5'>
      {`${name}: ${values}`}
   </div>
}

const FrequencyType = ({ type, groups }: {
   type: string,
   groups: Map<string, Frequency[]>
}) => {
   const child = useMemo(() => Array.from(groups, ([name, frequencies]) =>
      <FrequencyField key={name} name={name} frequencies={frequencies} />
   ), [groups]);

   return <div className='mb-3'>
      <div className='text-xl font-semibold mb-3'>{type}</div>
      <div>
         {child}
      </div>
   </div>
}

const Frequencies = ({ data }: {
   data: AirportFacility
}) => {
   const frequencies = useMemo(() => FrequencyTypeStr.toSorted((left) => left === "Other" ? 1 : -1).map(type => {
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

   return <div key={JSON.stringify(runway)} className='mb-3 [&>:not(:first-child)]:ml-5'>
      <div className='text-xl font-semibold mb-3'>{runway.designation}</div>
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
   </div>
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
      return <div key={type} className='[&>:not(:first-child)]:ml-5'>
         <div className='text-xl font-semibold mb-3'>{type}</div>
         {runways.map(runway => <RunwayField key={JSON.stringify(runway)} runway={runway} />)}
      </div>
   }), [groups]);

   return child
}

const Fuels = ({ data }: {
   data: AirportFacility
}) => {
   const body = useMemo(() => <div>
      {data.fuel1 ?
         <div>
            {data.fuel1}
         </div> :
         <></>
      }
      {data.fuel2 ?
         <div>
            {data.fuel2}
         </div> :
         <></>
      }
   </div>, [data.fuel1, data.fuel2]);

   return body
}

const Transitions = ({ data }: {
   data: AirportFacility
}) => {
   return <div>
      {
         data.transitionAlt !== 0 ?
            <div>
               <div className='text-xl font-semibold mb-3'>Altitude</div>
               <div className='mb-3 ml-5'>
                  {data.transitionAlt.toFixed(0)}
               </div>
            </div>
            : <></>
      }
      {
         data.transitionLevel !== 0 ?
            <div>
               <div className='text-xl font-semibold mb-3'>Level</div>
               <div className='mb-3 ml-5'>
                  {data.transitionLevel.toFixed(0)}
               </div>
            </div>
            : <></>
      }
   </div>
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

      messageHandler.subscribe("Metar", callback)

      if (__MSFS_EMBEDED__) {
         messageHandler.send({
            __getmetar__: true,
            icao: data.icao,
            lat: data.lat,
            lon: data.lon
         })
      } else {
         messageHandler.send({
            metar: `metar value of ${data.icao}`,
            taf: `taf value of ${data.icao}`,
            localMetar: `metar value of ${data.lat}/${data.lon}`,
            localTaf: `taf value of ${data.lat}/${data.lon}`,
            cavok: true,
            icao: data.icao
         })
      }

      return () => messageHandler.unsubscribe("Metar", callback)
   }, [data.icao, data.lat, data.lon])

   return <>{
      (metar ? <div className='[&>:not(:first-child)]:mt-8'>
         {(metar.metar || metar.taf) ?
            <div className='[&>:not(:first-child)]:pl-5'>
               <div className='text-xl font-semibold mb-3'>Airport</div>
               {metar.metar ?
                  <div>
                     <div className='text-xl font-semibold mb-3'>Metar</div>
                     <div className='mb-3 ml-5'>
                        {metar.metar}
                     </div>
                  </div>
                  : <></>
               }
               {metar.taf ?
                  <div>
                     <div className='text-xl font-semibold mb-3'>Taf</div>
                     <div className='mb-3 ml-5'>
                        {metar.taf}
                     </div>
                  </div>
                  : <></>}
            </div>
            : <></>
         }
         {(!metar.metar || !metar.taf) ?
            <div className='[&>:not(:first-child)]:pl-5'>
               <div className='text-xl font-semibold mb-3'>Nearest Airport</div>
               {!metar.metar ?
                  <div>
                     <div className='text-xl font-semibold mb-3'>Metar</div>
                     <div className='mb-3 ml-5'>
                        {metar.localMetar ?? "Not found"}
                     </div>
                  </div>
                  : <></>
               }
               {!metar.taf ?
                  <div>
                     <div className='text-xl font-semibold mb-3'>Taf</div>
                     <div className='mb-3 ml-5'>
                        {metar.localTaf ?? "Not found"}
                     </div>
                  </div>
                  : <></>}
            </div>
            : <></>
         }
      </div >
         : <h2 className='text-2xl'>Loading...</h2>)
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
         'block justify-left [&>:not(:first-child)]:mt-8'
      }>
         <div className='flex flex-col ml-8 shadow-sm'>
            <div className='flex flex-col'>
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
      <div className='text-4xl font-semibold mt-4 mb-10 flex flex-row'>
         <div><img src={data.towered ? toweredImg : notToweredImg} alt={data.towered ? 'towered' : 'not towered'} width={20} className='invert' /></div>
         <div className='ml-2'>{data.icao}{airportClass}</div>
      </div>
      <div className='flex flex-col overflow-hidden'>
         <Tabs tabs={Array.from(tabs)} names={TabStr} activeTab={tab} switchTab={setTab} />
         <div className='grid shrink p-4 overflow-hidden h-[60vh]'>
            {tabElems}
         </div>
      </div>
      <div className='flex flex-row w-full h-[56px] min-h-[56px] [&>:not(:first-child)]:ml-2 pt-10 justify-end' >
         <Button active={true} className='px-2'
            onClick={() => {
               setPopup(emptyPopup);
            }}>Close</Button>
      </div>
   </div >;
};