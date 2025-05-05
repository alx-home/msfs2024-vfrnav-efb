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
import { useContext, useEffect, useMemo } from "react";
import { Geometry, LineString, Point, Polygon, SimpleGeometry } from "ol/geom";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { Feature } from 'ol';

import VectorLayer from "ol/layer/Vector";

import { MapContext } from "@pages/Map/MapContext";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import { Coordinate } from "ol/coordinate";
import { toContext } from "ol/render";
import { messageHandler } from "@Settings/SettingsProvider";
import { PlanePoses } from "../../../../shared/PlanPos";
import LayerGroup from "ol/layer/Group";

const getNorm = (a: Coordinate, b: Coordinate) => {
  const ab = [b[0] - a[0], b[1] - a[1]];
  const nab = Math.sqrt(ab[0] * ab[0] + ab[1] * ab[1]);

  const norm = [-ab[1] / nab, ab[0] / nab];

  return norm;
}

const fetchRecord = async (id: number) => new Promise<PlanePoses>(resolve => {
  const callback = (poses: PlanePoses) => {
    if (poses.id === id) {
      messageHandler.unsubscribe('PlanePoses', callback)
      resolve(poses)
    }
  }

  messageHandler.subscribe('PlanePoses', callback)
  messageHandler.send({
    mType: 'GetRecord',
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
  // const { setPopup } = useContext(SettingsContext)!;
  const { profileScale, records: records_, withTouchdown, withGround } = useContext(MapContext)!;
  const records = useMemo(() => records_.filter(record => record.active), [records_]);

  const navData = useMemo(() => records.map(record => fetchRecord(record.id)), [records]);

  const navPath = useMemo(() => navData
    .map(async data => new Feature(new LineString((await data).value.map(pos => fromLonLat([pos.lon, pos.lat]))))), [navData]);

  const profile = useMemo(() => navData
    .reduce((result, data) => {
      const elems = (async () => {
        const res = 0.30480 / profileScale;

        const coords = (await data).value.map(elem => [...fromLonLat([elem.lon, elem.lat]), elem.altitude, elem.ground]);
        const elems: Coordinate[][][] = [[], []];
        for (let j = 0; j < (withGround ? 2 : 1); ++j) {
          let start: Coordinate | undefined;

          for (let i = 1; i < coords.length; ++i) {
            const a = coords[i - 1] as Coordinate
            const b = coords[i] as Coordinate

            const segment: Coordinate[] = [];

            segment.push(a.toSpliced(2))

            let norm = getNorm(a, b);

            if (!start) {
              start = norm;
            }

            const na = a[j + 2] - (withGround ? 0 : a[j + 3]);
            segment.push([a[0] + start[0] * na * res, a[1] + start[1] * na * res])

            if (i < coords.length - 1) {
              const c = coords[i + 1] as Coordinate
              const norm2 = getNorm(b, c);

              norm = [norm2[0] + norm[0], norm2[1] + norm[1]];
              const d = Math.sqrt(norm[0] * norm[0] + norm[1] * norm[1]);
              norm = [norm[0] / d, norm[1] / d];
            }

            start = norm;
            const nb = b[j + 2] - (withGround ? 0 : b[j + 3]);
            segment.push([b[0] + start[0] * nb * res, b[1] + start[1] * nb * res])
            segment.push(b.toSpliced(2))
            segment.push(a.toSpliced(2))

            elems[j].push(segment)
          }
        }

        return elems.reduce((result, profile) => [...result, ...profile.map(elem => new Feature(new Polygon([elem])))], [] as Feature[]);
      })();

      return [...result, elems] as Promise<Feature[]>[];
    }, [] as Promise<Feature[]>[]), [navData, profileScale, withGround]);

  const touchDowns = useMemo(() => records
    .map(async (record, index) => {
      const data = (await navData[index]).value;
      const pos = data[data.length - 1];
      const coords = fromLonLat([pos.lon, pos.lat])

      const feature = new Feature(new Point(coords));
      feature.set("speed", record.touchdown);
      return feature;
    }), [navData, records]);

  const vectorSource = useMemo(async () => new VectorSource<Feature<Geometry>>({
    features: [
      ...await Promise.all(navPath),
      ...(await Promise.all(profile)).reduce((result, elem) => [...result, ...elem], []),
    ],
  }), [navPath, profile]);
  const touchDownSource = useMemo(async () => new VectorSource<Feature<Geometry>>({
    features: [...await Promise.all(touchDowns)],
  }), [touchDowns]);

  const vectorLayer = useMemo(() => new VectorLayer({
    style: new Style({
      renderer(coords_, state) {
        const ctx = state.context;
        const geometry = state.geometry.clone() as SimpleGeometry;
        geometry.setCoordinates(coords_);

        const renderContext = toContext(ctx, {
          pixelRatio: 1,
        });

        if (geometry instanceof Polygon) {
          renderContext.setFillStrokeStyle(new Fill({
            color: 'rgba(0, 153, 255, 0.4)',
          }), new Stroke({
            color: 'transparent',
          }));
          renderContext.drawGeometry(geometry);
        } else {
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
      }
    }),
  }), []);

  const touchdownLayer = useMemo(() => new VectorLayer({
    style: new Style({
      renderer(coords_, state) {
        const ctx = state.context;
        const geometry = state.geometry.clone() as SimpleGeometry;
        geometry.setCoordinates(coords_);

        const x = (coords_ as Coordinate)[0];
        const y = (coords_ as Coordinate)[1];

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
        ctx.fillText(speed.toFixed(0) + "ft/min", x, y + 4)// @todo parameters
      }
    }),
  }), []);

  const group = useMemo(() => new LayerGroup({
    layers: [
      vectorLayer,
      touchdownLayer
    ]
  }), [touchdownLayer, vectorLayer])

  useEffect(() => {
    (async () => {
      vectorLayer.setSource(await vectorSource)
    })()
  }, [vectorLayer, vectorSource])

  useEffect(() => {
    (async () => {
      if (withTouchdown) {
        touchdownLayer.setSource(await touchDownSource)
      } else {
        touchdownLayer.setSource(new VectorSource());
      }
    })()
  }, [touchDownSource, touchdownLayer, vectorLayer, vectorSource, withTouchdown])

  return <OlLayer key={"airports"} source={group} opacity={opacity} order={order} active={active} minZoom={minZoom} maxZoom={maxZoom} clipAera={clipAera} />
};


