import { Map } from "ol";
import TileLayer from "ol/layer/Tile";
import { TileImage } from "ol/source";
import { useContext, useEffect, useState } from "react";
import { MapContext } from "@/MapPage/MapContext";

export class OlLayerProp {
   // eslint-disable-next-line no-unused-vars
   constructor(public order?: number, public active?: boolean, public maxZoom?: number, public minZoom?: number, public removeWhiteBackground?: boolean) { }
}

const useLayer = (source: TileImage, map?: Map, removeWhiteBackground?: boolean) => {
   const [layer, setLayer] = useState<TileLayer>();

   useEffect(() => {
      if (map) {
         setLayer(oldLayer => {
            if (oldLayer) {
               map.removeLayer(oldLayer);
            }

            const layer = new TileLayer({
               source: source,
               visible: false,
            })

            if (removeWhiteBackground === true) {
               layer.on('postrender', (event) => {
                  const context = event.context;
                  if (context && context instanceof CanvasRenderingContext2D) {
                     try {
                        const canvas = context.canvas;
                        const width = canvas.width;
                        const height = canvas.height;

                        const inputData = context.getImageData(0, 0, width, height).data;

                        const output = context.createImageData(width, height);
                        const outputData = output.data;

                        for (let pixelY = 0; pixelY < height; ++pixelY) {
                           for (let pixelX = 0; pixelX < width; ++pixelX) {
                              const index = (pixelY * width + pixelX);

                              const isWhite = (index: number) => {
                                 const r = inputData[index * 4];
                                 const g = inputData[index * 4 + 1];
                                 const b = inputData[index * 4 + 2];

                                 return r > 250 && g > 250 && b > 250;
                              }

                              outputData[index * 4] = inputData[index * 4];
                              outputData[index * 4 + 1] = inputData[index * 4 + 1];
                              outputData[index * 4 + 2] = inputData[index * 4 + 2];
                              if (isWhite(index)) {
                                 outputData[index * 4 + 3] = 50;
                              } else {
                                 outputData[index * 4 + 3] = inputData[index * 4 + 3];
                              }
                           }
                        }
                        context.putImageData(output, 0, 0);
                        /* eslint-disable @typescript-eslint/no-unused-vars,no-empty */
                     } catch (e) {
                     }
                  }
               });
            }

            map.addLayer(layer);
            return layer;
         });
      }

      return () => {
         setLayer(oldLayer => {
            if (oldLayer) {
               map?.removeLayer(oldLayer);
            }

            return undefined;
         });
      };
   }, [map, source, removeWhiteBackground]);

   return layer;
};

export const OlLayer = ({ opacity, source, order, active, maxZoom, minZoom, removeWhiteBackground }:
   OlLayerProp & {
      opacity?: number,
      source: TileImage,
      removeWhiteBackground?: boolean
   }) => {
   const mapContext = useContext(MapContext)!;
   const layer = useLayer(source, mapContext.map, removeWhiteBackground);

   useEffect(() => {
      layer?.setVisible(active ?? false);
   }, [active, layer]);

   useEffect(() => {
      if (minZoom) {
         layer?.setMinZoom(minZoom);
      }
   }, [minZoom, layer]);

   useEffect(() => {
      if (maxZoom) {
         layer?.setMaxZoom(maxZoom);
      }
   }, [maxZoom, layer]);

   useEffect(() => {
      if (opacity) {
         layer?.setOpacity(opacity);
      }
   }, [opacity, layer]);

   useEffect(() => {
      if (order !== undefined) {
         layer?.setZIndex(order);
      }
   }, [order, layer]);

   return <></>;
};