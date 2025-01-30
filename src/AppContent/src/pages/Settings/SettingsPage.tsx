import { CheckBox } from "@Utils/CheckBox";
import { Input } from "@Utils/Input";
import { Scroll } from "@Utils/Scroll";
import { Children, HTMLInputTypeAttribute, isValidElement, PropsWithChildren, ReactElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import undoImg from '@images/undo.svg';
import { SettingsContext } from "@Settings";
import { SharedSettingsDefault } from "@shared/Settings";

const List = ({ children }: PropsWithChildren) => {
   return <Scroll className="flex flex-col">
      <div>
         {children}
      </div>
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
         <div className={"flex flex-col my-auto [&>*:not(:first-child,.no-margin)]:mt-[11px] p-2 pl-0 text-xl text-neutral-500 font-semibold pb-5 "
            + (className ?? '')
         }>
            {children}
         </div>
      </div>
      <div className="w-8">
         <button className="p-1 bg-transparent"
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

const InputItem = ({ children, name, category, placeholder, pattern, className, type, inputMode, validate, onChange, defaultValue, value }: PropsWithChildren<{
   name: string,
   category?: string,
   placeholder?: string,
   pattern?: string,
   className?: string,
   defaultValue?: string,
   value?: string,
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
      <Input reset={reset} defaultValue={defaultValue} value={value} className={"max-w-3xl peer " + (className ?? '')} validate={validate}
         onChange={onChange} inputMode={inputMode} type={type} active={true} placeholder={placeholder} pattern={pattern} />
      <div className="no-margin hidden h-0 peer-[.invalid]:flex">
         <p className="pl-8 pt-1 text-red-500 text-base">
            {childs.filter(child => isValidElement<{ type: string }>(child) && child.props.type === 'Error')}
         </p>
      </div>
   </Item>;
}

type CheckItemProps = PropsWithChildren<{
   name: string,
   category?: string,
   defaultValue?: boolean,
   value?: boolean,
   onChange?: (_checked: boolean) => void
}>;


const CheckItem = ({ children, name, category, value, defaultValue, onChange }: CheckItemProps) => {
   const [reset, setReset] = useState(false);
   const resetCallback = useMemo(() => () => setReset(true), [setReset]);

   useEffect(() => {
      if (reset) {
         setReset(false);
      }
   }, [reset, setReset]);

   return <Item name={name} category={category} onReset={resetCallback}>
      <CheckBox reset={reset} className="flex flex-row my-auto" active={true} value={value} defaultValue={defaultValue} onChange={onChange}>
         <div className="flex grow my-auto">
            {children}
         </div>
      </CheckBox>
   </Item>;
}

const isCheckItem = (child: unknown): child is ReactElement<CheckItemProps> => {
   if (!isValidElement(child)) {
      return false;
   }

   const keys = [
      "name" as keyof CheckItemProps
   ];
   for (const key of keys) {
      if ((child.props as CheckItemProps)[key] === undefined) {
         return false
      }
   }

   return true
};

const CheckItems = ({ children, name, category }: PropsWithChildren<{
   name: string,
   category?: string
}>) => {
   const [reset, setReset] = useState(false);
   const resetCallback = useMemo(() => () => setReset(true), [setReset]);
   const childs = useMemo(() =>
      Children.toArray(children).filter(child => isCheckItem(child)).map((child) =>
         <CheckBox key={child.key} reset={reset} className="flex flex-row my-auto" active={true}
            value={child.props.value} defaultValue={child.props.defaultValue} onChange={child.props.onChange}>
            <div className="flex grow my-auto">
               {child.props.children}
            </div>
         </CheckBox>
      ), [children, reset]);

   useEffect(() => {
      if (reset) {
         setReset(false);
      }
   }, [reset, setReset]);

   return <Item name={name} category={category} onReset={resetCallback}>
      {childs}
   </Item>;
}

const Group = ({ children, name, className }: PropsWithChildren<{
   name: string,
   className?: string
}>) => {
   return <div className={"flex-col pl-0 " + className}>
      <div className="flex text-4xl font-semibold p-2 pl-6 hover:bg-white hover:text-slate-700">{name}</div>
      <div className="content flex-col">
         {children}
      </div>
   </div>;
}

export const SettingsPage = ({ active }: {
   active: boolean
}) => {
   const settings = useContext(SettingsContext)!;
   const [opacity, setOpacity] = useState(' opacity-0');
   const [advanced, setAdvanced] = useState(false);
   const setSpeed = useCallback((value: string) => settings.setSpeed(+value), [settings]);

   useEffect(() => {
      if (active) {
         setOpacity(' opacity-100');
      } else {
         setOpacity(' opacity-0');
      }
   }, [active]);

   return <div className="flex grow justify-center m-2 p-4" style={active ? {} : { display: 'none' }}>
      <div className={"transition transition-std p-4 max-w-[1280px] h-full  m-auto flex text-left flex-col grow"
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
               <InputItem name="Speed" type="text" placeholder={SharedSettingsDefault.speed.toString()} inputMode="decimal"
                  value={settings.speed.toString()} defaultValue={SharedSettingsDefault.speed.toString()}
                  validate={value => /^\d*$/g.test(value)}
                  onChange={setSpeed}>
                  <div>
                     Set the cruise speed of the aircraft. Leg duration will be calculated on belief of this settings.
                  </div>
                  <ErrorMessage type='Error'>
                     Please enter a numerical value !
                  </ErrorMessage>
               </InputItem>
            </Group>
            <Group name="Navigation">
               <CheckItem category="Wind correction" name="Heading"
                  value={settings.adjustHeading} defaultValue={SharedSettingsDefault.adjustHeading}
                  onChange={settings.setAdjustHeading}>
                  Adjust navigation heading by taking into account the given leg wind.<br />
                  (not yet implemented)
               </CheckItem>
               <CheckItem category="Wind correction" name="Time"
                  value={settings.adjustTime} defaultValue={SharedSettingsDefault.adjustTime}
                  onChange={settings.setAdjustTime}>
                  Adjust navigation time by taking into account the given leg wind.<br />
                  (not yet implemented)
               </CheckItem>
            </Group>
            <Group name="Map">
               <CheckItems name="VFR" category="Layers">
                  <CheckItem name="OACI" onChange={settings.setOACIEnabled}
                     value={settings.OACIEnabled} defaultValue={SharedSettingsDefault.OACIEnabled}>
                     Use France OACI Layer (geoportal)
                  </CheckItem>
                  <CheckItem name="Germany" onChange={settings.setGermanyEnabled}
                     value={settings.germanyEnabled} defaultValue={SharedSettingsDefault.germanyEnabled} >
                     Use Germany VFR Layer (secais).
                  </CheckItem>
                  <CheckItem name="US" onChange={settings.setUSSectionalEnabled}
                     value={settings.USSectionalEnabled} defaultValue={SharedSettingsDefault.USSectionalEnabled} >
                     Use US sectional Layers (iflightplanner).
                  </CheckItem>
               </CheckItems>
               <CheckItems name="IFR" category="Layers">
                  <CheckItem name="US" onChange={settings.setUSIFRHighEnabled}
                     value={settings.USIFRHighEnabled} defaultValue={SharedSettingsDefault.USIFRHighEnabled} >
                     Use US High IFR Layers (iflightplanner).
                  </CheckItem>
                  <CheckItem name="US" onChange={settings.setUSIFRLowEnabled}
                     value={settings.USIFRLowEnabled} defaultValue={SharedSettingsDefault.USIFRLowEnabled} >
                     Use US Low IFR Layers (iflightplanner).
                  </CheckItem>
               </CheckItems>
               <CheckItems name="Topographic" category="Layers">
                  <CheckItem name="Open Topo" onChange={settings.setOpenTopoEnabled}
                     value={settings.openTopoEnabled} defaultValue={SharedSettingsDefault.openTopoEnabled} >
                     Use Open Topo Layer.
                  </CheckItem>
                  <CheckItem name="Map for free" onChange={settings.setMapForFreeEnabled}
                     value={settings.mapForFreeEnabled} defaultValue={SharedSettingsDefault.mapForFreeEnabled} >
                     Use Map for free Layer.
                  </CheckItem>
               </CheckItems>
               <CheckItems name="World" category="Layers">
                  <CheckItem name="Google Map" onChange={settings.setGoogleMapEnabled}
                     value={settings.googleMapEnabled} defaultValue={SharedSettingsDefault.googleMapEnabled}>
                     Use Google map Layer.
                  </CheckItem>
                  <CheckItem name="Openstreet map" onChange={settings.setOpenStreetEnabled}
                     value={settings.openStreetEnabled} defaultValue={SharedSettingsDefault.openStreetEnabled} >
                     Use Openstreet map Layer.
                  </CheckItem>
               </CheckItems>
            </Group>
            <Group name="Enroute Charts" className={advanced ? "" : 'hidden'}>
               <div className={advanced ? "" : 'hidden'}>
                  <InputItem category="SIA" name="Address" inputMode="text"
                     validate={value =>
                        (value.substring(0, 8) === 'https://'.substring(0, value.length))
                        && (value.length < 9 || /^(\w|:|\/|-|_|\.)+(?:\{|$)(?:i|$)(?:c|$)(?:a|$)(?:o|$)(?:\}|$)(\w|:|\/|-|_|\.)*$/g.test(value.substring(8)))
                     }
                     placeholder={__SIA_ADDR__}
                     value={settings.SIAAddr} defaultValue={SharedSettingsDefault.SIAAddr}
                     onChange={settings.setSIAAddr}>
                     PDF template Address with {'{icao}'} placeholder.<br />
                     If the default address does not works anymore, please go to the addon wiki for more information: <br />
                     <a href="https://github.com/alx-home/msfs2024-vfrnav-efb">https://github.com/alx-home/msfs2024-vfrnav-efb</a>
                     <ErrorMessage type='Error'>
                        Invalid Address! pattern: https://***{'{icao}'}***
                     </ErrorMessage>
                  </InputItem>
                  <InputItem category="SIA" name="Authorization token" inputMode="text"
                     validate={value => /^(\w+)?=?$/g.test(value)}
                     placeholder='Please enter an authorization token'
                     value={settings.SIAAuth} defaultValue={SharedSettingsDefault.SIAAuth}
                     onChange={settings.setSIAAuth}>
                     Authorization token for accessing SIA Enroute charts on the PDF page.<br />
                     If the default authorization token value does not works anymore, please go to the addon wiki for more information: <br />
                     <a href="https://github.com/alx-home/msfs2024-vfrnav-efb">https://github.com/alx-home/msfs2024-vfrnav-efb</a>
                  </InputItem>
               </div>
            </Group>
            <Group name="Expert">
               <CheckItem category="Settings" name="Advanced" onChange={setAdvanced} defaultValue={false} >
                  Display advanced settings.
               </CheckItem>
            </Group>
         </List>
      </div>
   </div >;
}