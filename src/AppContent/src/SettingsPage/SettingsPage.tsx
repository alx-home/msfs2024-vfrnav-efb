import { CheckBox } from "@/Utils/CheckBox";
import { Input } from "@/Utils/Input";
import { Scroll } from "@/Utils/Scroll";
import { Children, HTMLInputTypeAttribute, isValidElement, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import undoImg from '@/images/undo.svg';
import { SettingsContext } from "@/Settings";

const List = ({ children }: PropsWithChildren) => {
   return <Scroll>
      {children}
   </Scroll>;
}

const Item = ({ children, name, category, className, onReset }: PropsWithChildren<{
   name: string,
   category?: string,
   className?: string,
   onReset?: () => void
}>) => {
   const [reset, setReset] = useState(false);

   useEffect(() => {
      if (reset) {
         onReset?.();
         setReset(false);
      }
   }, [onReset, reset, setReset]);

   return <div className="group flex flex-row py-4 pl-6 hover:bg-menu [&>*:not(:first-child)]:ml-[22px] pr-4">
      <div className="flex flex-col grow basis-0">
         <div className="flex text-2xl font-semibold">
            {(category ? <div className="flex text-neutral-500">{category}:&nbsp;</div> : <></>)}
            {name}
         </div>
         <div className={"flex flex-col my-auto [&>*:not(:first-child)]:mt-[11px] p-2 pl-0 text-xl text-neutral-500 font-semibold pb-5 "
            + (className ?? '')
         }>
            {children}
         </div>
      </div>
      <div className="w-8">
         <button className="p-1"
            onClick={() => { setReset(true) }} >
            <img className="invert hover:filter-msfs cursor-pointer" src={undoImg} alt='undo' />
         </button>
      </div>
   </div>;
}

const ErrorMessage = ({ children }: PropsWithChildren<{
   type: string
}>) => {
   return children;
};

const InputItem = ({ children, name, category, _default, pattern, className, type, inputMode, validate, onChange }: PropsWithChildren<{
   name: string,
   category?: string,
   _default?: string,
   pattern?: string,
   className?: string,
   inputMode?: "email" | "search" | "tel" | "text" | "url" | "none" | "numeric" | "decimal",
   validate?: (_value: string) => boolean,
   type?: HTMLInputTypeAttribute,
   onChange?: (_value: string) => void
}>) => {
   const childs = useMemo(() => Children.toArray(children), [children]);
   const [reset, setReset] = useState(false);
   const resetCallback = useMemo(() => () => setReset(true), [setReset]);

   useEffect(() => {
      if (reset) {
         setReset(false);
      }
   }, [reset, setReset]);

   return <Item name={name} category={category} onReset={resetCallback}>
      {childs.filter(child => isValidElement<{ type: string }>(child) ? child.props.type !== 'Error' : true)}
      <Input reset={reset} className={"max-w-3xl peer " + (className ?? '')} validate={validate} onChange={onChange} inputMode={inputMode} type={type} active={true} _default={_default} pattern={pattern} />
      <p className="pl-8 hidden peer-[.invalid]:flex text-red-500 text-base">
         {childs.filter(child => isValidElement<{ type: string }>(child) && child.props.type === 'Error')}
      </p>
   </Item>;
}
const CheckItem = ({ children, name, category, _default, _onChange }: PropsWithChildren<{
   name: string,
   category?: string,
   _default?: boolean,
   _onChange?: (_checked: boolean) => void
}>) => {
   const [reset, setReset] = useState(false);
   const resetCallback = useMemo(() => () => setReset(true), [setReset]);

   useEffect(() => {
      if (reset) {
         setReset(false);
      }
   }, [reset, setReset]);

   return <Item name={name} category={category} onReset={resetCallback}>
      <CheckBox reset={reset} className="flex flex-row my-auto" active={true} _default={_default} _onChange={_onChange}>
         <div className="flex grow my-auto">
            {children}
         </div>
      </CheckBox>
   </Item>;
}

const Group = ({ children, name }: PropsWithChildren<{
   name: string
}>) => {
   return <div className="flex flex-col pl-0">
      <div className="flex text-4xl font-semibold p-2 pl-6 hover:bg-white hover:text-slate-700">{name}</div>
      {children}
   </div>;
}

export const SettingsPage = ({ active }: {
   active: boolean
}) => {
   const settings = useContext(SettingsContext)!;
   const [opacity, setOpacity] = useState(' opacity-0');

   useEffect(() => {
      if (active) {
         setOpacity(' opacity-100');
      } else {
         setOpacity(' opacity-0');
      }
   }, [active]);

   return <div className="flex grow justify-center m-2 p-4" style={active ? {} : { display: 'none' }}>
      <div className={"transition transition-std p-4 max-w-[1280px] h-full  m-auto flex text-left flex-col"
         + " hocus:border-msfs"
         + opacity
      }>
         <div className="flex flex-row pl-4 pb-6">
            <div className="flex flex-row grow min-h-12 items-center justify-between p-4 text-4xl font-semibold border-b-2 border-gray-700 mb-4">
               Settings
            </div>
         </div>
         <List>
            <Group name="Flight">
               <InputItem name="Speed" type="text" _default="95" inputMode="decimal" validate={value => /^\d*$/g.test(value)} onChange={(value: string) => settings.setSpeed(+value)}>
                  <div>
                     Set the cruise speed of the aircraft. Leg duration will be calculated on belief of this settings.
                  </div>
                  <ErrorMessage type='Error'>
                     Please enter a numerical value !
                  </ErrorMessage>
               </InputItem>
            </Group>
            <Group name="Navigation">
               <CheckItem category="Wind correction" name="Heading" _default={true} _onChange={settings.setAdjustHeading}>
                  Adjust navigation heading by taking into account the given leg wind.<br />
                  (not yet implemented)
               </CheckItem>
               <CheckItem category="Wind correction" name="Time" _default={true} _onChange={settings.setAdjustTime}>
                  Adjust navigation time by taking into account the given leg wind.<br />
                  (not yet implemented)
               </CheckItem>
            </Group>
         </List>
      </div>
   </div >;
}