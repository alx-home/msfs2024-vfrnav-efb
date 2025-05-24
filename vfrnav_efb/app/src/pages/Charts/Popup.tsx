/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If
 * not, see <https://www.gnu.org/licenses/>.
 */

import { Button, EndSlot, Input, Tabs } from "@alx-home/Utils";
import { useKeyUp } from "@alx-home/Events";

import { SettingsContext } from "@Settings/SettingsProvider";

import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Src } from "./ChartsPage";

import loadingImg from '@alx-home/images/loading.svg';

const sources = ['Local', 'SIA', 'TEMSI', 'Weather Fronts'] as const;
type Source = typeof sources[number];

export const ChartsPopup = ({ setSrcs }: {
  setSrcs: Dispatch<SetStateAction<Map<string, Src>>>
}) => {
  const { getSIAPDF } = useContext(SettingsContext)!;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { setPopup, emptyPopup } = useContext(SettingsContext)!;
  const [sourceType, setSourceType] = useState<Source>("Local")
  const [valid, setValid] = useState(false);
  const [partialValid, setPartialValid] = useState(true);
  const [result, setResult] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const active = useMemo(() => !loading && (sourceType === 'SIA' || sourceType === 'Local'), [sourceType, loading]);

  const [pdf, setPdf] = useState<Uint8Array | undefined>();

  const key = useKeyUp();
  const [pathReload, setPathReload] = useState(false);
  const [path, setPath] = useState('');

  const validator = useMemo(() => {
    switch (sourceType) {
      case "SIA":
        return async (_value: string) => {
          const result = /^(L|$)(F|$)([a-z]{1,2})?$/i.test(_value)
          setValid(result && /^LF[a-z]{2}.?$/i.test(_value))
          setPartialValid(result);
          return result
        }

      case "Local":
        return async (_value: string) => {
          const result = _value.endsWith('.pdf') && await window.file_exists(_value);
          setValid(result)
          setPartialValid(result);
          return result
        }

      default:
        return async () => {
          setValid(false)
          return false
        }
    }
  }, [sourceType]);
  const sourceMessage = useMemo(() => {
    switch (sourceType) {
      case "SIA":
        return "Enter an OACI code"
      case "Local":
        return "Select a file to upload"

      default:
        return "not yet implemented !"
    }
  }, [sourceType]);

  const errorMessage = useMemo(() => {
    switch (sourceType) {
      case "SIA":
        return "ICAO Code must be of the form LF** (France only)"

      case "Local":
        return "Invalid Path"

      default:
        return "not yet implemented !"
    }
  }, [sourceType]);
  const nameMessage = useMemo(() => {
    switch (sourceType) {
      case "SIA":
        return "Page name for this pdf (default: ICAO code)"
      case "Local":
        return "Page name for this pdf (default: File name)"

      default:
        return "not yet implemented !"
    }
  }, [sourceType]);

  const openFile = useCallback(async () => {
    const result = await window.openFile(inputRef.current!.value.length ? inputRef.current!.value : path, [{
      name: "Pdf File",
      value: ["*.pdf"]
    }])
    if (result && result !== '') {
      setPathReload(true);
      setPath(result);
      setValid(true);
    }
  }, [path]);

  const fileBrowser = useMemo(() => {
    return sourceType == "Local" ? <EndSlot>
      <div className='[&>*]:border-0 [&>*]:hover:border-l-2 [&>*]:bg-slate-600 [&>*]:hover:bg-slate-700 [&>*]:h-full'>
        <Button active={true} className='px-4'
          onClick={openFile}>...</Button>
      </div>
    </EndSlot> : <></>
  }, [openFile, sourceType]);

  const setSource = useCallback((sourceType: Source) => {
    inputRef.current!.value = ''
    inputRef.current!.focus()
    setSourceType(sourceType)
  }, []);

  const switchSource = useCallback((source: Source) => {
    setSource(source);
    if (source !== 'SIA' && source !== "Local") {
      setError('Not yet implemented !');
    } else {
      setError(undefined);
    }
  }, [setSource]);

  const download = useCallback(() => {
    if (valid) {
      setError(undefined);
      setLoading(true);


      switch (sourceType) {
        case "SIA": {
          const icao = result.toUpperCase();

          getSIAPDF(icao).then(src => {
            setPdf(src);
          }).catch((e: Error) => {
            setLoading(false);
            setError(e.message);
          });
          break;
        }

        case "Local": {
          window.getFile(result).then(base64 => {
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; ++i) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            setPdf(bytes);
          }).catch((e: Error) => {
            setLoading(false);
            setError(e.message);
          });
          break;
        }

        default:
          setLoading(false);
          setError("Unknown source type");
      }
    }
  }, [sourceType, getSIAPDF, result, valid]);


  useEffect(() => {
    if (key == 'Escape') {
      if (!loading) {
        setPopup(emptyPopup);
      }
    }
  }, [emptyPopup, key, loading, setPopup])

  useEffect(() => {
    if (pdf) {
      let file_name = result.substring(result.lastIndexOf('\\') + 1);
      file_name = file_name.substring(0, file_name.lastIndexOf("."));

      const icao_or_name = sourceType == "Local" ? file_name : result.toUpperCase();

      setLoading(false);
      setPopup(emptyPopup);
      setSrcs(srcs => {
        const newSrcs = new Map<string, Src>(srcs);
        newSrcs.set(icao_or_name, { src: pdf, name: name.length ? name : icao_or_name });
        return newSrcs;
      });
    }
  }, [sourceType, emptyPopup, name, pdf, result, setPopup, setSrcs]);


  useEffect(() => {
    if (pathReload) {
      setPathReload(false);
    }
  }, [pathReload]);

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
        <Tabs disabled={loading} tabs={Array.from(sources)} activeTab={sourceType} switchTab={switchSource}>
          <div className='flex flex-col grow justify-center'>
            <div className="flex flex-col grow">
              <div className="flex flex-row transition-all justify-end">
                <Input active={active} ref={inputRef} placeholder={sourceMessage} inputMode="text" value={path}
                  validate={validator} onChange={setResult} reload={pathReload} onValidate={download} className='peer transition-all pr-0'  >
                  {fileBrowser}
                </Input>
              </div>
              <div className={"flex flex-row grow transition-all" + (partialValid ? " opacity-0" : " opacity-100 pl-4")}>
                <p className="pt-1 text-red-500 text-base h-0">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
    <div className="flex flex-col [&>:not(:first-child)]:mt-3">
      <div className='text-2xl font-semibold'>
        Name
      </div>
      <div className='flex'>
        <Input active={active} placeholder={nameMessage}
          inputMode="text" onChange={setName} onValidate={download} />
      </div>
    </div>
    <div className="no-margin flex h-0">
      <div className={"pt-2 w-full h-[fit-content] flex flex-row justify-center" + ((error || (sourceType !== 'SIA' && sourceType != 'Local')) ? '' : ' ')}>
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