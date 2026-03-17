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

import { MouseContextProvider } from '@alx-home/Events';

import { Menu } from '@app/Menu';
import { JSX, ReactElement, Suspense, lazy, useMemo, useState } from 'react';

// Lazy load all page components to enable code-splitting
// Each page will be in its own chunk and loaded on demand
const ChartsPage = lazy(() => import('@pages/Charts/ChartsPage').then(m => ({ default: m.ChartsPage })));
const CreditsPage = lazy(() => import('@pages/Credits/CreditsPage').then(m => ({ default: m.CreditsPage })));
const MapPage = lazy(() => import('@pages/Map/MapPage').then(m => ({ default: m.MapPage })));
const SettingsPage = lazy(() => import('@pages/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NavLogPage = lazy(() => import('@pages/NavLog/NavLogPage').then(m => ({ default: m.NavLogPage })));

import SettingsContextProvider from '@Settings/SettingsProvider';

import mapImg from '@efb-images/map.svg';
import navlogImg from '@efb-images/navlog.svg';

import settingsImg from '@alx-home/images/settings.svg';
import filesImg from '@alx-home/images/files.svg';
import creditsImg from '@alx-home/images/credits.svg';
import MapContextProvider from '@pages/Map/MapContext';

// Loading placeholder shown while page chunks are being loaded
const PageLoadingPlaceholder = () => <div className='flex items-center justify-center w-full h-full text-gray-400'>Loading...</div>;

export class Page {
  public readonly type: string = 'page';
  public readonly name: string;
  public readonly icon: JSX.Element;
  public readonly elem: JSX.Element;
  public readonly disabled?: boolean;

  constructor({ name, icon, elem, disabled }: {
    name: string,
    icon: JSX.Element,
    elem: JSX.Element,
    disabled?: boolean
  }) {
    this.name = name;
    this.icon = icon;
    this.elem = elem;
    this.disabled = disabled ?? false;
  }
};

export class Space {
  constructor({ name }: { name: string }) {
    this.name = name;
    this.elem = <div className='my-1' key={name}></div>;
  }

  public readonly name: string;
  public readonly type: string = 'space';
  public readonly elem: JSX.Element;
};

export const App = () => {
  const [page, setPage] = useState<string>("map");

  const empty = useMemo(() => <></>, []);
  const [popup, setPopup] = useState<ReactElement>(empty);

  const pages: (Page | Space)[] = useMemo(() => [
    new Page({
      name: "map",
      icon: <img src={mapImg} alt='map' />,
      elem: <MapPage key="map" />
    }),
    new Page({
      name: "navlog",
      icon: <img src={navlogImg} alt='nav log' />,
      elem: <NavLogPage key="navlog" />,
    }),
    new Page({
      name: "charts",
      icon: <img src={filesImg} alt='charts' />,
      elem: <ChartsPage key="charts" />
    }),
    new Page({
      name: "settings",
      icon: <img src={settingsImg} alt='settings' />,
      elem: <SettingsPage key="settings" />
    }),
    new Space({
      name: "space1"
    }),
    new Page({
      name: "credits",
      icon: <img src={creditsImg} alt='credits' />,
      elem: <CreditsPage key="credits" />
    })
  ], []);


  return (
    <MouseContextProvider>
      <SettingsContextProvider setPopup={setPopup} emptyPopup={empty} setPage={setPage}>
        <MapContextProvider>
          <div className={'fixed flex flex-col w-full h-full bg-opacity-80 bg-slate-600 z-50 justify-center text-sm'
            + (popup === empty ? ' hidden' : '')
          }>
            <div className='flex flex-row box-border relative m-auto w-full max-w-4xl max-h-full'>
              <div className='flex flex-row grow bg-menu border-2 hover:border-msfs px-8 py-5 shadow-slate-950 shadow-md m-8 max-h-full'>
                <div className='flex flex-row grow overflow-hidden'>
                  {popup}
                </div>
              </div>
            </div>
          </div>
          <div key='home' className='flex flex-row h-full' inert={popup !== empty}>
            <Menu pages={pages} setPage={page => setPage(page)} activePage={page} />
            {pages.map(elem =>
              <div className='flex grow' key={elem.name} style={{ display: elem.name == page ? '' : 'none' }}>
                <Suspense fallback={<PageLoadingPlaceholder />}>
                  {elem.elem}
                </Suspense>
              </div>
            )}
          </div>
        </MapContextProvider>
      </SettingsContextProvider>
    </MouseContextProvider>
  );
};
