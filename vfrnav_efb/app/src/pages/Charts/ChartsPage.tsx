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

import { Scroll, Button } from "@alx-home/Utils";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { ChartsPopup } from "./Popup";
import { ExportPdfs } from "@shared/Pdfs";
import { messageHandler, SettingsContext } from "@Settings/SettingsProvider";
import { Pdf } from "@Utils/Pdf";
import { useEFBServer } from "@Utils/useServer";

import deleteImg from '@alx-home/images/delete.svg';
import ExportIcon from '@alx-home/images/export.svg?react';

export type Src = {
  src: Uint8Array,
  id: string,
  name: string
};

export const ChartsPage = ({ active }: {
  active: boolean
}) => {
  const { setPopup } = useContext(SettingsContext)!;
  const [opacity, setOpacity] = useState(' opacity-0');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const efbConnected = useEFBServer();

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
      <Pdf key={src.name} alt="pdf" className={activeDocument === index ? "" : "hidden"} src={src.src} id={src.id} />)],
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

  const loadDocument = useCallback(() => setPopup(<ChartsPopup setSrcs={setSrcs} />), [setPopup]);
  const exportAll = useCallback(() => {
    if (!__MSFS_EMBEDED__) {
      messageHandler.send({
        __EXPORT_PDFS__: true,

        pdfs: Array.from(srcs.values()).map((src) => {
          const { name, id, src: data } = src;

          return {
            name: name,
            id: id,
            data: btoa(data.reduce((result, value) => result + String.fromCharCode(value), ""))
          }
        })
      })
    }
  }, [srcs]);

  useEffect(() => {
    if (__MSFS_EMBEDED__) {
      const callback = (message: ExportPdfs) => {
        const newSrcs = new Map<string, Src>();
        message.pdfs.forEach(pdf => {
          const binaryString = atob(pdf.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; ++i) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          setActiveDocument(0)
          newSrcs.set(pdf.name, {
            id: pdf.id,
            name: pdf.name,
            src: bytes
          })
        })

        setSrcs(newSrcs);
      }

      messageHandler.subscribe('__EXPORT_PDFS__', callback)
      return () => messageHandler.unsubscribe('__EXPORT_PDFS__', callback)
    }
  }, []);

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
                <Button active={true} className="flex flex-row px-5 text-nowrap justify-center"
                  onClick={loadDocument}>
                  {
                    pdfs.length ?
                      <>...</>
                      : <>Open</>
                  }
                </Button>
                {
                  __MSFS_EMBEDED__ ? <></>
                    : <Button active={pdfs.length > 0} disabled={(pdfs.length === 0) || !efbConnected} className="flex flex-row px-5 text-nowrap justify-center shrink"
                      onClick={exportAll}>
                      {
                        pdfs.length ?
                          <ExportIcon className="invert m-auto" />
                          : <>Export</>
                      }
                    </Button>
                }
              </div>
            </div>
          </Scroll>
        </div>
      </div>
    </div>
  </div >;
}