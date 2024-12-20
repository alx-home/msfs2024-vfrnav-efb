import { PropsWithChildren, useEffect, useRef, useState } from "react";

import checkImage from '@/images/check.svg';
import useMouseRelease from "@/Events/MouseRelease";

export const CheckBox = ({ className, active, children, _default, _onChange, reset }: PropsWithChildren<{
   className?: string,
   active: boolean,
   _default?: boolean,
   _onChange?: (_checked: boolean) => void,
   reset?: boolean
}>) => {
   const [checked, setChecked] = useState(_default ?? false);
   const elemRef = useRef<HTMLInputElement | null>(null);
   const mouseLeave = useMouseRelease();

   useEffect(() => _onChange?.(checked), [_onChange, checked, setChecked]);
   useEffect(() => {
      if (reset) {
         setChecked(_default ?? false);
      }
   }, [reset, setChecked, _default]);

   useEffect(() => {
      if (active && mouseLeave !== undefined) {
         elemRef.current?.blur();
      }
   }, [mouseLeave, active, checked]);

   return <div className={"relative flex flex-row "
      + (className ?? "")}>
      <div className="relative flex my-auto">
         <img className={'absolute transition transition-std p-0 m-0 left-[-7px] top-[-6px] w-14 h-12 invert pointer-events-none'
            + (checked ? '' : ' opacity-0')} src={checkImage} alt='checked' />
         <input type='checkbox' className={'peer absolute opacity-0 h-8 w-8 p-0 m-0 cursor-pointer'} checked={checked}
            onChange={() => { setChecked(checked => !checked) }}
            ref={elemRef}
            disabled={!active} />
         <div className={"flex h-8 w-8 bg-gray-700 p-1 shadow-md text-left rounded-sm border-2 border-gray-900 mr-4"
            + " peer-hocus:bg-gray-800 peer-hocus:border-msfs cursor-pointer"} />
      </div>
      {children}
   </div>;
};