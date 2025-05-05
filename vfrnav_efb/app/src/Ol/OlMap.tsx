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

import { useMouseRelease, useKeyUp } from "@alx-home/Events";

import { View } from "ol";
import { fromLonLat } from "ol/proj";
import { PropsWithChildren, useContext, useEffect, useRef, useState } from "react";
import { MapContext } from "@pages/Map/MapContext";

export const OlMap = ({ children, id, className }: PropsWithChildren<{ id: string, className: string }>) => {
  const mapContext = useContext(MapContext)!;

  const [center,] = useState(fromLonLat([1.5911241345835847, 48.104707368204686]));
  const [zoom,] = useState(10);
  const keyUp = useKeyUp();
  const [mouseInside, setMouseInside] = useState(false);
  const mouseRelease = useMouseRelease(mouseInside);
  const mapElement = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mouseRelease) {
      if (!mouseInside) {
        mapContext.cancel?.();
      }
    }
  }, [mouseRelease, mapContext, mouseInside]);

  useEffect(() => {
    if (keyUp === 'Escape') {
      mapContext.cancel?.();
    }
  }, [keyUp, mapContext])

  useEffect(() => {
    if (mapContext.map && mapElement.current) {
      mapContext.map.setView(new View({
        center: center,
        zoom: zoom,
      }));
    }
  }, [mapContext.map, mapElement, center, zoom]);

  useEffect(() => {
    if (mapContext.map && mapElement.current) {
      mapContext.map.setTarget(mapElement.current);
    }
  }, [mapContext.map, mapElement]);

  return <div className={"flex " + className}
    onMouseLeave={() => setMouseInside(false)}
    onMouseEnter={() => setMouseInside(true)}
  >
    <div ref={mapElement} id={id} className="grow w-full" />
    {children}
  </div>;
}