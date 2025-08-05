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
import { useContext, useEffect, useMemo, useState } from 'react';
import { Geometry, LineString, Point, Polygon, SimpleGeometry } from "ol/geom";
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
import { PlanePoses } from "@shared/PlanPos";
import LayerGroup from "ol/layer/Group";
import { getLength } from "ol/sphere";

const fetchRecord = async (id: number) => new Promise<PlanePoses>(resolve => {
  const callback = (poses: PlanePoses) => {
    if (poses.id === id) {
      messageHandler.unsubscribe('__PLANE_POSES__', callback)
      resolve(poses)
    }
  }

  messageHandler.subscribe('__PLANE_POSES__', callback)
  messageHandler.send({
    __GET_RECORD__: true,

    id: id
  })
})

export const RecordsLayer = ({
  opacity,
  order,
  active,
  minZoom,
  maxZoom,
  clipAera
}: OlLayerProp & {
  opacity?: number
}) => {
  const { map, profileScale, profileSlope1, profileSlope2, profileSlopeOffset1, profileSlopeOffset2, profileOffset, recordsCenter, profileRule1, profileRule2, records: records_, withTouchdown, withGround } = useContext(MapContext)!;
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

  const navData = useMemo(() => records.map(record => fetchRecord(record.id)), [records]);

  const navPath = useMemo(() => navData
    .map(async data => {
      const feature = new Feature(new LineString((await data).value.map(pos => fromLonLat([pos.lon, pos.lat]))))
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
    }), [navData]);

  const profile = useMemo(() => navData
    .reduce((result, data) => {
      const features = (async () => {
        const res = 0.30480 / profileScale;

        const coords = (await data).value.map(elem => [...fromLonLat([elem.lon, elem.lat]),
        Math.max(0, ((withGround ? elem.altitude : elem.altitude - elem.ground) - profileOffset) * res),
        Math.max(0, (elem.ground - profileOffset) * res)]);
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
              console.assert(segment.length);

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
        // Draw rule 1
        {
          const segment: Coordinate[] = [];
          let dist = -fullDistance * profileSlopeOffset1 / 100;
          let lastCoord: Coordinate | undefined = undefined;
          const slope = Math.atan(profileSlope1 * Math.PI / 180);
          for (const element of coords) {
            if (lastCoord) {
              dist += Math.sqrt(Math.pow(element[0] - lastCoord[0], 2) + Math.pow(element[1] - lastCoord[1], 2))
            }
            lastCoord = element;

            const coord = element as Coordinate
            const vec = getVec(coord, res * Math.max(0, profileRule1 + slope * dist - profileOffset));

            segment.push([coord[0] + vec[0], coord[1] + vec[1]])
          }

          const feature = new Feature(new LineString(segment));
          feature.setStyle(new Style({
            fill: new Fill(), stroke: new Stroke({
              color: 'rgba(255, 0, 0, 1)',
              width: 2,
            })
          }))
          features.push(feature)
        }

        // Draw rule 2
        {
          const segment: Coordinate[] = [];
          let dist = -fullDistance * profileSlopeOffset2 / 100;
          let lastCoord: Coordinate | undefined = undefined;
          const slope = Math.atan(profileSlope2 * Math.PI / 180);
          for (const element of coords) {
            if (lastCoord) {
              dist += Math.sqrt(Math.pow(element[0] - lastCoord[0], 2) + Math.pow(element[1] - lastCoord[1], 2))
            }
            lastCoord = element;

            const coord = element as Coordinate
            const vec = getVec(coord, res * Math.max(0, profileRule2 + slope * dist - profileOffset));

            segment.push([coord[0] + vec[0], coord[1] + vec[1]])
          }

          const feature = new Feature(new LineString(segment));
          feature.setStyle(new Style({
            fill: new Fill(), stroke: new Stroke({
              color: 'rgba(0, 255, 0, 1)',
              width: 2,
            })
          }))
          features.push(feature)
        }

        return features;
      })();

      return [...result, features] as Promise<Feature[]>[];
    }, [] as Promise<Feature[]>[]), [navData, profileScale, center, withGround, profileOffset, zoom, profileSlopeOffset1, profileSlope1, profileRule1, profileSlopeOffset2, profileSlope2, profileRule2]);

  const touchDowns = useMemo(() => records
    .map(async (record, index) => {
      const data = (await navData[index]).value;
      const pos = data[data.length - 1];
      const coords = fromLonLat([pos.lon, pos.lat])

      const feature = new Feature(new Point(coords));
      feature.set("speed", record.touchdown);
      return feature;
    }), [navData, records]);

  const projectionSource = useMemo(() => new VectorSource<Feature<Geometry>>({}), []);
  const pathSource = useMemo(() => new VectorSource<Feature<Geometry>>({}), []);
  const touchDownSource = useMemo(async () => new VectorSource<Feature<Geometry>>({
    features: [...await Promise.all(touchDowns)],
  }), [touchDowns]);

  const projectionLayer = useMemo(() => new VectorLayer(), []);

  const pathLayer = useMemo(() => {
    const vector = new VectorLayer() as VectorLayer & Interactive;

    vector.onDrag = (event) => {
      const size = event.map.getSize();
      if (size) {
        setMapSize([size[0], size[1]]);
      } else {
        setMapSize(undefined);
      }
      return true;
    }
    return vector
  }, []);


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

  useEffect(() => {
    projectionLayer.setSource(projectionSource)
  }, [projectionLayer, projectionSource])

  useEffect(() => {
    pathLayer.setSource(pathSource)
  }, [pathLayer, pathSource])

  useEffect(() => {
    (async () => {
      projectionSource.clear();
      projectionSource.addFeatures([...(await Promise.all(profile)).reduce((result, elem) => [...result, ...elem], [])])
    })()
  }, [profile, projectionSource])

  useEffect(() => {
    (async () => {
      pathSource.clear();
      pathSource.addFeatures(await Promise.all(navPath))
    })()
  }, [navPath, pathSource])

  useEffect(() => {
    (async () => {
      if (withTouchdown) {
        touchdownLayer.setSource(await touchDownSource)
      } else {
        touchdownLayer.setSource(new VectorSource());
      }
    })()
  }, [touchDownSource, touchdownLayer, withTouchdown])


  return <OlLayer key={"airports"} source={group} opacity={opacity} order={order} active={active} minZoom={minZoom} maxZoom={maxZoom} clipAera={clipAera} />
};


