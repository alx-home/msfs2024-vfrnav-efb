import MouseContextProvider from '@/Events/MouseContext';

import { MapPage } from '@/MapPage/MapPage';
import { Menu } from '@/app/Menu';
import { JSX, useState } from 'react';

import mapImg from '@/images/map.svg';
import navlogImg from '@/images/navlog.svg';
import settingsImg from '@/images/settings.svg';
import creditsImg from '@/images/credits.svg';
import { CreditsPage } from '@/CreditsPage/CreditsPage';
import { SettingsPage } from '@/SettingsPage/SettingsPage';
import SettingsContextProvider from '@/Settings';

import "./ol.css";
import '@/global.sass';

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
  constructor(index: number) {
    this.index = index;
    this.elem = <div className='my-1' key={'space_' + this.index}></div>;
  }

  public readonly index: number;
  public readonly type: string = 'space';
  public readonly elem: JSX.Element;
};

export const App = () => {
  const [page, setPage] = useState<string>("map");
  const pages: (Page | Space)[] = [
    new Page({
      name: "map",
      icon: <img src={mapImg} alt='map' />,
      elem: <MapPage key="map" active={page === "map"} />
    }),
    new Page({
      name: "navlog",
      icon: <img src={navlogImg} alt='nav log' />,
      elem: <div key="navlog" />,
      disabled: true
    }),
    new Page({
      name: "settings",
      icon: <img src={settingsImg} alt='settings' />,
      elem: <SettingsPage key="settings" active={page === "settings"} />
    }),
    new Space(1),
    new Page({
      name: "credits",
      icon: <img src={creditsImg} alt='credits' />,
      elem: <CreditsPage key="credits" active={page === "credits"} />
    })
  ];

  return (
    <MouseContextProvider>
      <SettingsContextProvider>
        <div key='home' className='flex flex-row h-full'>
          <Menu pages={pages} setPage={page => setPage(page)} activePage={page} />
          {pages.map(elem => elem.elem)}
        </div>
      </SettingsContextProvider>
    </MouseContextProvider>
  );
};
