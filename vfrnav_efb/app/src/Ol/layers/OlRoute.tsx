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

import { OlLayerProp } from "./OlLayer";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";
import { Geometry, MultiLineString, SimpleGeometry } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Snap from "ol/interaction/Snap";
import { doubleClick } from 'ol/events/condition';
import { FeatureLike } from "ol/Feature";
import Style from "ol/style/Style";
import { Coordinate, rotate } from "ol/coordinate";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { messageHandler, SettingsContext } from "@Settings/SettingsProvider";
import { MapContext } from "@pages/Map/MapContext";

import greenMarker from '@efb-images/marker-icon-green.svg';
import redMarker from '@efb-images/marker-icon-red.svg';
import blueMarker from '@efb-images/marker-icon-blue.svg';
import { ExportNav, Properties, PropertiesRecord } from "@shared/NavData";
import { NavData } from "@pages/Map/MapMenu/Menus/Nav";


const useMap = () => {
   const { defaultSpeed } = useContext(SettingsContext)!;
   const { map, navData, setNavData, counter, updateNavProps } = useContext(MapContext)!;
   const [modify, setModify] = useState<Modify>();
   const [snap, setSnap] = useState<Snap>();
   const [layer, setLayer] = useState<VectorLayer>();
   const [modified, setModified] = useState<Feature<MultiLineString>[] | undefined>(undefined);
   const [resetLayer, setResetLayer] = useState(false);

   const initFeature = useCallback((feature: Feature<MultiLineString>) => {
      if (!feature.getProperties()['initialized']) {
         feature.setId(++counter.current);

         feature.setProperties({ ...feature.getProperties(), initialized: true })
         return true
      }

      return false
   }, [counter])

   const [newFeatures, setNewFeatures] = useState<Feature<MultiLineString>[] | undefined>(undefined)
   const [orders, setOrders] = useState<number[]>([]);

   const source = useMemo(() => {
      const source = new VectorSource<Feature<Geometry>>({
         features: []
      });
      source.on('addfeature', (e) => setNewFeatures(items => ([...(items ?? []), (e.feature as Feature<MultiLineString>)])));

      return source
   }, []);

   useEffect(() => {
      if (orders.length != navData.length || navData.find((data, index) => data.order !== orders[index])) {
         const oldFeatures = source.getFeatures();

         source.clear();
         setOrders(navData.map(data => data.order));
         source.addFeatures(navData.toSorted((left, right) => left.order - right.order).map(data => {
            const oldFeature = oldFeatures.find((feature) => feature.getId() === data.id)!;
            const feature = oldFeature.clone();
            feature.setProperties(oldFeature.getProperties())
            feature.setId(oldFeature.getId())

            return feature;
         }));
      }
   }, [navData, orders, source])

   useEffect(() => {
      if (newFeatures) {
         const newData: NavData[] = [];
         let hasChanges = false;

         for (const feature of newFeatures) {
            if (initFeature(feature)) {
               const coords = feature.getGeometry()!.getCoordinates()[0].map(coords => ([...coords]));
               const id = feature.getId() as number;
               const date = new Date();

               hasChanges = true;
               newData.push({
                  id: id,
                  order: 0,
                  active: true,
                  name: `New Nav ${id}`,
                  shortName: `${id}`,
                  coords: coords,
                  layer: layer!,
                  waypoints: coords.map(() => ""),
                  loadedFuel: 300,
                  departureTime: date.getHours() * 60 + date.getMinutes(),
                  properties: coords.filter((_, index) => index).map((value, index) => {
                     const props = { ...PropertiesRecord.defaultValues, ias: defaultSpeed, ata: -1 };
                     return updateNavProps(props, coords[index], value)
                  })
               })
            }
         }

         if (hasChanges) {
            setNavData(items => ([...items, ...newData.map((value, index) => ({
               ...value,
               order: items.length + index
            }))]));
         }
         setNewFeatures(undefined);
      }
   }, [defaultSpeed, initFeature, layer, newFeatures, setNavData, updateNavProps])

   useEffect(() => {
      const layer = new VectorLayer({
         source: source
      });
      map.addLayer(layer);
      setLayer(layer);
      setResetLayer(true);

      return () => { map.removeLayer(layer) };
   }, [source, map]);

   useEffect(() => {
      if (resetLayer) {
         const features: Feature[] = [];

         navData.forEach(data => {
            const feature = new Feature<MultiLineString>(new MultiLineString([data.coords]));
            initFeature(feature);
            features.push(feature)

            data.id = feature.getId() as number;
         })

         source.addFeatures(features);
         setNavData(navData);

         setResetLayer(false);
      }
   }, [resetLayer, layer, source, navData, initFeature, setNavData]);

   useEffect(() => {
      const modify = new Modify({
         source: source,
         deleteCondition: doubleClick,
      });

      modify.on('modifystart', (e) => {
         setModified(items => [...(items ?? []), ...(e.features.getArray() as Feature<MultiLineString>[])]);
      })

      modify.on('modifyend', (e) => {
         setModified(items => [...(items ?? []), ...(e.features.getArray() as Feature<MultiLineString>[])]);
      })

      map.addInteraction(modify);
      setModify(modify);

      return () => { map.removeInteraction(modify) };
   }, [source, map]);

   useEffect(() => {
      const snap = new Snap({ source: source });
      map.addInteraction(snap);
      setSnap(snap);

      return () => { map.removeInteraction(snap) };
   }, [source, map]);

   useEffect(() => {
      if (modified) {
         const newNavData = navData.map(data => ({ ...data }))

         let hasChanges = false;

         modified.forEach((feature) => {
            const data = newNavData.find(elem => elem.id === feature.getId());

            if (data) {
               const oldCoords = data.coords;
               const newCoords = (feature.getGeometry() as MultiLineString).getCoordinates()[0];

               const index = (() => {
                  const index = oldCoords.slice(0, newCoords.length).findIndex((coord, index) => (coord[0] !== newCoords[index][0]) || (coord[1] !== newCoords[index][1]))

                  if (index === -1) {
                     if (oldCoords.length > newCoords.length) {
                        // Last Coord deletion
                        return oldCoords.length - 1;
                     } else {
                        return -1
                     }
                  }

                  return index;
               })()

               if (index === -1) {
                  return;
               }

               data.coords = newCoords.map(coords => [...coords])
               hasChanges = true;

               const properties = data.properties.map(props => ({ ...props }));

               if (oldCoords.length !== newCoords.length) {
                  console.assert(Math.abs(newCoords.length - oldCoords.length) === 1);
                  console.assert(index !== 0);

                  if (oldCoords.length < newCoords.length) {
                     const prevProps = properties[index - 1];
                     properties.splice(index - 1, 0, { ...prevProps, wind: { ...prevProps.wind }, vor: { ...prevProps.vor } })
                     data.waypoints.splice(index, 0, "");

                     if (index + 1 === properties.length) {
                        properties[index].active = true
                     } else {
                        properties[index].active = properties[index + 1].active
                     }
                  } else {
                     properties.splice(Math.min(index, properties.length - 1), 1)
                     data.waypoints.splice(index, 1);
                  }
               }

               if (index < properties.length) {
                  console.assert(index < newCoords.length - 1)
                  properties[index] = updateNavProps(properties[index], newCoords[index], newCoords[index + 1])
               }

               if (index > 0 && (index < newCoords.length)) {
                  properties[index - 1] = updateNavProps(properties[index - 1], newCoords[index - 1], newCoords[index])
               }

               data.properties = properties
            }
         });

         if (hasChanges) {
            setNavData(newNavData)
         }

         setModified(undefined);
      }
   }, [modified, navData, setNavData, updateNavProps]);


   return {
      source: source,
      modify: modify,
      snap: snap,
      layer: layer,
      initFeature: initFeature
   };
};

const useDraw = (source?: VectorSource<Feature<Geometry>>) => {
   const { map, setAddNav, triggerFlash } = useContext(MapContext)!;
   const [draw, setDraw] = useState<Draw>();

   const updateDraw = useCallback((draw: Draw | undefined) => {
      setDraw(oldDraw => {
         if (oldDraw) {
            map.removeInteraction(oldDraw);
         }

         if (draw) {
            map.addInteraction(draw);
         }

         return draw;
      });
   }, [setDraw, map]);

   useEffect(() => {
      setAddNav(() => () => {
         const draw = new Draw({
            type: 'MultiLineString',
            source: source
         });
         updateDraw(draw);
         triggerFlash();

         draw.on('drawend', () => {
            updateDraw(undefined);
         });
      });
   }, [setAddNav, triggerFlash, updateDraw, source]);

   useEffect(() => () => {
      updateDraw(undefined);
   }, [updateDraw]);

   return { draw: draw };
}

export const OlRouteLayer = ({
   order,
   zIndex
}: {
   zIndex: number
} & OlLayerProp) => {
   const { setNavData, map, setCancel, navData, updateNavProps, setFuelCurve, updateFuelPreset, setFuelUnit, setDeviationCurve, updateDeviationPreset, importNavRef } = useContext(MapContext)!;
   const settings = useContext(SettingsContext)!;

   const { source, layer, initFeature } = useMap();
   const { draw } = useDraw(source);

   const greenMarkerImg = useRef<HTMLImageElement | null>(null);
   const redMarkerImg = useRef<HTMLImageElement | null>(null);
   const blueMarkerImg = useRef<HTMLImageElement | null>(null);

   const navRenderer = useMemo(() => (feature: FeatureLike) => {
      const geom = feature.getGeometry();

      if (geom?.getType() === 'MultiLineString') {
         return [new Style({
            renderer: (coords, state) => {
               const context = state.context;

               const data = navData.find(data => data.id === state.feature.getId())!;

               if (!data.active) {
                  return;
               }

               const geometry = state.geometry.clone() as SimpleGeometry;
               geometry.setCoordinates(coords);

               if (geometry.getType() === 'MultiLineString') {
                  const mapRotation = state.rotation;
                  const mapSize = map.getSize()!;

                  const mapCenter = [mapSize[0] * 0.5, mapSize[1] * 0.5];
                  const mapCenter2 = ((coord: Coordinate) => {
                     const mrCos = Math.abs(Math.cos(mapRotation));
                     const mrSin = Math.abs(Math.sin(mapRotation));
                     return [coord[0] * mrCos + coord[1] * mrSin, coord[0] * mrSin + coord[1] * mrCos]
                  })(mapCenter)

                  const toCanvas = (coord: Coordinate) =>
                     rotate([coord[0] - mapCenter[0], coord[1] - mapCenter[1]], -mapRotation)
                        .map((elem, index) => mapCenter2[index] + elem);

                  const fromCanvas = (coord: Coordinate) =>
                     rotate([coord[0] - mapCenter2[0], coord[1] - mapCenter2[1]], mapRotation)
                        .map((elem, index) => mapCenter[index] + elem);

                  const getCoordinateFromPixel = (coord: Coordinate) => map.getCoordinateFromPixel(fromCanvas(coord));
                  const getPixelFromCoordinate = (coord: Coordinate) => toCanvas(map.getPixelFromCoordinate(coord));
                  const mapModulo = Math.floor(getPixelFromCoordinate([20037508.34, 20043237.22])[0] - getPixelFromCoordinate([-20037508.34, 20043237.22])[0])

                  const { properties, waypoints } = data;
                  const coords_ = (coords as Coordinate[][])[0];
                  const fullCoords = (geom as MultiLineString).getCoordinates()[0].map(coord => getPixelFromCoordinate(coord));

                  // Draw Distance/cap
                  //------------------------------
                  fullCoords.filter((_, index) => index !== fullCoords.length - 1).forEach((coord, index) => {
                     if (!coords_.find(elem => (Math.abs(Math.ceil(elem[0] - coord[0]) % mapModulo) < 10)
                        && (Math.abs(elem[1] - coord[1]) < 10))) {
                        return;
                     }

                     const nextCoord = fullCoords[index + 1];

                     const props = updateNavProps(index < properties.length ? properties[index] : PropertiesRecord.defaultValues, getCoordinateFromPixel(coord), getCoordinateFromPixel(nextCoord), false);
                     const { CH, TC, MH, dist, altitude, dur, remark } = props;
                     const waypoint = waypoints[index];
                     const nextWaypoint = waypoints[index + 1];
                     const { days, hours, minutes, seconds } = dur;

                     let angle = TC - 90;
                     const mapAngle = mapRotation * 180 / Math.PI;

                     angle += mapAngle

                     angle %= 360;
                     if (angle < -180) {
                        angle += 360;
                     } else if (angle > 180) {
                        angle -= 360;
                     }

                     const offset = ((angle < 0 && angle < -90) || (angle > 0 && angle < 90)) ? -settings.map.markerSize * 0.25 : settings.map.markerSize * 0.25;

                     if (angle < -90 || angle > 90) {
                        angle = angle - 180;
                     }
                     angle -= mapAngle

                     const ch = Math.round(CH);
                     const cDelta = Math.round(MH - CH);

                     const maxSize = settings.map.text.maxSize;

                     const topLeft = toCanvas([0, 0])
                     const topRight = toCanvas([mapSize[0], 0])
                     const bottomRight = toCanvas([mapSize[0], mapSize[1]])
                     const bottomLeft = toCanvas([0, mapSize[1]])

                     const getIntersection = (a: Coordinate, b: Coordinate, c: Coordinate, d: Coordinate) => {
                        const t = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0]))
                           / ((a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]))

                        if (t >= 1 || t <= 0) {
                           return undefined
                        }

                        return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]
                     }


                     const clippedCoords = (() => {
                        let result = [coord, nextCoord];
                        let int = getIntersection(result[0], result[1], topLeft, topRight)

                        if (int) {
                           if (fromCanvas(result[0])[1] <= 0) {
                              result = [int, result[1]]
                           } else {
                              result = [result[0], int]
                           }
                        }

                        int = getIntersection(result[0], result[1], topRight, bottomRight)

                        if (int) {
                           if (fromCanvas(result[0])[0] >= mapSize[0]) {
                              result = [int, result[1]]
                           } else {
                              result = [result[0], int]
                           }
                        }

                        int = getIntersection(result[0], result[1], bottomLeft, bottomRight)

                        if (int) {
                           if (fromCanvas(result[0])[1] >= mapSize[1]) {
                              result = [int, result[1]]
                           } else {
                              result = [result[0], int]
                           }
                        }

                        int = getIntersection(result[0], result[1], topLeft, bottomLeft)

                        if (int) {
                           if (fromCanvas(result[0])[0] <= 0) {
                              result = [int, result[1]]
                           } else {
                              result = [result[0], int]
                           }
                        }

                        return result;
                     })()

                     const vector = [clippedCoords[1][0] - clippedCoords[0][0], clippedCoords[1][1] - clippedCoords[0][1]];
                     const center = [(clippedCoords[0][0] + clippedCoords[1][0]) >> 1, (clippedCoords[0][1] + clippedCoords[1][1]) >> 1];
                     const distance = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);

                     const drawText = (text: string, background: boolean, bottom?: boolean) => {
                        context.save();

                        context.lineJoin = 'round';
                        context.strokeStyle = `rgba(${settings.map.text.borderColor.red.toFixed(0)}, ${settings.map.text.borderColor.green.toFixed(0)}, ${settings.map.text.borderColor.blue.toFixed(0)}, ${settings.map.text.borderColor.alpha})`;
                        context.lineWidth = Math.floor(settings.map.text.borderSize);
                        context.font = "900 " + maxSize.toFixed(0) + "px Inter-bold, sans-serif";
                        const textWidth = context.measureText(text).width;
                        const textSize = Math.min(maxSize, maxSize * (distance - settings.map.markerSize * 1.5) / textWidth);
                        context.font = "900 " + textSize.toFixed(0) + "px Inter-bold, sans-serif";

                        if (textSize >= settings.map.text.minSize) {
                           context.textAlign = "center";
                           context.translate(center[0], center[1]);
                           context.rotate(angle * Math.PI / 180);
                           context.translate(offset, ((bottom ?? false) ? textSize + settings.map.text.borderSize * 0.25 : -settings.map.text.borderSize * 0.25 - 5));

                           if (background) {
                              context.strokeText(text, 0, 0);
                           } else {
                              context.fillStyle = `rgba(${settings.map.text.color.red.toFixed(0)}, ${settings.map.text.color.green.toFixed(0)}, ${settings.map.text.color.blue.toFixed(0)}, ${settings.map.text.color.alpha})`;
                              context.fillText(text, 0, 0);
                           }
                        }

                        context.restore();
                     }


                     for (const background of [true, false]) {
                        const hours_str = (days && (hours < 10) ? '0' : '') + hours.toString();
                        const minutes_str = (minutes < 10 ? "0" : '') + minutes.toString();
                        const delta_str = cDelta === 0 ? '' : (cDelta > 0 ? ' +' : ' ') + cDelta.toFixed() + '';
                        const seconds_str = (seconds < 10 ? '0' : '') + seconds.toString();

                        drawText(ch.toString() + delta_str + "\u00b0 "
                           + Math.round(dist).toString() + " nm  "
                           + (days ? days.toString() + 'd ' : '')
                           + ((days || hours) ? (hours_str + ":") : "")
                           + ((days || hours || minutes) ? (minutes_str + ":") : "")
                           + seconds_str, background);

                        drawText(waypoint + (waypoint.length ? " " : "")
                           + (waypoint.length || nextWaypoint.length ? "→ " : '') + nextWaypoint + (nextWaypoint.length ? ' ' : '')
                           + "↑" + (altitude < 10000 ? altitude : "FL" + (altitude / 100).toFixed(0))
                           + (remark.length ? " @" + remark : ""), background, true)
                     }
                  });

                  // Draw lines Background
                  //------------------------------
                  context.lineWidth = 5;
                  context.strokeStyle = `rgb(255, 255, 255)`;
                  context.beginPath()
                  context.moveTo(fullCoords[0][0], fullCoords[0][1])
                  fullCoords.forEach((coord, index) => {
                     if (index > 0) {
                        context.lineTo(coord[0], coord[1])
                     }
                  });
                  context.stroke();

                  // Draw lines Foreground
                  //------------------------------
                  const firstActive = properties.findIndex(value => value.active);

                  context.lineWidth = 4;
                  context.strokeStyle = firstActive ? `rgb(0, 200, 120)` : `rgb(31, 41, 55)`;//@todo parameter
                  context.beginPath()
                  context.moveTo(fullCoords[0][0], fullCoords[0][1])
                  fullCoords.forEach((coord, index) => {
                     if (index > 0) {
                        context.lineTo(coord[0], coord[1])

                        if (index === firstActive) {
                           context.stroke()

                           context.strokeStyle = `rgb(31, 41, 55)`;
                           context.beginPath()
                           context.moveTo(coord[0], coord[1])
                        }
                     }
                  });
                  context.stroke();

                  // Draw markers
                  //------------------------------
                  fullCoords.forEach((coord, index) => {
                     const size = settings.map.markerSize;

                     context.save();
                     {
                        context.translate(coord[0], coord[1]);
                        context.rotate(-map.getView().getRotation())
                        if (index === 0) {
                           // First Coord
                           context.drawImage(greenMarkerImg.current!, -size / 2, -size, size, size);
                        } else if (index === fullCoords.length - 1) {
                           // Last Coord
                           context.drawImage(redMarkerImg.current!, -size / 2, -size, size, size);
                        } else {
                           // Coord in between
                           context.drawImage(blueMarkerImg.current!, -size / 2, -size, size, size);
                        }
                     }
                     context.restore()
                  });
               }
            }
         })]
      }

      return [];
   }, [map, navData, settings, updateNavProps]);

   const onExportNav = useCallback((data: {
      name: string;
      shortName: string;
      order: number;
      coords: number[][];
      properties: Properties[];
      waypoints: string[];
      loadedFuel: number;
      departureTime: number;
   }[]) => {
      source.clear();

      const features: Feature[] = [];
      const navData = data.map((data): NavData => {
         const feature = new Feature<MultiLineString>(new MultiLineString([data.coords]));
         initFeature(feature);

         features.push(feature)
         const result: NavData = {
            id: feature.getId() as number,
            order: data.order,
            active: true,
            name: data.name,
            shortName: data.shortName,
            coords: data.coords.map(coords => ([...coords])),
            layer: layer!,
            departureTime: data.departureTime,
            loadedFuel: data.loadedFuel,
            waypoints: data.waypoints,
            properties: data.properties,
         }

         return result;
      })

      source.addFeatures(features);
      setNavData(navData);
   }, [initFeature, layer, setNavData, source])

   useEffect(() => {
      importNavRef.current = onExportNav
   }, [importNavRef, onExportNav])

   useEffect(() => {
      layer?.setZIndex(zIndex);
   }, [zIndex, layer]);

   useEffect(() => {
      layer?.setStyle(navRenderer);
   }, [navRenderer, layer]);

   useEffect(() => {
      setCancel(() => () => {
         if (draw) {
            map.removeInteraction(draw);
         }
      });
   }, [map, setCancel, draw]);


   useEffect(() => {
      if (order !== undefined) {
         layer?.setZIndex(order);
      }
   }, [order, layer]);

   useEffect(() => {
      if (__MSFS_EMBEDED__) {
         const callback = (message: ExportNav) => {
            onExportNav(message.data)
            setFuelUnit(message.fuelUnit)

            if (message.fuelCurve.length) {
               console.assert(message.fuelPreset === 'custom')
               setFuelCurve(message.fuelCurve.map(elem => [elem.thrust, elem.curves.map(value => [value.alt, value.values])]))
               updateFuelPreset('custom')
            } else {
               console.assert(message.fuelPreset !== 'custom')
               updateFuelPreset(message.fuelPreset)
            }

            if (message.deviationCurve.length) {
               console.assert(message.deviationPreset === 'custom')
               setDeviationCurve(message.deviationCurve)
               updateDeviationPreset('custom')
            } else {
               console.assert(message.deviationPreset !== 'custom')
               updateDeviationPreset(message.deviationPreset)
            }
         }
         messageHandler.subscribe("__EXPORT_NAV__", callback)
         return () => messageHandler.unsubscribe("__EXPORT_NAV__", callback);
      }
   }, [onExportNav, setDeviationCurve, setFuelCurve, setFuelUnit, updateDeviationPreset, updateFuelPreset])

   return <div className="hidden">
      <img ref={greenMarkerImg} src={greenMarker} alt='start marker' />
      <img ref={redMarkerImg} src={redMarker} alt='destination marker' />
      <img ref={blueMarkerImg} src={blueMarker} alt='intermediate marker' />
   </div>;
};