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
   navData: NavData[]
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
   removeNav: (_name: string) => void,
   activeNav: (_name: string, _active: boolean) => void,
   editNav: (_name: string, _newName: string) => void,
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
      registerMouseEnd: (callback: (_coords: Coordinate) => void) => {
         mouseEndCallbacks.current.push(callback)
      },
      unregisterMouseEnd: (callback: (_coords: Coordinate) => void) => {
         mouseEndCallbacks.current.splice(mouseEndCallbacks.current.findIndex(value => value === callback), 1)
      },
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