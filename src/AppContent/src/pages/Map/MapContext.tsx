import { Collection, Map, MapBrowserEvent, getUid } from 'ol';
import { createContext, Dispatch, PropsWithChildren, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { NavData } from "./MapMenu/Menus/Nav";
import BaseLayer from "ol/layer/Base";
import { defaults } from "ol/interaction/defaults";
import VectorLayer from "ol/layer/Vector";
import Layer from "ol/layer/Layer";
import LayerGroup from "ol/layer/Group";
import { Coordinate } from "ol/coordinate";
import Feature, { FeatureLike } from "ol/Feature";
import { SimpleGeometry } from "ol/geom";
import VectorSource from "ol/source/Vector";
import { Cluster } from "ol/source";
import { PlaneRecord, PlaneRecords } from '@shared/PlanPos';
import { messageHandler } from '@Settings/SettingsProvider';

export type Interactive = {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   onClick?: (_pixel: MapBrowserEvent<any>, _features: FeatureLike[]) => boolean
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   onHover?: (_pixel: MapBrowserEvent<any>, _features: FeatureLike[]) => boolean
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   onBlur?: (_pixel: MapBrowserEvent<any>, _features: FeatureLike[]) => boolean
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   onMoveEnd?: (_pixel: MapBrowserEvent<any>, _features: FeatureLike[]) => boolean
}

export const MapContext = createContext<{
   map: Map,
   navData: NavData[],
   records: PlaneRecord[],
   profileScale: number,
   setProfileScale: (_value: number) => void,
   withTouchdown: boolean,
   enableTouchdown: (_value: boolean) => void,
   withGround: boolean,
   enableGround: (_value: boolean) => void,
   counter: number
   flash: boolean,
   flashKey: number,
   setNavData: Dispatch<SetStateAction<NavData[]>>,
   setCounter: Dispatch<SetStateAction<number>>,
   setFlash: Dispatch<SetStateAction<boolean>>,
   registerMouseEnd: (_callback: (_coords: Coordinate) => void) => void
   unregisterMouseEnd: (_callback: (_coords: Coordinate) => void) => void
   addNav?: () => void,
   cancel?: () => void,
   setAddNav: Dispatch<SetStateAction<(() => void) | undefined>>,
   setCancel: Dispatch<SetStateAction<(() => void) | undefined>>,
   triggerFlash: (_value?: boolean) => void,
   removeNav: (_id: number) => void,
   activeNav: (_id: number, _active: boolean) => void,
   editNav: (_id: number, _newName: string) => void,
   removeRecord: (_id: number) => void,
   activeRecord: (_id: number, _active: boolean) => void,
   editRecord: (_id: number, _newName: string) => void,
   reorderNav: (_orders: number[]) => void
} | undefined>(undefined);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getFeaturesAtPixel = (map: Map, layer: Layer, coords: Coordinate, event: MapBrowserEvent<any>): FeatureLike[] => {
   if (!layer.isVisible?.()) {
      return [];
   }

   if (layer instanceof LayerGroup) {
      let result: FeatureLike[] = [];

      layer.getLayers().forEach(layer => result = [...result, ...getFeaturesAtPixel(map, layer as Layer, coords, event)]);

      return result;
   } else if (layer instanceof VectorLayer) {
      const source = layer.getSource();
      if (source instanceof VectorSource || source instanceof Cluster) {
         return source.getFeatures().filter(feature => {
            if (feature instanceof Feature) {
               const geom = feature.getGeometry();

               if (geom instanceof SimpleGeometry) {
                  return geom.containsXY(coords[0], coords[1]);
               }
            }
         })
      }
   }

   return [];
}

const MapContextProvider = ({ children }: PropsWithChildren) => {
   const mouseEndCallbacks = useRef<((_coords: Coordinate) => void)[]>([])
   const map = useMemo<Map>(() => {
      const layers = new Collection<BaseLayer>();
      const focused: {
         feature: Interactive | undefined,
         args: FeatureLike[]
      } = {
         feature: undefined,
         args: []
      };

      const map = new Map({
         layers: layers,
         interactions: defaults({ doubleClickZoom: false })
      });

      map.on('moveend', (event) => {
         const coord = event.map.getView().getCenter()!;
         mouseEndCallbacks.current.forEach(callback => callback(coord));
      });

      map.on('pointermove', (event) => {
         const coords = event.coordinate;

         map.getTargetElement().style.cursor = '';

         const setFocused = (iElem: Interactive | undefined, features: FeatureLike[]) => {
            focused.feature?.onBlur?.(event, focused.args);

            focused.feature = iElem;
            focused.args = features
         }

         const focuseElem = (iElem: Interactive, features: FeatureLike[]) => {
            if (iElem.onHover) {
               map.getTargetElement().style.cursor = 'pointer';

               if (focused.feature === iElem) {
                  return true;
               } else if (iElem.onHover?.(event, features)) {
                  setFocused(iElem, features);
                  return true;
               }
            }
            return false;
         };

         if (!map.getAllLayers()
            .toSorted((left, right) => (right.getZIndex() ?? 0) - (left.getZIndex() ?? 0))
            .find(layer => {
               const iLayer = (layer as unknown as Interactive);

               const features = getFeaturesAtPixel(map, layer, coords, event);
               if (features.length) {
                  if (iLayer.onHover || iLayer.onClick || iLayer.onBlur) {
                     return focuseElem(iLayer, features)
                  } else {
                     for (const feature of features.toSorted((left, right) => +getUid(right) - +getUid(left))) {
                        const iFeature = (feature as unknown as Interactive);
                        if (focuseElem(iFeature, features)) {
                           return true
                        }
                     }
                  }
               }

               return false;
            })) {
            setFocused(undefined, []);
         }
      })

      map.on('click', (event) => {
         const coords = event.coordinate;
         map.getAllLayers()
            .toSorted((left, right) => (right.getZIndex() ?? 0) - (left.getZIndex() ?? 0))
            .find(layer => {
               const iLayer = (layer as unknown as Interactive);

               const features = getFeaturesAtPixel(map, layer, coords, event);
               if (features.length) {
                  if (iLayer.onClick) {
                     return iLayer.onClick?.(event, features);
                  } else {
                     for (const feature of features.toSorted((left, right) => +getUid(right) - +getUid(left))) {
                        const iFeature = (feature as unknown as Interactive);
                        if (iFeature.onClick?.(event, features)) {
                           return true;
                        }
                     }
                  }
               }

               return false;
            })
      })

      return map;
   }, []);
   const [records, setRecords] = useState<PlaneRecord[]>([]);
   const [addNav, setAddNav] = useState<() => void>();
   const [cancel, setCancel] = useState<() => void>();
   const [navData, setNavData] = useState<NavData[]>([]);
   const [counter, setCounter] = useState(0);
   const [flash, setFlash] = useState(false);
   const [flashKey, setFlashKey] = useState(0);

   const [cancelRequest, setCancelRequest] = useState(false);
   const [addNavRequest, setAddNavRequest] = useState(false);

   const [profileScale, setProfileScale] = useState(1);
   const [touchdown, setTouchdown] = useState(false);
   const [ground, setGround] = useState(true);

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

   useEffect(() => {
      const onPlaneRecords = (records: PlaneRecords) => {
         setRecords(records.value);
      };

      messageHandler.subscribe("PlaneRecords", onPlaneRecords)
      messageHandler.send({ mType: "GetPlaneRecords" });
      return () => messageHandler.unsubscribe("PlaneRecords", onPlaneRecords);
   }, [])

   const provider = useMemo(() => ({
      map: map,
      addNav: (): void => setAddNavRequest(true),
      setAddNav: setAddNav,
      cancel: (): void => setCancelRequest(true),
      registerMouseEnd: (callback: (_coords: Coordinate) => void) => {
         mouseEndCallbacks.current.push(callback)
      },
      unregisterMouseEnd: (callback: (_coords: Coordinate) => void) => {
         mouseEndCallbacks.current.splice(mouseEndCallbacks.current.findIndex(value => value === callback), 1)
      },
      setCancel: setCancel,
      navData: navData,
      setNavData: setNavData,
      records: records,
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
      removeNav: (id: number) => {
         setNavData(items => {
            const newItems = [...items];
            const deleteIndex = newItems.findIndex((item) => item.id === id);
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
      activeNav: (id: number, active: boolean) => {
         setNavData(items => {
            const newItems = [...items];
            newItems.find((item) => item.id === id)!.active = active;
            return newItems;
         });
      },
      editNav: (id: number, newName: string) => {
         setNavData(items => {
            const newItems = [...items];
            const item = newItems.find((item) => item.id === id);
            if (item) {
               item.name = newName;
            }
            return newItems;
         })
      },
      removeRecord: (id: number) => {
         messageHandler.send({
            mType: "RemoveRecord",
            id: id
         })
      },
      activeRecord: (id: number, active: boolean) => {
         messageHandler.send({
            mType: "ActiveRecord",
            id: id,
            active: active
         })
      },
      editRecord: (id: number, newName: string) => {
         messageHandler.send({
            mType: "EditRecord",
            id: id,
            name: newName
         })
      },
      setProfileScale: setProfileScale,
      profileScale: profileScale,
      enableTouchdown: setTouchdown,
      withTouchdown: touchdown,
      enableGround: setGround,
      withGround: ground,
      reorderNav: (orders: number[]) => {
         setNavData(data => {
            return orders.map((order, index) => ({ ...data[index], order: order }))
         });
      }
   }), [map, navData, records, counter, flash, flashKey, profileScale, touchdown, ground]);

   return (
      <MapContext.Provider
         value={provider}
      >
         {children}
      </MapContext.Provider>
   );
};

export default MapContextProvider;