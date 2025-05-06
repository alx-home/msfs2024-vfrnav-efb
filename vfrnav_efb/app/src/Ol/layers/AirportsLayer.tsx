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
import { messageHandler, SettingsContext } from "@Settings/SettingsProvider";
import { Point } from "ol/geom";
import { fromLonLat, toLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";

import Style from "ol/style/Style";
import VectorLayer from "ol/layer/Vector";


import { AirportFacility, Facilities } from "@shared/Facilities";
import { Interactive, MapContext } from "@pages/Map/MapContext";
import { AirportPopup } from "./AirportPopup";
import { Coordinate } from "ol/coordinate";

import AirportsImg from '@efb-images/airport.svg';
import SoftAirportsImg from '@efb-images/softairport.svg';
import WaterAirportsImg from '@efb-images/waterairport.svg';
import MilitaryAirportImg from '@efb-images/militaryAirport.svg';
import HelipadImg from '@efb-images/helipad.svg';

export const AirportsLayer = ({
  opacity,
  order,
  active,
  minZoom,
  maxZoom,
  clipAera
}: OlLayerProp & {
  opacity?: number
}) => {
  const { setPopup, airports } = useContext(SettingsContext)!;
  const { map, registerMouseEnd, unregisterMouseEnd } = useContext(MapContext)!;
  const vectorSource = useMemo(() => new VectorSource<Feature<Point>>({}), []);

  const [facilities, setFacilities] = useState<AirportFacility[]>([]);

  const HelipadIcon = useRef<HTMLImageElement | null>(null);
  const AirportsIcon = useRef<HTMLImageElement | null>(null);
  const SoftAirportsIcon = useRef<HTMLImageElement | null>(null);
  const WaterAirportsIcon = useRef<HTMLImageElement | null>(null);
  const MilitaryAirportIcon = useRef<HTMLImageElement | null>(null);

  const elemStyle = useCallback((feature: Feature) => new Style({
    renderer(coordinates, state) {
      const [x, y] = coordinates as Coordinate;
      const ctx = state.context;
      const radius = 20;

      const hover = feature.get('hover') as boolean;
      const info = feature.get('info') as AirportFacility;

      if (hover) {
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.2, 0, 2 * Math.PI, true);
        ctx.fillStyle = 'rgba(0, 140, 205, 0.3)';
        ctx.fill();
      }

      if (info.airportClass === 5 || info.airportPrivateType !== 1) {
        ctx.drawImage(MilitaryAirportIcon.current!, x - radius, y - radius, 2 * radius, 2 * radius)
      } else if (info.airportClass === 4) {
        ctx.drawImage(HelipadIcon.current!, x - radius, y - radius, 2 * radius, 2 * radius)
      } else if (info.airportClass === 3) {
        ctx.drawImage(WaterAirportsIcon.current!, x - radius, y - radius, 2 * radius, 2 * radius)
      } else if (info.airportClass === 1) {
        ctx.drawImage(AirportsIcon.current!, x - radius, y - radius, 2 * radius, 2 * radius)
      } else {
        ctx.drawImage(SoftAirportsIcon.current!, x - radius, y - radius, 2 * radius, 2 * radius)
      }
    }
  }), []);


  // Layer displaying the clusters and individual features.
  const vectorLayer = useMemo(() => new VectorLayer({
    source: vectorSource
  }) as VectorLayer & Interactive, [vectorSource]);

  useEffect(() => {
    if (__MSFS_EMBEDED__) {
      const onGetFacilities = (facilities: Facilities) => {
        setFacilities(facilities.facilities);
      };

      messageHandler.subscribe("Facilities", onGetFacilities)
      return () => messageHandler.unsubscribe("Facilities", onGetFacilities);
    }
  }, [map, setPopup, vectorSource])

  useEffect(() => {
    const onMouseEnd = (coords: Coordinate) => {
      const pos = toLonLat(coords)

      if (__MSFS_EMBEDED__) {
        messageHandler.send({
          mType: "GetFacilities",

          lat: pos[1],
          lon: pos[0]
        });
      } else {
        window.getFacilities(pos[1], pos[0]).then((facilities) => {
          setFacilities(facilities);
        });
      }
    };

    registerMouseEnd(onMouseEnd)
    return () => unregisterMouseEnd(onMouseEnd)
  }, [registerMouseEnd, unregisterMouseEnd])

  useEffect(() => {
    vectorSource.clear();

    facilities.map(facility => {
      if (facility.airportClass === 5 || facility.airportPrivateType !== 1) {
        if (!airports.private) {
          return
        }
      } else if (facility.airportClass === 4) {
        if (!airports.helipads) {
          return
        }
      } else if (facility.airportClass === 3) {
        if (!airports.waterRunway) {
          return
        }
      } else if (facility.airportClass === 1) {
        if (!airports.hardRunway) {
          return
        }
      } else if (!airports.softRunway) {
        return
      }

      const coords = fromLonLat([facility.lon, facility.lat]);
      const feature = new Feature({
        geometry: new Point(coords)
      }) as Feature<Point> & Interactive;

      feature.getGeometry()!.containsXY = (x: number, y: number): boolean => {
        const center = map.getPixelFromCoordinate(coords);
        const mouse = map.getPixelFromCoordinate([x, y]);

        const dx = center[0] - mouse[0];
        const dy = center[1] - mouse[1];

        return dx * dx + dy * dy < (20 * 1.2) * (20 * 1.2);
      }

      feature.set('info', facility)

      feature.setStyle(elemStyle(feature));
      feature.onHover = () => {
        feature.set('hover', true);
        return true;
      }
      feature.onBlur = () => {
        feature.set('hover', false);
        return true;
      }

      feature.onClick = () => {
        const info = feature.get('info') as AirportFacility;
        setPopup(<AirportPopup data={info} />);
        return true;
      }

      vectorSource.addFeature(feature)
    })
  }, [airports, elemStyle, facilities, map, setPopup, vectorSource])

  return <>
    <OlLayer key={"airports"} source={vectorLayer} opacity={opacity} order={order} active={active} minZoom={minZoom} maxZoom={maxZoom} clipAera={clipAera} />
    <div className="hidden">
      <img ref={HelipadIcon} src={HelipadImg} alt='helipad' />
      <img ref={AirportsIcon} src={AirportsImg} alt='airport' />
      <img ref={SoftAirportsIcon} src={SoftAirportsImg} alt='soft airport' />
      <img ref={WaterAirportsIcon} src={WaterAirportsImg} alt='water airport' />
      <img ref={MilitaryAirportIcon} src={MilitaryAirportImg} alt='military airport' />
    </div>
  </>
};


