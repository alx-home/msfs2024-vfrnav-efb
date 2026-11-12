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
import { useEffect, useMemo, useRef, useState, memo } from 'react';
import { messageHandler, useSettings } from "@Settings/SettingsStore";

import greenMarker from '@efb-images/marker-icon-green.svg';
import redMarker from '@efb-images/marker-icon-red.svg';
import blueMarker from '@efb-images/marker-icon-blue.svg';
import { ExportNav, Properties, PropertiesRecord } from "@shared/NavData";
import { NavData } from "@pages/Map/MapMenu/Menus/Nav";
import { useEvent } from "react-use-event-hook";
import { useMapSubSettings } from "@pages/Map/MapSettings";
import { State } from "ol/render";


const useMap = () => {
   const defaultSpeed = useSettings(settings => settings.defaultSpeed);
   const [map, navData, setNavData, counterRef, updateNavProps] = useMapSubSettings(settings => ([
      settings.map,
      settings.navData,
      settings.setNavData,
      settings.counterRef,
      settings.updateNavProps
   ]));
   const [modify, setModify] = useState<Modify>();
   const [snap, setSnap] = useState<Snap>();
   const [layer, setLayer] = useState<VectorLayer>();

   const [features, setFeatures] = useState<Map<number, Feature<MultiLineString>>>(new Map())
   const [lastNavData, setLastNavData] = useState<NavData[]>([]);
   const pending = useRef<boolean>(false);

   const addFeature = useEvent((feature: Feature<MultiLineString>) => {
      if (pending.current) {
         return;
      }

      const newData: NavData[] = [];

      const coords = feature.getGeometry()!.getCoordinates()[0].map(coords => ([...coords]));
      const date = new Date();
      const id = ++counterRef.current;
      feature.setId(id);
      feature.set('order', newData.length);

      const props = coords.filter((_, index) => index).map((value, index) => {
         const props = { ...PropertiesRecord.defaultValues, ias: defaultSpeed, ata: -1 };
         return updateNavProps(props, coords[index], value)
      });

      newData.push({
         id,
         order: newData.length,
         active: true,
         name: `New Nav ${id}`,
         shortName: `${id}`,
         coords,
         layer: layer!,
         waypoints: coords.map(() => ""),
         loadedFuel: 300,
         departureTime: date.getHours() * 60 + date.getMinutes(),
         taxiTime: 15,
         taxiConso: 30,
         link: 'None',
         properties: props
      })

      setNavData(items => ([...items, ...newData.map((value, index) => ({
         ...value,
         order: items.length + index
      }))]));
      setFeatures(items => new Map(items).set(feature.getId() as number, feature));
   });


   const removeFeature = useEvent((feature: Feature<MultiLineString>) => {
      if (pending.current) {
         return;
      }

      const id = feature.getId() as number;

      setNavData(old => old.toSpliced(old.findIndex(item => item.id === id), 1));
      setFeatures(items => {
         const newFeatures = new Map(items);
         newFeatures.delete(feature.getId() as number);
         return newFeatures;
      });
   });

   const modifyFeatures = useEvent((features: Feature<MultiLineString>[]) => {
      if (pending.current) {
         return;
      }

      // Snapshot the mutable OL geometries synchronously BEFORE setNavData!
      const snapshots = features.map(feature => ({
         id: feature.getId(),
         newCoords: (feature.getGeometry() as MultiLineString).getCoordinates()[0].map(c => [...c])
      }));

      setNavData(oldData => {
         const newNavData = oldData.map(data => ({ ...data }));

         let hasChanges = false;

         for (const feature of snapshots) {
            const data = newNavData.find(elem => elem.id === feature.id)!;

            const oldCoords = data.coords;
            const newCoords = feature.newCoords;
            console.assert(Math.abs(oldCoords.length - newCoords.length) <= 1);

            const index = (() => {
               for (const [i, coord] of oldCoords.entries()) {
                  if (i >= newCoords.length || coord[0] !== newCoords[i][0] || coord[1] !== newCoords[i][1]) {
                     return i;
                  }
               }

               if (newCoords.length > oldCoords.length) {
                  return oldCoords.length;
               }

               return -1;
            })()

            if (index === -1) {
               continue;
            }
            console.assert(index >= 0);
            console.assert(index <= oldCoords.length);

            data.coords = newCoords.map(coords => [...coords]);
            data.properties = data.properties.map(props => ({ ...props }));
            data.waypoints = [...data.waypoints];

            console.assert(data.properties.length === data.waypoints.length - 1);

            // A coordinate has been added or removed, adjust properties and waypoints accordingly
            if (oldCoords.length !== newCoords.length) {

               // If a coordinate has been added, insert a new property and waypoint at the appropriate index
               if (oldCoords.length < newCoords.length) {
                  const prevIndex = Math.max(index - 1, 0);// Copy properties from the previous index, for first insertion, we use the first element
                  const prevProps = data.properties[prevIndex];

                  data.properties.splice(prevIndex, 0, { ...prevProps, wind: { ...prevProps.wind }, vor: { ...prevProps.vor } })
                  data.waypoints.splice(index, 0, "");

                  if (index + 1 === data.properties.length) {
                     data.properties[index].active = true
                  } else {
                     data.properties[index].active = data.properties[index + 1].active
                  }
               }
               // If a coordinate has been removed, remove the corresponding property and waypoint
               else {
                  data.properties.splice(Math.max(index - 1, 0), 1)
                  data.waypoints.splice(index, 1);
               }
            }

            if (index < data.properties.length) {
               console.assert(index < newCoords.length - 1)
               data.properties[index] = updateNavProps(data.properties[index], newCoords[index], newCoords[index + 1])
            }

            if ((index > 0) && (index < newCoords.length)) {
               data.properties[index - 1] = updateNavProps(data.properties[index - 1], newCoords[index - 1], newCoords[index])
            }

            hasChanges = true;
         }

         return hasChanges ? newNavData : oldData;
      });
   });

   const source = useMemo(() => {
      const result = new VectorSource<Feature<Geometry>>({
         features: []
      });
      result.on('addfeature', e => addFeature(e.feature as Feature<MultiLineString>));
      result.on('removefeature', e => removeFeature(e.feature as Feature<MultiLineString>));

      return result
   }, [addFeature, removeFeature]);

   useEffect(() => {
      const layer = new VectorLayer({
         source: source
      });

      layer.setRenderOrder((a, b) => {
         const orderA = a.get('order') ?? 0;
         const orderB = b.get('order') ?? 0;
         return orderA - orderB;
      });

      map.addLayer(layer);
      setLayer(layer);

      const modify = new Modify({
         source: source,
         deleteCondition: doubleClick,
      });

      modify.on('modifystart', (e) => {
         const draggedFeatures = e.features.getArray() as Feature<MultiLineString>[];
         for (const feature of draggedFeatures) {
            const listener = () => {
               // Fires as soon as OL inserts/moves the vertex during drag!
               modifyFeatures([feature]);
               feature.un('change', listener);
            };
            feature.on('change', listener);
         }
      })

      modify.on('modifyend', (e) => {
         modifyFeatures(e.features.getArray() as Feature<MultiLineString>[]);
      })

      map.addInteraction(modify);
      setModify(modify);

      const snap = new Snap({ source: source });
      map.addInteraction(snap);
      setSnap(snap);

      return () => {
         map.removeInteraction(modify);
         map.removeInteraction(snap);
         map.removeLayer(layer);
      };
   }, [source, map, modifyFeatures]);

   if ((navData.length !== lastNavData.length)
      || navData.some((data, index) =>
         (data.order !== lastNavData[index]?.order)
         || (data.active !== lastNavData[index]?.active))) {

      const newData = navData.filter(data => !features.has(data.id));
      const oldData = navData.filter(data => features.has(data.id));

      pending.current = true;

      // Remove features that are no longer in the new data
      for (const [, feature] of features.entries().filter(([id,]) => !navData.some(data => data.id === id))) {
         source.removeFeature(feature);
      }

      // Add new features to the source
      const newFeatures = new Map<number, Feature<MultiLineString>>();
      for (const data of newData) {
         const newFeature = new Feature<MultiLineString>(new MultiLineString([data.coords]));
         newFeature.setId(data.id);
         newFeature.set('order', data.order);

         if (data.active) {
            source.addFeature(newFeature);
         }

         newFeatures.set(data.id, newFeature);
      }

      // Update old features with new order and properties
      for (const data of oldData) {
         const feature = source.getFeatureById(data.id) as Feature<MultiLineString> | undefined;

         if (feature) {
            feature.set('order', data.order);

            if (!data.active) {
               source.removeFeature(feature);
            }

            newFeatures.set(data.id, feature);
         } else {
            // If the feature is not found in the source, create a new one
            const newFeature = new Feature<MultiLineString>(new MultiLineString([data.coords]));
            newFeature.setId(data.id);
            newFeature.set('order', data.order);
            if (data.active) {
               source.addFeature(newFeature);
            }

            newFeatures.set(data.id, newFeature);
         }
      }

      setLastNavData([...navData.map(data => ({ ...data }))]);
      setFeatures(newFeatures);
      console.assert(navData.length === newFeatures.size, 'Mismatch between navData and newFeatures');

      pending.current = false;
   }


   return {
      source,
      modify,
      snap,
      layer,
   };
};

const useDraw = (source?: VectorSource<Feature>) => {
   const { map, setAddNav, triggerFlash } = useMapSubSettings(settings => ({
      map: settings.map,
      setAddNav: settings.setAddNav,
      triggerFlash: settings.triggerFlash
   }));
   const [draw, setDraw] = useState<Draw>();

   const updateDraw = useEvent((draw: Draw | undefined) => {
      setDraw(oldDraw => {
         if (oldDraw) {
            map.removeInteraction(oldDraw);
         }

         if (draw) {
            map.addInteraction(draw);
         }

         return draw;
      });
   });

   useEffect(() => {
      setAddNav(() => () => {
         const draw = new Draw({
            type: 'MultiLineString',
            source
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

   return { draw };
}

export const OlRouteLayer = memo(function OlRouteLayer({
   order,
   zIndex
}: {
   zIndex: number
} & OlLayerProp) {
   const [setNavData, map, setCancel, navData, updateNavProps, setFuelCurve, updateFuelPreset,
      setFuelUnit, setDeviationCurve, updateDeviationPreset, importNavRef, counterRef] = useMapSubSettings(settings => ([
         settings.setNavData,
         settings.map,
         settings.setCancel,
         settings.navData,
         settings.updateNavProps,
         settings.setFuelCurve,
         settings.updateFuelPreset,
         settings.setFuelUnit,
         settings.setDeviationCurve,
         settings.updateDeviationPreset,
         settings.importNavRef,
         settings.counterRef
      ]));
   const mapSettings = useSettings(settings => settings.map);

   const { source, layer } = useMap();
   const { draw } = useDraw(source);

   const greenMarkerImg = useRef<HTMLImageElement | null>(null);
   const redMarkerImg = useRef<HTMLImageElement | null>(null);
   const blueMarkerImg = useRef<HTMLImageElement | null>(null);

   const navRenderer = useEvent((coords: Coordinate[][], state: State, geom: MultiLineString) => {
      const context = state.context;

      const data = navData.find(data => data.id === state.feature.getId());

      if (!data) {
         return null;
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

         const { properties, waypoints } = data;
         const fullCoords = geom.getCoordinates()[0].map(coord => getPixelFromCoordinate(coord));

         // Draw Distance/cap
         //------------------------------
         for (let index = 0; index < Math.min(fullCoords.length, waypoints.length) - 1; index++) {
            const coord = fullCoords[index];

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

            const offset = ((angle < 0 && angle < -90) || (angle > 0 && angle < 90)) ? -mapSettings.markerSize * 0.25 : mapSettings.markerSize * 0.25;

            if (angle < -90 || angle > 90) {
               angle = angle - 180;
            }
            angle -= mapAngle

            const ch = Math.round(CH);
            const cDelta = Math.round(MH - CH);

            const maxSize = mapSettings.text.maxSize;

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


            const drawText_ = (text: string[], background: boolean, bottom: boolean, index: number): boolean => {
               context.save();

               context.lineJoin = 'round';
               context.strokeStyle = `rgba(${mapSettings.text.borderColor.red.toFixed(0)}, ${mapSettings.text.borderColor.green.toFixed(0)}, ${mapSettings.text.borderColor.blue.toFixed(0)}, ${mapSettings.text.borderColor.alpha})`;
               context.lineWidth = Math.floor(mapSettings.text.borderSize);
               context.font = `900 ${maxSize.toFixed(0)}px Inter-bold, sans-serif`;
               const text_str = text.join(' ');
               const textWidth = context.measureText(text_str).width;
               let drawned = false;

               if (text.length === 1) {
                  const textSize = Math.min(maxSize, maxSize * (distance - mapSettings.markerSize * 1.5) / textWidth);
                  context.font = `900 ${textSize.toFixed(0)}px Inter-bold, sans-serif`;

                  if (textSize >= mapSettings.text.minSize) {
                     drawned = true;

                     context.textAlign = "center";
                     context.translate(center[0], center[1]);
                     context.rotate(angle * Math.PI / 180);
                     context.translate(offset, (bottom
                        ? textSize + mapSettings.text.borderSize * 0.25 + index * maxSize
                        : -mapSettings.text.borderSize * 0.25 - 5 - index * maxSize));

                     if (background) {
                        context.strokeText(text_str, 0, 0);
                     } else {
                        context.fillStyle = `rgba(${mapSettings.text.color.red.toFixed(0)}, ${mapSettings.text.color.green.toFixed(0)}, ${mapSettings.text.color.blue.toFixed(0)}, ${mapSettings.text.color.alpha})`;
                        context.fillText(text_str, 0, 0);
                     }
                  }
               } else if (textWidth < (distance - mapSettings.markerSize * 1.5)) {
                  drawned = drawText_([text.join("  ")], background, bottom, 0)
               } else {
                  console.assert(index === 0);

                  let sub_index = 0;
                  for (const subtext of text) {
                     if (drawText_([subtext], background, bottom, sub_index)) {
                        ++sub_index;
                     }
                  }
               }

               context.restore();
               return drawned;
            }

            const drawText = (text: string[], background: boolean, bottom?: boolean, index?: number) => {
               drawText_(text, background, bottom ?? false, index ?? 0)
            }


            for (const background of [true, false]) {
               const hours_str = (days && (hours < 10) ? '0' : '') + hours.toString();
               const minutes_str = (minutes < 10 ? "0" : '') + minutes.toString();
               const delta_str = cDelta === 0 ? '' : `${(cDelta > 0 ? ' +' : ' ') + cDelta.toFixed()}`;
               const seconds_str = (seconds < 10 ? '0' : '') + seconds.toString();

               drawText([`${ch.toString() + delta_str}\u00b0 ${Math.round(dist).toString()} nm`,
               (days ? days.toString() + 'd ' : '')
               + ((days || hours) ? (hours_str + ":") : "")
               + ((days || hours || minutes) ? (minutes_str + ":") : "")
               + seconds_str], background);

               const from = waypoint + (waypoint.length && !nextWaypoint.length ? " →" : "");
               const to = (nextWaypoint.length ? "→ " : "") + nextWaypoint;

               drawText(["↑" + (altitude < 10000 ? altitude : "FL" + (altitude / 100).toFixed(0)),
               ...(from.length ? [from] : []),
               ...(to.length ? [to] : []),
               ...(remark.length ? ["@" + remark] : [])], background, true)
            }
         };

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

         for (const [index, coord] of fullCoords.entries()) {
            if (index > 0) {
               context.lineTo(coord[0], coord[1])

               if (index === firstActive) {
                  context.stroke()

                  context.strokeStyle = `rgb(31, 41, 55)`;
                  context.beginPath()
                  context.moveTo(coord[0], coord[1])
               }
            }
         }
         context.stroke();

         // Draw markers
         //------------------------------
         for (const [index, coord] of fullCoords.entries()) {
            const size = mapSettings.markerSize;

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
         }
      }
   });

   const onExportNav = useEvent((data: {
      id: number,
      name: string;
      shortName: string;
      order: number;
      active?: boolean,
      coords: number[][];
      properties: Properties[];
      waypoints: string[];
      loadedFuel: number;
      departureTime: number;
      taxiTime: number;
      taxiConso: number;
      link: string
   }[]) => {
      const idMap = new Map<number, number>();

      const newNavData = data
         .toSorted((left, right) => left.order - right.order)
         .map((data): NavData => {
            const id = ++counterRef.current;

            const result: NavData = {
               id,
               order: data.order,
               active: data.active ?? true,
               name: data.name,
               shortName: data.shortName,
               coords: data.coords.map(coords => ([...coords])),
               layer: layer!,
               departureTime: data.departureTime,
               taxiTime: data.taxiTime,
               taxiConso: data.taxiConso,
               link: data.link,
               loadedFuel: data.loadedFuel,
               waypoints: data.waypoints,
               properties: data.properties,
            }

            idMap.set(data.id, result.id);
            return result;
         })
         .map(elem => elem.link === 'None' ? elem : {
            ...elem,
            link: idMap.get(+elem.link)!.toString()
         })

      setNavData(newNavData);
   })

   useEffect(() => {
      importNavRef.current = onExportNav
   }, [importNavRef, onExportNav])

   useEffect(() => {
      layer?.setZIndex(zIndex);
   }, [zIndex, layer]);

   useEffect(() => {
      layer?.setStyle((feature: FeatureLike) => {
         const geom = feature.getGeometry();

         if (geom?.getType() === 'MultiLineString') {
            return [new Style({
               renderer: (coords, state) => navRenderer(coords as Coordinate[][], state, geom as MultiLineString)
            })]
         }

         return [];
      });
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
});