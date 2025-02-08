import { CheckBox } from "@Utils/CheckBox";
import { Input } from "@Utils/Input";
import { Scroll } from "@Utils/Scroll";
import { Children, HTMLInputTypeAttribute, isValidElement, PropsWithChildren, ReactElement, useCallback, useContext, useEffect, useMemo, useState, JSX } from 'react';

import { SettingsContext, SharedSettingsDefault } from "@Settings";
import { Slider } from "@Utils/Slider";

import undoImg from '@images/undo.svg';
import markerImg from '@images/marker-icon-blue.svg';
import { DualSlider } from "@Utils/DualSlider";

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
            {(category ? <div className="flex text-slate-500">{category}:&nbsp;</div> : <></>)}
            {name}
         </div>
         <div className={"flex flex-col my-auto [&>*:not(:first-child,.no-margin)]:mt-[11px] p-2 pl-0 text-xl text-slate-500 font-semibold pb-5 "
            + (className ?? '')
         }>
            {children}
         </div>
      </div>
      <div className="w-8">
         <button className="p-1 bg-transparent" tabIndex={-1}
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

const SliderItem = ({ name, category, className, onChange, defaultValue, value, range, bounds, children }: PropsWithChildren<{
   name: string,
   category?: string,
   className?: string,
   defaultValue?: number,
   value?: number,
   bounds?: {
      min: number,
      max: number
   },
   range: { min: number, max: number },
   onChange?: (_value: number) => void
}>) => {
   const [reset, setReset] = useState(false);
   const resetCallback = useMemo(() => () => setReset(true), [setReset]);
   const childs = useMemo(() => Children.toArray(children), [children]);

   useEffect(() => {
      if (reset) {
         setReset(false);
      }
   }, [reset, setReset]);

   return <Item name={name} category={category} onReset={resetCallback}>
      {childs.filter(child => isValidElement<{ type: string }>(child) ? child.props.type !== 'Error' : true)}
      <Slider reset={reset} defaultValue={defaultValue} value={value} className={"max-w-3xl peer " + (className ?? '')}
         onChange={onChange} bounds={bounds} active={true} range={range} />
   </Item>;
}

const DualSliderItem = ({ name, category, className, onChange, defaultValue, value, range, children }: PropsWithChildren<{
   name: string,
   category?: string,
   className?: string,
   defaultValue?: {
      min: number,
      max: number
   },
   value?: {
      min: number,
      max: number
   },
   range: { min: number, max: number },
   onChange?: (_min: number, _max: number) => void
}>) => {
   const [reset, setReset] = useState(false);
   const resetCallback = useMemo(() => () => setReset(true), [setReset]);
   const childs = useMemo(() => Children.toArray(children), [children]);

   useEffect(() => {
      if (reset) {
         setReset(false);
      }
   }, [reset, setReset]);

   return <Item name={name} category={category} onReset={resetCallback}>
      {childs.filter(child => isValidElement<{ type: string }>(child) ? child.props.type !== 'Error' : true)}
      <DualSlider reset={reset} defaultValue={defaultValue} value={value} className={"max-w-3xl peer " + (className ?? '')}
         onChange={onChange} active={true} range={range} />
   </Item>;
}

const CheckItem = ({ children, name, category, value, defaultValue, onChange }: PropsWithChildren<{
   name: string,
   category?: string,
   defaultValue?: boolean,
   value?: boolean,
   onChange?: (_checked: boolean) => void
}>) => {
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

const isItem = <T,>(child: unknown): child is ReactElement<PropsWithChildren<T>> => {
   if (!isValidElement(child)) {
      return false;
   }

   return true
};

const Legend = ({ children }: PropsWithChildren) => {
   return <>
      {children}
   </>
}

const isLegend = (child: unknown) => {
   if (!isValidElement(child)) {
      return false;
   }

   return child.type === Legend;
};

type Props = PropsWithChildren<{
   name: string,
   category?: string,
   Comp: JSX.ElementType
}>;
const Items = ({ children, name, category, Comp }: Props) => {
   const [reset, setReset] = useState(false);
   const resetCallback = useMemo(() => () => setReset(true), [setReset]);
   const childs = useMemo(() =>
      Children.toArray(children).filter(child => isItem(child)).map((child) => {
         if (isLegend(child)) {
            return child
         } else {
            return <Comp key={child.key} reset={reset} className="flex flex-row my-auto" {...child.props}>
               {child.props.children}
            </Comp>
         }
      }
      ), [Comp, children, reset]);

   useEffect(() => {
      if (reset) {
         setReset(false);
      }
   }, [reset, setReset]);

   return <>
      <Item name={name} category={category} onReset={resetCallback}>
         {childs}
      </Item>
   </>;
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

   const textSize = useMemo(() => ({ min: SharedSettingsDefault.map.text.minSize, max: SharedSettingsDefault.map.text.maxSize }), []);
   const setTextSize = useCallback((min: number, max: number) => {
      settings.map.text.setMinSize(min);
      settings.map.text.setMaxSize(max);
   }, [settings.map.text]);

   const setMapTextRed = useCallback((value: number) => {
      settings.map.text.setColor((old) => ({ ...old, red: value }))
   }, [settings.map.text]);
   const setMapTextGreen = useCallback((value: number) => {
      settings.map.text.setColor((old) => ({ ...old, green: value }))
   }, [settings.map.text]);
   const setMapTextBlue = useCallback((value: number) => {
      settings.map.text.setColor((old) => ({ ...old, blue: value }))
   }, [settings.map.text]);
   const setMapTextAlpha = useCallback((value: number) => {
      settings.map.text.setColor((old) => ({ ...old, alpha: value }))
   }, [settings.map.text]);

   const setMapTextBorderRed = useCallback((value: number) => {
      settings.map.text.setBorderColor((old) => ({ ...old, red: value }))
   }, [settings.map.text]);
   const setMapTextBorderGreen = useCallback((value: number) => {
      settings.map.text.setBorderColor((old) => ({ ...old, green: value }))
   }, [settings.map.text]);
   const setMapTextBorderBlue = useCallback((value: number) => {
      settings.map.text.setBorderColor((old) => ({ ...old, blue: value }))
   }, [settings.map.text]);
   const setMapTextBorderAlpha = useCallback((value: number) => {
      settings.map.text.setBorderColor((old) => ({ ...old, alpha: value }))
   }, [settings.map.text]);

   return <div className="flex grow justify-center m-2 p-4" style={active ? {} : { display: 'none' }}>
      <div className={"transition transition-std p-4 max-w-[1280px] h-full  m-auto flex text-left flex-col grow"
         + " hocus:border-msfs"
         + opacity
      }>
         <div className="flex flex-row pl-4 pb-[32px]">
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
               <Items name="VFR" category="Layers" Comp={CheckBox}>
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
               </Items>
               <Items name="IFR" category="Layers" Comp={CheckBox}>
                  <CheckItem name="US" onChange={settings.setUSIFRHighEnabled}
                     value={settings.USIFRHighEnabled} defaultValue={SharedSettingsDefault.USIFRHighEnabled} >
                     Use US High IFR Layers (iflightplanner).
                  </CheckItem>
                  <CheckItem name="US" onChange={settings.setUSIFRLowEnabled}
                     value={settings.USIFRLowEnabled} defaultValue={SharedSettingsDefault.USIFRLowEnabled} >
                     Use US Low IFR Layers (iflightplanner).
                  </CheckItem>
               </Items>
               <Items name="Topographic" category="Layers" Comp={CheckBox}>
                  <CheckItem name="Open Topo" onChange={settings.setOpenTopoEnabled}
                     value={settings.openTopoEnabled} defaultValue={SharedSettingsDefault.openTopoEnabled} >
                     Use Open Topo Layer.
                  </CheckItem>
                  <CheckItem name="Map for free" onChange={settings.setMapForFreeEnabled}
                     value={settings.mapForFreeEnabled} defaultValue={SharedSettingsDefault.mapForFreeEnabled} >
                     Use Map for free Layer.
                  </CheckItem>
               </Items>
               <Items name="World" category="Layers" Comp={CheckBox}>
                  <CheckItem name="Google Map" onChange={settings.setGoogleMapEnabled}
                     value={settings.googleMapEnabled} defaultValue={SharedSettingsDefault.googleMapEnabled}>
                     Use Google map Layer.
                  </CheckItem>
                  <CheckItem name="Openstreet map" onChange={settings.setOpenStreetEnabled}
                     value={settings.openStreetEnabled} defaultValue={SharedSettingsDefault.openStreetEnabled} >
                     Use Openstreet map Layer.
                  </CheckItem>
               </Items>
            </Group>
            <Group name="Map Display">
               <DualSliderItem category="Legs" name="Text size"
                  range={{ min: 5, max: 50 }}
                  defaultValue={textSize}
                  value={textSize}
                  onChange={setTextSize}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex flex-row min-w-[80px] justify-center">
                        <div className={"flex flex-col justify-center mr-1"} style={{ font: `900 ${settings.map.text.minSize.toFixed(0)}px Inter-bold, sans-serif` }}>a</div>
                        <div className={"flex flex-col justify-center"} style={{ font: `900 ${settings.map.text.maxSize.toFixed(0)}px Inter-bold, sans-serif` }}>A</div>
                     </div>
                     <div className="flex flex-col justify-center">Set bounds of navigation legs text size.</div>
                  </div>
               </DualSliderItem>
               <SliderItem category="Legs" name="Border size"
                  range={{ min: 1, max: 15 }}
                  defaultValue={SharedSettingsDefault.map.text.borderSize}
                  value={settings.map.text.borderSize}
                  onChange={settings.map.text.setBorderSize}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex min-w-[50px] justify-center mr-2">
                        <div className={"relative flex flex-col justify-center"} style={{ font: `900 50px Inter-bold, sans-serif` }}>
                           <div className="z-0 text-transparent" style={{
                              WebkitTextStroke: `${settings.map.text.borderSize.toFixed(0)}px #fff`
                           }}>A</div>
                           <div className="position absolute top-0 bottom-0 left-0 right-0 z-10 text-[var(--background)] group-hover:text-[var(--menu-bg)]">A</div></div>
                     </div>
                     <div className="flex flex-col justify-center">Set navigation legs text border size.</div>
                  </div>
               </SliderItem>
               <Items name="Text Color" category="Legs" Comp={Slider}>
                  <Legend>
                     <div className="flex flex-row min-h-[60px]">
                        <div className="flex min-w-[50px] justify-center">
                           <div className={"flex flex-col justify-center bg-white rounded-md px-2 mr-2"} style={{ font: `900 50px Inter-bold, sans-serif`, color: `rgba(${settings.map.text.color.red.toFixed(0)}, ${settings.map.text.color.green.toFixed(0)}, ${settings.map.text.color.blue.toFixed(0)}, ${settings.map.text.color.alpha})` }}>A</div>
                           <div className="flex flex-col justify-center">Set navigation legs text color.</div>
                        </div>
                     </div>
                  </Legend>
                  <SliderItem name="Red" className="max-w-3xl"
                     range={{ min: 0, max: 255 }}
                     defaultValue={SharedSettingsDefault.map.text.color.red}
                     value={settings.map.text.color.red}
                     onChange={setMapTextRed}
                  >
                     <div className="flex flex-row w-20">
                        Red:
                     </div>
                  </SliderItem>
                  <SliderItem name="Green" className="max-w-3xl"
                     range={{ min: 0, max: 255 }}
                     defaultValue={SharedSettingsDefault.map.text.color.green}
                     value={settings.map.text.color.green}
                     onChange={setMapTextGreen}
                  >
                     <div className="flex flex-row w-20">
                        Green:
                     </div>
                  </SliderItem>
                  <SliderItem name="Blue" className="max-w-3xl"
                     range={{ min: 0, max: 255 }}
                     defaultValue={SharedSettingsDefault.map.text.color.blue}
                     value={settings.map.text.color.blue}
                     onChange={setMapTextBlue}
                  >
                     <div className="flex flex-row w-20">
                        Blue:
                     </div>
                  </SliderItem>
                  <SliderItem category="Text" name="Alpha" className="max-w-3xl"
                     range={{ min: 0, max: 1 }}
                     defaultValue={SharedSettingsDefault.map.text.color.alpha}
                     value={settings.map.text.color.alpha}
                     onChange={setMapTextAlpha}>
                     <div className="flex flex-row w-20">
                        Alpha:
                     </div>
                  </SliderItem>
               </Items>
               <Items name="Border Color" category="Legs" Comp={Slider}>
                  <Legend>
                     <div className="flex flex-row min-h-[60px]">
                        <div className="flex min-w-[50px] justify-center mr-2">
                           <div className={"relative flex flex-col justify-center"} style={{ font: `900 50px Inter-bold, sans-serif` }}>
                              <div className="z-0 text-transparent" style={{
                                 WebkitTextStroke: `10px rgba(${settings.map.text.borderColor.red.toFixed(0)}, ${settings.map.text.borderColor.green.toFixed(0)}, ${settings.map.text.borderColor.blue.toFixed(0)}, ${settings.map.text.borderColor.alpha})`
                              }}>A</div>
                              <div className="position absolute top-0 bottom-0 left-0 right-0 text-[var(--background)] group-hover:text-[var(--menu-bg)] z-10">A</div>
                           </div>
                        </div>
                        <div className="flex flex-col justify-center">Set navigation legs text border color.</div>
                     </div>
                  </Legend>
                  <SliderItem name="Red" className="max-w-3xl"
                     range={{ min: 0, max: 255 }}
                     defaultValue={SharedSettingsDefault.map.text.borderColor.red}
                     value={settings.map.text.borderColor.red}
                     onChange={setMapTextBorderRed}
                  >
                     <div className="flex flex-row w-20">
                        Red:
                     </div>
                  </SliderItem>
                  <SliderItem name="Green" className="max-w-3xl"
                     range={{ min: 0, max: 255 }}
                     defaultValue={SharedSettingsDefault.map.text.borderColor.green}
                     value={settings.map.text.borderColor.green}
                     onChange={setMapTextBorderGreen}
                  >
                     <div className="flex flex-row w-20">
                        Green:
                     </div>
                  </SliderItem>
                  <SliderItem name="Blue" className="max-w-3xl"
                     range={{ min: 0, max: 255 }}
                     defaultValue={SharedSettingsDefault.map.text.borderColor.blue}
                     value={settings.map.text.borderColor.blue}
                     onChange={setMapTextBorderBlue}
                  >
                     <div className="flex flex-row w-20">
                        Blue:
                     </div>
                  </SliderItem>
                  <SliderItem name="Alpha" className="max-w-3xl"
                     range={{ min: 0, max: 1 }}
                     defaultValue={SharedSettingsDefault.map.text.borderColor.alpha}
                     value={settings.map.text.borderColor.alpha}
                     onChange={setMapTextBorderAlpha}>
                     <div className="flex flex-row w-20">
                        Alpha:
                     </div>
                  </SliderItem>
               </Items>
               <SliderItem category="Marker" name="Size"
                  range={{ min: 10, max: 80 }}
                  value={settings.map.markerSize} defaultValue={SharedSettingsDefault.map.markerSize}
                  onChange={settings.map.setMarkerSize}>
                  <div className="flex flex-row min-h-[80px]">
                     <div className="flex min-w-[80px] justify-center">
                        <img alt='marker' src={markerImg} width={settings.map.markerSize} />
                     </div>
                     <div className="flex flex-col justify-center">Set navigation legs marker size.</div>
                  </div>
               </SliderItem>
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