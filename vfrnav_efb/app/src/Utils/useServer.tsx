import { messageHandler } from "@Settings/SettingsProvider";
import { EfbState, ServerState } from "@shared/Server";
import { useEffect, useState } from "react"

export const useServer = () => {
   const [connected, setConnected] = useState(!__MSFS_EMBEDED__ && !window.__WEB_SERVER__);

   useEffect(() => {
      if (__MSFS_EMBEDED__ || window.__WEB_SERVER__) {
         const onStateChanged = (message: ServerState) => {
            setConnected(message.state);
         };
         messageHandler.subscribe("__SERVER_STATE__", onStateChanged);
         messageHandler.send({ "__GET_SERVER_STATE__": true });

         return () => messageHandler.unsubscribe("__SERVER_STATE__", onStateChanged);
      }
   }, [connected]);

   return connected;
}

export const useEFBServer = () => {
   const [connected, setConnected] = useState(__MSFS_EMBEDED__);

   useEffect(() => {
      if (!__MSFS_EMBEDED__) {
         const onStateChanged = (message: EfbState) => {
            setConnected(message.state);
         };
         messageHandler.subscribe("__EFB_STATE__", onStateChanged);
         messageHandler.send({ "__GET_EFB_STATE__": true });

         return () => messageHandler.unsubscribe("__EFB_STATE__", onStateChanged);
      }
   }, [connected]);

   return connected;
}