import { CheckBox } from "@Utils/CheckBox";
import { Input } from "@Utils/Input";
import { Scroll } from "@Utils/Scroll";
import { Children, HTMLInputTypeAttribute, isValidElement, PropsWithChildren, ReactElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { AirportLayerOptions, Color, LayerSetting, SharedSettingsDefault } from "@shared/Settings";
import { Slider } from "@Utils/Slider";

import undoImg from '@images/undo.svg';
import markerImg from '@images/marker-icon-blue.svg';
import { DualSlider } from "@Utils/DualSlider";

import oaciImg from '@images/oaci.jpg';
import { SettingsContext } from "@Settings/SettingsProvider";
import { AirportLayerSettingSetter, LayerSettingSetter } from "@Settings/Settings";

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
   validate?: (_value: string, _blur: boolean) => boolean,
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
   value: number,
   bounds?: {
      min: number,
      max: number
   },
   range: { min: number, max: number },
   onChange: (_value: number) => void
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
   value: {
      min: number,
      max: number
   },
   range: { min: number, max: number },
   onChange: (_min: number, _max: number) => void
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

const CheckItem = ({ children, name, category, value, defaultValue, onChange, disabled }: PropsWithChildren<{
   name: string,
   category?: string,
   defaultValue?: boolean,
   value: boolean,
   onChange: (_checked: boolean) => void,
   disabled?: boolean
}>) => {
   const [reset, setReset] = useState(false);
   const resetCallback = useMemo(() => () => setReset(true), [setReset]);

   useEffect(() => {
      if (reset) {
         setReset(false);
      }
   }, [reset, setReset]);

   return <Item name={name} category={category} onReset={resetCallback}>
      <CheckBox reset={reset} active={!(disabled ?? false)} className="flex flex-row my-auto" value={value} defaultValue={defaultValue} onChange={onChange}>
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

const ColorPicker = ({ defaultColor, value, setColor, name, category, children }: PropsWithChildren<{
   defaultColor: Color,
   value: Color,
   name: string,
   category: string,
   setColor: (_setter: (_old: Color) => Color) => void
}>) => {
   const setRed = useCallback((value: number) => {
      setColor((old) => ({ ...old, red: value }))
   }, [setColor]);
   const setGreen = useCallback((value: number) => {
      setColor((old) => ({ ...old, green: value }))
   }, [setColor]);
   const setBlue = useCallback((value: number) => {
      setColor((old) => ({ ...old, blue: value }))
   }, [setColor]);
   const setAlpha = useCallback((value: number) => {
      setColor((old) => ({ ...old, alpha: value }))
   }, [setColor]);

   return <Items name={name} category={category}>
      <Legend>
         {children}
      </Legend>
      <Slider className="max-w-3xl"
         range={{ min: 0, max: 255 }}
         defaultValue={defaultColor.red}
         value={value.red}
         onChange={setRed}
      >
         <div className="flex flex-row w-20">
            Red:
         </div>
      </Slider>
      <Slider className="max-w-3xl"
         range={{ min: 0, max: 255 }}
         defaultValue={defaultColor.green}
         value={value.green}
         onChange={setGreen}
      >
         <div className="flex flex-row w-20">
            Green:
         </div>
      </Slider>
      <Slider className="max-w-3xl"
         range={{ min: 0, max: 255 }}
         defaultValue={defaultColor.blue}
         value={value.blue}
         onChange={setBlue}
      >
         <div className="flex flex-row w-20">
            Blue:
         </div>
      </Slider>
      <Slider className="max-w-3xl"
         range={{ min: 0, max: 1 }}
         defaultValue={defaultColor.alpha}
         value={value.alpha}
         onChange={setAlpha}>
         <div className="flex flex-row w-20">
            Alpha:
         </div>
      </Slider>
   </Items>
}

const isLegend = (child: unknown) => {
   if (!isValidElement(child)) {
      return false;
   }

   return child.type === Legend;
};

type Props = PropsWithChildren<{
   name: string,
   category?: string
}>;
const Items = ({ children, name, category }: Props) => {
   const [reset, setReset] = useState(false);
   const resetCallback = useMemo(() => () => setReset(true), [setReset]);
   const childs = useMemo(() =>
      Children.toArray(children).filter(child => isItem(child)).map((child) => {
         if (isLegend(child)) {
            return child
         } else {
            return <child.type key={child.key} reset={reset} className="flex flex-row my-auto" {...child.props}>
               {child.props.children}
            </child.type>
         }
      }
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

const ZoomItem = ({ name, setting, defaultSetting, reset }: {
   name: string,
   setting: LayerSetting & LayerSettingSetter,
   defaultSetting: LayerSetting,
   reset?: boolean
}) => {
   const range = useMemo(() => ({ min: 0, max: 30 }), []);
   const onChange = useCallback((min: number, max: number) => { setting.setMaxZoom(range.max - min); setting.setMinZoom(range.max - max) }, [range.max, setting]);
   const defaultValue = useMemo(() => ({ max: range.max - (defaultSetting.minZoom ?? 0), min: range.max - (defaultSetting.maxZoom ?? range.max) }), [defaultSetting.maxZoom, defaultSetting.minZoom, range.max])
   const value = useMemo(() => ({ max: range.max - (setting.minZoom ?? 0), min: range.max - (setting.maxZoom ?? range.max) }), [range.max, setting.maxZoom, setting.minZoom])

   return <DualSlider onChange={onChange} range={range} reset={reset}
      value={value}
      defaultValue={defaultValue}
      className={"max-w-3xl"}>
      <div className="flex flex-row w-40">{name}:</div>
   </DualSlider>
}

const LayerActivation = ({ setting, defaultSetting, reset, children }: PropsWithChildren<{
   setting: LayerSetting & LayerSettingSetter,
   defaultSetting: LayerSetting,
   reset?: boolean
}>) => {
   return <CheckBox onChange={setting.setEnabled} reset={reset}
      value={setting.enabled} defaultValue={defaultSetting.enabled}>
      {children}
   </CheckBox>
}

const AirortLayerOption = ({ setting, defaultSetting, reset, children, settingKey }: PropsWithChildren<{
   setting: AirportLayerOptions & LayerSetting & AirportLayerSettingSetter,
   defaultSetting: AirportLayerOptions,
   reset?: boolean,
   settingKey: keyof AirportLayerOptions
}>) => {
   const keySetter = useMemo(() => ('enable' + settingKey.charAt(0).toUpperCase() + settingKey.substring(1)) as keyof AirportLayerSettingSetter, [settingKey]);

   return <CheckBox onChange={setting[keySetter]} reset={reset}
      value={setting[settingKey]} defaultValue={defaultSetting[settingKey]} active={setting.active}>
      {children}
   </CheckBox>
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

   const textSize = useMemo(() => ({ min: settings.map.text.minSize, max: settings.map.text.maxSize }), [settings.map.text.maxSize, settings.map.text.minSize]);
   const defaultTextSize = useMemo(() => ({ min: SharedSettingsDefault.map.text.minSize, max: SharedSettingsDefault.map.text.maxSize }), []);
   const setTextSize = useCallback((min: number, max: number) => {
      settings.map.text.setMinSize(min);
      settings.map.text.setMaxSize(max);
   }, [settings.map.text]);


   const getPatternReg = useCallback((value: string, blur: boolean) => {
      return blur ? `\\{${value}\\}` : Array.from(`{${value}}`).reduce((prev, char) => prev + `(?:${/[{}]/.test(char) ? `\\${char}` : char}|$)`, '');
   }, []);

   const uriValidator = useCallback((regex: string, blur: boolean, value: string) => {
      const port = blur ? `(:\\d{1,4})?` : `(?:\\:|$)(?:\\d|$){4}`;
      const proto = blur ? `(https?|ftp|file)://` :
         `(((?:h|$)(?:t|$)(?:t|$)(?:p|$)(?:s|$)?)|`
         + `((?:f|$)(?:t|$)(?:p|$))|`
         + `((?:f|$)(?:i|$)(?:l|$)(?:e|$))`
         + `)(?:\\:|$)(?:/|$){2}`;

      return (!value.length) || new RegExp('^' + proto + regex + port + '$', 'g').test(value)
   }, []);

   const uriChar = useMemo(() => '(\\w|\\/|-|_|\\.|\\&|\\=|\\?)', []);

   const validateSIAAddr = useCallback((value: string, blur: boolean) => {
      const regex = (() => {
         const icao = getPatternReg('icao', blur);

         return `${uriChar}*${icao}${uriChar}*`;
      })();

      return uriValidator(regex, blur, value)
   }, [getPatternReg, uriValidator, uriChar]);

   const validateSIAAZBAAddr = useCallback((value: string, blur: boolean) => {
      const regex = (() => {
         const date = getPatternReg('date', blur);

         return `${uriChar}*${date}${uriChar}*`;
      })();

      return uriValidator(regex, blur, value)
   }, [getPatternReg, uriValidator, uriChar]);

   const validateSIAAZBADateAddr = useCallback((value: string, blur: boolean) => {
      return uriValidator(`${uriChar}+`, blur, value)
   }, [uriValidator, uriChar]);

   const AZBARange = useMemo(() => {
      const range = settings.map.azba.range;
      const hours = Math.floor(range / 60);
      const minutes = Math.floor(range - hours * 60);

      return (hours ? hours + 'h' : '') + (minutes < 10 ? '0' : '') + minutes + 'min';
   }, [settings.map.azba.range]);


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
               <SliderItem category="AZBA" name="Margin"
                  range={{ min: 0, max: 24 * 60 }}
                  defaultValue={SharedSettingsDefault.map.azba.range}
                  value={settings.map.azba.range}
                  onChange={settings.map.azba.setRange}>
                  <div className="flex flex-row">
                     <div className="flex flex-col justify-center">Consider an AZBA zone to be active {AZBARange} before its real beginning time.</div>
                  </div>
               </SliderItem>
            </Group>
            <Group name="Navigation">
               <CheckItem category="Wind correction" name="Heading" disabled={true}
                  value={settings.adjustHeading} defaultValue={SharedSettingsDefault.adjustHeading}
                  onChange={settings.setAdjustHeading}>
                  Adjust navigation heading by taking into account the given leg wind.<br />
                  (not yet implemented)
               </CheckItem>
               <CheckItem category="Wind correction" name="Time" disabled={true}
                  value={settings.adjustTime} defaultValue={SharedSettingsDefault.adjustTime}
                  onChange={settings.setAdjustTime}>
                  Adjust navigation time by taking into account the given leg wind.<br />
                  (not yet implemented)
               </CheckItem>
            </Group>
            <Group name="Map">
               <Items name="Airports" category="Layers">
                  <LayerActivation setting={settings.airports} defaultSetting={SharedSettingsDefault.airports}>
                     Use Airports Layer
                  </LayerActivation>
                  <AirortLayerOption setting={settings.airports} defaultSetting={SharedSettingsDefault.airports} settingKey='hardRunway'>
                     - Hard runway airports
                  </AirortLayerOption>
                  <AirortLayerOption setting={settings.airports} defaultSetting={SharedSettingsDefault.airports} settingKey='softRunway'>
                     - Soft runway airports
                  </AirortLayerOption>
                  <AirortLayerOption setting={settings.airports} defaultSetting={SharedSettingsDefault.airports} settingKey='private'>
                     - Private / Military airports
                  </AirortLayerOption>
                  <AirortLayerOption setting={settings.airports} defaultSetting={SharedSettingsDefault.airports} settingKey='helipads'>
                     - Helipads
                  </AirortLayerOption>
                  <AirortLayerOption setting={settings.airports} defaultSetting={SharedSettingsDefault.airports} settingKey='waterRunway'>
                     - Hippodromes
                  </AirortLayerOption>
               </Items>
               <Items name="VFR" category="Layers">
                  <LayerActivation setting={settings.azba} defaultSetting={SharedSettingsDefault.azba}>
                     Use France AZBA Layer (sia)
                  </LayerActivation>
                  <LayerActivation setting={settings.OACI} defaultSetting={SharedSettingsDefault.OACI}>
                     Use France OACI Layer (geoportal)
                  </LayerActivation>
                  <LayerActivation setting={settings.germany} defaultSetting={SharedSettingsDefault.germany}>
                     Use Germany DFS Layer (secais).
                  </LayerActivation>
                  <LayerActivation setting={settings.openflightmaps} defaultSetting={SharedSettingsDefault.openflightmaps}>
                     Use Open Flight Layer.
                  </LayerActivation>
                  <LayerActivation setting={settings.openflightmapsBase} defaultSetting={SharedSettingsDefault.openflightmapsBase}>
                     Use Open Flight Base Layer (Background).
                  </LayerActivation>
                  <LayerActivation setting={settings.USSectional} defaultSetting={SharedSettingsDefault.USSectional}>
                     Use US sectional Layers (iflightplanner).
                  </LayerActivation>
               </Items>
               <Items name="IFR" category="Layers">
                  <LayerActivation setting={settings.USIFRHigh} defaultSetting={SharedSettingsDefault.USIFRHigh}>
                     Use US High IFR Layers (iflightplanner).
                  </LayerActivation>
                  <LayerActivation setting={settings.USIFRLow} defaultSetting={SharedSettingsDefault.USIFRLow}>
                     Use US Low IFR Layers (iflightplanner).
                  </LayerActivation>
               </Items>
               <Items name="Topographic" category="Layers">
                  <LayerActivation setting={settings.opentopo} defaultSetting={SharedSettingsDefault.opentopo}>
                     Use Open Topo Layer.
                  </LayerActivation>
                  <LayerActivation setting={settings.mapforfree} defaultSetting={SharedSettingsDefault.mapforfree}>
                     Use Map for free Layer.
                  </LayerActivation>
               </Items>
               <Items name="World" category="Layers">
                  <LayerActivation setting={settings.googlemap} defaultSetting={SharedSettingsDefault.googlemap}>
                     Use Google map Layer.
                  </LayerActivation>
                  <LayerActivation setting={settings.openstreet} defaultSetting={SharedSettingsDefault.openstreet}>
                     Use Open Street map Layer.
                  </LayerActivation>
               </Items>
               <Items name="Cheat" category="Layers">
                  <LayerActivation setting={settings.plane} defaultSetting={SharedSettingsDefault.plane}>
                     Use plane Layer (Displays aircraft position on the map).
                  </LayerActivation>
               </Items>
               <Items name="Visibility" category="Layers">
                  <Legend>
                     <div className="pb-2">
                        Set zoom levels for which the layer is to be displayed on the map. Zooming out of this range on the map will hide the layer.
                     </div>
                  </Legend>
                  <ZoomItem name="Airports" setting={settings.airports} defaultSetting={SharedSettingsDefault.airports} />
                  <ZoomItem name="France AZBA" setting={settings.azba} defaultSetting={SharedSettingsDefault.azba} />
                  <ZoomItem name="France OACI" setting={settings.OACI} defaultSetting={SharedSettingsDefault.OACI} />
                  <ZoomItem name="Germany DFS" setting={settings.germany} defaultSetting={SharedSettingsDefault.germany} />
                  <ZoomItem name="US sectional" setting={settings.USSectional} defaultSetting={SharedSettingsDefault.USSectional} />
                  <ZoomItem name="US High IFR" setting={settings.USIFRHigh} defaultSetting={SharedSettingsDefault.USIFRHigh} />
                  <ZoomItem name="US Low IFR" setting={settings.USIFRLow} defaultSetting={SharedSettingsDefault.USIFRLow} />
                  <ZoomItem name="Open Flight" setting={settings.openflightmaps} defaultSetting={SharedSettingsDefault.openflightmaps} />
                  <ZoomItem name="Open Flight Base" setting={settings.openflightmapsBase} defaultSetting={SharedSettingsDefault.openflightmapsBase} />
                  <ZoomItem name="Open Topo" setting={settings.opentopo} defaultSetting={SharedSettingsDefault.opentopo} />
                  <ZoomItem name="Open Street" setting={settings.openstreet} defaultSetting={SharedSettingsDefault.openstreet} />
                  <ZoomItem name="Map4Free" setting={settings.mapforfree} defaultSetting={SharedSettingsDefault.mapforfree} />
                  <ZoomItem name="Google" setting={settings.googlemap} defaultSetting={SharedSettingsDefault.googlemap} />
                  <ZoomItem name="Plane" setting={settings.plane} defaultSetting={SharedSettingsDefault.plane} />
               </Items>
            </Group>
            <Group name="Map Display">
               <ColorPicker name="Active high color" category="AZBA" defaultColor={SharedSettingsDefault.map.azba.activeHighColor} value={settings.map.azba.activeHighColor} setColor={settings.map.azba.setActiveHighColor}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex min-w-[50px] justify-center">
                        <div className={"flex flex-row justify-end rounded-md overflow-hidden mr-2 min-w-[50px]"} style={{ backgroundImage: `url(${oaciImg})`, backgroundSize: 'cover' }} >
                           <div className="flex w-1/2 h-full"
                              style={{
                                 backgroundColor: `rgba(${settings.map.azba.activeHighColor.red.toFixed(0)}, ${settings.map.azba.activeHighColor.green.toFixed(0)}, ${settings.map.azba.activeHighColor.blue.toFixed(0)}, ${settings.map.azba.activeHighColor.alpha})`,
                              }} />
                        </div>
                        <div className="flex flex-col justify-center">Set AZBA active high layer color.</div>
                     </div>
                  </div>
               </ColorPicker>
               <ColorPicker name="Active low color" category="AZBA" defaultColor={SharedSettingsDefault.map.azba.activeLowColor} value={settings.map.azba.activeLowColor} setColor={settings.map.azba.setActiveLowColor}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex min-w-[50px] justify-center">
                        <div className={"flex flex-row justify-end rounded-md overflow-hidden mr-2 min-w-[50px]"} style={{ backgroundImage: `url(${oaciImg})`, backgroundSize: 'cover' }}  >
                           <div className="flex w-1/2 h-full"
                              style={{
                                 backgroundColor: `rgba(${settings.map.azba.activeLowColor.red.toFixed(0)}, ${settings.map.azba.activeLowColor.green.toFixed(0)}, ${settings.map.azba.activeLowColor.blue.toFixed(0)}, ${settings.map.azba.activeLowColor.alpha})`
                              }} />
                        </div>
                        <div className="flex flex-col justify-center">Set AZBA active low layer color.</div>
                     </div>
                  </div>
               </ColorPicker>
               <ColorPicker name="Inactive high color" category="AZBA" defaultColor={SharedSettingsDefault.map.azba.inactiveHighColor} value={settings.map.azba.inactiveHighColor} setColor={settings.map.azba.setInactiveHighColor}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex min-w-[50px] justify-center">
                        <div className={"flex flex-row justify-end rounded-md overflow-hidden mr-2 min-w-[50px]"} style={{ backgroundImage: `url(${oaciImg})`, backgroundSize: 'cover' }} >
                           <div className="flex w-1/2 h-full"
                              style={{
                                 backgroundColor: `rgba(${settings.map.azba.inactiveHighColor.red.toFixed(0)}, ${settings.map.azba.inactiveHighColor.green.toFixed(0)}, ${settings.map.azba.inactiveHighColor.blue.toFixed(0)}, ${settings.map.azba.inactiveHighColor.alpha})`
                              }} />
                        </div>
                        <div className="flex flex-col justify-center">Set AZBA inactive high layer color.</div>
                     </div>
                  </div>
               </ColorPicker>
               <ColorPicker name="Inactive low color" category="AZBA" defaultColor={SharedSettingsDefault.map.azba.inactiveLowColor} value={settings.map.azba.inactiveLowColor} setColor={settings.map.azba.setInactiveLowColor}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex min-w-[50px] justify-center">
                        <div className={"flex flex-row justify-end rounded-md overflow-hidden mr-2 min-w-[50px]"} style={{ backgroundImage: `url(${oaciImg})`, backgroundSize: 'cover' }}  >
                           <div className="flex w-1/2 h-full"
                              style={{
                                 backgroundColor: `rgba(${settings.map.azba.inactiveLowColor.red.toFixed(0)}, ${settings.map.azba.inactiveLowColor.green.toFixed(0)}, ${settings.map.azba.inactiveLowColor.blue.toFixed(0)}, ${settings.map.azba.inactiveLowColor.alpha})`
                              }} />
                        </div>
                        <div className="flex flex-col justify-center">Set AZBA inactive low layer color.</div>
                     </div>
                  </div>
               </ColorPicker>
               <DualSliderItem category="Legs" name="Text size"
                  range={{ min: 5, max: 50 }}
                  defaultValue={defaultTextSize}
                  value={textSize}
                  onChange={setTextSize}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex flex-row min-w-[80px] justify-center">
                        <div className={"flex flex-col justify-center mr-1"} style={{ font: `900 ${textSize.min.toFixed(0)}px Inter-bold, sans-serif` }}>a</div>
                        <div className={"flex flex-col justify-center"} style={{ font: `900 ${textSize.max.toFixed(0)}px Inter-bold, sans-serif` }}>A</div>
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
               <ColorPicker name="Text Color" category="Legs" defaultColor={SharedSettingsDefault.map.text.color} value={settings.map.text.color} setColor={settings.map.text.setColor}>
                  <div className="flex flex-row min-h-[60px]">
                     <div className="flex min-w-[50px] justify-center">
                        <div className={"flex flex-col justify-center bg-white rounded-md px-2 mr-2"} style={{ font: `900 50px Inter-bold, sans-serif`, color: `rgba(${settings.map.text.color.red.toFixed(0)}, ${settings.map.text.color.green.toFixed(0)}, ${settings.map.text.color.blue.toFixed(0)}, ${settings.map.text.color.alpha})` }}>A</div>
                        <div className="flex flex-col justify-center">Set navigation legs text color.</div>
                     </div>
                  </div>
               </ColorPicker>
               <ColorPicker name="Border Color" category="Legs" defaultColor={SharedSettingsDefault.map.text.borderColor} value={settings.map.text.borderColor} setColor={settings.map.text.setBorderColor}>
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
               </ColorPicker>
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
                  <InputItem category="SIA" name="Authorization token" inputMode="text"
                     validate={value => /^(\w+)?=?$/g.test(value)}
                     placeholder='Please enter an authorization token'
                     value={settings.SIAAuth} defaultValue={SharedSettingsDefault.SIAAuth}
                     onChange={settings.setSIAAuth}>
                     Authorization token for accessing SIA Enroute charts on the PDF page. Use this settings in case of a broken default address.<br />
                     For more information, please go to the addon wiki: <a href="https://github.com/alx-home/msfs2024-vfrnav-efb/wiki">https://github.com/alx-home/msfs2024-vfrnav-efb/wiki</a>
                  </InputItem>
                  <InputItem category="SIA" name="Address" inputMode="text"
                     validate={validateSIAAddr}
                     placeholder={__SIA_ADDR__}
                     value={settings.SIAAddr} defaultValue={SharedSettingsDefault.SIAAddr}
                     onChange={settings.setSIAAddr}>
                     PDF template Address with {'{icao}'} placeholder. Use this settings in case of a broken default address.<br />
                     For more information, please go to the addon wiki: <a href="https://github.com/alx-home/msfs2024-vfrnav-efb/wiki">https://github.com/alx-home/msfs2024-vfrnav-efb/wiki</a>
                     <ErrorMessage type='Error'>
                        Invalid Address! pattern: (http,https,ftp)://***{'{icao}'}***
                     </ErrorMessage>
                  </InputItem>
                  <InputItem category="SIA" name="AZBA address" inputMode="text"
                     validate={validateSIAAZBAAddr}
                     placeholder={__SIA_AZBA_ADDR__}
                     value={settings.SIAAZBAAddr} defaultValue={SharedSettingsDefault.SIAAZBAAddr}
                     onChange={settings.setSIAAZBAAddr}>
                     AZBA template Address with {'{date}'} placeholder. Use this settings in case of a broken default address.<br />
                     For more information, please go to the addon wiki: <a href="https://github.com/alx-home/msfs2024-vfrnav-efb/wiki">https://github.com/alx-home/msfs2024-vfrnav-efb/wiki</a>
                     <ErrorMessage type='Error'>
                        Invalid Address! pattern: (http,https,ftp)://***{'{date}'}***
                     </ErrorMessage>
                  </InputItem>
                  <InputItem category="SIA" name="AZBA date address" inputMode="text"
                     validate={validateSIAAZBADateAddr}
                     placeholder={__SIA_AZBA_DATE_ADDR__}
                     value={settings.SIAAZBADateAddr} defaultValue={SharedSettingsDefault.SIAAZBADateAddr}
                     onChange={settings.setSIAAZBADateAddr}>
                     AZBA date template Address. Use this settings in case of a broken default address.<br />
                     For more information, please go to the addon wiki: <a href="https://github.com/alx-home/msfs2024-vfrnav-efb/wiki">https://github.com/alx-home/msfs2024-vfrnav-efb/wiki</a>
                     <ErrorMessage type='Error'>
                        Invalid Address! pattern: (http,https,ftp)://***
                     </ErrorMessage>
                  </InputItem>
               </div>
            </Group>
            <Group name="Expert">
               <CheckItem category="Settings" name="Advanced" value={advanced} onChange={setAdvanced} defaultValue={false} >
                  Display advanced settings.
               </CheckItem>
            </Group>
         </List>
      </div>
   </div >;
}