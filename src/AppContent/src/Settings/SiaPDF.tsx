import { useCallback } from "react";
import { getSIAAuth } from "./SIA";

const SIACache = new Map<string, Promise<Uint8Array>>();

export const useSIAPDF = (SIAAddr: string, SIAAuth: string) => {
   return useCallback(async (icao: string) => {
      {
         const cached = SIACache.get(icao);
         if (!cached) {
            const addr = SIAAddr.replace('{icao}', icao);

            SIACache.set(icao, fetch(addr, {
               method: 'GET',
               headers: {
                  'Auth': getSIAAuth(SIAAuth, addr)
               }
            }).then(async (response) => {
               if (response.ok) {
                  return new Uint8Array(await response.arrayBuffer())
               } else {
                  throw new Error('SIA fetch ' + icao + ' error: ' + response.statusText);
               }
            }));
         }
      }

      return SIACache.get(icao)!;
   }, [SIAAddr, SIAAuth]);
}