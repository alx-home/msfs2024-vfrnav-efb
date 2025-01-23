import MouseContextProvider from '@/Events/MouseContext';

import { MapPage } from '@/MapPage/MapPage';
import { Menu } from '@/app/Menu';
import { JSX, ReactElement, useMemo, useState } from 'react';

import mapImg from '@images/map.svg';
import navlogImg from '@images/navlog.svg';
import settingsImg from '@images/settings.svg';
import filesImg from '@images/files.svg';
import creditsImg from '@images/credits.svg';
import { CreditsPage } from '@/CreditsPage/CreditsPage';
import { SettingsPage } from '@/SettingsPage/SettingsPage';
import SettingsContextProvider from '@/Settings';

import { ChartsPage } from '@/ChartsPage/ChartsPage';

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
      name: "charts",
      icon: <img src={filesImg} alt='charts' />,
      elem: <ChartsPage key="charts" active={page === "charts"} />
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

  const empty = useMemo(() => <></>, []);
  const [popup, setPopup] = useState<ReactElement>(empty);

  return (
    <MouseContextProvider>
      <SettingsContextProvider setPopup={setPopup} emptyPopup={empty}>
        <div className={'absolute flex flex-col w-full h-full bg-opacity-80 bg-slate-600 z-50 justify-center'
          + (popup === empty ? ' hidden' : '')
        }>
          <div className='m-auto w-full max-w-4xl'>
            <div className='flex flex-col bg-menu border-2 hover:border-msfs px-8 py-5 shadow-slate-950 shadow-md m-8'>
              {popup}
            </div>
          </div>
        </div>
        <div key='home' className='flex flex-row h-full' inert={popup !== empty}>
          <Menu pages={pages} setPage={page => setPage(page)} activePage={page} />
          {pages.map(elem => elem.elem)}
        </div>
      </SettingsContextProvider>
    </MouseContextProvider>
  );
};
