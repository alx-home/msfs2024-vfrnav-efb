
import { ChangeEvent, CSSProperties, Dispatch, FocusEvent, KeyboardEvent, MouseEventHandler, SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { Feature } from 'ol';
import VectorLayer from 'ol/layer/Vector';

import { Button } from '@Utils/Button';
import { MapContext } from '@pages/Map/MapContext';

import editImg from "@images/edit.svg";
import deleteImg from "@images/delete.svg";
import { Slider } from '@Utils/Slider';

import { CheckBox } from '@Utils/CheckBox';
import { Scroll } from '@Utils/Scroll';

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
   return <button className={'flex w-11 h-11 hover:brightness-125 focus:border-2 focus:border-with ' + ' ' + background}
      onClick={onClick}>
      <img className='w-8 h-8 grow mt-auto mb-auto justify-center cursor-pointer' src={image} alt={alt} />
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

   return <input className={'bg-transparent h-8 pt-[2px] pointer-events-auto'} placeholder={name} ref={textArea} type="text" style={editMode ? {} : { display: 'none' }}
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
      <div className={'transition duration-std flex flex-row [&>*:not(:first-child)]:ml-[5px] overflow-hidden max-w-24 h-11 mt-auto mb-auto w-0 group-hocus:w-full'}
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
   const { records, profileScale, setProfileScale, enableTouchdown, withTouchdown, enableGround, withGround } = useContext(MapContext)!;
   const childs = useMemo(() => records.map((record) => {
      return <div key={record.id} className='flex'>
         <RecordItem key={record.id} active={record.active} name={record.name} shortName={record.id.toFixed(0)} id={record.id} />
      </div>
   }), [records]);

   const reset = useCallback(() => setProfileScale(1), [setProfileScale]);

   return <div className='flex flex-col grow overflow-hidden'>
      <div className='grow overflow-hidden'>
         <Scroll className={className} style={style}>
            <div className="flex min-h-12 shrink-0 items-center justify-between ps-1 text-2xl font-semibold">
               Record&apos;s
            </div>
            <menu className={"flex flex-col [&>*:not(:first-child)]:mt-[5px]"}>
               {childs}
            </menu>
         </Scroll>
      </div>
      <div className={className + ' justify-end mb-2 pr-0'}>
         <div className='flex flex-col pr-3 grow'>
            <div className='flex flex-row grow mt-4'>
               <div className='text-left text-xl grow'>Touchdown</div>
               <div className='flex flex-row justify-end'>
                  <CheckBox className="w-8" value={withTouchdown} onChange={enableTouchdown} />
               </div>
            </div>
            <div className='flex flex-row grow mt-4'>
               <div className='text-left text-xl grow'>Ground Layer</div>
               <div className='flex flex-row justify-end'>
                  <CheckBox className="w-8" value={withGround} onChange={enableGround} />
               </div>
            </div>
            <div className='flex flex-col grow mb-4 mt-2'>
               <div className='flex flex-row grow'>
                  <div className='flex flex-row text-xl mr-4 min-w-20'>Scale<br />1:{profileScale.toFixed(3)}</div>
                  <Slider className="flex flex-row grow justify-end" value={profileScale} range={{ min: 0.1, max: 10 }} onChange={setProfileScale} />
               </div>
            </div>
            <Button className="flex flex-row grow justify-center" active={true} onClick={reset}>
               Reset
            </Button>
         </div>
      </div>
   </div>
};