import { useCallback, PropsWithChildren, useRef, useState, useEffect } from 'react';
import { Slider, SliderRef } from './Slider';

export const DualSlider = ({ className, active, range, reset, defaultValue, onChange, value, children }: PropsWithChildren<{
   active?: boolean,
   className?: string,
   reset?: boolean,
   value: {
      min: number,
      max: number
   },
   defaultValue?: {
      min: number,
      max: number
   },
   onChange: (_min: number, _max: number) => void,
   range: {
      min: number,
      max: number
   }
}>) => {
   const [next, setNext] = useState({
      min: value.min,
      max: value.max
   })
   const onChangeMin = useCallback((min: number) => {
      setNext(next => ({
         min: min,
         max: Math.max(min, next.max)
      }))
   }, []);

   const onChangeMax = useCallback((max: number) => {
      setNext(next => ({
         min: Math.min(next.min, max),
         max: max
      }))
   }, []);

   useEffect(() => {
      const epsilon = (range.max - range.min) / 10000;

      if (Math.abs(next.max - value.max) > epsilon || Math.abs((next.min - value.min)) > epsilon) {
         onChange(next.min, next.max);
      }
   }, [next.max, next.min, onChange, range.max, range.min, value.max, value.min])

   const sliderMinRef = useRef<SliderRef | null>(null);
   const sliderMaxRef = useRef<SliderRef | null>(null);

   const trackCallback = useCallback((_value: number) => {
      if (Math.abs(_value - value.min) > Math.abs(_value - value.max)) {
         sliderMaxRef.current!(true);
      } else {
         sliderMinRef.current!(true);
      }
   }, [value.max, value.min])


   return <div className={"flex flex-row grow " + (className ?? "")}>
      {children}
      <div className='group relative flex flex-row grow'>
         <div className='group/slider peer relative grow h-7'>
            <div className='absolute left-0 right-0 top-0 bottom-0'>
               <Slider ref={sliderMinRef} range={range} active={active} reset={reset} value={value.min} defaultValue={defaultValue?.min} onChange={onChangeMin} hideTrack={false} passiveTrack={true} />
            </div>
            <div className='absolute left-0 right-0 top-0 bottom-0'>
               <Slider ref={sliderMaxRef} range={range} active={active} reset={reset} value={value.max} defaultValue={defaultValue?.max} onChange={onChangeMax} hideTrack={true} trackCallback={trackCallback} />
            </div>
         </div>
      </div>
   </div>;
};