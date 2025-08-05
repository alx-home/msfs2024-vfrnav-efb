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

import { ChangeEvent, CSSProperties, Dispatch, FocusEvent, KeyboardEvent, MouseEventHandler, SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { Feature } from 'ol';
import VectorLayer from 'ol/layer/Vector';

import { Slider, Button, CheckBox, Scroll, DualSlider } from '@alx-home/Utils';

import { MapContext } from '@pages/Map/MapContext';

import editImg from "@alx-home/images/edit.svg";
import deleteImg from "@alx-home/images/delete.svg";


export class RecordData {
  // eslint-disable-next-line no-unused-vars
  constructor(public id: number, public name: string, public active: boolean, public shortName: string, public feature: Feature, public layer: VectorLayer) { }
};

const Label = ({ name, shortName, editMode }: {
  name: string,
  shortName: string,
  editMode: boolean
}) => {
  return <div
    className='flex flex-row pt-1 grow'
    style={editMode ? { display: 'none' } : {}}>
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
    <img className='w-6 h-6 min-h-6 max-h-6 grow mt-auto mb-auto justify-center cursor-pointer' src={image} alt={alt} />
  </button>;
};

const Input = ({ editMode, setEditMode, name, id }: {
  editMode: boolean,
  setEditMode: Dispatch<SetStateAction<boolean>>,
  name: string,
  id: number
}) => {
  const { editRecord } = useContext(MapContext)!;
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
    editRecord(id, e.currentTarget.value)
    setEditMode(false);
  }, [editRecord, id, setEditMode])

  const onFocus = useCallback(() => {
    setFocused(true);
  }, [])

  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }, [])

  const onKeyUp = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      editRecord(id, e.currentTarget.value);
      setEditMode(false);
    }
  }, [editRecord, id, setEditMode])

  return <input className={'bg-transparent h-6 pt-[2px] pointer-events-auto'} placeholder={name} ref={textArea} type="text" style={editMode ? {} : { display: 'none' }}
    onBlur={onBlur}
    onFocus={onFocus}
    onChange={onChange}
    onKeyUp={onKeyUp}
  />;
};

const RecordItem = ({ name, shortName, active, id }: {
  active: boolean,
  name: string,
  id: number,
  shortName: string
}) => {
  const { activeRecord, removeRecord } = useContext(MapContext)!;
  const [editMode, setEditMode] = useState(false);

  const onClick = useCallback(() => activeRecord(id, !active), [active, activeRecord, id]);
  const onEdit = useCallback(() => setEditMode(true), [setEditMode]);
  const onRemove = useCallback(() => removeRecord(id), [removeRecord, id]);

  return <div className={'group flex flex-row max-w-full grow [&>*:not(:first-child)]:hover:ml-[5px]' + (active ? ' border-l-2 border-msfs' : '')}>
    <Button className={'flex flex-row grow max-w-full mx-[5px] @container/label'}
      active={!editMode}
      onClick={onClick}>
      <Label name={name} shortName={shortName} editMode={editMode} />
      <Input editMode={editMode} setEditMode={setEditMode} name={name} id={id} />
    </Button>
    <div className={'transition duration-std flex flex-row [&>*:not(:first-child)]:ml-[5px] overflow-hidden max-w-[4.5rem] h-8 mt-auto mb-auto w-0 group-hocus:w-full'}
      style={{ display: (editMode ? 'none' : ''), transitionProperty: 'width' }}
    >
      <Edit onClick={onEdit} image={editImg} alt='edit' background='bg-msfs' />
      <Edit onClick={onRemove} image={deleteImg} alt='delete' background='bg-red-600' />
    </div>
  </div>;
};


export const Records = ({ className, style }: {
  className: string,
  style: CSSProperties
}) => {
  const { records } = useContext(MapContext)!;
  const childs = useMemo(() => records.map((record) => {
    return <div key={record.id} className='flex min-h-max'>
      <RecordItem key={record.id} active={record.active} name={record.name} shortName={record.id.toFixed(0)} id={record.id} />
    </div>
  }), [records]);

  return <div className={'flex flex-col h-full overflow-hidden p-2 pt-8'}>
    <div className="flex min-h-12 shrink-0 items-center justify-between ps-1 text-2xl ">
      Record&apos;s
    </div>
    <div className='flex flex-col grow overflow-hidden'>
      <Scroll className={className} style={style}>
        <menu className={"flex flex-col [&>*:not(:first-child)]:mt-[5px]"}>
          {childs}
        </menu>
      </Scroll>
    </div>
  </div>
};

export const RecordsToolbar = () => {
  const { profileOffset, setProfileOffset, profileScale, setProfileScale,
    profileRule1, profileRule2, setProfileRule1, setProfileRule2,
    profileSlope1, profileSlope2, setProfileSlope1, setProfileSlope2,
    profileSlopeOffset1, profileSlopeOffset2, setProfileSlopeOffset1, setProfileSlopeOffset2,
    enableTouchdown, withTouchdown, enableGround, withGround } = useContext(MapContext)!;

  const setProfileRules = useCallback((min: number, max: number) => {
    setProfileRule1(min)
    setProfileRule2(max)
  }, [setProfileRule1, setProfileRule2]);

  const setProfileSlopes = useCallback((min: number, max: number) => {
    setProfileSlope1(min)
    setProfileSlope2(max)
  }, [setProfileSlope1, setProfileSlope2]);

  const setProfileSlopesOffset = useCallback((min: number, max: number) => {
    setProfileSlopeOffset1(min)
    setProfileSlopeOffset2(max)
  }, [setProfileSlopeOffset1, setProfileSlopeOffset2]);

  const reset = useCallback(() => {
    setProfileScale(1)
    setProfileRules(1000, 1500)
    setProfileSlopes(0, 0);
  }, [setProfileRules, setProfileScale, setProfileSlopes]);


  return <div className='flex flex-col grow'>
    <div className='flex flex-col'>
      <div className='flex flex-row grow mt-2'>
        <div className='flex flex-row mr-4'>
          <CheckBox value={withTouchdown} onChange={enableTouchdown} />
        </div>
        <div className='text-left text-base grow'>Touchdown</div>
      </div>
      <div className='flex flex-row grow mt-2'>
        <div className='flex flex-row mr-4'>
          <CheckBox value={withGround} onChange={enableGround} />
        </div>
        <div className='text-left text-base grow'>Ground Layer</div>
      </div>
      <div className='flex flex-col grow mb-1 mt-1'>
        <div className='flex flex-row grow'>
          <div className='flex flex-row text-base ml-10 mr-4 min-w-40'>Scale 1:{profileScale.toFixed(3)}</div>
          <Slider className="flex flex-row grow justify-end" value={profileScale} range={{ min: 0.1, max: 10 }} onChange={setProfileScale} />
        </div>
      </div>
      <div className='flex flex-col grow mb-1 mt-1'>
        <div className='flex flex-row grow'>
          <div className='flex flex-row text-base ml-10 mr-4 min-w-40'>Offset ({profileOffset >= 10000 ? "FL" + (profileOffset / 100).toFixed(0) : profileOffset.toFixed(0)})</div>
          <Slider className="flex flex-row grow justify-end" value={profileOffset} range={{ min: 0, max: 10000 }} onChange={setProfileOffset} />
        </div>
      </div>
      <div className='flex flex-col grow mb-1 mt-1'>
        <div className='flex flex-row grow'>
          <div className='flex flex-row text-base ml-10 mr-4 min-w-40'>Rules {profileRule1 >= 10000 ? "FL" + (profileRule1 / 100).toFixed(0) : profileRule1.toFixed(0)} {profileRule2 >= 10000 ? "FL" + (profileRule2 / 100).toFixed(0) : profileRule2.toFixed(0)}</div>
          <DualSlider className="flex flex-row grow justify-end" value={{ min: profileRule1, max: profileRule2 }} range={{ min: 0, max: 40000 }} onChange={setProfileRules} />
        </div>
      </div>
      <div className='flex flex-col grow mb-4'>
        <div className='flex flex-row grow'>
          <div className='flex flex-row text-base ml-10 mr-4 min-w-40'>Slopes {profileSlope1.toFixed(0)}° {profileSlope2.toFixed(0)}°</div>
          <DualSlider className="flex flex-row grow" value={{ min: profileSlopeOffset1, max: profileSlopeOffset2 }} range={{ min: 0, max: 100 }} onChange={setProfileSlopesOffset} />
          <DualSlider className="flex flex-row grow justify-end" value={{ min: profileSlope1, max: profileSlope2 }} range={{ min: -45, max: 45 }} onChange={setProfileSlopes} />
        </div>
      </div>
      <div className='flex'>
        <Button className="flex flex-row grow justify-center min-h-0" active={true} onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  </div>
}