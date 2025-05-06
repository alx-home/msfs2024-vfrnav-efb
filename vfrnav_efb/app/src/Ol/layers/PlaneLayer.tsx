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
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";

import Style from "ol/style/Style";
import VectorLayer from "ol/layer/Vector";

import { Interactive, MapContext } from "@pages/Map/MapContext";
import { Coordinate } from "ol/coordinate";

import { messageHandler } from "@Settings/SettingsProvider";
import { PlanePos } from '@shared/PlanPos';

import PlaneImg from '@efb-images/plane.svg';

export const PlaneLayer = ({
  opacity,
  order,
  active,
  minZoom,
  maxZoom,
  clipAera
}: OlLayerProp & {
  opacity?: number
}) => {
  const { map } = useContext(MapContext)!;
  const vectorSource = useMemo(() => new VectorSource<Feature<Point>>({}), []);
  const [pos, setPos] = useState<PlanePos>({
    __PLANE_POS__: true,

    date: Date.now(),
    lon: 2.3941664695739746, lat: 47.48055648803711,
    heading: 45,
    altitude: 3000,
    ground: 100,
    verticalSpeed: 0,
    windDirection: 0,
    windVelocity: 0
  });

  const PlaneIcon = useRef<HTMLImageElement | null>(null);

  const elemStyle = useCallback((angle: number) => new Style({
    renderer(coordinates, state) {
      const [x, y] = coordinates as Coordinate;
      const ctx = state.context;
      const radius = 15;

      ctx.save()
      {
        ctx.translate(x, y)
        ctx.rotate(angle * Math.PI / 180)
        ctx.drawImage(PlaneIcon.current!, - radius, - radius, 2 * radius, 2 * radius)
      }
      ctx.restore();
    }
  }), []);

  // Layer displaying the clusters and individual features.
  const vectorLayer = useMemo(() => new VectorLayer({
    source: vectorSource
  }) as VectorLayer & Interactive, [vectorSource]);

  useEffect(() => {
    const onGetPlanePosition = (planePos: PlanePos) => {
      setPos(planePos);
    };

    messageHandler.subscribe("__PLANE_POS__", onGetPlanePosition)
    return () => messageHandler.unsubscribe("__PLANE_POS__", onGetPlanePosition);
  }, [map, vectorSource])

  useEffect(() => {
    vectorSource.clear();

    const coords = fromLonLat([pos.lon, pos.lat]);

    const feature = new Feature({
      geometry: new Point(coords)
    }) as Feature<Point> & Interactive;

    feature.setStyle(elemStyle(pos.heading));

    vectorSource.addFeature(feature)
  }, [elemStyle, map, pos, vectorSource])


  return <>
    <OlLayer key={"airports"} source={vectorLayer} opacity={opacity} order={order} active={active} minZoom={minZoom} maxZoom={maxZoom} clipAera={clipAera} />
    <div className="hidden">
      <img ref={PlaneIcon} src={PlaneImg} alt='plane' />
    </div>
  </>
};


