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

import { Collection, Map as olMap, MapBrowserEvent, getUid, MapEvent } from 'ol';
import { createContext, Dispatch, PropsWithChildren, RefObject, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavData } from './MapMenu/Menus/Nav';
import BaseLayer from "ol/layer/Base";
import { defaults } from "ol/interaction/defaults";
import VectorLayer from "ol/layer/Vector";
import Layer from "ol/layer/Layer";
import LayerGroup from "ol/layer/Group";
import { Coordinate } from "ol/coordinate";
import Feature, { FeatureLike } from "ol/Feature";
import { LineString, SimpleGeometry } from "ol/geom";
import VectorSource from "ol/source/Vector";
import { Cluster } from "ol/source";
import { PlaneRecord, PlaneRecords } from '@shared/PlanPos';
import { messageHandler } from '@Settings/SettingsProvider';
import { Deviation, ExportNavRecord, FuelUnit, Properties } from '@shared/NavData';
import { getLength } from 'ol/sphere';

export type Interactive = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick?: (_pixel: MapBrowserEvent<any>, _features: FeatureLike[]) => boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onHover?: (_pixel: MapBrowserEvent<any>, _features: FeatureLike[]) => boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBlur?: (_pixel: MapBrowserEvent<any>, _features: FeatureLike[]) => boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMoveEnd?: (_pixel: MapBrowserEvent<any>, _features: FeatureLike[]) => boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDrag?: (_pixel: MapBrowserEvent<any> | MapEvent, _features: FeatureLike[]) => boolean
}

export const MapContext = createContext<{
  map: olMap,
  navData: NavData[],
  records: PlaneRecord[],
  profileScale: number,

  setRecordsCenter: (_value: { x: number, y: number }) => void,
  recordsCenter: { x: number, y: number },
  setProfileRule1: (_value: number) => void,
  profileRule1: number,
  setProfileRule2: (_value: number) => void,
  profileRule2: number,
  setProfileScale: (_value: number) => void,
  withTouchdown: boolean,
  enableTouchdown: (_value: boolean) => void,
  withGround: boolean,
  enableGround: (_value: boolean) => void,
  counter: RefObject<number>
  flash: boolean,
  flashKey: number,
  setNavData: Dispatch<SetStateAction<NavData[]>>,
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
  setLoadedFuel: (_id: number, _value: number) => void,
  setDepartureTime: (_id: number, _value: number) => void,
  editNavProperties: (_id: number, _properties: Properties[]) => void,
  updateWaypoints: (_id: number, _names: string[]) => void,
  removeRecord: (_id: number) => void,
  activeRecord: (_id: number, _active: boolean) => void,
  editRecord: (_id: number, _newName: string) => void,
  reorderNav: (_orders: number[]) => void,

  updateNavProps: (_props: Properties, _prevCoords: Coordinate, _coords: Coordinate) => Properties

  deviations: { x: number, y: number }[],
  setDeviations: Dispatch<SetStateAction<Deviation[]>>,

  fuelConsumption: number,
  setFuelConsumption: Dispatch<SetStateAction<number>>,
  fuelUnit: FuelUnit,
  setFuelUnit: Dispatch<SetStateAction<FuelUnit>>,
} | undefined>(undefined);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getFeaturesAtPixel = (map: olMap, layer: Layer, coords: Coordinate, event: MapBrowserEvent<any>): FeatureLike[] => {
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

const updateFuel = (fuelConsumption: number, props: Properties): Properties => {
  return {
    ...props, vor: { ...props.vor }, wind: { ...props.wind },
    dur: { ...props.dur },
    conso: fuelConsumption / 3600 * props.dur.full,
  }
}

const updateNavProps = (fuelConsumption: number, deviations: Deviation[], props: Properties, prevCoords: Coordinate, coords: Coordinate): Properties => {
  const { ias, oat, altitude, wind, magVar } = props;
  const { direction, speed: windVel } = wind;
  const windDir = direction > 180 ? direction - 180 : direction + 180;

  const vector = [coords[0] - prevCoords[0], coords[1] - prevCoords[1]];
  const angle = Math.atan2(vector[1], vector[0]) * 180 / Math.PI;
  let TC = 90 - angle;

  if (TC < 0) {
    TC += 360;
  }

  const dist = getLength(new LineString([prevCoords, coords])) * 0.0005399568;

  // const tas = ias * Math.sqrt(1 +  altitude / 44330 + (oat - (15 - 0.0065 * altitude)) / 273.15)
  const tas = ias * Math.sqrt(0.945085118 + altitude * 4.635453591185e-5 + oat / 273.15)

  const WCA = Math.asin(Math.max(-1, Math.min(1, windVel * Math.sin((TC - windDir) * (Math.PI / 180)) / tas))) * (180 / Math.PI)
  const MH = (TC + magVar) % 360;
  const [CH, dev] = (() => {
    const value = (() => {
      const value = (MH + WCA) % 360
      if (value < 0) {
        return value + 360;
      }

      return value;
    })();
    const devIndex = deviations.findIndex(elem => elem.x > value)

    if (devIndex === -1) {
      if (value === deviations[0].x) {
        return [(value + deviations[0].y) % 360, deviations[0].y];
      } else {
        console.assert(value === deviations[deviations.length - 1].x)
        return [(value + deviations[deviations.length - 1].y) % 360, deviations[deviations.length - 1].y];
      }
    } else {
      const index = devIndex - 1;
      console.assert(index >= 0);

      const x = value - deviations[index].x
      const slope = (deviations[index + 1].y - deviations[index].y) / (deviations[index + 1].x - deviations[index].x)
      const dev = slope * x + deviations[index].y;
      return [(value + dev) % 360, dev];
    }
  })()

  const GS = tas * Math.cos(WCA * (Math.PI / 180)) + windVel * Math.cos((TC - windDir) * (Math.PI / 180));
  const dur = dist * 3600 / GS;

  const fdays = dur / 86400;
  const days = Math.floor(fdays);
  const fhours = (fdays - days) * 24;
  const hours = Math.floor(fhours);
  const fminutes = (fhours - hours) * 60;
  const minutes = Math.floor(fminutes);
  const fseconds = (fminutes - minutes) * 60;
  const seconds = Math.floor(fseconds);

  return updateFuel(fuelConsumption, {
    ...props, TC: TC, CH: CH, dev: dev, MH: MH, dur: {
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds,
      full: dur
    }, tas: tas, GS: GS, dist: dist
  })
}


const MapContextProvider = ({ children }: PropsWithChildren) => {
  const mouseEndCallbacks = useRef<((_coords: Coordinate) => void)[]>([])
  const dragging = useRef(false);

  const map = useMemo<olMap>(() => {
    const layers = new Collection<BaseLayer>();
    const focused: {
      feature: Interactive | undefined,
      args: FeatureLike[]
    } = {
      feature: undefined,
      args: []
    };

    const map = new olMap({
      layers: layers,
      interactions: defaults({ doubleClickZoom: false })
    });

    const handleDrag = (event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent> | MapEvent) => {
      map.getAllLayers().forEach(async (layer) => {
        if (!layer.isVisible?.()) {
          return false;
        }

        if (layer instanceof VectorLayer) {
          const source = layer.getSource();
          if (source instanceof VectorSource || source instanceof Cluster) {
            const features = source.getFeatures()


            const iLayer = (layer as unknown as Interactive);

            if (iLayer.onDrag) {
              iLayer.onDrag(event, features)
            }

            features.forEach(feature => {
              const iFeature = (feature as unknown as Interactive);
              iFeature.onDrag?.(event, features)
            })
          }
        }
      })
    }

    map.on('movestart', () => {
      dragging.current = true;
    })

    map.on('moveend', (event) => {
      dragging.current = true;
      handleDrag(event)
      dragging.current = false;

      const coord = event.map.getView().getCenter()!;
      mouseEndCallbacks.current.forEach(callback => callback(coord));
    });

    map.on('pointermove', (event) => {
      const coords = event.coordinate;

      map.getTargetElement().style.cursor = '';

      if (dragging.current) {
        handleDrag(event);
      }

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
  const [activeRecords, setActiveRecords] = useState(new Map<number, boolean>());
  const [addNav, setAddNav] = useState<() => void>();
  const [cancel, setCancel] = useState<() => void>();
  const [navData, setNavData] = useState<NavData[]>([]);
  const counter = useRef(0);
  const [flash, setFlash] = useState(false);
  const [flashKey, setFlashKey] = useState(0);

  const [cancelRequest, setCancelRequest] = useState(false);
  const [addNavRequest, setAddNavRequest] = useState(false);

  const [profileScale, setProfileScale] = useState(1);
  const [profileRule1, setProfileRule1] = useState(1000);
  const [profileRule2, setProfileRule2] = useState(1500);
  const [recordsCenter, setRecordsCenter] = useState({ x: 0.5, y: 0.5 });
  const [touchdown, setTouchdown] = useState(false);
  const [ground, setGround] = useState(true);
  const [deviations, setDeviations] = useState<Deviation[]>([
    {
      x: 0,
      y: 0
    },
    {
      x: 360,
      y: 0
    }
  ])

  const [fuelConsumption, setFuelConsumption] = useState(ExportNavRecord.defaultValues.fuelConsumption);
  const [fuelUnit, setFuelUnit] = useState<FuelUnit>(ExportNavRecord.defaultValues.fuelUnit)

  const updateNavPropsCB = useCallback((props: Properties, prevCoords: Coordinate, coords: Coordinate) =>
    updateNavProps(fuelConsumption, deviations, props, prevCoords, coords)
    , [deviations, fuelConsumption])

  useEffect(() => {
    setNavData(navData => navData.map(elem => (
      {
        ...elem,
        properties: elem.properties.map((props, index) =>
          updateNavProps(fuelConsumption, deviations, props, elem.coords[index], elem.coords[index + 1]))
      }
    )))
  }, [deviations, fuelConsumption])

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
      const newActiveRecords = new Map<number, boolean>();
      const newRecords = records.value.map(value => {
        const active = activeRecords.get(value.id) ?? false;

        newActiveRecords.set(value.id, active);
        return { ...value, active: active };
      });
      setActiveRecords(newActiveRecords);
      setRecords(newRecords);
    };

    messageHandler.subscribe("__RECORDS__", onPlaneRecords)
    return () => messageHandler.unsubscribe("__RECORDS__", onPlaneRecords);
  }, [activeRecords])

  useEffect(() => {
    messageHandler.send({ __GET_RECORDS__: true });
  }, []);

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
    setLoadedFuel: (id: number, value: number) => {
      setNavData(items => {
        const newItems = items.map(item => ({ ...item }));
        const item = newItems.find((item) => item.id === id);
        if (item) {
          item.loadedFuel = value;
        }
        return newItems;
      })
    },
    setDepartureTime: (id: number, value: number) => {
      setNavData(items => {
        const newItems = items.map(item => ({ ...item }));
        const item = newItems.find((item) => item.id === id);
        if (item) {
          item.departureTime = value;
        }
        return newItems;
      })
    },
    editNavProperties: (id: number, properties: Properties[]) => {
      setNavData(items => {
        const newItems = items.map(item => ({ ...item }));
        const item = newItems.find((item) => item.id === id);
        if (item) {
          const { coords } = item;
          item.properties = properties.map((props, index) => updateNavPropsCB(props, coords[index], coords[index + 1]));
        }
        return newItems;
      })
    },
    updateWaypoints: (id: number, names: string[]) => {
      setNavData(items => {
        const newItems = items.map(item => ({ ...item }));
        const item = newItems.find((item) => item.id === id);
        if (item) {
          item.waypoints = [...names];
        }
        return newItems;
      })
    },
    reorderNav: (orders: number[]) => {
      setNavData(data => {
        return orders.map((order, index) => ({ ...data[index], order: order }))
      });
    },
    removeRecord: (id: number) => {
      messageHandler.send({
        __REMOVE_RECORD__: true,

        id: id
      })
    },
    activeRecord: (id: number, active: boolean) => {
      const newActiveRecords = new Map(activeRecords);
      newActiveRecords.set(id, active);

      setActiveRecords(newActiveRecords);
      setRecords(records => records.map(value => ({ ...value, active: newActiveRecords.get(value.id) ?? false })));
    },
    editRecord: (id: number, newName: string) => {
      messageHandler.send({
        __EDIT_RECORD__: true,

        id: id,
        name: newName
      })
    },
    setProfileScale: setProfileScale,
    profileScale: profileScale,
    recordsCenter: recordsCenter,
    setRecordsCenter: setRecordsCenter,
    setProfileRule1: setProfileRule1,
    profileRule1: profileRule1,
    setProfileRule2: setProfileRule2,
    profileRule2: profileRule2,
    enableTouchdown: setTouchdown,
    withTouchdown: touchdown,
    enableGround: setGround,
    withGround: ground,

    deviations: deviations,
    setDeviations: setDeviations,
    updateNavProps: updateNavPropsCB,

    fuelConsumption: fuelConsumption,
    setFuelConsumption: setFuelConsumption,
    fuelUnit: fuelUnit,
    setFuelUnit: setFuelUnit,
  }), [map, navData, records, flash, flashKey, profileScale, recordsCenter, profileRule1, profileRule2, touchdown, ground, deviations, updateNavPropsCB, fuelConsumption, fuelUnit, activeRecords]);

  return (
    <MapContext.Provider
      value={provider}
    >
      {children}
    </MapContext.Provider>
  );
};

export default MapContextProvider;