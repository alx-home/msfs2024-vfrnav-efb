import { useRef, useMemo, useEffect, useState, useCallback, ChangeEvent, PropsWithChildren, forwardRef, ForwardedRef, useImperativeHandle } from 'react';

type InputProps = {
   active?: boolean,
   reset?: boolean,
   value?: number,
   defaultValue?: number,
   onChange?: (_value: number) => void,
   range: {
      min: number,
      max: number
   }
};
const InputImpl = ({ active, range, reset, defaultValue, onChange, value }: InputProps, inputRef: ForwardedRef<HTMLInputElement | null>) => {
   const ref = useRef<HTMLInputElement | null>(null);
   const [lastPropValue, setLastPropValue] = useState<number>();

   useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(inputRef, () => ref.current);

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
      onChange?.(+e.target.value);
   }, [onChange]);

   return <input type="range" min={range.min} max={range.max} step={step} ref={ref} disabled={!(active ?? true)}
      className={'absolute top-0 bottom-0 right-0 left-0 bg-transparent z-10 pointer-events-none w-full'

         + ' [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-runnable-track]:border-transparent'
         + ' [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:pointer-events-auto'
         + ' [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:rounded-2xl'
         + ' [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-gray-700'
         + ' [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-100'
         + ((active ?? true) ? ' cursor-pointer [&::-webkit-slider-thumb]:hocus:border-msfs [&::-webkit-slider-thumb]:hocus:bg-gray-200' : ' pointer-events-none')

         + ' [&::-moz-range-thumb]:appearance-none [&::-moz-range-track]:bg-transparent [&::-moz-range-track]:border-transparent'
         + ' [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:pointer-events-auto'
         + ' [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:rounded-2xl'
         + ' [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-gray-700'
         + ' [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-100'
         + ((active ?? true) ? ' cursor-pointer [&::-moz-range-thumb]:hocus:border-msfs [&::-moz-range-thumb]:hocus:bg-gray-200' : ' pointer-events-none')
      }
      onChange={onChangeC}
   />
}

const Input = forwardRef<HTMLInputElement | null, InputProps>(InputImpl);

export const DualSlider = ({ className, active, range, reset, defaultValue, onChange, value, children }: PropsWithChildren<{
   active?: boolean,
   className?: string,
   reset?: boolean,
   value?: {
      min: number,
      max: number
   },
   defaultValue?: {
      min: number,
      max: number
   },
   onChange?: (_min: number, _max: number) => void,
   range: {
      min: number,
      max: number
   }
}>) => {
   const minRef = useRef<HTMLInputElement | null>(null);
   const maxRef = useRef<HTMLInputElement | null>(null);

   const onChangeMin = useCallback((min: number) => {
      if (maxRef.current && min > +maxRef.current.value) {
         maxRef.current.value = min.toString();
      }
      onChange?.(min, +(maxRef.current?.value ?? range.max));
   }, [onChange, range.max]);

   const onChangeMax = useCallback((max: number) => {
      if (minRef.current && max < +minRef.current.value) {
         minRef.current.value = max.toString();
      }
      onChange?.(+(minRef.current?.value ?? range.min), max);
   }, [onChange, range.min]);


   return <div className={"flex flex-row grow " + (className ?? "")}>
      {children}
      <div className='group relative flex flex-row grow'>
         <div className='peer relative grow h-7'>
            <Input range={range} ref={minRef} active={active} reset={reset} value={value?.min} defaultValue={defaultValue?.min} onChange={onChangeMin} />
            <Input range={range} ref={maxRef} active={active} reset={reset} value={value?.max} defaultValue={defaultValue?.max} onChange={onChangeMax} />
         </div>
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