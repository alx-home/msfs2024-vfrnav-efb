import { HTMLInputTypeAttribute, useRef, useState, useEffect } from 'react';

export const Input = ({ className, active, _default, pattern, type, inputMode, validate, reset, onChange }: {
   active: boolean,
   className?: string,
   _default?: string,
   pattern?: string,
   inputMode?: "email" | "search" | "tel" | "text" | "url" | "none" | "numeric" | "decimal",
   validate?: (_value: string) => boolean,
   type?: HTMLInputTypeAttribute,
   reset?: boolean,
   onChange?: (_value: string) => void
}) => {
   const ref = useRef<HTMLInputElement | null>(null);
   const [value, setValue] = useState(_default ?? "");
   const [valid, setValid] = useState(true);

   useEffect(() => {
      if (reset) {
         setValue(_default ?? "");
         if (ref.current) {
            ref.current.value = "";
         }
      }
   }, [reset, setValue, _default]);

   useEffect(() => {
      onChange?.(value);
   }, [value, onChange]);

   return <div className={"group overflow-hidden px-4 grow bg-gray-700 p-1 shadow-lg flex text-left text-white rounded-sm border-2 border-gray-900 " + (className ?? "")
      + (active ? ' hocus:bg-gray-800 hocus:drop-shadow-xl hocus:border-msfs has-[:focus]:border-msfs has-[:hover]:border-msfs' : ' opacity-30')
      + (valid ? '' : ' invalid')}>
      <input ref={ref} type={type} className={'grow flex overflow-hidden bg-transparent ' + (valid ? '' : ' invalid')} disabled={!active} placeholder={value} inputMode={inputMode} pattern={pattern}
         onChange={e => {
            if (validate?.(e.target.value) ?? true) {
               setValue(e.target.value);
               setValid(true);
            } else {
               setValid(false);
               ref.current!.value = value;
            }
         }} />
   </div>;
};