import { GlobalSettings, LayerSettingSetter } from "@Settings/Settings";
import { SettingsContext } from "@Settings/SettingsProvider";
import { LayerSetting } from "@shared/Settings";
import { Draggable } from "@Utils/Draggable";
import { CSSProperties, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Scroll } from "@Utils/Scroll";

export class Layer {
   // eslint-disable-next-line no-unused-vars
   constructor(public src: string, public alt: string, public order: number, public getSettings: (_settings: GlobalSettings) => LayerSetting & LayerSettingSetter) { }
};

const LayerComp = ({ src, alt, getSettings }:
   Layer) => {
   const settings = useContext(SettingsContext)!;
   const layerSettings = useMemo(() => getSettings(settings), [getSettings, settings]);

   const [transition, setTransition] = useState(false);
   const ref = useRef<HTMLButtonElement | null>(null);
   const [currentActive, setCurrentActive] = useState<boolean>(layerSettings.active);
   const [currentEnabled, setCurrentEnabled] = useState<boolean>(layerSettings.enabled);

   useEffect(() => {
      if (currentActive !== layerSettings.active) {
         layerSettings.setActive(currentActive);
      }
   }, [currentActive, layerSettings.active, layerSettings]);
   useEffect(() => {
      setTransition(false);
      setTimeout(() => setTransition(true), 10);
   }, []);

   useEffect(() => {
      if (layerSettings.enabled !== currentEnabled) {
         setCurrentEnabled(layerSettings.enabled)
         setCurrentActive(layerSettings.enabled);
      }
   }, [currentEnabled, layerSettings.enabled]);

   return <button className={'group transition-[filter] shadow-md transition-std border-l-4 cursor-pointer'
      + (layerSettings.active ? ' border-l-msfs' : ' border-l-gray-600')
      + (layerSettings.enabled ? '' : ' hidden h-0')}
      ref={ref}
      onClick={() => setCurrentActive(active => !active)}
      onMouseUp={() => ref.current?.blur()}>
      <img width={200} height={200} src={src} alt={alt}
         className={'block ml-auto mr-auto group-hocus:brightness-75 group-hocus:contrast-150 '
            + (transition ? ' transition-[width]' : '')
            + ' w-28 @lg:border-l-2'
            + ' @[150px]:w-52 @lg:border-l-4'
            + ' @[200px]:w-72 @lg:border-l-8'
         } />
   </button>;
};

export type OnLayerChange = (_layers: { index: number, order?: number, active?: boolean }[]) => void;

export const Layers = ({ layers, onLayerChange, className, style }: {
   layers: Layer[],
   onLayerChange: OnLayerChange,
   className: string,
   style: CSSProperties
}) => {
   const childs = useMemo(() => layers.map((layer) =>
      <LayerComp order={layer.order} key={layer.alt} src={layer.src} alt={layer.alt} getSettings={layer.getSettings} />
   ), [layers]);

   const onOrdersChange = useCallback((orders: number[]) => {
      onLayerChange(orders.map((order, index) => ({ index: index, order: order })));
   }, [onLayerChange]);

   return <Scroll className={className} style={style}>
      <div className="flex min-h-12 shrink-0 items-center justify-between ps-1 text-2xl font-semibold">
         Layers
      </div>
      <Draggable className='@container flex flex-col p-4 [&>*:not(:first-child):has(>:not(.hidden))]:mt-[7px] w-full'
         vertical={true}
         onOrdersChange={onOrdersChange}>
         {childs}
      </Draggable>
   </Scroll>;
};