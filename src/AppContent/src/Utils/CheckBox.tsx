import { ChangeEvent, PropsWithChildren, useCallback, useEffect, useRef } from "react";

import checkImage from '@images/check.svg';

export const CheckBox = ({ className, active, children, value, defaultValue, onChange, reset }: PropsWithChildren<{
   className?: string,
   active?: boolean,
   defaultValue?: boolean,
   value: boolean,
   onChange: (_checked: boolean) => void,
   reset?: boolean
}>) => {
   const elemRef = useRef<HTMLInputElement | null>(null);

   useEffect(() => {
      if (reset) {
         onChange(defaultValue ?? false);
      }
   }, [reset, defaultValue, value, onChange]);

   const onChangeC = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      elemRef.current?.blur();
      onChange(e.currentTarget.checked)
   }, [onChange]);

   return <div className={"relative flex flex-row "
      + (className ?? "")}>
      <div className={"relative flex my-auto"
         + ((active ?? true) ? '' : ' opacity-15 pointer-events-none')}>
         <img className={'absolute transition transition-std p-0 m-0 left-[-7px] top-[-6px] w-14 h-12 invert pointer-events-none'
            + (value ? '' : ' opacity-0')} src={checkImage} alt='checked' />
         <input type='checkbox' className={'peer absolute opacity-0 h-8 w-8 p-0 m-0 cursor-pointer'} checked={value}
            onChange={onChangeC}
            ref={elemRef}
            disabled={!(active ?? true)} />
         <div className={"flex h-8 w-8 bg-gray-700 p-1 shadow-md text-left rounded-sm border-2 border-gray-900 mr-4"
            + " peer-hocus:bg-gray-800 peer-hocus:border-msfs cursor-pointer"} />
      </div>
      {children}
   </div>;
};