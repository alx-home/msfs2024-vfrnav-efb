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
import { useCallback, useContext, useEffect, useMemo, useRef, memo, useState } from 'react';
import { messageHandler, SettingsContext } from "@Settings/SettingsProvider";
import { Point } from "ol/geom";
import { fromLonLat, toLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";

import Style from "ol/style/Style";
import VectorLayer from "ol/layer/Vector";


import { AirportFacility, Facilities, Facility } from "@shared/Facilities";
import { Interactive, MapContext } from "@pages/Map/MapContext";
import { AirportPopup } from "./AirportPopup";
import { Coordinate } from "ol/coordinate";

import AirportsImg from '@efb-images/airport.svg';
import SoftAirportsImg from '@efb-images/softairport.svg';
import WaterAirportsImg from '@efb-images/waterairport.svg';
import MilitaryAirportImg from '@efb-images/militaryAirport.svg';
import HelipadImg from '@efb-images/helipad.svg';
import { useEvent } from "react-use-event-hook";

export const AirportsLayer = memo(function AirportsLayer({
  opacity,
  order,
  active,
  minZoom,
  maxZoom,
  clipAera
}: OlLayerProp & {
  opacity?: number
}) {
  const { setPopup, airports } = useContext(SettingsContext)!;
  const { map, registerMouseEnd, unregisterMouseEnd } = useContext(MapContext)!;
  const [pos, setPos] = useState({ lat: 0, lon: 0 });
  const vectorSource = useMemo(() => new VectorSource<Feature<Point>>({}), []);

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

  const ignored = useCallback((info: AirportFacility) => {
    if (info.airportClass === 5 || info.airportPrivateType !== 1) {
      return !airports.private;
    } else if (info.airportClass === 4) {
      return !airports.helipads;
    } else if (info.airportClass === 3) {
      return !airports.waterRunway;
    } else if (info.airportClass === 1) {
      return !airports.hardRunway;
    } else if (!airports.softRunway) {
      return true;
    }

    return false;
  }, [airports]);


  const updateLayerEvent = useEvent((facilities: Facilities) => {
    const missingFacilities = new Map(facilities.facilities.map(facility => [facility.substring(1).trim(), facility]));
    vectorSource.removeFeatures(vectorSource.getFeatures().filter(feature => {
      const info = feature.get('info') as AirportFacility;

      // If the facility is in the new list of facilities, we keep it and remove it from the list of missing facilities. 
      // We also check if it should be ignored or not, 
      // and if it should be ignored, we remove it from the layer.
      if (missingFacilities.has(info.icao)) {
        missingFacilities.delete(info.icao);

        return ignored(info);
      }

      // Otherwise, we remove it from the layer.
      return true;
    }));

    // We return the list of missing facilities, which we will need to request from the main process.
    return missingFacilities;
  });

  const addFacility = useCallback((facility: AirportFacility) => {
    if (ignored(facility)) {
      return;
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
  }, [elemStyle, map, setPopup, vectorSource, ignored]);

  const addFacilityEvent = useEvent(addFacility);

  // Layer displaying the clusters and individual features.
  const vectorLayer = useMemo(() => new VectorLayer({
    source: vectorSource
  }) as VectorLayer & Interactive, [vectorSource]);

  useEffect(() => {
    const token = {
      current: 0
    };
    const facilityCB: {
      current: ((_facility: Facility) => void) | undefined;
    } = {
      current: undefined
    };

    const onGetFacilities = (facilities: Facilities) => {
      ++token.current;
      const currentToken = token.current;

      if (facilityCB.current) {
        messageHandler.unsubscribe("__FACILITY__", facilityCB.current);
      }

      // The list contains the facilities that are missing and need to be requested from the main process.
      const missingFacilities = updateLayerEvent(facilities);

      let nextChunk = 0;
      const getNext = () => {
        // We send the requests in chunks of 10 to avoid sending too many requests at the same time, which can cause stutters.

        if (nextChunk > 0) {
          --nextChunk;
        }

        // If we have already sent all the requests for the current chunk, we send the next chunk.
        if (nextChunk === 0) {
          for (const icao of missingFacilities.values()) {
            if (nextChunk >= 10) {
              break;
            }

            ++nextChunk;
            if (icao) {
              messageHandler.send({
                __GET_FACILITY__: true,
                icao
              });
            }
          }
        }
      };

      facilityCB.current = (message: Facility) => {
        // We check if the token is still the same, which means that we are still in the same update cycle. 
        // If it's not, it means that we have already received a new list of facilities and we should ignore this one.
        if (currentToken === token.current) {
          const facility = JSON.parse(message.data) as AirportFacility;

          if (missingFacilities.has(facility.icao)) {
            missingFacilities.delete(facility.icao);
            addFacilityEvent(facility);
            getNext();
          }
        }
      };
      messageHandler.subscribe("__FACILITY__", facilityCB.current);

      getNext();
    };

    messageHandler.subscribe("__FACILITIES__", onGetFacilities)
    return () => {
      messageHandler.unsubscribe("__FACILITIES__", onGetFacilities);
      ++token.current;

      if (facilityCB.current) {
        messageHandler.unsubscribe("__FACILITY__", facilityCB.current);
      }
    };
  }, [addFacilityEvent, updateLayerEvent]);

  useEffect(() => {
    const onMouseEnd = (coords: Coordinate) => {
      const pos = toLonLat(coords)
      setPos({ lat: pos[1], lon: pos[0] });
    };

    registerMouseEnd(onMouseEnd)
    return () => unregisterMouseEnd(onMouseEnd)
  }, [registerMouseEnd, unregisterMouseEnd])


  useEffect(() => {
    // We request the facilities around the current position. 
    // The main process will respond with a list of facilities, which we will then display on the map.
    messageHandler.send({
      __GET_FACILITIES__: true,

      lat: pos.lat,
      lon: pos.lon
    });
  }, [addFacility, pos]);

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
});


