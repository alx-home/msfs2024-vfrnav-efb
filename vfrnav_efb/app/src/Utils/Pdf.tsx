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

import { createRef, JSX, MouseEvent, PropsWithChildren, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button, Scroll } from "@alx-home/Utils";
import { useMouseMove, useMouseRelease } from "@alx-home/Events";

import '@alx-home/pdfjs-dist/web/pdf_viewer.css';

import prevImage from "@alx-home/images/prev.svg";
import nextImage from "@alx-home/images/next.svg";
import zoomInImg from '@alx-home/images/zoom-in.svg';
import zoomOutImg from '@alx-home/images/zoom-out.svg';

import { PDFDocumentProxy, RenderTask } from "@alx-home/pdfjs-dist";

type PDFJs = typeof import("@alx-home/pdfjs-dist/types/src/pdf");

const getDocument = (async () => {
  if (__MSFS_EMBEDED__) {
    return (await import('@alx-home/pdfjs-dist')).getDocument;
  } else {
    return ((await import('pdfjs-dist')) as unknown as PDFJs).getDocument;
  }
})();

type Refs = { canvas: RefObject<HTMLCanvasElement | null>, text: RefObject<HTMLDivElement | null>, container: RefObject<HTMLDivElement | null> };

const usePdf = (src: Uint8Array, id: string) => {
  const [canvas, setCanvas] = useState<JSX.Element[]>([]);
  const timeouts = useRef<NodeJS.Timeout[]>([]);
  const [renderers, setRenderers] = useState<((_scale: number) => Promise<void>)[]>([]);
  const [ref, setRef] = useState<(Refs & { renderIndex: number })[]>([]);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const tasks = useRef<(RenderTask | undefined)[]>([]);

  useEffect(() => {
    if (pdfRef.current) {
      pdfRef.current.destroy();
    }

    pdfRef.current = null;
    (async () =>
      (await getDocument)({
        ...(src instanceof Uint8Array ? { data: new Uint8Array(src) } : { url: src }),
        stopAtErrors: true,
        useSystemFonts: true, disableFontFace: false
      }).promise.then(pdf => {
        if (pdfRef.current === null) {
          pdfRef.current = pdf;

          const refs = Array.from({ length: pdf.numPages }, () => ({ canvas: createRef<HTMLCanvasElement>(), text: createRef<HTMLDivElement>(), container: createRef<HTMLDivElement>(), renderIndex: 0 }));

          timeouts.current = Array.from({ length: pdf.numPages });
          tasks.current = Array.from({ length: pdf.numPages }, () => undefined);

          setRef(refs);
          setRenderers(Array.from({ length: pdf.numPages }, () => (() => Promise.resolve())));
          setCanvas(Array.from({ length: pdf.numPages }, (_v, index) => {
            const { canvas, container } = refs[index];

            return <div ref={container} key={"pdf-" + id} className="relative pdfViewer overflow-hidden">
              <canvas ref={canvas} className="select-none" />
              {/* <div className="absolute left-0 right-0 bottom-0 top-0 overflow-hidden"> */}
              {/* <div ref={text} className="textLayer"></div> */}
              {/* </div> */}
            </div>
          }
          ));
        }
      }))();
  }, [src, id]);


  useEffect(() => {
    const pdf = pdfRef.current;
    if (pdf) {
      const getPage = (pageNumber: number): Promise<(_scale: number) => Promise<void>> => {
        return pdf.getPage(pageNumber + 1).then((page) => {
          const promise = { ref: Promise.resolve() };
          return (scale: number) => {
            const renderIndex = ++ref[pageNumber].renderIndex;

            promise.ref = promise.ref.catch(() => { }).then(() => {
              const render = new Promise<void>((resolve, reject) => {
                if (pdfRef.current === pdf && renderIndex === ref[pageNumber].renderIndex) {
                  const canvas = document.createElement("canvas");
                  const realCanvas = ref[pageNumber].canvas.current!;
                  const container = ref[pageNumber].container.current!;

                  const viewport = page.getViewport({ scale: scale });

                  const ctx = canvas.getContext('2d')!;

                  const outputScale = window.devicePixelRatio || 1;
                  canvas.width = Math.floor(viewport.width * outputScale);
                  canvas.height = Math.floor(viewport.height * outputScale);

                  const scaleX = canvas.width / realCanvas.width;
                  const scaleY = canvas.height / realCanvas.height;
                  realCanvas.style.transform = `scale(${scaleX}, ${scaleY})`
                    + ` translate(${(canvas.width - realCanvas.width) / (2 * scaleX)}px, ${(canvas.height - realCanvas.height) / (2 * scaleY)}px)`;

                  container.style.width = canvas.width + 'px';
                  container.style.height = canvas.height + 'px';
                  resolve();

                  const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

                  const renderContext = {
                    canvasContext: ctx,
                    transform: transform,
                    viewport: viewport
                  };

                  timeouts.current[pageNumber] = setTimeout(() => {
                    if (pdfRef.current === pdf && renderIndex === ref[pageNumber].renderIndex) {
                      const task = page.render(renderContext);
                      try {
                        tasks.current[pageNumber]?.cancel();
                      }
                      // eslint-disable-next-line no-empty
                      catch { }

                      tasks.current[pageNumber] = task;
                      task.promise.then(async () => {
                        if (pdfRef.current === pdf && renderIndex === ref[pageNumber].renderIndex) {
                          console.assert(tasks.current[pageNumber] === task);
                          tasks.current[pageNumber] = undefined;

                          realCanvas.width = canvas.width;
                          realCanvas.height = canvas.height;
                          realCanvas.style.transform = "";

                          const ctx = realCanvas.getContext('2d')!;
                          ctx.drawImage(canvas, 0, 0);
                          // const textContent = await page.getTextContent();
                          // const textLayer = new TextLayer({
                          //    textContentSource: textContent,
                          //    container: ref[pageNumber].ref[1].current!,
                          //    viewport: viewport
                          // });

                          // textLayer.render();
                        }
                      });
                    }
                  }, 500);
                } else if (pdfRef.current === pdf) {
                  reject(new Error("pdf rendering (1) aborted " + renderIndex + "/" + ref[pageNumber].renderIndex));
                } else {
                  reject(new Error("pdf closed"));
                }
              });

              return render;
            });

            return promise.ref;
          };
        });
      }

      Promise.all(Array.from({ length: pdf.numPages }, (_value, index) => {
        return getPage(index);
      })).then(renderers => setRenderers(renderers));
    }
  }, [ref]);

  return { pages: canvas, renderers: renderers };
};

const Page = ({ hidden, children, renderer }: PropsWithChildren<{
  hidden: boolean,
  renderer: (_scale: number) => Promise<void>
}>) => {
  const [offset, setOffset] = useState<{
    x: number,
    y: number
  } | undefined>();
  const [scrolling, setScrolling] = useState(false);
  const mousePosition = useMouseMove(scrolling);
  const mouseUp = useMouseRelease(scrolling);
  const ref = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1.5);
  const [oldZoom, setOldZoom] = useState(0);
  const [oldClient, setOldClient] = useState<{ width: number, height: number } | undefined>();

  useEffect(() => {
    renderer(zoom).then(() => {
      if (oldZoom !== zoom) {
        const delta = zoom / oldZoom - 1;

        const client = oldClient ?? { width: ref.current!.clientWidth, height: ref.current!.clientHeight };

        ref.current!.scroll({
          left: ref.current!.scrollLeft + delta * (ref.current!.scrollLeft + client.width / 2),
          top: ref.current!.scrollTop + delta * (ref.current!.scrollTop + client.height / 2),
        });

        setOldClient({ width: ref.current!.clientWidth, height: ref.current!.clientHeight });
        setOldZoom(zoom);
      }
    }).catch(() => { });
  }, [renderer, zoom, oldZoom, oldClient]);

  useEffect(() => {
    setScrolling(false);
    setOffset(undefined);
  }, [mouseUp])

  useEffect(() => {
    if (ref.current && mousePosition && offset) {
      ref.current.scroll({
        top: offset.y - mousePosition.y,
        left: offset.x - mousePosition.x
      })
    }
  }, [mousePosition, offset])

  const onClick = useCallback((e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    if (e.button === 0) {
      setOffset({ x: e.clientX + ref.current!.scrollLeft, y: e.clientY + ref.current!.scrollTop });
      setScrolling(true);
    }
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    if (e.altKey || e.shiftKey) {
      const delta = -e.deltaY / 500;
      setZoom(zoom => Math.max(1, zoom + delta));
      e.preventDefault();
    } else if (e.ctrlKey) {
      ref.current!.scrollBy({
        left: e.deltaY / 3
      });
      e.preventDefault();
    }
  }, [])

  const zoomIn = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    setZoom(zoom => zoom + 1);
  }, []);

  const zoomOut = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    setZoom(zoom => Math.max(1, zoom - 1));
  }, []);

  return <div className="flex flex-row grow justify-center overflow-hidden">
    <div className={"absolute flex flex-col transition-all right-0 top-0 mt-[40px] mr-3 z-10 p-2 opacity-40 w-12 hocus-within:w-20 hocus-within:h-auto hocus-within:opacity-100 cursor-pointer"
      + (hidden ? ' hidden' : '')
    }>
      <button className="group transition-all right-0 top-0 mr-3 z-10 w-full cursor-pointer bg-transparent"
        onClick={zoomIn}
      >
        <img src={zoomInImg} alt="zoom in" className="w-full opacity-20 group-hocus:opacity-100 invert transition"></img>
      </button>
      <button className="group transition-all right-0 top-0 mr-3 mt-1 z-10 w-full cursor-pointer bg-transparent"
        onClick={zoomOut}
      >
        <img src={zoomOutImg} alt="zoom out" className="w-full invert opacity-20 group-hocus:opacity-100 transition"></img>
      </button>
    </div>
    <Scroll hidden={hidden} ref={ref} onWheel={onWheel} >
      <div onPointerDown={e => onClick(e)} className="flex flex-row grow justify-center overflow-visible">
        {children}
      </div>
    </Scroll>
  </div>;
};

export const Pdf = ({ src, alt, id, className }: {
  src: Uint8Array,
  id: string,
  alt: string,
  className: string
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const { pages, renderers } = usePdf(src, id);

  const childs = useMemo(() => pages.map((canvas, index) =>
    <Page key={"scroll-" + alt + "@" + index} hidden={currentPage !== index} renderer={renderers[index]}>
      {canvas}
    </Page>
  ), [currentPage, pages, renderers, alt]);
  const numPages = useMemo(() => pages.length, [pages]);

  const prevDisabled = useMemo(() => currentPage === 0, [currentPage]);
  const nextDisabled = useMemo(() => currentPage === Math.max(0, numPages - 1), [currentPage, numPages]);

  const next = useCallback(() => setCurrentPage(page => {
    if (numPages) {
      return Math.min(numPages - 1, page + 1);
    }
    return 0;
  }), [numPages]);
  const prev = useCallback(() => setCurrentPage(page => {
    return Math.max(0, page - 1);
  }), []);

  return <div className={"relative flex flex-col grow justify-start max-h-full max-w-full " + className}>
    <div className="flex flex-row h-[32px] min-h-[32px] justify-begin">
      <Button active={true} disabled={prevDisabled} className="flex flex-row justify-begin"
        onClick={prev}>
        <img className="h-[22px]" src={prevImage} alt="prev" />
      </Button>
      <div className="flex flex-row grow justify-end">
        <Button className="flex flex-row justify-end" active={true} disabled={nextDisabled}
          onClick={next}>
          <img className="h-[22px]" src={nextImage} alt="next" />
        </Button>
      </div>
    </div>
    {childs}
  </div >;
}