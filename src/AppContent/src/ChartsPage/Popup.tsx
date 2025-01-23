import { SettingsContext } from "@/Settings";
import { Button } from "@/Utils/Button";
import { Input } from "@/Utils/Input";
import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Src } from "./ChartsPage";

import loadingImg from '@images/loading.svg';
import useKeyUp from "@/Events/KeyUp";

const sources = ['SIA', 'TEMSI', 'Weather Fronts', 'Local'] as const;
type Source = typeof sources[number];

export const Popup = ({ setSrcs }: {
   setSrcs: Dispatch<SetStateAction<Map<string, Src>>>
}) => {
   const { getSIAPDF } = useContext(SettingsContext)!;
   const inputRef = useRef<HTMLInputElement | null>(null);

   const { setPopup, emptyPopup } = useContext(SettingsContext)!;
   const [sourceType, setSourceType] = useState<Source>("SIA")
   const [valid, setValid] = useState(false);
   const [result, setResult] = useState("");
   const [name, setName] = useState("");
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | undefined>();

   const [pdf, setPdf] = useState<Uint8Array | undefined>();

   const key = useKeyUp();

   const validator = useMemo(() => {
      switch (sourceType) {
         case "SIA":
            return (_value: string) => {
               const result = /^(L|$)(F|$)([a-z]{1,2})?$/i.test(_value)
               setValid(/^LF[a-z]{2}.?$/i.test(_value))
               return result
            }

         default:
            return () => {
               setValid(false)
               return false
            }
      }
   }, [sourceType]);
   const sourceMessage = useMemo(() => {
      switch (sourceType) {
         case "SIA":
            return "Enter an OACI code"
         default:
            return "not yet implemented !"
      }
   }, [sourceType]);
   const errorMessage = useMemo(() => {
      switch (sourceType) {
         case "SIA":
            return "ICAO Code must be of the form LF** (France only)"
         default:
            return "not yet implemented !"
      }
   }, [sourceType]);
   const nameMessage = useMemo(() => {
      switch (sourceType) {
         case "SIA":
            return "Page name for this pdf (default: ICAO code)"
         default:
            return "not yet implemented !"
      }
   }, [sourceType]);
   const setSource = useCallback((sourceType: Source) => {
      inputRef.current!.value = ''
      inputRef.current!.focus()
      setSourceType(sourceType)
   }, []);

   const switchSource = useCallback((source: Source) => {
      setSource(source);
      if (source !== 'SIA') {
         setError('Not yet implemented !');
      } else {
         setError(undefined);
      }
   }, [setSource]);
   const download = useCallback(() => {
      if (valid) {
         const icao = result.toUpperCase();

         setError(undefined);
         setLoading(true);

         getSIAPDF(icao).then(src => {
            setPdf(src);
         }).catch((e: Error) => {
            setLoading(false);
            setError(e.message);
         });
      }
   }, [getSIAPDF, result, valid]);

   useEffect(() => {
      if (key == 'Escape') {
         if (!loading) {
            setPopup(emptyPopup);
         }
      }
   }, [emptyPopup, key, loading, setPopup])

   useEffect(() => {
      if (pdf) {
         const icao = result.toUpperCase();

         setLoading(false);
         setPopup(emptyPopup);
         setSrcs(srcs => {
            const newSrcs = new Map<string, Src>(srcs);
            newSrcs.set(icao, { src: pdf, name: name.length ? name : icao });
            return newSrcs;
         });
      }
   }, [emptyPopup, name, pdf, result, setPopup, setSrcs]);


   useEffect(() => {
      inputRef.current?.focus()
   }, []);

   useEffect(() => setValid(false), [sourceType]);

   return <div className='relative flex flex-col p-2 [&>:not(:first-child_.no-margin)]:mt-8 w-full'>
      <img src={loadingImg} alt='loading' className={"absolute w-72 right-[-5rem] top-[-4rem] z-50" + (loading ? '' : ' hidden')} />
      <div className="flex flex-col [&>:not(:first-child)]:mt-3">
         <div className='text-2xl font-semibold'>
            Source
         </div>
         <div className='flex flex-col [&>:not(:first-child)]:ml-2 shadow-sm'>
            <div className='flex flex-row justify-start'>
               <div className='flex flex-row shrink!important [&>:not(:first-child)]:ml-1'>
                  {sources.map(source =>
                     <Button active={!loading} key={source} disabled={sourceType === source || loading} className='px-2'
                        onClick={() => switchSource(source)}>
                        {source}
                     </Button>)}
               </div>
            </div>
            <div className='flex flex-col p-4'>
               <Input active={!loading && sourceType === 'SIA'} ref={inputRef} placeholder={sourceMessage} inputMode="text"
                  validate={validator} onChange={setResult} onValidate={download} className="peer" />
               <div className="hidden peer-[.invalid]:flex h-0">
                  <p className="pl-8 pt-2 text-red-500 text-base">
                     {errorMessage}
                  </p>
               </div>
            </div>
         </div>
      </div>
      <div className="flex flex-col [&>:not(:first-child)]:mt-3">
         <div className='text-2xl font-semibold'>
            Name
         </div>
         <div className='flex'>
            <Input active={!loading && sourceType === 'SIA'} placeholder={nameMessage}
               inputMode="text" onChange={setName} onValidate={download} />
         </div>
      </div>
      <div className="no-margin flex h-0">
         <div className={"pt-2 w-full h-[fit-content] flex flex-row justify-center" + ((error || (sourceType !== 'SIA')) ? '' : ' ')}>
            <div className={"flex flex-row grow text-xl font-bold justify-center shrink p-2"
               + " text-rose-600 border-slate-900 border-1 shadow-smd"
               + (error ? '' : ' hidden')}>
               {error}
            </div>
         </div>
      </div>
      <div className='flex flex-row grow w-full [&>:not(:first-child)]:ml-2 pt-8' >
         <Button active={!loading} disabled={loading} className='px-2'
            onClick={() => {
               setPopup(emptyPopup);
            }}>Cancel</Button>
         <Button active={!loading} disabled={!valid || loading} className='px-2'
            onClick={download}>Download</Button>
      </div>
   </div >;
};