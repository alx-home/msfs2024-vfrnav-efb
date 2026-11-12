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

import { useKeyUp } from "@alx-home/Events";
import { useSettings } from "@Settings/SettingsStore";

import { View } from "ol";
import { fromLonLat } from "ol/proj";
import { PropsWithChildren, useContext, useEffect, useRef, useState, memo } from 'react';
import headingImg from "@efb-images/headingLock.svg";
import posImg from "@efb-images/posLock.svg";
import { MapContext } from "@pages/Map/MapContext";
import useEvent from "react-use-event-hook";

export const OlMap = memo(function OlMap({ children, id, className }: PropsWithChildren<{ id: string, className: string }>) {
  const mapContext = useContext(MapContext)!;
  const cheatMode = useSettings(settings => settings.plane.enabled);

  const [center,] = useState(fromLonLat([1.5911241345835847, 48.104707368204686]));
  const [zoom,] = useState(10);
  const keyUp = useKeyUp();
  const mapElement = useRef<HTMLDivElement | null>(null);

  const switchHeadingLock = useEvent((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();

    mapContext?.setFollowMode(mode => {
      return { ...mode, heading: !mode.heading, pending: false };
    });
  });
  const switchPositionLock = useEvent((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();

    mapContext?.setFollowMode(mode => {
      return { ...mode, position: !mode.position, pending: false };
    });
  });

  const disableFollow = useEvent(() => {
    mapContext?.setFollowMode(mode => ({ ...mode, heading: mode.pending ? mode.heading : false, pending: false }));
  });

  useEffect(() => {
    if (keyUp === 'Escape') {
      mapContext.cancel?.();
    }
  }, [keyUp, mapContext])

  useEffect(() => {
    if (mapContext.map && mapElement.current) {
      const view = new View({
        center: center,
        zoom: zoom,
      });
      mapContext.map.setView(view);

      view.on('change:rotation', disableFollow);
    }
  }, [mapContext.map, mapElement, center, zoom, disableFollow]);

  useEffect(() => {
    if (mapContext.map && mapElement.current) {
      mapContext.map.setTarget(mapElement.current);
    }
  }, [mapContext.map, mapElement]);

  return <div className={"flex " + className}>
    <div ref={mapElement} id={id} className="grow w-full" />
    {cheatMode && <div className="ol-unselectable ol-control absolute left-2 bottom-4 z-10">
      <button
        onClick={switchHeadingLock}
        className={`
        flex h-full w-full items-center justify-center ${mapContext?.followMode?.heading ? '!bg-highlight' : ''}
      `}
      >
        <img src={headingImg} alt="Heading Lock" className="h-7 w-7 m-auto" />
      </button>
      <button
        onClick={switchPositionLock}
        className={`
        flex h-full w-full items-center justify-center ${mapContext?.followMode?.position ? '!bg-highlight' : ''}
      `}
      >
        <img src={posImg} alt="Position Lock" className="h-7 w-7 m-auto" />
      </button>
    </div>}
    {children}
  </div>;
});