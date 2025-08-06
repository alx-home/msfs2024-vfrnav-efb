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
import { Coordinate } from "ol/coordinate";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { messageHandler, SettingsContext } from "@Settings/SettingsProvider";
import { MapContext } from "@pages/Map/MapContext";

import greenMarker from '@efb-images/marker-icon-green.svg';
import redMarker from '@efb-images/marker-icon-red.svg';
import blueMarker from '@efb-images/marker-icon-blue.svg';
import { ExportNav, PropertiesRecord } from "@shared/NavData";
import { NavData } from "@pages/Map/MapMenu/Menus/Nav";


const useMap = () => {
   const { defaultSpeed } = useContext(SettingsContext)!;
   const { map, navData, setNavData, counter, updateNavProps } = useContext(MapContext)!;
   const [modify, setModify] = useState<Modify>();
   const [snap, setSnap] = useState<Snap>();
   const [layer, setLayer] = useState<VectorLayer>();
   const [modified, setModified] = useState<Feature<MultiLineString>[] | undefined>(undefined);

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

      const features: Feature[] = [];

      navData.forEach(data => {
         const feature = new Feature<MultiLineString>(new MultiLineString([data.coords]));
         initFeature(feature);
         features.push(feature)

         data.id = feature.getId() as number;
      })

      source.addFeatures(features);
      setNavData(navData);

      return () => { map.removeLayer(layer) };
   }, [source, map]);

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
   const { setNavData, counter, map, setCancel, navData, updateNavProps, setFuelConsumption, setFuelUnit, setDeviations } = useContext(MapContext)!;
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

               const properties = data.properties;
               const waypoints = data.waypoints;

               const geometry = state.geometry.clone() as SimpleGeometry;
               geometry.setCoordinates(coords);

               if (geometry.getType() === 'MultiLineString') {
                  const coords_ = (coords as Coordinate[][])[0];

                  // Draw Distance/cap
                  //------------------------------
                  coords_.filter((_, index) => index !== coords_.length - 1).forEach((coord, index) => {
                     const nextCoord = coords_[index + 1];

                     const vector = [nextCoord[0] - coord[0], nextCoord[1] - coord[1]];
                     const mapRotation = map.getView().getRotation();

                     const getCoordinateFromPixel = (coord: Coordinate) => {
                        return map.getCoordinateFromPixel([coord[0] * Math.cos(mapRotation) - coord[1] * Math.sin(mapRotation), coord[0] * Math.sin(mapRotation) + coord[1] * Math.cos(mapRotation)])
                     };

                     const props = updateNavProps(properties[index], getCoordinateFromPixel(coord), getCoordinateFromPixel(nextCoord));
                     const { CH, TC, dist, dur, remark } = props;
                     const waypoint = waypoints[index];
                     const nextWaypoint = waypoints[index + 1];
                     const { days, hours, minutes, seconds } = dur;

                     let angle = TC - 90;
                     let mag = 90 + angle;

                     if (mag < 0) {
                        mag += 360;
                     }

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


                     const distance = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);

                     const ch = Math.round(CH);
                     const cDelta = Math.round(CH - TC);

                     const maxSize = settings.map.text.maxSize;

                     const center = [(coord[0] + nextCoord[0]) >> 1, (coord[1] + nextCoord[1]) >> 1];

                     const drawText = (text: string, bottom?: boolean) => {
                        context.save();

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
                           context.translate(offset, ((bottom ?? false) ? textSize * 0.5 + 7 + settings.map.text.borderSize * 0.25 : -settings.map.text.borderSize * 0.25 - 5));

                           context.strokeText(text, 0, 0);

                           context.fillStyle = `rgba(${settings.map.text.color.red.toFixed(0)}, ${settings.map.text.color.green.toFixed(0)}, ${settings.map.text.color.blue.toFixed(0)}, ${settings.map.text.color.alpha})`;
                           context.fillText(text, 0, 0);
                        }

                        context.restore();
                     }

                     drawText(ch.toString() + (cDelta === 0 ? '' : (cDelta > 0 ? ' +' : ' ') + cDelta.toFixed() + '') + "\u00b0 "
                        + Math.round(dist).toString() + " nm  "
                        + (days ? days.toString() + 'd ' : '')
                        + ((days || hours) ? ((days && (hours < 10) ? '0' : '') + hours.toString() + ":") : "")
                        + ((days || hours || minutes) ? ((minutes < 10 ? "0" : '') + minutes.toString() + ":") : "")
                        + (seconds < 10 ? '0' : '') + seconds.toString());

                     drawText(waypoint + (waypoint.length || nextWaypoint.length ? " -> " : '') + nextWaypoint
                        + (remark.length ? " @" + remark : ""), true)
                  });

                  // Draw lines Background
                  //------------------------------
                  context.lineWidth = 5;
                  context.strokeStyle = `rgb(255, 255, 255)`;
                  context.beginPath()
                  context.moveTo(coords_[0][0], coords_[0][1])
                  coords_.forEach((coord, index) => {
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
                  context.moveTo(coords_[0][0], coords_[0][1])
                  coords_.forEach((coord, index) => {
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
                  coords_.forEach((coord, index) => {
                     const size = settings.map.markerSize;

                     context.save();
                     {
                        context.translate(coord[0], coord[1]);
                        context.rotate(-map.getView().getRotation())
                        if (index === 0) {
                           // First Coord
                           context.drawImage(greenMarkerImg.current!, -size / 2, -size, size, size);
                        } else if (index === coords_.length - 1) {
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
         const onExportNav = (message: ExportNav) => {
            source.clear();

            const features: Feature[] = [];
            const data = message.data.map((data): NavData => {
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
            setNavData(data);
            setFuelConsumption(message.fuelConsumption)
            setFuelUnit(message.fuelUnit)
            setDeviations(message.deviations)
         };

         messageHandler.subscribe("__EXPORT_NAV__", onExportNav)
         return () => messageHandler.unsubscribe("__EXPORT_NAV__", onExportNav);
      }
   }, [counter, initFeature, layer, navData, setDeviations, setFuelConsumption, setFuelUnit, setNavData, source])

   return <div className="hidden">
      <img ref={greenMarkerImg} src={greenMarker} alt='start marker' />
      <img ref={redMarkerImg} src={redMarker} alt='destination marker' />
      <img ref={blueMarkerImg} src={blueMarker} alt='intermediate marker' />
   </div>;
};