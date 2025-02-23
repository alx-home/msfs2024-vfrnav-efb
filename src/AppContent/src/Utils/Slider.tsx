import useMouseMove from '@Events/MouseMove';
import useMouseRelease from '@Events/MouseRelease';
import {
   // useMemo,
   useEffect, useState,
   // useCallback, ChangeEvent,
   PropsWithChildren,
   useCallback,
   useRef,
   MouseEvent,
   useMemo,
   Dispatch,
   SetStateAction,
   forwardRef,
   ForwardedRef,
   useImperativeHandle
} from 'react';

type SlidderProps = PropsWithChildren<{
   active?: boolean,
   className?: string,
   reset?: boolean,
   value: number,
   defaultValue?: number,
   onChange: (_value: number) => void,
   bounds?: {
      min: number,
      max: number
   },
   range: {
      min: number,
      max: number
   },
   hideTrack?: boolean,
   passiveTrack?: boolean,
   trackCallback?: (_value: number) => void,
}>;

export type SliderRef = Dispatch<SetStateAction<boolean>>;

const SliderImpl = ({ className, active, range, reset, defaultValue, onChange, value, bounds, children, hideTrack, trackCallback, passiveTrack }: SlidderProps,
   slidderRef: ForwardedRef<SliderRef | null>) => {
   const trackRef = useRef<HTMLButtonElement>(null);
   const cursorRef = useRef<HTMLButtonElement>(null);
   const marginLeft = useMemo(() =>
      `${((value ?? range.min) - range.min) * 100 / (range.max - range.min)}%`
      , [value, range.min, range.max]);

   const [scrolling, setScrolling] = useState(false);
   const mousePosition = useMouseMove(scrolling);
   const mouseUp = useMouseRelease(scrolling);

   useImperativeHandle<SliderRef, SliderRef>(slidderRef, () => setScrolling);

   const timeout = useRef<NodeJS.Timeout>(undefined)
   const [lastUpdate, setLastUpdate] = useState(Date.now())

   const notify = useCallback((value: number) => {
      const newValue = Math.max(Math.min(value * (range.max - range.min) + range.min, bounds?.max ?? range.max), bounds?.min ?? range.min);
      onChange(newValue);
   }, [bounds?.max, bounds?.min, onChange, range.max, range.min]);

   useEffect(() => {
      if (mouseUp && scrolling) {
         setScrolling(false);
         trackRef.current?.blur();
         cursorRef.current?.blur();
      }
   }, [mouseUp, scrolling]);

   useEffect(() => {
      if (reset) {
         onChange(defaultValue ?? range.min);
      }
   }, [reset, onChange, defaultValue, range.min, range.max]);

   useEffect(() => {
      if (mousePosition) {
         const bounding = trackRef.current!.getBoundingClientRect();
         const cursorBoundings = cursorRef.current!.getBoundingClientRect();
         if (timeout.current) {
            clearTimeout(timeout.current);
         }

         const update = () => {
            setLastUpdate(Date.now());
            notify((mousePosition.x - bounding.left - (cursorBoundings.width / 2)) / (bounding.width - cursorBoundings.width))
         }

         if (Date.now() > lastUpdate + 10) {
            update()
         } else {
            timeout.current = setTimeout(update, 10);
         }
      }
   }, [lastUpdate, mousePosition, notify]);

   const onClick = useCallback((_event: MouseEvent<HTMLButtonElement>) => {
      if (trackCallback) {
         const bounding = trackRef.current!.getBoundingClientRect();
         const cursorBoundings = cursorRef.current!.getBoundingClientRect();

         trackCallback((_event.clientX - bounding.left - (cursorBoundings.width / 2)) * (range.max - range.min) / (bounding.width - cursorBoundings.width) + range.min)
      } else {
         setScrolling(true);
      }
   }, [range.max, range.min, trackCallback]);

   const onMouseDown = useCallback(() => {
      setScrolling(true);
   }, []);

   return <div className={"flex flex-row grow " + (className ?? "")}>
      {children}
      <div className={'group/slider relative flex flex-row grow max-w-full pr-[18px]'}>
         <button className={'peer flex flex-row h-7 z-10'
            + (!(active ?? true) ? ' opacity-20' : '')

            + ' w-[18px] min-w-[18px] h-[18px] border-2 rounded-2xl border-white transition-colors duration-100 shadow-md'

            + (scrolling ? ' border-msfs bg-gray-200 drop-shadow-xl' : ' bg-gray-700')

            + ((active ?? true) ?
               ' cursor-pointer'
               + ' group-hover/slider:border-msfs group-hover/slider:bg-gray-200 group-hover/slider:drop-shadow-xl'
               + ' group-focus-within/slider:border-msfs group-focus-within/slider:bg-gray-200 group-focus-within/slider:drop-shadow-xl'
               + ' hocus:border-msfs hocus:bg-gray-200 hocus:drop-shadow-xl'
               : ' pointer-events-none')
         }
            style={{ marginLeft: marginLeft }}
            onMouseDown={onMouseDown}
            ref={cursorRef}
         >
         </button>
         <div className='absolute z-0 left-0 top-0 right-0 bottom-0 flex flex-row grow'>
            <button className={'flex flex-row grow bg-transparent border-transparent h-[8px] m-auto'
               + ((active ?? true)
                  ? ' group-hover/slider:[&>*]:border-msfs group-hover/slider:drop-shadow-xl'
                  + ' group-focus-within/slider:[&>*]:border-msfs group-focus-within/slider:drop-shadow-xl'
                  : ' opacity-30')

               + (scrolling ? ' [&>*]:border-msfs drop-shadow-xl' : '')
               + ((passiveTrack || (hideTrack && !trackCallback)) ? ' pointer-events-none' : '')
            }
               tabIndex={-1}
               ref={trackRef}
               onMouseDown={onClick}
            >
               <div className={'flex flex-row grow transition-all duration-100 bg-gray-700 shadow-md h-[8px]'
                  + ' rounded-sm border-2 border-gray-900'
                  + (hideTrack ? ' opacity-0' : '')
               }
               />
            </button>
         </div>
      </div>
   </div>;
};

export const Slider = forwardRef<SliderRef, SlidderProps>(SliderImpl);