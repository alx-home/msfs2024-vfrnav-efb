import { HTMLInputTypeAttribute, useState, useEffect, useRef, useMemo, RefObject } from 'react';

export const Input = ({ className, active, placeholder, pattern, type, inputMode, validate, defaultValue, reset, onChange, onValidate, ref: parentRef }: {
   active: boolean,
   className?: string,
   placeholder?: string,
   pattern?: string,
   inputMode?: "email" | "search" | "tel" | "text" | "url" | "none" | "numeric" | "decimal",
   validate?: (_value: string) => boolean,
   type?: HTMLInputTypeAttribute,
   reset?: boolean,
   defaultValue?: string,
   onChange?: (_value: string) => void,
   onValidate?: (_value: string) => void,
   ref?: RefObject<HTMLInputElement | null>
}) => {
   const [value, setValue] = useState("");
   const [valid, setValid] = useState(true);

   const refInt = useRef<HTMLInputElement | null>(null);
   const ref = useMemo(() => parentRef ?? refInt, [parentRef]);

   useEffect(() => {
      if (reset) {
         setValue("");
         if (ref.current) {
            setValid(true);
            ref.current.value = "";
         }
      }
   }, [reset, setValue, ref]);

   useEffect(() => {
      onChange?.(value.length ? value : defaultValue ?? "");
   }, [value, onChange, defaultValue]);

   return <div className={"group overflow-hidden px-4 grow bg-gray-700 p-1 shadow-md flex text-left text-white rounded-sm border-2 border-gray-900 " + (className ?? "")
      + (active ? ' hocus:bg-gray-800 hocus:drop-shadow-xl hocus:border-msfs has-[:focus]:border-msfs has-[:hover]:border-msfs' : ' opacity-30')
      + (valid ? '' : ' invalid')}>
      <input ref={ref} type={type} className={'grow flex overflow-hidden bg-transparent ' + (valid ? '' : ' invalid')} disabled={!active} placeholder={placeholder} inputMode={inputMode} pattern={pattern}
         onChange={e => {
            if (validate?.(e.target.value) ?? true) {
               setValue(e.target.value);
               setValid(true);
            } else {
               setValid(false);
               ref.current!.value = value;
            }
         }}
         onKeyUp={e => {
            if (e.code === "Enter") {
               onValidate?.(e.currentTarget.value);
            }
         }} />
   </div>;
};