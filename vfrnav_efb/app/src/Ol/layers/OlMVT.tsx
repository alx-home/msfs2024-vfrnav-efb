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

import { MVT } from "ol/format";
import { OlLayer, OlLayerProp } from "./OlLayer";
import { useMemo, useContext } from 'react';
import { createXYZ } from "ol/tilegrid";
import VectorTileSource from 'ol/source/VectorTile';
import VectorTileLayer from "ol/layer/VectorTile";
import Style from "ol/style/Style";
import { MapContext } from "@pages/Map/MapContext";
import { Feature, VectorTile } from "ol";
import { Coordinate } from "ol/coordinate";
import { LineString, MultiLineString, SimpleGeometry } from "ol/geom";
import { toContext } from "ol/render";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";

export const OlMVTLayer = ({
  opacity,
  url,
  order,
  active,
  minZoom,
  maxZoom,
  clipAera
}: OlLayerProp & {
  url: string,
  opacity?: number
}) => {
  const { map } = useContext(MapContext)!;

  const source = useMemo(() => new VectorTileLayer({
    declutter: true,
    source: new VectorTileSource({
      format: new MVT(),
      tileGrid: createXYZ({
        minZoom: Math.max(12, minZoom ?? 12),
        maxZoom: Math.min(maxZoom ?? 15, 15)
      }),
      url: url,
    }),
    style: new Style({
      renderer: (coords_, state) => {
        const properties = (state.geometry as never)['properties_'];

        if (properties['layer'] === 'contour_ft') {
          const ctx = state.context;

          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2;

          const draw = (coords: Coordinate[]) => {
            ctx.beginPath()
            ctx.moveTo(coords[0][0], coords[0][1])
            for (const coord of coords) {
              ctx.lineTo(coord[0], coord[1])
            }

            ctx.stroke()
          }

          ctx.beginPath()

          const coords = (coords_ as Coordinate[]);
          const height = properties['height'] as number;
          if (typeof coords[0][0] === 'number') {
            draw(coords);

            if (coords.length > 1) {
              const index = Math.floor(coords.length / 2) - 1
              const center = [coords[index][0] + (coords[index + 1][0] - coords[index][0]) * 0.5, coords[index][1] + (coords[index + 1][1] - coords[index][1]) * 0.5]
              const angle = -Math.atan2(coords[index + 1][1] - coords[index][1], coords[index + 1][0] - coords[index][0])


              ctx.save()
              {
                ctx.lineJoin = 'round';
                ctx.fillStyle = 'white';
                ctx.font = "900 15px Inter-bold, sans-serif";
                ctx.textAlign = "center";
                ctx.translate(center[0], center[1]);
                ctx.rotate(angle);
                ctx.fillText(height.toString() + 'ft', 0, 0);
              }
              ctx.restore()
            }
          } else {
            console.assert(Array.isArray(coords[0][0]))

            for (const coord of (coords_ as Coordinate[][])) {
              draw(coord)
            }

          }
          const renderContext = toContext(ctx, {
            pixelRatio: 1,
          });

          renderContext.setFillStrokeStyle(new Fill(), new Stroke({
            color: '#FFFFFF',
            width: 2,
          }));
          renderContext.drawGeometry(state.geometry);
        }
      }
    })
  }), [maxZoom, minZoom, url]);
  return <OlLayer source={source} opacity={opacity} order={order} active={active} minZoom={minZoom} maxZoom={maxZoom} clipAera={clipAera} />;
};