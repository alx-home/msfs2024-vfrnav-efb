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

import { useContext, useEffect, useMemo, useRef, useState } from "react";

import { ChartsPopup } from "./Popup";
import { ExportPdfs, PdfBlob } from "@shared/Pdfs";
import { messageHandler, SettingsContext } from "@Settings/SettingsProvider";
import { Pdf } from "@Utils/Pdf";
import { useEFBServer } from "@Utils/useServer";

import deleteImg from '@alx-home/images/delete.svg';
import ExportIcon from '@alx-home/images/export.svg?react';
import { useEvent } from "react-use-event-hook";

export type Src = {
  src: Uint8Array,
  id: string,
  name: string
};

export const ChartsPage = ({ active }: {
  active: boolean
}) => {
  const { setPopup, addPdfRef } = useContext(SettingsContext)!;
  const [opacity, setOpacity] = useState(' opacity-0');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const efbConnected = useEFBServer();

  const [pdfProcessed, setPdfProcessed] = useState(true);

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

  const onWheel = useEvent((e: WheelEvent) => {
    scrollRef.current!.scrollBy({
      left: e.deltaY / 3
    });
    e.preventDefault();
  })

  const removeDocument = useEvent(() => {
    const src = srcs.entries().find((_src, index) => index === activeDocument)!;

    setSrcs(srcs => {
      const newSrcs = new Map<string, Src>(srcs);
      newSrcs.delete(src[0]);
      return newSrcs;
    })
  });

  const loadDocument = useEvent(() => setPopup(<ChartsPopup setSrcs={setSrcs} />));
  const exportAll = useEvent(() => {
    if (!__MSFS_EMBEDED__) {
      console.assert(pdfProcessed, "Tried to export pdfs while a previous export is still being processed");
      setPdfProcessed(false);

      const timeout = setTimeout(() => {
        processedCallback();

        if (efbConnected) {
          // Simulator may have been restarted or EFB closed, 
          // so we can consider the acknowledgment lost and allow new exports to be sent
          console.error("Did not receive PDF acknowledgment from EFB after 30 seconds");
        }
      }, 30_000);

      const processedCallback = () => {
        clearTimeout(timeout);
        messageHandler.unsubscribe('__PDF_PROCESSED__', processedCallback);
        setPdfProcessed(true);
      };
      messageHandler.subscribe('__PDF_PROCESSED__', processedCallback);

      const blobs: PdfBlob[] = [];

      const chunkString = (str: string, size: number): [number, string][] =>
        Array.from({ length: Math.ceil(str.length / size) }, (_, i) =>
          ([i, str.slice(i * size, i * size + size)])
        );


      messageHandler.send({
        __EXPORT_PDFS__: true,

        pdfs: Array.from(srcs.values()).map((src, index) => {
          const { name, id, src: data } = src;

          const rawData = btoa(data.reduce((result, value) => result + String.fromCharCode(value), ""));

          const chunks = chunkString(rawData, 100 * 1024);
          blobs.push(...chunks.map(chunk => ({
            __PDF_BLOB__: true as const,

            document: index,
            id: chunk[0],
            data: chunk[1]
          })));

          return {
            name: name,
            id: id,
            num_blobs: chunks.length
          }
        })
      });

      blobs.forEach(blob => messageHandler.send(blob));
    }
  });

  useEffect(() => {
    if (__MSFS_EMBEDED__) {
      const pendingBlobs: ((_data: string) => void)[][] = [];
      const pendingPdf = { current: -1 };
      const timeout = { current: -1 };
      const timeoutCB = {
        current: () => { }
      };

      const blobCallback = (message: PdfBlob) => {
        clearTimeout(timeout.current);
        timeout.current = setTimeout(timeoutCB.current, 15_000);

        if (message.pdf_id !== pendingPdf.current) {
          console.error("Received blob for pdf " + message.pdf_id + " but pending pdf is " + pendingPdf.current);
          return;
        }

        const callback = pendingBlobs[message.document][message.id];
        if (callback) {
          callback(message.data);
        } else {
          console.error("Received blob with id " + message.id + " but no pending callback was found");
        }
      }

      const callback = (message: ExportPdfs) => {
        if (pendingPdf.current !== -1) {
          console.error("Received export request while another export is still pending");
          return;
        }

        pendingPdf.current = message.id!;

        const error = { current: false };

        timeoutCB.current = () => {
          error.current = true;
          console.error("Did not receive all blobs for pdf export after 15 seconds");
        };
        timeout.current = setTimeout(timeoutCB.current, 15_000);

        const newSrcs = new Map<string, Src>();
        // Initialize pending blobs array for each pdf
        message.pdfs.forEach(pdf => {
          pendingBlobs.push(Array.from({ length: pdf.num_blobs }).map(() => () => { }));
        });

        Promise.all(message.pdfs.map((pdf, pdfIndex) => {
          return Promise.all(Array.from({ length: pdf.num_blobs }).map((_, blobId) => {
            console.assert(pendingBlobs.length > pdfIndex, "Pdf index " + pdfIndex + " is out of bounds for pending blobs");
            console.assert(pendingBlobs[pdfIndex].length > blobId, "Blob id " + blobId + " is out of bounds for pdf " + pdf.name);
            return new Promise<string>(resolve => pendingBlobs[pdfIndex][blobId] = resolve);
          }))
            .then(data => {
              if (error.current) {
                throw new Error("Received blobs after timeout for pdf " + pdf.name);
              }

              const binaryString = atob(data.join(''));
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; ++i) {
                bytes[i] = binaryString.charCodeAt(i);
              }

              newSrcs.set(pdf.name, {
                id: pdf.id,
                name: pdf.name,
                src: bytes
              })
            });
        })).then(() => {
          setSrcs(newSrcs);
        }).catch((error) => {
          console.error("Error while loading pdfs", error);
        }).finally(() => {
          clearTimeout(timeout.current);
          timeout.current = -1;

          pendingBlobs.length = 0;
          pendingPdf.current = -1;
          messageHandler.send({
            __PDF_PROCESSED__: true,

            id: message.id!
          });
        });
      }

      messageHandler.subscribe('__PDF_BLOB__', blobCallback);
      messageHandler.subscribe('__EXPORT_PDFS__', callback)
      return () => {
        messageHandler.unsubscribe('__EXPORT_PDFS__', callback);
        messageHandler.unsubscribe('__PDF_BLOB__', blobCallback);
      }
    }
  }, []);

  useEffect(() => {
    addPdfRef.current = (name: string, pdf: Src) => {
      setSrcs(srcs => {
        const newSrcs = new Map<string, Src>(srcs);
        newSrcs.set(name, pdf);
        return newSrcs;
      })
    }
  }, [addPdfRef]);

  useEffect(() => {
    setActiveDocument(Math.max(0, srcs.size - 1, 0));
  }, [srcs]);

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
                  __MSFS_EMBEDED__ || (pdfs.length === 0) ? <></>
                    : <Button active={pdfs.length > 0} disabled={(pdfs.length === 0) || !efbConnected || !pdfProcessed} className="flex flex-row px-5 text-nowrap justify-center shrink"
                      onClick={exportAll}>
                      <ExportIcon className="invert m-auto" />
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