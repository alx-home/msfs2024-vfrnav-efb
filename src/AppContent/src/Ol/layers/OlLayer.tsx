import { Map } from "ol";
import TileLayer from "ol/layer/Tile";
import { TileImage } from "ol/source";
import { useContext, useEffect, useState } from "react";
import { MapContext } from "@/MapPage/MapContext";

export class OlLayerProp {
   // eslint-disable-next-line no-unused-vars
   constructor(public order?: number, public active?: boolean, public maxZoom?: number, public minZoom?: number) { }
}

const useLayer = (source: TileImage, map?: Map) => {
   const [layer, setLayer] = useState<TileLayer>();

   useEffect(() => {
      if (map) {
         setLayer(oldLayer => {
            if (oldLayer) {
               map.removeLayer(oldLayer);
            }

            const layer = new TileLayer({
               source: source,
               visible: false
            })

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
   }, [map, source]);

   return layer;
};

export const OlLayer = ({ opacity, source, order, active, maxZoom, minZoom }: OlLayerProp & {
   opacity?: number,
   source: TileImage
}) => {
   const mapContext = useContext(MapContext)!;
   const layer = useLayer(source, mapContext.map);

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