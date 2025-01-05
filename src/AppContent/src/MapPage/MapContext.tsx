import { Collection, Map } from "ol";
import { createContext, Dispatch, PropsWithChildren, SetStateAction, useEffect, useMemo, useState } from "react";
import { NavData } from "./MapMenu/Menus/Nav";
import BaseLayer from "ol/layer/Base";
import { defaults } from "ol/interaction/defaults";
import TileLayer from "ol/layer/Tile";


export const MapContext = createContext<{
   map: Map,
   navData: NavData[]
   counter: number
   flash: boolean,
   flashKey: number,
   setNavData: Dispatch<SetStateAction<NavData[]>>,
   setCounter: Dispatch<SetStateAction<number>>,
   setFlash: Dispatch<SetStateAction<boolean>>,
   addNav?: () => void,
   cancel?: () => void,
   setAddNav: Dispatch<SetStateAction<(() => void) | undefined>>,
   setCancel: Dispatch<SetStateAction<(() => void) | undefined>>,
   triggerFlash: (_value?: boolean) => void,
   removeNav: (_name: string) => void,
   activeNav: (_name: string, _active: boolean) => void,
   editNav: (_name: string, _newName: string) => void,
   reorderNav: (_orders: number[]) => void
} | undefined>(undefined);

const MapContextProvider = ({ children }: PropsWithChildren) => {
   const map = useMemo<Map>(() => {
      const layers = new Collection<BaseLayer>();

      const map = new Map({
         layers: layers,
         interactions: defaults({ doubleClickZoom: false })
      });

      map.getView().on('change:resolution', () => {
         const layers = map.getLayers();
         layers.forEach((layer) => {
            if (layer instanceof TileLayer) {
               const tmpSource = layer.getSource()
               const zoom = map.getView().getZoom();
             // 'duck typing' for source object, vector layers don't have a zoom level.
             if(typeof tmpSource.getTileGrid === 'function' && zoom) {
                 if(zoom > tmpSource.getTileGrid().maxZoom ||
                 zoom < tmpSource.getTileGrid().minZoom) {
                     layer.setVisible(false);
                 } else {
                     layer.setVisible(true);
                 }
               }
            }
         });
     });

      return map;
   }, []);
   const [addNav, setAddNav] = useState<() => void>();
   const [cancel, setCancel] = useState<() => void>();
   const [navData, setNavData] = useState<NavData[]>([]);
   const [counter, setCounter] = useState(0);
   const [flash, setFlash] = useState(false);
   const [flashKey, setFlashKey] = useState(0);

   const [cancelRequest, setCancelRequest] = useState(false);
   const [addNavRequest, setAddNavRequest] = useState(false);

   useEffect(() => {
      if (cancelRequest) {
         setCancelRequest(false);
         cancel?.();
      }
   }, [cancelRequest, cancel]);

   useEffect(() => {
      if (addNavRequest) {
         setAddNavRequest(false);
         addNav?.();
      }
   }, [addNavRequest, addNav]);

   const provider = useMemo(() => ({
      map: map,
      addNav: (): void => setAddNavRequest(true),
      setAddNav: setAddNav,
      cancel: (): void => setCancelRequest(true),
      setCancel: setCancel,
      navData: navData,
      setNavData: setNavData,
      counter: counter,
      setCounter: setCounter,
      flash: flash,
      setFlash: setFlash,
      flashKey: flashKey,
      triggerFlash: (value?: boolean) => {
         if (value ?? true) {
            setFlashKey(key => key + 1);
         }
         setFlash(value ?? true);
      },
      removeNav: (name: string) => {
         setNavData(items => {
            const newItems = [...items];
            const deleteIndex = newItems.findIndex((item) => item.name === name);
            const deleteOrder = newItems[deleteIndex].order;
            newItems.splice(deleteIndex, 1);
            return newItems.map(elem => {
               if (elem.order > deleteOrder) {
                  return { ...elem, order: (elem.order - 1) };
               }
               return elem;
            });
         });
      },
      activeNav: (name: string, active: boolean) => {
         setNavData(items => {
            const newItems = [...items];
            newItems.find((item) => item.name === name)!.active = active;
            return newItems;
         });
      },
      editNav: (name: string, newName: string) => {
         setNavData(items => {
            const newItems = [...items];
            const item = newItems.find((item) => item.name === name);
            if (item) {
               item.name = newName;
            }
            return newItems;
         })
      },
      reorderNav: (orders: number[]) => {
         setNavData(data => {
            return orders.map((order, index) => ({ ...data[index], order: order }))
         });
      }
   }), [map, navData, setNavData, counter, setCounter, flash, setFlash, flashKey, setFlashKey, setAddNavRequest, setCancelRequest]);

   return (
      <MapContext.Provider
         value={provider}
      >
         {children}
      </MapContext.Provider>
   );
};

export default MapContextProvider;