import useMouseRelease from '@Events/MouseRelease';
import { useRef, useMemo, RefObject, useEffect, useState, useCallback, ChangeEvent, PropsWithChildren } from 'react';

export const Slider = ({ className, active, ref: parentRef, range, reset, defaultValue, onChange, value, bounds, children }: PropsWithChildren<{
   active?: boolean,
   className?: string,
   reset?: boolean,
   value?: number,
   defaultValue?: number,
   onChange?: (_value: number) => void,
   bounds?: {
      min: number,
      max: number
   },
   range: {
      min: number,
      max: number
   },
   ref?: RefObject<HTMLInputElement | null>
}>) => {
   const [lastPropValue, setLastPropValue] = useState<number>();

   const refInt = useRef<HTMLInputElement | null>(null);
   const ref = useMemo(() => parentRef ?? refInt, [parentRef]);
   const mouseRelease = useMouseRelease();

   useEffect(() => {
      if ((active ?? true) && mouseRelease !== undefined) {
         ref.current?.blur();
      }
   }, [mouseRelease, active, ref]);

   useEffect(() => {
      if (reset) {
         if (ref.current) {
            ref.current.value = (defaultValue ?? range.min).toString();
         }
         onChange?.(defaultValue ?? range.min);
      }
   }, [reset, ref, onChange, defaultValue, range.min]);

   useEffect(() => {
      if (ref.current && (value ?? range.min) != lastPropValue) {
         ref.current.value = value?.toString() ?? ""
      }
      setLastPropValue(value);
   }, [value, ref, lastPropValue, defaultValue, range.min]);

   const step = useMemo(() => (range.max - range.min) / 100, [range.max, range.min]);

   const onChangeC = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      const value = Math.max(Math.min(+e.target.value, bounds?.max ?? +e.target.value), bounds?.min ?? +e.target.value)
      e.target.value = value.toString()
      onChange?.(value);
   }, [bounds?.max, bounds?.min, onChange]);

   return <div className={"flex flex-row grow " + (className ?? "")}>
      {children}
      <div className='group relative flex flex-row grow'>
         <input type="range" min={range.min} max={range.max} step={step} ref={ref} disabled={!(active ?? true)}
            className={'peer flex flex-row grow bg-transparent h-7 z-10'

               + ' [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-runnable-track]:border-transparent'
               + ' [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6'
               + ' [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:rounded-2xl'
               + ' [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-gray-700'
               + ' [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-100'
               + ((active ?? true) ? ' cursor-pointer [&::-webkit-slider-thumb]:hocus:border-msfs [&::-webkit-slider-thumb]:hocus:bg-gray-200' : ' pointer-events-none')

               + ' [&::-moz-range-thumb]:appearance-none [&::-moz-range-track]:bg-transparent [&::-moz-range-track]:border-transparent'
               + ' [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6'
               + ' [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:rounded-2xl'
               + ' [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-gray-700'
               + ' [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-100'
               + ((active ?? true) ? ' cursor-pointer [&::-moz-range-thumb]:hocus:border-msfs [&::-moz-range-thumb]:hocus:bg-gray-200' : ' pointer-events-none')
            }
            onChange={onChangeC}
         />
         <div className={'absolute z-0 left-0 top-0 right-0 bottom-0 flex flex-col justify-center'
            + ((active ?? true) ? ' peer-hocus:[&>*]:bg-gray-800 peer-hocus:[&>*]:border-msfs peer-hocus:drop-shadow-xl' : ' opacity-30')
         }>
            <div className={'flex flex-row grow transition-all duration-100 bg-gray-700 shadow-md max-h-3'
               + ' pointer-events-none rounded-sm border-2 border-gray-900 '
            } />
         </div>
      </div>
   </div>;
};