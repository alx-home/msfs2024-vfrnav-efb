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
import { useServer } from "@Utils/useServer";
import { sha256 } from "js-sha256";

const sources = ['Local', 'SIA', 'TEMSI', 'Weather Fronts'] as const;
type Source = typeof sources[number];

const Tab = ({ sourceType, inputRef: globalRef, setValid, setResult, download, loading, enable }: {
  sourceType: Source,
  inputRef: React.RefObject<HTMLInputElement | null>,
  setValid: Dispatch<SetStateAction<boolean>>,
  setResult: Dispatch<SetStateAction<string>>,
  download: () => void,
  loading: boolean,
  enable: boolean
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [path, setPath] = useState('');
  const [pathReload, setPathReload] = useState(false);
  const [partialValid, setPartialValid] = useState(true);
  const [reload, setReload] = useState(true);
  const active = useMemo(() => !loading && (sourceType === 'SIA' || sourceType === 'Local'), [sourceType, loading]);
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

  const openFile = useCallback(async () => {
    const result = await window.openFile(inputRef.current!.value.length ? inputRef.current!.value : path, [{
      name: "Pdf File",
      value: ["*.pdf"]
    }])
    if (result && result !== '') {
      setPath(result);
      setPathReload(true);
      setValid(true);
      setPartialValid(true);

      inputRef.current?.focus();
    }
  }, [path, setValid]);

  const validator = useMemo(() => {
    switch (sourceType) {
      case "SIA":
        return async (value: string) => {
          setValid(false);
          const result = /^LF[a-z]{2}$/i.test(value);
          setValid(result);
          return result
        }

      case "Local":
        return async (value: string) => {
          setValid(false);
          const result = path.endsWith('.pdf') && await window.file_exists(value);
          setValid(result);
          return result
        }

      default:
        return async () => {
          setValid(false);
        }
    }
  }, [path, setValid, sourceType]);

  const partialValidator = useMemo(() => {
    switch (sourceType) {
      case "SIA":
        return async (value: string) => {
          const result = /^(L|$)(F|$)([a-z]{1,2})?$/i.test(value)
          setPartialValid(result);
          setPath(value);
          return result
        }

      case "Local":
        return async (value: string) => {
          const result = value.endsWith('.pdf') && await window.file_exists(value);
          setPartialValid(result);
          setPath(value);
          return result
        }

      default:
        return async () => {
          setPartialValid(false)
          setValid(false);
          return false
        }
    }
  }, [setValid, sourceType]);

  useEffect(() => {
    if (enable) {
      setReload(true);
    }
  }, [enable]);

  useEffect(() => {
    if (reload) {
      globalRef.current = inputRef.current;
      setPathReload(true);
      validator(path);
      setResult(path);

      setReload(false);
    }
  }, [globalRef, path, reload, setResult, validator]);

  useEffect(() => {
    if (pathReload) {
      setPathReload(false)
    }
  }, [pathReload]);

  useEffect(() => {
    validator(path);
    setResult(path);
  }, [path, setResult, validator])

  const fileBrowser = useMemo(() => {
    return sourceType == "Local" ? <EndSlot>
      <div className='[&>*]:border-0 [&>*]:hover:border-l-2 [&>*]:bg-slate-600 [&>*]:hover:bg-slate-700 [&>*]:h-full'>
        <Button active={true} className='px-4'
          onClick={openFile}>...</Button>
      </div>
    </EndSlot> : <></>
  }, [openFile, sourceType]);


  return <div className={"flex flex-col grow transition-all" + (enable ? "" : " hidden") + (partialValid ? "" : " -mt-4 mb-4")}>
    <div className="flex flex-row justify-end">
      <Input active={active} ref={inputRef} placeholder={sourceMessage} inputMode="text" value={path}
        validate={partialValidator}
        reload={pathReload} onValidate={download} className='peer transition-all pr-0'  >
        {fileBrowser}
      </Input>
    </div>
    <div className={"flex flex-row grow transition-all pl-4" + (partialValid ? " opacity-0" : " opacity-100")}>
      <p className="pt-1 text-red-500 text-sm h-0 [text-shadow:1px_2px_8px_rgba(0_0_0_0.2)]">
        {errorMessage}
      </p>
    </div>
  </div>
}

export const ChartsPopup = ({ setSrcs }: {
  setSrcs: Dispatch<SetStateAction<Map<string, Src>>>
}) => {
  const { getSIAPDF } = useContext(SettingsContext)!;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { setPopup, emptyPopup } = useContext(SettingsContext)!;
  const [sourceType, setSourceType] = useState<Source>("Local")
  const [valid, setValid] = useState(false);
  const [result, setResult] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const notLoading = useMemo(() => !loading, [loading]);
  const [error, setError] = useState<string | undefined>();
  const [pdf, setPdf] = useState<Uint8Array | undefined>();
  const serverConnected = useServer();
  const disabled = useMemo(() => error, [error]);
  const ready = useMemo(() => valid && !error && !loading, [error, loading, valid]);

  const key = useKeyUp();

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

  const tabs = useMemo(() =>
    sources.map(source => <Tab enable={source === sourceType} key={source} sourceType={source} loading={loading || !!disabled} download={download} inputRef={inputRef} setResult={setResult} setValid={setValid} />)
    , [disabled, download, loading, sourceType]);

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
        newSrcs.set(icao_or_name, { src: pdf, name: name.length ? name : icao_or_name, id: sha256(pdf) });
        return newSrcs;
      });
    }
  }, [sourceType, emptyPopup, name, pdf, result, setPopup, setSrcs]);

  useEffect(() => {
    if (sourceType === 'Local') {
      if (serverConnected) {
        if (error === "Server not connected!") {
          setError(undefined);
        }
      } else {
        setError("Server not connected!");
      }
    }
  }, [error, serverConnected, sourceType]);

  useEffect(() => {
    inputRef.current?.focus()
  }, []);

  return <div className='relative flex flex-col p-2 [&>:not(:first-child_.no-margin)]:mt-8 w-full'>
    <img src={loadingImg} alt='loading' className={"absolute w-72 right-[-5rem] top-[-4rem] z-50" + (loading ? '' : ' hidden')} />
    <div className="flex flex-col [&>:not(:first-child)]:mt-3">
      <div className='text-base '>
        Source
      </div>
      <div className='flex flex-col [&>:not(:first-child)]:ml-2 shadow-xl border-slate-700 border-1 pb-4'>
        <Tabs disabled={loading} tabs={Array.from(sources)} activeTab={sourceType} switchTab={switchSource} />
        <div className='grid shrink px-4'>
          <div className='flex flex-col grow justify-center'>
            {tabs}
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-col [&>:not(:first-child)]:mt-3">
      <div className='text-base '>
        Name
      </div>
      <div className='flex'>
        <Input active={!disabled} placeholder={nameMessage}
          inputMode="text" onChange={setName} onValidate={download} />
      </div>
    </div>
    <div className='flex flex-row grow w-full [&>:not(:first-child)]:ml-2 pt-2' >
      <Button active={notLoading} disabled={loading} className='px-2'
        onClick={() => {
          setPopup(emptyPopup);
        }}>Cancel</Button>
      <Button active={ready} disabled={!ready} className='px-2'
        onClick={download}>Download</Button>
    </div>
    <div className={"px-8 absolute -top-4 flex h-full w-full pointer-events-none" + ((error || (sourceType !== 'SIA' && sourceType != 'Local')) ? '' : ' hidden')}>
      <div className="w-full flex flex-row m-auto justify-center">
        <div className={"flex flex-row grow text-sm justify-center shrink p-2"
          + " text-rose-600 border-slate-900 border-1 shadow-smd bg-slate-800"
          + (error ? '' : ' hidden')}>
          {error}
        </div>
      </div>
    </div>
  </div >;
};