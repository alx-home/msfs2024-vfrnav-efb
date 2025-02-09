import { useCallback } from "react";
import { getSIAAuth } from "./SIA";

export type Azba = {
   id: string,
   remark: string,
   name: string,
   upper: number,
   lower: number,
   coordinates:
   {
      latitude: number,
      longitude: number,
   }[],
   timeslots:
   {
      startTime: Date,
      endTime: Date
   }[]
};

let SIAAZBACache: Promise<Azba[]> | undefined = undefined;

const dmsToDD = (value: string) => {
   const float = value.slice(value.length - 4, value.length - 3) === '.';
   const pos = float ? 3 : 0;

   const direction = value.slice(value.length - 1)
   const degrees = +value.slice(0, value.length - (5 + pos))
   const minutes = +value.slice(value.length - (5 + pos), value.length - (3 + pos))
   const seconds = +value.slice(value.length - (3 + pos), value.length - 1)

   return ((direction === 'S' || direction === 'W') ? -1 : 1) * (degrees + minutes / 60 + seconds / 3600)
}

export const useSIAZBA = (SIAAZBAAddr: string, SIAAZBADateAddr: string, SIAAuth: string) => {

   return useCallback(async (): Promise<Azba[]> => {
      if (SIAAZBACache) {
         return SIAAZBACache;
      }

      return fetch(SIAAZBADateAddr, {
         method: 'GET',
         headers: {
            'Auth': getSIAAuth(SIAAuth, SIAAZBADateAddr)
         }
      }).then(async (response): Promise<Azba[]> => {
         if (response.ok) {
            return response.json().then(json => {
               const addr = SIAAZBAAddr
                  .replace('{date}', json.rtba)
                  .replace('{start_date}', (json.endDate as string).replaceAll(':', '%3A').replace('+', '%2B'))
                  .replace('{end_date}', (json.startDate as string).replaceAll(':', '%3A').replace('+', '%2B'));


               SIAAZBACache = fetch(addr, {
                  method: 'GET',
                  headers: {
                     'Auth': getSIAAuth(SIAAuth, addr)
                  }
               }).then(async (response) => {
                  if (response.ok) {
                     return response.json().then(json => {
                        const result: Azba[] = [];

                        json["hydra:member"].forEach((elem: {
                           codeId: string,
                           txtRmk: string,
                           name: string,
                           initialCodeType: string,
                           valDistVerUpper: number,
                           valDistVerLower: number,
                           coordinates: {
                              longitude: string,
                              latitude: string
                           }[],
                           timeSlots: {
                              startTime: string,
                              endTime: string,
                           }[]
                        }) => {
                           result.push({
                              id: elem.codeId,
                              remark: elem.txtRmk,
                              name: elem.initialCodeType + ' ' + elem.name,
                              upper: elem.valDistVerUpper,
                              lower: elem.valDistVerLower,
                              coordinates: elem.coordinates.map(coord => {
                                 return {
                                    longitude: dmsToDD(coord.longitude),
                                    latitude: dmsToDD(coord.latitude)
                                 }
                              }),
                              timeslots: elem.timeSlots.map(slot => ({
                                 startTime: __MSFS_EMBEDED__ ? new Date(new Date(slot.startTime.substring(0, slot.startTime.length - 6)).getTime() - 3600000) : new Date(slot.startTime.substring(0, slot.startTime.length - 6)),
                                 endTime: __MSFS_EMBEDED__ ? new Date(new Date(slot.endTime.substring(0, slot.endTime.length - 6)).getTime() - 3600000) : new Date(slot.endTime.substring(0, slot.endTime.length - 6)),
                              }))
                           });
                        });

                        return result;
                     });
                  } else {
                     throw new Error('SIA AZBA fetch error: ' + response.statusText);
                  }
               });

               return SIAAZBACache;
            });
         } else {
            throw new Error('SIA AZBA date fetch error: ' + response.statusText);
         }
      });

   }, [SIAAZBAAddr, SIAAZBADateAddr, SIAAuth]);
}