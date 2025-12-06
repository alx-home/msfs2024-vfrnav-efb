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

import { ChangeEvent, Children, CSSProperties, Dispatch, FocusEvent, isValidElement, KeyboardEvent, MouseEventHandler, PropsWithChildren, SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import VectorLayer from 'ol/layer/Vector';

import { Draggable, Scroll, Button } from '@alx-home/Utils';

import { MapContext } from '@pages/Map/MapContext';

import newFileImg from '@alx-home/images/new-file.svg';
import importImg from '@alx-home/images/import.svg';
import exportImg from '@alx-home/images/export.svg';
import editImg from "@alx-home/images/edit.svg";
import deleteImg from "@alx-home/images/delete.svg";
import { useEFBServer } from '@Utils/useServer';
import { messageHandler } from '@Settings/SettingsProvider';
import { Properties } from '@shared/NavData';
import { Coordinate } from 'ol/coordinate';

export class NavData {
  // eslint-disable-next-line no-unused-vars
  constructor(public id: number,
    // eslint-disable-next-line no-unused-vars
    public order: number,
    // eslint-disable-next-line no-unused-vars
    public name: string,
    // eslint-disable-next-line no-unused-vars
    public active: boolean,
    // eslint-disable-next-line no-unused-vars
    public shortName: string,
    // eslint-disable-next-line no-unused-vars
    public coords: Coordinate[],
    // eslint-disable-next-line no-unused-vars
    public loadedFuel: number,
    // eslint-disable-next-line no-unused-vars
    public departureTime: number,
    // eslint-disable-next-line no-unused-vars
    public taxiTime: number,
    // eslint-disable-next-line no-unused-vars
    public taxiConso: number,
    // eslint-disable-next-line no-unused-vars
    public link: string,
    // eslint-disable-next-line no-unused-vars
    public properties: Properties[],
    // eslint-disable-next-line no-unused-vars
    public waypoints: string[],
    // eslint-disable-next-line no-unused-vars
    public layer: VectorLayer) { }
};

const Label = ({ name, shortName, editMode }: {
  name: string,
  shortName: string,
  editMode: boolean
}) => {
  return <div
    className='flex flex-row pt-1 grow'
    style={editMode ? { display: 'none' } : {}}>
    {/*
      <div className="text-nowrap hidden @[85px]/label:flex">{name}</div>
      <div className="text-nowrap hidden @[55px]/label:flex @[85px]/label:hidden">nav: {shortName}</div>
      <div className="text-nowrap flex @[55px]/label:hidden">{shortName}</div>
       */}
    <div className="text-nowrap overflow-hidden h-[20px] flex group-hocus:hidden">{name}</div>
    <div className="text-nowrap overflow-hidden h-[20px] hidden group-hocus:flex">{shortName}</div>
  </div>;
};

const Edit = ({ onClick, image, alt, background }: {
  onClick: MouseEventHandler<HTMLButtonElement>,
  image: string,
  alt: string,
  background: string
}) => {
  return <button className={'flex w-8 h-8 hover:brightness-125 focus:border-2 focus:border-with ' + ' ' + background}
    onClick={onClick}>
    <img className='w-6 h-6 min-w-6 min-h-6 grow mt-auto mb-auto justify-center cursor-pointer' src={image} alt={alt} />
  </button>;
};

const Input = ({ editMode, setEditMode, name, id }: {
  editMode: boolean,
  setEditMode: Dispatch<SetStateAction<boolean>>,
  name: string,
  id: number
}) => {
  const { editNav } = useContext(MapContext)!;
  const textArea = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(name);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (editMode) {
      textArea.current?.focus()
    }
  }, [editMode]);

  useEffect(() => {
    if (textArea.current && !focused) {
      textArea.current.value = value;
    }
  });

  const onBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    editNav(id, e.currentTarget.value)
    setEditMode(false);
  }, [editNav, id, setEditMode])

  const onFocus = useCallback(() => {
    setFocused(true);
  }, [])

  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }, [])

  const onKeyUp = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      editNav(id, e.currentTarget.value);
      setEditMode(false);
    }
  }, [editNav, id, setEditMode])

  return <input className={'bg-transparent h-6 pt-[2px] pointer-events-auto'} placeholder={name} ref={textArea} type="text" style={editMode ? {} : { display: 'none' }}
    onBlur={onBlur}
    onFocus={onFocus}
    onChange={onChange}
    onKeyUp={onKeyUp}
  />;
};

const NavItem = ({ name, shortName, active, id, setDraggable }: {
  active: boolean,
  id: number,
  name: string,
  shortName: string,
  setDraggable?: Dispatch<SetStateAction<boolean>>
}) => {
  const { setNavData, removeNav } = useContext(MapContext)!;
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    return () => setDraggable?.(true);
  }, [setDraggable])

  useEffect(() => {
    if (editMode) {
      setDraggable?.(false);
    } else {
      setDraggable?.(true);
    }
  }, [editMode, setDraggable])

  const onClick = useCallback(() => setNavData(navData => {
    const newData = [...navData];
    const elem = newData.find(e => e.id === id);
    if (elem) {
      elem.active = !active;
    }
    return newData;
  }), [active, id, setNavData]);
  const onEdit = useCallback(() => setEditMode(true), [setEditMode]);
  const onRemove = useCallback(() => removeNav(id), [removeNav, id]);

  return <div className={'group flex flex-row max-w-full grow [&>*:not(:first-child)]:hover:ml-[5px]' + (active ? ' border-l-2 border-msfs' : '')}>
    <Button className={'flex flex-row grow max-w-full mx-[5px] @container/label'}
      active={!editMode}
      onClick={onClick}>
      <Label name={name} shortName={shortName} editMode={editMode} />
      <Input editMode={editMode} setEditMode={setEditMode} id={id} name={name} />
    </Button>
    <div className={'transition duration-std flex flex-row [&>*:not(:first-child)]:ml-[5px] overflow-hidden max-w-[4.4rem] h-8 mt-auto mb-auto w-0 group-hocus:w-full'}
      style={{ display: (editMode ? 'none' : ''), transitionProperty: 'width' }}
    >
      <Edit onClick={onEdit} image={editImg} alt='edit' background='bg-msfs' />
      <Edit onClick={onRemove} image={deleteImg} alt='delete' background='bg-red-600' />
    </div>
  </div>;
};

const Add = ({ name, image, onClick, disabled, active }: PropsWithChildren<{
  name: string,
  image: string,
  onClick: MouseEventHandler<HTMLButtonElement>,
  disabled?: boolean,
  active?: boolean
}>) => {
  const isActive = useMemo(() => active ?? true, [active]);
  const isDisabled = useMemo(() => disabled ?? false, [disabled]);
  return <Button onClick={onClick} active={isActive} disabled={isDisabled} className='px-2 min-h-4 pt-[0.1rem] flex flex-row grow @container'>
    <div className='hidden @[47px]:flex justify-center w-full'>{name}</div>
    <div className='flex grow justify-center @[47px]:hidden w-5 h-5'>
      <img src={image} alt={name} width={'100%'} height={'100%'} className='invert' />
    </div>
  </Button>;
};

const Item = ({ children, className, setDraggable }: PropsWithChildren<{
  order: number,
  className: string,
  setDraggable: Dispatch<SetStateAction<boolean>>
}>) => {
  const child = useMemo(() => {
    const child = Children.only(children);
    if (isValidElement<object>(child)) {
      return {
        ...child, props: {
          ...child.props,
          setDraggable: setDraggable
        }
      };
    }
    return undefined;
  }, [children, setDraggable]);

  return <div className={className}>{child}</div>;
};

export const Nav = ({ closeMenu, className, style }: {
  closeMenu: () => void,
  className: string,
  style: CSSProperties
}) => {
  const efbConnected = useEFBServer();

  const { addNav, navData, deviationCurve, deviationPreset, fuelUnit, fuelCurve, fuelPreset, reorderNav } = useContext(MapContext)!;
  const key = useMemo(() => navData.reduce((prev, elem) => { return prev + ";" + elem.name; }, ""), [navData]);
  const [draggable, setDraggable] = useState(true);
  const childs = useMemo(() => navData.map((item, index) => {
    return <Item key={navData[index].id} order={navData[index].order} className='flex' setDraggable={setDraggable}>
      <NavItem key={item.id} active={item.active} id={item.id} name={item.name} shortName={item.shortName} />
    </Item>
  })
    , [navData]);

  const onAdd = useCallback(() => {
    addNav?.()
    closeMenu()
  }, [addNav, closeMenu]);

  const importNav = useCallback(() => { }, []);
  const exportNav = useCallback(() => {
    messageHandler.send({
      __EXPORT_NAV__: true,

      data: navData.map(data => ({
        id: data.id,
        name: data.name,
        order: data.order,
        active: data.active,
        shortName: data.shortName,
        coords: data.coords,
        properties: data.properties,
        waypoints: data.waypoints,
        loadedFuel: data.loadedFuel,
        departureTime: data.departureTime,
        taxiTime: data.taxiTime,
        taxiConso: data.taxiConso,
        link: data.link
      })),
      deviationCurve: deviationPreset === 'custom' ? deviationCurve : [],
      deviationPreset: deviationPreset,
      fuelUnit: fuelUnit,
      fuelCurve: fuelPreset === 'custom' ? fuelCurve.map(elem => ({
        thrust: elem[0],
        curves: elem[1].map(curve => ({
          alt: curve[0],
          values: curve[1]
        }))
      })) : [],
      fuelPreset: fuelPreset
    })
  }, [deviationCurve, deviationPreset, fuelCurve, fuelPreset, fuelUnit, navData]);

  const onOrdersChange = useMemo(() => (orders: number[]) => {
    reorderNav(orders);
  }, [reorderNav]);

  return <div className={'flex flex-col h-full overflow-hidden p-2 pt-8'}>
    <div className="flex min-h-12 shrink-0 items-center justify-between ps-1 text-2xl ">
      Nav&apos;s
    </div>
    <Scroll style={style} className={className}>
      <div className={"flex flex-col [&>*:not(:first-child)]:mt-[5px]"}>
        <Draggable key={key} className={'@container flex flex-col w-full overflow-hidden [&>*:not(:first-child)]:mt-[4px] [&>*:last-child]:mb-[4px]'}
          vertical={true}
          active={draggable}
          onOrdersChange={onOrdersChange}
        >
          {childs}
        </Draggable>
      </div>
    </Scroll>
    <div className='flex flex-col p-2 mt-auto'>
      <div className='flex pt-4'>
        <Add name='Create' image={newFileImg} onClick={onAdd} />
      </div>
      <div className='flex'>
        <Add name='Import' image={importImg} disabled={true} onClick={importNav} />
        <Add name='Export' image={exportImg} disabled={!efbConnected || __MSFS_EMBEDED__} onClick={exportNav} />
      </div>
    </div>
  </div >
};