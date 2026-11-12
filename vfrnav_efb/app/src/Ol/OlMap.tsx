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
import { PropsWithChildren, useEffect, useRef, useState, memo } from 'react';
import headingImg from "@efb-images/headingLock.svg";
import posImg from "@efb-images/posLock.svg";
import useEvent from "react-use-event-hook";
import { useMapSubSettings } from "@pages/Map/MapSettings";

export const OlMap = memo(function OlMap({ children, id, className }: PropsWithChildren<{ id: string, className: string }>) {
  const { map, followMode, setFollowMode, cancel } = useMapSubSettings(settings => ({
    map: settings.map,
    followMode: settings.followMode,
    setFollowMode: settings.setFollowMode,
    cancel: settings.cancel
  }));
  const cheatMode = useSettings(settings => settings.plane.enabled);

  const [center,] = useState(fromLonLat([1.5911241345835847, 48.104707368204686]));
  const [zoom,] = useState(10);
  const keyUp = useKeyUp();
  const mapElement = useRef<HTMLDivElement | null>(null);

  const switchHeadingLock = useEvent((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();

    setFollowMode(mode => {
      return { ...mode, heading: !mode.heading, pending: false };
    });
  });
  const switchPositionLock = useEvent((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();

    setFollowMode(mode => {
      return { ...mode, position: !mode.position, pending: false };
    });
  });

  const disableFollow = useEvent(() => {
    setFollowMode(mode => ({ ...mode, heading: mode.pending ? mode.heading : false, pending: false }));
  });

  useEffect(() => {
    if (keyUp === 'Escape') {
      cancel?.();
    }
  }, [keyUp, cancel])

  useEffect(() => {
    if (map && mapElement.current) {
      const view = new View({
        center,
        zoom,
      });
      map.setView(view);

      view.on('change:rotation', disableFollow);
    }
  }, [map, mapElement, center, zoom, disableFollow]);

  useEffect(() => {
    if (map && mapElement.current) {
      map.setTarget(mapElement.current);
    }
  }, [map, mapElement]);

  return <div className={"flex " + className}>
    <div ref={mapElement} id={id} className="grow w-full" />
    {cheatMode && <div className="ol-unselectable ol-control absolute left-2 bottom-4 z-10">
      <button
        onClick={switchHeadingLock}
        className={`
        flex h-full w-full items-center justify-center ${followMode?.heading ? '!bg-highlight' : ''}
      `}
      >
        <img src={headingImg} alt="Heading Lock" className="h-7 w-7 m-auto" />
      </button>
      <button
        onClick={switchPositionLock}
        className={`
        flex h-full w-full items-center justify-center ${followMode?.position ? '!bg-highlight' : ''}
      `}
      >
        <img src={posImg} alt="Position Lock" className="h-7 w-7 m-auto" />
      </button>
    </div>}
    {children}
  </div>;
});