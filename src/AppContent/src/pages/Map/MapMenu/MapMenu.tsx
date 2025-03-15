import { Dispatch, KeyboardEvent, MouseEvent, SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import useMouseRelease from '@Events/MouseRelease';
import { MouseContext } from '@Events/MouseContext';
import { Layer, Layers, OnLayerChange } from './Menus/Layers';
import { Nav } from './Menus/Nav';

import useMouseMove from '@Events/MouseMove';
import { Records } from './Menus/Records';

// eslint-disable-next-line no-unused-vars
export enum Menu { layers, nav, records };

export const MapMenu = ({ open, setOpen, menu, layers, onLayerChange }: {
   open: boolean,
   setOpen: Dispatch<SetStateAction<boolean>>,
   menu: Menu,
   layers: Layer[],
   onLayerChange: OnLayerChange,
}) => {
   const closeWidth = useMemo(() => 40, []);
   const minWidth = useMemo(() => 120, []);
   const maxWidth = useMemo(() => 250, []);

   const [initialDelta, setInitialDelta] = useState<number | undefined>();
   const [width, setWidth] = useState(0);
   const [defaultWidth, setDefaultWidth] = useState(minWidth);

   const handleRef = useRef<HTMLDivElement>(null);

   const mousePosition = useMouseMove(initialDelta !== undefined);
   const mouseUp = useMouseRelease(initialDelta !== undefined);
   const { cursorChangeHandler } = useContext(MouseContext);


   const onDragStart = useCallback((mouseX: number) => {
      setInitialDelta(width + mouseX);
      setOpen(width > 0);
   }, [setOpen, width]);

   const onDragEnd = useCallback(() => {
      handleRef.current?.blur();

      if (width > 0) {
         setDefaultWidth(width);
      }
      setInitialDelta(undefined);
   }, [width, setInitialDelta]);

   const updateWidth = useCallback((width: number) => {
      if (width < closeWidth) {
         width = 0;
      } else if (width < minWidth) {
         width = minWidth;
      } else if (width > maxWidth) {
         width = maxWidth;
      }

      setOpen(width > 0);
      setWidth(width);
   }, [closeWidth, minWidth, maxWidth, setOpen, setWidth]);

   const onDrag = useCallback((mouseX: number) => {
      if (initialDelta !== undefined) {
         updateWidth(initialDelta - mouseX);
      }
   }, [initialDelta, updateWidth]);

   const handleKey = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
         updateWidth(width + 10);
      } else if (e.key === "ArrowRight") {
         updateWidth(width - 10);
      }
   }, [updateWidth, width]);

   useEffect(() => {
      if (mousePosition) {
         onDrag(mousePosition.x);
      }
   }, [mousePosition, onDrag]);

   useEffect(() => {
      if (mouseUp !== undefined) {
         onDragEnd();
      }
   }, [mouseUp, onDragEnd]);

   useEffect(() => {
      if (open) {
         if (!width) {
            setWidth(defaultWidth);
         }
      } else if (width) {
         setWidth(0);
      }
   }, [open, defaultWidth, width]);

   useEffect(() => {
      if (initialDelta) {
         cursorChangeHandler("ew-resize");
      } else {
         cursorChangeHandler("");
      }
   }, [initialDelta, cursorChangeHandler]);

   const closeMenu = useCallback(() => {
      setOpen(false);
   }, [setOpen]);

   const onMouseDown = useCallback((e: MouseEvent) => onDragStart(e.pageX), [onDragStart])
   const className = useMemo(() => ('overflow-hidden shrink-0 flex flex-col [&>*:not(:first-child)]:mt-[7px]'
      + (width > 0 ? ' p-3 pt-[25px]' : ' hidden')), [width]);

   const layer = useMemo(() => {
      switch (menu) {
         case Menu.layers:
            return <Layers layers={layers} onLayerChange={onLayerChange} className={className} style={{ width: width }} />
         case Menu.nav:
            return <Nav closeMenu={closeMenu} className={className} style={{ width: width }} />
         case Menu.records:
            return <Records className={className} style={{ width: width }} />
      }
   }, [className, closeMenu, layers, menu, onLayerChange, width]);

   return <>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-static-element-interactions */}
      <div ref={handleRef} aria-orientation="vertical" tabIndex={0}
         onMouseDown={onMouseDown}
         onMouseUp={onDragEnd}
         onKeyDown={handleKey}
         className='relative z-10 select-none transition-std transition-colors w-2 bg-slate-900 hocus:bg-msfs shadow-smd cursor-ew-resize' />

      <div className={'overflow-hidden shrink-0 border-l border-gray-700 pointer-events-auto'
         + ' flex flex-col bg-gray-800 text-center text-white'
         + (width > 0 ? '' : ' hidden')}>
         {layer}
      </div>
   </>
};