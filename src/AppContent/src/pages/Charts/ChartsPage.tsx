import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@Utils/Button";
import { Pdf } from "@Utils/Pdf";
import { Popup } from "./Popup";
import { Scroll } from "@Utils/Scroll";
import { SettingsContext } from "@Settings";

import deleteImg from '@images/delete.svg';

export type Src = {
   src: string | Uint8Array,
   name: string
};

export const ChartsPage = ({ active }: {
   active: boolean
}) => {
   const { setPopup } = useContext(SettingsContext)!;
   const [opacity, setOpacity] = useState(' opacity-0');
   const scrollRef = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
      if (active) {
         setOpacity(' opacity-100');
      } else {
         setOpacity(' opacity-0');
      }
   }, [active]);

   const [activeDocument, setActiveDocument] = useState(0);

   const [srcs, setSrcs] = useState(new Map<string, Src>());
   const pdfs = useMemo(() =>
      [...srcs.values().map((src, index) =>
         <Pdf key={src.name} alt="pdf" className={activeDocument === index ? "" : "hidden"} src={src.src} />)],
      [activeDocument, srcs]);
   const buttons = useMemo(() =>
      [...srcs.values().map((src, index) => <Button key={src.name} active={true}
         className="flex flex-row grow h-[22px] px-5 overflow-visible text-nowrap"
         disabled={activeDocument === index}
         onClick={() => setActiveDocument(index)}>
         {src.name}
      </Button>)],
      [activeDocument, srcs]);

   const onWheel = useCallback((e: WheelEvent) => {
      scrollRef.current!.scrollBy({
         left: e.deltaY / 3
      });
      e.preventDefault();
   }, [])

   const removeDocument = useCallback(() => {
      const src = srcs.entries().find((_src, index) => index === activeDocument)!;
      setActiveDocument(Math.max(Math.min(srcs.size - 2, activeDocument), 0));

      setSrcs(srcs => {
         const newSrcs = new Map<string, Src>(srcs);
         newSrcs.delete(src[0]);
         return newSrcs;
      })
   }, [activeDocument, srcs]);

   const loadDocument = useCallback(() => setPopup(<Popup setSrcs={setSrcs} />), [setPopup]);

   return <div className="flex grow justify-center overflow-hidden max-w-full" style={active ? {} : { display: 'none' }}>
      <div className="flex flex-row grow justify-center max-w-full">
         <div className={"flex flex-col shrink transition transition-std py-1 px-2 h-full text-left"
            + " justify-start overflow-hidden bg-menu rounded-sm shadow-md"
            + " hocus:border-msfs"
            + opacity
         }>
            <div className={"relative flex grow overflow-hidden max-w-full" + (pdfs.length ? '' : ' w-[800px]')}>
               {pdfs}
               <button className={"group absolute transition-all right-0 bottom-0 mb-3 mr-3 z-10 bg-red-600 p-2 opacity-40 w-8 h-8 hocus-within:w-16 hocus-within:h-16 hocus-within:opacity-100 cursor-pointer"
                  + (pdfs.length ? '' : ' hidden')
               }
                  onClick={removeDocument}>
                  <img src={deleteImg} alt="remove document" className="w-full opacity-20 group-hocus:opacity-100 transition"></img>
               </button>
            </div>
            <div className="flex flex-row shrink min-h-[38px] overflow-hidden">
               <Scroll onWheel={onWheel} ref={scrollRef} >
                  <div className="flex flex-row grow justify-center w-max pb-2">
                     {buttons}
                     <div className={"flex flex-row " + (pdfs.length ? 'shrink' : 'grow')}>
                        <Button active={true} className="flex flex-row h-[22px] px-5 overflow-visible text-nowrap justify-center"
                           onClick={loadDocument}>
                           ...
                        </Button>
                     </div>
                  </div>
               </Scroll>
            </div>
         </div>
      </div>
   </div >;
}