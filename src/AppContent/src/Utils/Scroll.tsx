import useMouseMove from '@/Events/MouseMove';
import useMouseRelease from '@/Events/MouseRelease';
import { PropsWithChildren, useRef, useEffect, useState, CSSProperties, useCallback, MouseEvent } from 'react';

export const Scroll = ({ children, className, style }: PropsWithChildren<{
   className?: string,
   style?: CSSProperties
}>) => {
   const [scroll, setScroll] = useState({ x: 0, y: 0, ratioX: 0, ratioY: 0, width: 0, height: 0, displayX: false, displayY: false });
   const [scrolling, setScrolling] = useState<{ vertical: boolean } | undefined>(undefined);
   const [visible, setVisible] = useState(0);
   const [selectable, setSelectable] = useState(true);
   const mousePosition = useMouseMove(scrolling !== undefined);
   const [offset, setOffset] = useState(0);
   const mouseUp = useMouseRelease();
   const ref = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
      if (mouseUp !== undefined) {
         setScrolling(undefined);
         setSelectable(true);
         setOffset(0);
         setTimeout(() => {
            setVisible(count => count === visible ? 0 : count);
         }, 1000);
      }
   }, [mouseUp, scrolling, visible]);

   useEffect(() => {
      if (mousePosition && scrolling && ref.current) {
         const boundings = ref.current?.parentElement!.getBoundingClientRect();

         if (scrolling.vertical) {
            ref.current?.scroll({ top: (mousePosition.y + offset - (boundings?.top ?? 0) - scroll.height / 2) * scroll.ratioY });
         } else {
            console.log((mousePosition.x - (boundings?.left ?? 0) - scroll.width / 2) * scroll.ratioX)
            ref.current?.scroll({ left: (mousePosition.x + offset - (boundings?.left ?? 0) - scroll.width / 2) * scroll.ratioX });
         }
      }
   }, [mousePosition, scroll.height, scroll.ratioX, scroll.ratioY, scroll.width, scrolling, offset]);

   const updateScroll = useCallback((target: HTMLDivElement) => {
      setVisible(visible => visible + 1);

      const ratio = [target.scrollWidth ? target.clientWidth / target.scrollWidth : 1, target.scrollHeight ? target.clientHeight / target.scrollHeight : 1];
      const client = [target.clientWidth, target.clientHeight];
      const scrollSize = [client[0] * ratio[0], client[1] * ratio[1]];

      const moveSize = [client[0] - scrollSize[0], client[1] - scrollSize[1]];
      const outer = [target.scrollWidth - client[0], target.scrollHeight - client[1]];
      const posRatio = [outer[0] ? target.scrollLeft / outer[0] : 0, outer[1] ? target.scrollTop / outer[1] : 0];

      setScroll({ x: moveSize[0] * posRatio[0], y: moveSize[1] * posRatio[1], ratioX: outer[0] / moveSize[0], ratioY: outer[1] / moveSize[1], width: scrollSize[0], height: scrollSize[1], displayX: outer[0] !== 0, displayY: outer[1] !== 0 })
   }, [setScroll]);

   const onClick = useCallback((_e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, vertical: boolean) => {
      setSelectable(false);
      setScrolling({ vertical: vertical });
   }, []);

   const onScrollClick = useCallback((e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>, vertical: boolean) => {
      const boundings = ref.current?.parentElement!.getBoundingClientRect();

      if (vertical) {
         setOffset((scroll.height / 2 + scroll.y) - (e.clientY - (boundings?.top ?? 0)));
      } else {
         setOffset((scroll.width / 2 + scroll.x) - (e.clientX - (boundings?.left ?? 0)));
      }
   }, [scroll.height, scroll.width, scroll.x, scroll.y]);

   useEffect(() => {
      if (visible) {
         setTimeout(() => {
            setVisible(count => count === visible && scrolling === undefined ? 0 : count);
         }, 1000);
      }
   }, [visible, scrolling]);

   useEffect(() => {
      if (ref.current) {
         updateScroll(ref.current);
      }
   }, [updateScroll, ref.current?.scrollWidth, ref.current?.scrollHeight, ref.current?.scrollTop, ref.current?.scrollLeft]);

   return <div className='flex relative overflow-hidden'>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div className={'group absolute transition duration-1000 hover:duration-200 hover:cursor-pointer'
         + ' flex flex-row right-0 top-0 w-[7px] bottom-0 bg-gray-800 bg-opacity-50 opacity-0 hover:opacity-100'
         + (visible ? ' opacity-100' : '')
         + (scroll.displayY ? '' : ' hidden')
      }
         onMouseDown={(e) => onClick(e, true)}
      >
         {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
         <div className={'transition grow bg-gray-700 group-hover:bg-msfs'
            + (visible ? ' bg-msfs' : '')} style={{ marginTop: scroll.y, height: scroll.height }}
            onMouseDown={e => onScrollClick(e, true)}
         />
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div className={'group absolute transition duration-1000 hover:duration-200 hover:cursor-pointer'
         + ' flex flex-col left-0 right-0 h-[7px] bottom-0 bg-gray-800 bg-opacity-50 opacity-0 hover:opacity-100'
         + (visible ? ' opacity-100' : '')
         + (scroll.displayX ? '' : ' hidden')
      }
         onMouseDown={(e) => onClick(e, false)}
      >
         {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
         <div className={'transition grow bg-gray-700 group-hover:bg-msfs'
            + (visible ? ' bg-msfs' : '')} style={{ marginLeft: scroll.x, width: scroll.width }}
            onMouseDown={e => onScrollClick(e, false)}
         />
      </div>
      <div className={'box-content overflow-scroll [scrollbar-width:none] '
         + (className ?? '')
         + (selectable ? '' : ' select-none')}
         style={style}
         ref={ref}
         onScroll={e => {
            updateScroll(e.currentTarget);
         }}>
         {children}
      </div>
   </div >;
};