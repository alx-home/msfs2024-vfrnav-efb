import { HTMLInputTypeAttribute, useState, useEffect, useRef, useMemo, RefObject, useCallback, KeyboardEvent, ChangeEvent, FocusEvent } from 'react';

export const Input = ({ className, active, placeholder, pattern, type, inputMode, validate, value, defaultValue, reset, onChange, onValidate, ref: parentRef }: {
   active: boolean,
   className?: string,
   placeholder?: string,
   pattern?: string,
   inputMode?: "email" | "search" | "tel" | "text" | "url" | "none" | "numeric" | "decimal",
   validate?: (_value: string, _blur: boolean) => boolean,
   onBlur?: (_value: string) => boolean,
   type?: HTMLInputTypeAttribute,
   reset?: boolean,
   value?: string,
   defaultValue?: string,
   onChange?: (_value: string) => void,
   onValidate?: (_value: string) => void,
   ref?: RefObject<HTMLInputElement | null>
}) => {
   const [valid, setValid] = useState(true);
   const [focused, setFocused] = useState(false);
   const [lastValue, setLastValue] = useState("");
   const [lastPropValue, setLastPropValue] = useState(value ?? "");

   const refInt = useRef<HTMLInputElement | null>(null);
   const ref = useMemo(() => parentRef ?? refInt, [parentRef]);

   useEffect(() => {
      if (reset) {
         if (ref.current) {
            setValid(true);
            ref.current.value = "";
            setLastValue("")
         }
         onChange?.(defaultValue ?? "");
      }
   }, [reset, ref, onChange, defaultValue]);

   useEffect(() => {
      if ((value ?? "") != lastPropValue) {
         if (!focused && ref.current) {
            if (value == defaultValue) {
               ref.current.value = ""
               setLastValue("")
            } else {
               ref.current.value = value ?? ""
               setLastValue(ref.current.value)
            }
         }
         setLastPropValue(value ?? "");
      }
   }, [value, focused, placeholder, ref, lastPropValue, defaultValue]);

   const onBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      setValid(validate?.(e.target.value, true) ?? true)
   }, [validate])

   const onFocus = useCallback(() => {
      setFocused(true);
   }, [])

   const onKeyUp = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
      if (e.code === "Enter") {
         onValidate?.(e.currentTarget.value);
      }
   }, [onValidate]);

   const onChangeC = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      if (validate?.(e.target.value, false) ?? true) {
         setValid(true);
         setLastValue(e.target.value)
         onChange?.(e.target.value);
      } else {
         setValid(false);
         ref.current!.value = lastValue;
      }
   }, [lastValue, onChange, ref, validate]);

   return <div className={"group overflow-hidden px-4 grow bg-gray-700 p-1 shadow-md flex text-left text-white rounded-sm border-2 border-gray-900 " + (className ?? "")
      + (active ? ' hocus:bg-gray-800 hocus:drop-shadow-xl hocus:border-msfs has-[:focus]:border-msfs has-[:hover]:border-msfs' : ' opacity-30')
      + (valid ? '' : ' invalid')}>
      <input ref={ref} type={type} className={'grow flex overflow-hidden bg-transparent ' + (valid ? '' : ' invalid')} disabled={!active} placeholder={placeholder} inputMode={inputMode} pattern={pattern}
         onChange={onChangeC}
         onKeyUp={onKeyUp}
         onBlur={onBlur}
         onFocus={onFocus}
      />
   </div>;
};