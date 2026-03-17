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

import { OlLayer, OlLayerProp } from "./OlLayer";
import { useContext, useEffect, useMemo, useState, useRef, memo } from 'react';
import { Circle, Geometry, LineString, Point, Polygon, SimpleGeometry } from "ol/geom";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { Feature } from 'ol';

import VectorLayer from "ol/layer/Vector";

import { Interactive, MapContext } from "@pages/Map/MapContext";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import { Coordinate } from "ol/coordinate";
import { toContext } from "ol/render";
import { messageHandler } from "@Settings/SettingsProvider";
import { decodePlaneBlob, PlaneBlob, PlanePosContent, PlaneRecord } from "@shared/PlanPos";
import LayerGroup from "ol/layer/Group";
import { getLength } from "ol/sphere";

import { useEvent } from "react-use-event-hook";
import Text from "ol/style/Text";


let cancelToken: { current: boolean } | undefined = undefined;
const fetchRecord = async (record: PlaneRecord) => new Promise<PlanePosContent[]>((resolve, reject) => {
  if (cancelToken) {
    if (!cancelToken.current) {
      cancelToken.current = true;
      reject(new Error("Fetch cancelled"));
    }
  }
  cancelToken = { current: false };
  const timeout = setTimeout(() => {
    cancelToken!.current = true;
    reject(new Error("Fetch timeout"));
  }, 10000);

  const currentToken = cancelToken;

  const pending_blobs = new Set(record.blobs);
  const result: PlanePosContent[][] = record.blobs.map(() => []);

  // Receive blobs one by one, and resolve the promise when all blobs have been received
  // Blobs may be received in any order, so we keep track of pending blobs and their corresponding index in the result array
  const callback = (blob: PlaneBlob) => {
    if (currentToken.current) {
      // This fetch has been cancelled, we can ignore any received blobs
      // The promise has already been resolved with an empty array, so we don't need to do anything else
      return;
    }

    if (pending_blobs.has(blob.id)) {
      pending_blobs.delete(blob.id);
      result[record.blobs.indexOf(blob.id)] = decodePlaneBlob(blob.value, blob.version ?? 1);

      if (pending_blobs.size === 0) {
        currentToken.current = true;
        clearTimeout(timeout);

        // All blobs have been received, we can resolve the promise with the complete result
        messageHandler.unsubscribe('__PLANE_BLOB__', callback)
        resolve(result.flat());
      }
    }
  }

  messageHandler.subscribe('__PLANE_BLOB__', callback)

  for (const blob of record.blobs) {
    messageHandler.send({
      __GET_PLANE_BLOB__: true,

      id: blob
    })
  }
});

export const RecordsLayer = memo(function RecordsLayer({
  opacity,
  order,
  active,
  minZoom,
  maxZoom,
  clipAera
}: OlLayerProp & {
  opacity?: number
}) {
  const {
    map,
    profileScale, profileRange, profileSlope1, profileSlope2, profileSlopeOffset1, profileSlopeOffset2, profileOffset, profileRule1, profileRule2,
    recordsCenter, records: records_, currentRecord, setCurrentRecord,
    withTouchdown, withGround,
  } = useContext(MapContext)!;
  const records = useMemo(() => records_.filter(record => record.active), [records_]);
  const [mapSize, setMapSize] = useState<number[] | undefined>(undefined);
  const [zoom, setZoom] = useState(1);

  const center = useMemo(() => {
    if (mapSize) {
      const zoom = getLength(new LineString([map.getCoordinateFromPixel([0, 0]), map.getCoordinateFromPixel([mapSize[0], mapSize[1]])])) * 4;
      setZoom(zoom);

      return map.getCoordinateFromPixel([mapSize[0] * (0.5 + (recordsCenter.x - 0.5) * 200), mapSize[1] * (0.5 + (recordsCenter.y - 0.5) * 200)]);
    } else {
      return undefined;
    }
  }, [map, mapSize, recordsCenter.x, recordsCenter.y])


  const lastNavData = useRef<[number, PlanePosContent[]][]>(undefined);
  const navPath = useMemo(() => currentRecord
    .map(data => {
      const feature = new Feature(new LineString(data.map(pos => fromLonLat([pos.lon, pos.lat]))))
      feature.setStyle(new Style({
        renderer(coords_, state) {
          const ctx = state.context;
          const geometry = state.geometry.clone() as SimpleGeometry;
          geometry.setCoordinates(coords_);

          const renderContext = toContext(ctx, {
            pixelRatio: 1,
          });

          renderContext.setFillStrokeStyle(new Fill(), new Stroke({
            color: '#FFFFFF',
            width: 6,
          }));
          renderContext.drawGeometry(geometry);
          renderContext.setFillStrokeStyle(new Fill({}), new Stroke({
            color: 'rgba(0, 153, 255, 1)',
            width: 4,
          }));
          renderContext.drawGeometry(geometry);
        }
      }))
      return feature;
    }), [currentRecord]);

  const profile = useMemo(() => currentRecord
    .reduce((result, data) => {
      const features = (() => {
        const res = 0.30480 / profileScale;

        const coords = data
          .filter((_coord, index) =>
            (index >= profileRange.min * data.length)
            && (index < profileRange.max * data.length)
          ).map(elem => [
            ...fromLonLat([elem.lon, elem.lat]),
            Math.max(0, ((withGround ? elem.altitude : elem.altitude - elem.ground) - profileOffset) * res) / 3.28084,
            Math.max(0, (elem.ground - profileOffset) * res) / 3.28084,
            elem.verticalSpeed,
            elem.windVelocity,
            elem.windDirection,
            elem.indicatedAirSpeed ?? -1,
            elem.trueAirSpeed ?? -1,
            elem.groundVelocity ?? -1,
            elem.heading,
          ]);
        const features: Feature[] = [];
        const polygonStyle = new Style({
          fill: new Fill({
            color: 'rgba(0, 153, 255, 0.4)',
          }), stroke: new Stroke({
            color: 'transparent',
          })
        });

        if (!center || (coords.length === 0)) {
          return features;
        }

        const getVec = (coord: Coordinate, height: number) => {
          const vec = [coord[0] - center[0], coord[1] - center[1]]

          vec[0] *= height / (Math.max(0.0000001, zoom - height));
          vec[1] *= height / (Math.max(0.0000001, zoom - height));

          return vec;
        }

        for (let j = 0; j < (withGround ? 2 : 1); ++j) {
          let vecA: Coordinate = getVec(coords[0], coords[0][j + 2]);

          let begIndex = 0;
          let segment: Coordinate[] = [];
          let sign = 0;

          for (let i = 0; i < coords.length; ++i) {
            const coord = coords[i] as Coordinate
            const vecB = getVec(coord, coord[j + 2]);
            const signB = vecB[0] * vecA[1] - vecB[1] * vecA[0];

            if (signB * sign < 0) {
              // Curvature change => Close Polygon

              console.assert(i > 0);
              console.assert(segment.length !== 0);

              const last = segment[segment.length - 1];
              for (let k = i; k >= begIndex; --k) {
                segment.push([coords[k][0], coords[k][1]])
              }
              segment.push(segment[0].toSpliced(2))
              const feature = new Feature(new Polygon([segment]))
              feature.setStyle(polygonStyle);
              features.push(feature)

              segment = [last.toSpliced(2)];
              begIndex = i - 1;
              sign = 0;
            } else {
              sign = signB;
            }

            segment.push([coord[0] + vecB[0], coord[1] + vecB[1]])
            vecA = vecB;
          }

          if (segment.length) {
            // Close last Polygon

            const i = coords.length - 1;
            console.assert(i > 0);

            for (let k = i; k >= begIndex; --k) {
              segment.push([coords[k][0], coords[k][1]])
            }
            segment.push(segment[0].toSpliced(2))

            const feature = new Feature(new Polygon([segment]))
            feature.setStyle(polygonStyle);
            features.push(feature)
          }

          // Draw bounds
          segment = []
          for (const element of coords) {
            const coord = element as Coordinate
            const vec = getVec(coord, coord[j + 2]);

            segment.push([coord[0] + vec[0], coord[1] + vec[1]])
          }

          const feature = new Feature(new LineString(segment));
          feature.setStyle(new Style({
            fill: new Fill(), stroke: new Stroke({
              color: 'rgba(255, 255, 255, ' + (j === 0 ? '1' : '0.4') + ')',
              width: 1,
            })
          }))
          features.push(feature)
        }

        const fullDistance = coords.reduce((result, coord, index) =>
          result + (
            index === 0
              ? 0
              : Math.sqrt(Math.pow(coords[index - 1][0] - coord[0], 2) + Math.pow(coords[index - 1][1] - coord[1], 2))
          ), 0)


        const drawRule = (color: string, profileSlopeOffset: number, profileSlope: number, profileRule: number) => {
          const segment: Coordinate[] = [];
          let dist = -fullDistance * profileSlopeOffset / 100;
          let lastDist = dist;
          let lastCoord: Coordinate | undefined = undefined;
          const slope = Math.atan(profileSlope * Math.PI / 180);
          for (const element of coords) {
            if (lastCoord) {
              dist += Math.sqrt(Math.pow(element[0] - lastCoord[0], 2) + Math.pow(element[1] - lastCoord[1], 2))
            }
            lastCoord = element;

            const coord = element as Coordinate
            const vec = getVec(coord, res * Math.max(0, profileRule + profileOffset + slope * dist - profileOffset));
            const vec2 = getVec(coord, coord[2]);

            segment.push([coord[0] + vec[0], coord[1] + vec[1]])

            const addPoint = (coord: [number, number]) => {
              const point = new Feature({
                geometry: new Circle([coord[0], coord[1]], 50)
              });
              point.setStyle(new Style({
                fill: new Fill({
                  color: 'rgba(' + color + ', 0.8)',
                }), stroke: new Stroke({
                  color: 'rgba(255, 255, 255, 0.8)',
                  width: 1.5,
                })
              }))
              features.push(point)
            }

            if ((lastDist < 0) && (dist >= 0)) {
              addPoint([coord[0] + vec[0], coord[1] + vec[1]])
              addPoint([coord[0], coord[1]])
              addPoint([coord[0] + vec2[0], coord[1] + vec2[1]])

              const textFeature = new Feature({
                geometry: new Point([coord[0] + vec2[0], coord[1] + vec2[1]])
              });

              const groundAlt = coord[3] * 3.28084 / res + profileOffset;
              const alt = coord[2] * 3.28084 / res + profileOffset + (withGround ? 0 : groundAlt);
              textFeature.setStyle(
                new Style({
                  text: new Text({
                    text: 'AMSL: ' + alt.toFixed(0) + ' ft\n'
                      + 'AGL: ' + (alt - groundAlt).toFixed(0) + ' ft\n'
                      + 'HDG: ' + coord[10].toFixed(0) + '°\n'
                      + 'Wind: ' + coord[5].toFixed(0) + 'kts @' + coord[6].toFixed(0) + '°\n'
                      + '\nVSpeed: ' + (coord[4] * 60).toFixed(0) + ' ft/min\n'
                      + (coord[7] !== -1 ? ('IAS: ' + coord[7].toFixed(0) + ' kts\n') : '')
                      + (coord[8] !== -1 ? ('TAS: ' + coord[8].toFixed(0) + ' kts\n') : '')
                      + (coord[9] !== -1 ? ('GS: ' + coord[9].toFixed(0) + ' kts') : ''),
                    font: '16px Calibri,sans-serif',
                    fill: new Fill({ color: '#FFF' }),
                    padding: [6, 10, 6, 10],
                    backgroundFill: new Fill({ color: 'rgba(' + color + ', 0.5)' }),
                    backgroundStroke: new Stroke({ color: 'rgba(' + color + ', 0.8)', width: 2 }),
                    textAlign: 'left',
                    textBaseline: 'bottom',

                    offsetY: -17,
                    offsetX: 22
                  })
                })
              );
              features.push(textFeature);

            };

            lastDist = dist;
          }

          const feature = new Feature(new LineString(segment));
          feature.setStyle(new Style({
            fill: new Fill(), stroke: new Stroke({
              color: 'rgba(' + color + ', 1)',
              width: 2,
            })
          }))
          features.push(feature)
        }

        drawRule('255, 0, 0', profileSlopeOffset1, profileSlope1, profileRule1 / 3.28084);
        drawRule('0, 255, 0', profileSlopeOffset2, profileSlope2, profileRule2 / 3.28084);

        return features;
      })();

      return [...result, features] as Feature[][];
    }, [] as Feature[][]), [currentRecord, profileScale, center, profileRange.min, profileRange.max, withGround, profileOffset, zoom, profileSlopeOffset1, profileSlope1, profileRule1, profileSlopeOffset2, profileSlope2, profileRule2]);

  const projectionSource = useMemo(() => new VectorSource<Feature<Geometry>>({}), []);
  const pathSource = useMemo(() => new VectorSource<Feature<Geometry>>({}), []);
  const [touchDownSource, setTouchDownSource] = useState(new VectorSource<Feature<Geometry>>({
    features: [],
  }));

  const projectionLayer = useMemo(() => new VectorLayer(), []);

  const onDrag = useEvent((event) => {
    const size = event.map.getSize();
    if (size) {
      if (size[0] !== mapSize?.[0] || size[1] !== mapSize?.[1]) {
        setMapSize([size[0], size[1]]);
      }
    } else {
      setMapSize(undefined);
    }
    return true;
  });
  const pathLayer = useMemo(() => {
    const vector = new VectorLayer() as VectorLayer & Interactive;

    vector.onDrag = onDrag;
    return vector
  }, [onDrag]);


  const touchdownLayer = useMemo(() => new VectorLayer({
    style: new Style({
      renderer(coords_, state) {
        const ctx = state.context;
        const geometry = state.geometry.clone() as SimpleGeometry;
        geometry.setCoordinates(coords_);

        const x = (coords_ as Coordinate)[0];
        const y = (coords_ as Coordinate)[1];

        ctx.save()
        {
          ctx.beginPath();
          ctx.fillStyle = "rgba(0, 153, 255, 0.4)"
          ctx.strokeStyle = "#FFFFFF"
          ctx.lineWidth = 2
          ctx.arc(x, y, 50, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();

          const speed = state.feature.get("speed") as number;
          ctx.font = "15px Inter-bold, sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#FFFFFF"

          ctx.translate(x, y);
          ctx.rotate(-map.getView().getRotation())
          ctx.fillText(speed.toFixed(0) + "ft/min", 0, 4)// @todo parameters
        }
        ctx.restore()
      }
    }),
  }), [map]);

  const group = useMemo(() => new LayerGroup({
    layers: [
      pathLayer,
      projectionLayer,
      touchdownLayer
    ]
  }), [touchdownLayer, projectionLayer, pathLayer])

  const fetching = useRef(0);
  const navDataPromise = useRef(Promise.resolve());
  const updateNavData = useEvent(async () => {
    if (fetching.current !== 0) {
      // Already fetching nav data for a previous change, we can skip this update
      return;
    }

    ++fetching.current;

    const newData: Promise<PlanePosContent[]>[] = [];

    const activeRecords = records.filter(record => record.active);
    for (const record of activeRecords) {
      const oldData = lastNavData.current?.find(([id,]) => id === record.id)
      if (oldData) {
        // Record already exists, we can keep its data
        newData.push(Promise.resolve(oldData[1]));
      } else {
        // New record, we need to fetch its data
        newData.push(fetchRecord(record));
      }
    }

    console.assert(newData.length === activeRecords.length);
    Promise.all(newData).then(results => {
      lastNavData.current = activeRecords.map((record, index) => [record.id, results[index]]);
      const touchdowns = activeRecords
        .map((record, index) => {
          const data = results[index];
          const pos = data[data.length - 1];
          const coords = fromLonLat([pos.lon, pos.lat])

          const feature = new Feature(new Point(coords));
          feature.set("speed", record.touchdown);
          return feature;
        });

      setCurrentRecord(results);
      setTouchDownSource(
        new VectorSource<Feature<Geometry>>({
          features: touchdowns
        })
      );
    }).catch(error => {
      console.error("Error fetching nav data", error);
    }).finally(() => {
      --fetching.current;
    });
  });

  // Update nav data when records change if :
  // - We are not already fetching nav data for a previous change
  // - The number of active records has changed
  // - Or if there is at least one active record that was not present in the previous nav data
  // - Or if there is at least one record that was present in the previous nav data but is not active anymore
  useEffect(() => {
    if ((fetching.current === 0) &&
      ((records.filter(record => record.active).length !== lastNavData.current?.length)
        || records.some((record) => record.active && !lastNavData.current!.find(([id,]) => id === record.id))
        || records.some((record) => !record.active && lastNavData.current!.find(([id,]) => id === record.id)))) {
      navDataPromise.current = navDataPromise.current.then(updateNavData);
    }
  }, [records, updateNavData])

  useEffect(() => {
    projectionLayer.setSource(projectionSource)
  }, [projectionLayer, projectionSource])

  useEffect(() => {
    pathLayer.setSource(pathSource)
  }, [pathLayer, pathSource])

  useEffect(() => {
    (async () => {
      projectionSource.clear();
      projectionSource.addFeatures([...profile.reduce((result, elem) => [...result, ...elem], [])])
    })()
  }, [profile, projectionSource])

  useEffect(() => {
    pathSource.clear();
    pathSource.addFeatures(navPath)
  }, [navPath, pathSource])

  useEffect(() => {
    (async () => {
      if (withTouchdown) {
        touchdownLayer.setSource(touchDownSource)
      } else {
        touchdownLayer.setSource(new VectorSource());
      }
    })()
  }, [touchDownSource, touchdownLayer, withTouchdown])


  return <OlLayer key={"airports"} source={group} opacity={opacity} order={order} active={active} minZoom={minZoom} maxZoom={maxZoom} clipAera={clipAera} />
});
