import { useEffect, useState } from "react"

export const useServer = () => {
   const [connected, setConnected] = useState(!__MSFS_EMBEDED__);

   useEffect(() => {
      if (__MSFS_EMBEDED__) {
         const running = {
            current: true
         };

         (async () => {
            let current = connected;

            while (true) {
               current = await window.severStateChanged(current);
               if (running.current) {
                  setConnected(current);
               } else {
                  break;
               }
            }
         })();

         return () => { running.current = false };
      }
   }, [connected]);

   return connected;
}