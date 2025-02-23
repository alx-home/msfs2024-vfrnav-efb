import useMouseMove from '@Events/MouseMove';
import useMouseRelease from '@Events/MouseRelease';
import { PropsWithChildren, useEffect, useState, CSSProperties, useCallback, MouseEvent, forwardRef, useRef, useImperativeHandle, ForwardedRef } from 'react';
import { useResize } from '@Events/Resize';

type ScrollProps = PropsWithChildren<{
   className?: string,
   style?: CSSProperties,
   hidden?: boolean,
   onWheel?: (_ev: WheelEvent) => void
}>;

type ScrollRef = HTMLDivElement | null;

const ScrollImpl = ({ children, className, style, hidden, onWheel }: ScrollProps, inputRef: ForwardedRef<ScrollRef>) => {
   const [scroll, setScroll] = useState({ x: 0, y: 0, ratioX: 0, ratioY: 0, width: 0, height: 0, displayX: false, displayY: false });
   const [scrolling, setScrolling] = useState<{ vertical: boolean } | undefined>(undefined);
   const [selectable, setSelectable] = useState(true);
   const mousePosition = useMouseMove(scrolling !== undefined);
   const [offset, setOffset] = useState(0);
   const mouseUp = useMouseRelease(scrolling !== undefined);
   const ref = useRef<ScrollRef>(null);
   const [dimensions, setResizeRef] = useResize();

   useImperativeHandle<ScrollRef, ScrollRef>(inputRef, () => ref.current);

   useEffect(() => {
      if (mouseUp !== undefined) {
         setScrolling(undefined);
         setSelectable(true);
         setOffset(0);
      }
   }, [mouseUp, scrolling]);

   useEffect(() => {
      if (mousePosition && scrolling && ref.current) {
         const boundings = ref.current.parentElement!.getBoundingClientRect();

         if (scrolling.vertical) {
            ref.current?.scroll({ top: (mousePosition.y + offset - (boundings?.top ?? 0) - scroll.height / 2) * scroll.ratioY });
         } else {
            ref.current?.scroll({ left: (mousePosition.x + offset - (boundings?.left ?? 0) - scroll.width / 2) * scroll.ratioX });
         }
      }
   }, [mousePosition, scroll.height, scroll.ratioX, scroll.ratioY, scroll.width, scrolling, offset]);

   const updateScroll = useCallback((target: HTMLDivElement) => {
      const ratio = [target.scrollWidth ? target.clientWidth / target.scrollWidth : 1, target.scrollHeight ? target.clientHeight / target.scrollHeight : 1];
      const client = [target.clientWidth, target.clientHeight];
      const scrollSize = [client[0] * ratio[0], client[1] * ratio[1]];

      const moveSize = [client[0] - scrollSize[0], client[1] - scrollSize[1]];
      const outer = [target.scrollWidth - client[0], target.scrollHeight - client[1]];
      const posRatio = [outer[0] ? target.scrollLeft / outer[0] : 0, outer[1] ? target.scrollTop / outer[1] : 0];

      setScroll({ x: moveSize[0] * posRatio[0], y: moveSize[1] * posRatio[1], ratioX: outer[0] / moveSize[0], ratioY: outer[1] / moveSize[1], width: scrollSize[0], height: scrollSize[1], displayX: outer[0] !== 0, displayY: outer[1] !== 0 })
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [setScroll, dimensions]);

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
      if (ref.current) {
         updateScroll(ref.current);
      }
   }, [updateScroll, ref.current?.scrollWidth, ref.current?.scrollHeight, ref.current?.scrollTop, ref.current?.scrollLeft]);

   useEffect(() => {
      const elem = ref.current;

      if (onWheel !== undefined && elem !== null) {
         elem.addEventListener('wheel', onWheel.bind(elem), { passive: false });
         return elem.removeEventListener('wheel', onWheel.bind(elem));
      }
   }, [onWheel]);

   return <div className='group/container flex w-full relative overflow-hidden'>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div className={'group/scroll absolute transition duration-1000 hover:duration-200 cursor-pointer z-10'
         + ' flex flex-row right-0 top-0 w-[7px] bottom-[7px] bg-gray-800 bg-opacity-50 opacity-0 hover:opacity-100'
         + ' group-hover/container:opacity-100'
         + (scroll.displayY ? '' : ' hidden')
      }
         onMouseDown={(e) => onClick(e, true)}
      >
         {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
         <div className={'transition grow bg-gray-700 group-hover/scroll:bg-msfs'
            + (scrolling?.vertical ? ' bg-msfs' : '')}
            style={{ marginTop: scroll.y, height: scroll.height }}
            onMouseDown={e => onScrollClick(e, true)}
         />
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div className={'group/scroll absolute transition duration-1000 hover:duration-200 cursor-pointer z-10'
         + ' flex flex-col left-0 right-[7px] h-[7px] bottom-0 bg-gray-800 bg-opacity-50 opacity-0 hover:opacity-100'
         + ' group-hover/container:opacity-100'
         + (scroll.displayX ? '' : ' hidden')
      }
         onMouseDown={(e) => onClick(e, false)}
      >
         {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
         <div className={'transition grow bg-gray-700 group-hover/scroll:bg-msfs'
            + ((scrolling ? !scrolling.vertical : false) ? ' bg-msfs' : '')}
            style={{ marginLeft: scroll.x, width: scroll.width }}
            onMouseDown={e => onScrollClick(e, false)}
         />
      </div>
      <div className={'group/scroll absolute transition duration-1000 hover:duration-200 z-10'
         + ' flex flex-col right-0 w-[7px] h-[7px] bottom-0 bg-gray-800 bg-opacity-50 opacity-0 hover:opacity-100'
         + ' group-hover/container:opacity-100'
         + ((scroll.displayX || scroll.displayY) ? '' : ' hidden')
      }
      />
      <div className={'peer flex w-full box-content overflow-scroll [scrollbar-width:none] '
         + (className ?? '')
         + (selectable ? '' : ' select-none')
         + ((hidden ?? false) ? ' hidden' : '')}
         style={style}
         ref={e => { ref.current = e; setResizeRef(e); }}
         onScroll={e => updateScroll(e.currentTarget)}
      >
         {children}
      </div>
   </div >;
};

export const Scroll = forwardRef<ScrollRef, ScrollProps>(ScrollImpl);