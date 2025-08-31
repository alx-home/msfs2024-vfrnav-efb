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
import { createContext, Dispatch, PropsWithChildren, RefObject, SetStateAction, useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
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
import { messageHandler, SettingsContext } from '@Settings/SettingsProvider';
import { Deviation, ExportNavRecord, FuelUnit, getFuelConsumption, h125Curve, FuelPoint, Properties, Alt } from '@shared/NavData';
import { getLength } from 'ol/sphere';
import { PresetPopup } from '@pages/NavLog/Settings/Fuel/PresetPopup';

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

  setProfileScale: (_value: number) => void,
  profileScale: number,
  setProfileOffset: (_value: number) => void,
  profileOffset: number,

  setRecordsCenter: (_value: { x: number, y: number }) => void,
  recordsCenter: { x: number, y: number },
  profileRange: { min: number, max: number },
  setProfileRange: (_value: { min: number, max: number }) => void,
  setProfileRule1: (_value: number) => void,
  profileRule1: number,
  setProfileRule2: (_value: number) => void,
  profileRule2: number,
  setProfileSlope1: (_value: number) => void,
  profileSlope1: number,
  setProfileSlope2: (_value: number) => void,
  profileSlope2: number,
  setProfileSlopeOffset1: (_value: number) => void,
  profileSlopeOffset1: number,
  setProfileSlopeOffset2: (_value: number) => void,
  profileSlopeOffset2: number,

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
  setTaxiTime: (_id: number, _value: number) => void,
  setTaxiConso: (_id: number, _value: number) => void,
  setLink: (_id: number, _value: string) => void,
  editNavProperties: (_id: number, _properties: ((Properties[]) | ((_props: Properties[]) => (Properties[])))) => void,
  updateWaypoints: (_id: number, _names: string[]) => void,
  removeRecord: (_id: number) => void,
  activeRecord: (_id: number, _active: boolean) => void,
  editRecord: (_id: number, _newName: string) => void,
  reorderNav: (_orders: number[]) => void,

  updateNavProps: (_props: Properties, _prevCoords: Coordinate, _coords: Coordinate, _withFuel?: boolean) => Properties

  fuelUnit: FuelUnit,
  setFuelUnit: Dispatch<SetStateAction<FuelUnit>>,

  savedFuelCurves: [string, number, [number, FuelPoint[]][]][]
  setSavedFuelCurves: Dispatch<SetStateAction<[string, number, [number, FuelPoint[]][]][]>>,
  fuelSettingsOat: number,
  setFuelSettingsOat: Dispatch<SetStateAction<number>>,

  fuelCurve: [number, FuelPoint[]][]
  setFuelCurve: Dispatch<SetStateAction<[number, FuelPoint[]][]>>,
  updateFuelPreset: (_name: string, _user?: boolean) => void,
  fuelPreset: string,

  savedDeviationCurves: [string, number, [Alt, number][]][]
  setSavedDeviationCurves: Dispatch<SetStateAction<[string, number, [Alt, number][]][]>>,

  deviationCurve: [Alt, number][]
  setDeviationCurve: Dispatch<SetStateAction<[Alt, number][]>>,
  updateDeviationPreset: (_name: string, _user?: boolean) => void,
  deviationPreset: string,

  importNavRef: RefObject<((_data: {
    id: number,
    name: string;
    shortName: string;
    active?: boolean
    order: number;
    coords: number[][];
    properties: Properties[];
    waypoints: string[];
    loadedFuel: number;
    departureTime: number;
    taxiTime: number;
    taxiConso: number;
    link: string;
  }[]) => void) | undefined>

  importNav: (_data: {
    id: number,
    name: string
    shortName: string
    active?: boolean
    order: number
    coords: number[][]
    properties: Properties[]
    waypoints: string[]
    loadedFuel: number
    departureTime: number
    taxiTime: number;
    taxiConso: number;
    link: string;
  }[]) => void

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

const updateFuel = (fuelCurve: [number, FuelPoint[]][], props: Properties): Properties => {
  const fuelConsumption = getFuelConsumption({ fuelCurve, oat: props.oat, altitude: props.altitude })

  return {
    ...props, vor: { ...props.vor }, wind: { ...props.wind },
    dur: { ...props.dur },
    conso: fuelConsumption / 3600 * props.dur.full,
  }
}

const updateNavProps = (deviationCurve: Deviation[], props: Properties, prevCoords: Coordinate, coords: Coordinate, fuelCurve?: [number, FuelPoint[]][]): Properties => {
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
    const devIndex = deviationCurve.findIndex(elem => elem[0] > value)

    if (devIndex === -1) {
      if (value === deviationCurve[0][0]) {
        return [(value + deviationCurve[0][1]) % 360, deviationCurve[0][1]];
      } else {
        console.assert(value === deviationCurve[deviationCurve.length - 1][0])
        return [(value + deviationCurve[deviationCurve.length - 1][1]) % 360, deviationCurve[deviationCurve.length - 1][1]];
      }
    } else {
      const index = devIndex - 1;
      console.assert(index >= 0);

      const x = value - deviationCurve[index][0]
      const slope = (deviationCurve[index + 1][1] - deviationCurve[index][1]) / (deviationCurve[index + 1][0] - deviationCurve[index][0])
      const dev = slope * x + deviationCurve[index][1];
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

  const result = {
    ...props, TC: TC, CH: CH, dev: dev, MH: MH, dur: {
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds,
      full: dur
    }, tas: tas, GS: GS, dist: dist
  };
  return fuelCurve ? updateFuel(fuelCurve, result) : result
}

const MapContextProvider = ({ children }: PropsWithChildren) => {
  const { setPopup } = useContext(SettingsContext)!
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
  const [profileOffset, setProfileOffset] = useState(0);
  const [profileRule1, setProfileRule1] = useState(1000);
  const [profileRule2, setProfileRule2] = useState(1500);
  const [profileRange, setProfileRange] = useState({ min: 0, max: 1 });
  const [profileSlope1, setProfileSlope1] = useState(0);
  const [profileSlope2, setProfileSlope2] = useState(0);
  const [profileSlopeOffset1, setProfileSlopeOffset1] = useState(0);
  const [profileSlopeOffset2, setProfileSlopeOffset2] = useState(0);
  const [recordsCenter, setRecordsCenter] = useState({ x: 0.65, y: 0.65 });
  const [touchdown, setTouchdown] = useState(false);
  const [ground, setGround] = useState(true);

  const [fuelUnit, setFuelUnit] = useState<FuelUnit>(ExportNavRecord.defaultValues.fuelUnit)

  const [savedFuelCurves, setSavedFuelCurves] = useState<[string, number, [number, FuelPoint[]][]][]>([
    ['real h125', 0, h125Curve]
  ])
  const [fuelCurve, setFuelCurve] = useState<[number, FuelPoint[]][]>(
    savedFuelCurves.length
      ? savedFuelCurves[0][2]
      : [[100, [
        [0, [[20, 145]]],
        [25000, [[20, 145]]]
      ]]])

  const [fuelPreset, setFuelPreset] = useState(savedFuelCurves.length ? savedFuelCurves[0][0] : 'custom')
  const [nextFuelPreset, setNextFuelPreset] = useState<{
    value: string,
    user?: boolean
  } | undefined>(undefined)
  const updateFuelPreset = useCallback((value: string, user?: boolean) => {
    setNextFuelPreset({ value, user })
  }, [])

  const [fuelSettingsOat, setFuelSettingsOat] = useState(20)

  const [savedDeviationCurves, setSavedDeviationCurves] = useState<[string, number, [number, number][]][]>([])
  const [deviationCurve, setDeviationCurve] = useState<[number, number][]>(
    savedDeviationCurves.length
      ? savedDeviationCurves[0][2]
      : [
        [0, 0],
        [360, 0]
      ])
  const [deviationPreset, setDeviationPreset] = useState(savedDeviationCurves.length ? savedDeviationCurves[0][0] : 'none')
  const [nextDeviationPreset, setNextDeviationPreset] = useState<{
    value: string,
    user?: boolean
  } | undefined>(undefined)
  const updateDeviationPreset = useCallback((value: string, user?: boolean) => {
    setNextDeviationPreset({ value, user });
  }, [])


  const importNavRef = useRef<(_data: {
    id: number,
    name: string;
    shortName: string;
    active?: boolean
    order: number;
    coords: number[][];
    properties: Properties[];
    waypoints: string[];
    loadedFuel: number;
    departureTime: number;
    taxiTime: number;
    taxiConso: number;
    link: string;
  }[]) => void>(undefined);

  const importNav = useCallback((data: {
    id: number,
    name: string;
    shortName: string;
    active?: boolean
    order: number;
    coords: number[][];
    properties: Properties[];
    waypoints: string[];
    loadedFuel: number;
    departureTime: number;
    taxiTime: number;
    taxiConso: number;
    link: string;
  }[]) => {
    importNavRef.current?.(data)
  }, [])


  const updateNavPropsCB = useCallback((props: Properties, prevCoords: Coordinate, coords: Coordinate) =>
    updateNavProps(deviationCurve, props, prevCoords, coords, fuelCurve)
    , [deviationCurve, fuelCurve])


  useEffect(() => {
    if (nextDeviationPreset) {
      const { value, user } = nextDeviationPreset;
      setNextDeviationPreset(undefined);

      if (value === 'custom') {
        setDeviationPreset('custom')
      } else {
        if (value === 'none') {
          setDeviationCurve([[0, 0], [360, 0]])
          setDeviationPreset('none')
        } else {
          const curve = savedDeviationCurves.find(e => e[0] === value);

          if (curve?.[2].length) {
            setDeviationCurve(curve[2])
            setDeviationPreset(value)
          } else {
            return;
          }
        }

        if ((user ?? true)) {
          messageHandler.send({
            __DEFAULT_DEVIATION_PRESET__: true,

            name: value,
            date: (new Date()).getTime()
          })
        }
      }
    }
  }, [nextDeviationPreset, savedDeviationCurves])

  useEffect(() => {
    if (nextFuelPreset) {
      const { value, user } = nextFuelPreset
      setNextFuelPreset(undefined);

      if (value === 'custom') {
        setFuelPreset('custom')
      } else if (value === 'simple') {
        setPopup(<PresetPopup validate={(fuel) => {
          setFuelCurve([
            [100, [
              [0, [[20, fuel]]],
              [25000, [[20, fuel]]]
            ]],
          ])
          setFuelSettingsOat(20)
          setFuelPreset('custom')
        }} />)
      } else {
        const curve = savedFuelCurves.find(e => e[0] === value);

        if (curve?.[2].length) {
          setFuelCurve(curve[2])
          setFuelPreset(value)

          if ((user ?? true)) {
            messageHandler.send({
              __DEFAULT_FUEL_PRESET__: true,

              name: value,
              date: (new Date()).getTime()
            })
          }
        }
      }
    }
  }, [nextFuelPreset, savedFuelCurves, setPopup])

  useEffect(() => {
    setNavData(navData => navData.map(elem => {
      const result = {
        ...elem,
        properties: elem.properties.map((props, index) =>
          updateNavProps(deviationCurve, props, elem.coords[index], elem.coords[index + 1], fuelCurve))
      };

      return result;
    }))
  }, [deviationCurve, fuelCurve])

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
    setNavData(oldNavData => {
      let change = false;

      const data = oldNavData.map(elem => ({
        conso: elem.taxiConso + elem.properties.reduce((result, elem) => result + elem.conso, 0),
        dur: elem.taxiTime * 60 + elem.properties.reduce((result, elem) => result + elem.dur.full, 0)
      }));

      const navData = oldNavData.map(elem => {
        if (elem.link === 'None') {
          return elem;
        }

        if (oldNavData.find(elem1 => elem1.id === +elem.link)) {
          return elem;
        }

        change = true;
        return { ...elem, link: 'None' };
      })

      const getData = (id: number): {
        fuel: number,
        dur: number
      } => {
        const index = navData.findIndex(elem => elem.id === id);

        console.assert(index !== -1)
        const elem = navData[index];

        if (elem.link === 'None') {
          return {
            fuel: elem.loadedFuel - data[index].conso,
            dur: elem.departureTime * 60 + data[index].dur
          }
        } else {
          const parent = getData(+elem.link);
          return {
            fuel: parent.fuel - data[index].conso,
            dur: parent.dur + data[index].dur
          }
        }
      }

      const newNavData = navData.map(elem => {
        if (elem.link !== 'None') {
          const data = getData(+elem.link)

          return {
            ...elem,
            departureTime: data.dur / 60,
            loadedFuel: data.fuel
          }
        }

        return elem;
      })

      if (change || newNavData.find((elem, index) => (elem.departureTime !== navData[index].departureTime) || (elem.loadedFuel !== navData[index].loadedFuel))) {
        return newNavData;
      } else {
        return oldNavData;
      }
    })
  }, [navData])

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
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) {
          return items;
        }

        return items.toSpliced(index, 1, { ...items[index], active: active })
      });
    },
    editNav: (id: number, newName: string) => {
      setNavData(items => {
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) {
          return items;
        }

        return items.toSpliced(index, 1, { ...items[index], name: newName })
      })
    },
    setLoadedFuel: (id: number, value: number) => {
      setNavData(items => {
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) {
          return items;
        }

        return items.toSpliced(index, 1, { ...items[index], loadedFuel: value })
      })
    },
    setDepartureTime: (id: number, value: number) => {
      setNavData(items => {
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) {
          return items;
        }

        return items.toSpliced(index, 1, { ...items[index], departureTime: value })
      })
    },
    setTaxiTime: (id: number, value: number) => {
      setNavData(items => {
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) {
          return items;
        }

        return items.toSpliced(index, 1, { ...items[index], taxiTime: value })
      })
    },
    setTaxiConso: (id: number, value: number) => {
      setNavData(items => {
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) {
          return items;
        }

        return items.toSpliced(index, 1, { ...items[index], taxiConso: value })
      })
    },
    setLink: (id: number, value: string) => {
      setNavData(items => {
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) {
          return items;
        }

        return items.toSpliced(index, 1, { ...items[index], link: value })
      })
    },
    editNavProperties: (id: number, properties: ((Properties[]) | ((_props: Properties[]) => (Properties[])))) => {
      setNavData(items => {
        const newItems = items.map(item => ({ ...item }));
        const item = newItems.find((item) => item.id === id);
        if (item) {
          const { coords } = item;
          if (typeof properties === 'function') {
            item.properties = properties(item.properties).map((props, index) => updateNavPropsCB(props, coords[index], coords[index + 1]));
          } else {
            item.properties = properties.map((props, index) => updateNavPropsCB(props, coords[index], coords[index + 1]));
          }
        }

        return newItems;
      })
    },
    updateWaypoints: (id: number, names: string[]) => {
      setNavData(items => {
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) {
          return items;
        }

        return items.toSpliced(index, 1, { ...items[index], waypoints: [...names] })
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
    setProfileOffset: setProfileOffset,
    profileOffset: profileOffset,
    setProfileScale: setProfileScale,
    profileScale: profileScale,
    recordsCenter: recordsCenter,
    setRecordsCenter: setRecordsCenter,
    setProfileRange: setProfileRange,
    profileRange: profileRange,
    setProfileRule1: setProfileRule1,
    profileRule1: profileRule1,
    setProfileRule2: setProfileRule2,
    profileRule2: profileRule2,

    setProfileSlope1: setProfileSlope1,
    profileSlope1: profileSlope1,
    setProfileSlope2: setProfileSlope2,
    profileSlope2: profileSlope2,

    setProfileSlopeOffset1: setProfileSlopeOffset1,
    profileSlopeOffset1: profileSlopeOffset1,
    setProfileSlopeOffset2: setProfileSlopeOffset2,
    profileSlopeOffset2: profileSlopeOffset2,

    enableTouchdown: setTouchdown,
    withTouchdown: touchdown,
    enableGround: setGround,
    withGround: ground,

    updateNavProps: updateNavPropsCB,

    fuelUnit: fuelUnit,
    setFuelUnit: setFuelUnit,

    setSavedFuelCurves: setSavedFuelCurves,
    savedFuelCurves: savedFuelCurves,
    updateFuelPreset: updateFuelPreset,
    fuelPreset: fuelPreset,
    fuelSettingsOat: fuelSettingsOat,
    setFuelSettingsOat: setFuelSettingsOat,

    fuelCurve: fuelCurve,
    setFuelCurve: setFuelCurve,

    setSavedDeviationCurves: setSavedDeviationCurves,
    savedDeviationCurves: savedDeviationCurves,

    deviationCurve: deviationCurve,
    setDeviationCurve: setDeviationCurve,
    updateDeviationPreset: updateDeviationPreset,
    deviationPreset: deviationPreset,

    importNavRef: importNavRef,
    importNav: importNav
  }), [map, navData, records, flash, flashKey, profileOffset, profileScale, recordsCenter, profileRange, profileRule1, profileRule2, profileSlope1, profileSlope2, profileSlopeOffset1, profileSlopeOffset2, touchdown, ground, updateNavPropsCB, fuelUnit, savedFuelCurves, updateFuelPreset, fuelPreset, fuelSettingsOat, fuelCurve, savedDeviationCurves, deviationCurve, updateDeviationPreset, deviationPreset, importNav, activeRecords]);

  return (
    <MapContext.Provider
      value={provider}
    >
      {children}
    </MapContext.Provider>
  );
};

export default MapContextProvider;