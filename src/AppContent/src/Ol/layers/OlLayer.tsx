import { Feature, Map } from "ol";
import TileLayer from "ol/layer/Tile";
import { TileImage } from "ol/source";
import { useContext, useEffect, useId, useMemo } from "react";
import { MapContext } from "@pages/Map/MapContext";
import VectorLayer from "ol/layer/Vector";
import { Coordinate } from "ol/coordinate";
import { Polygon } from "ol/geom";
import VectorSource from 'ol/source/Vector';
import Fill from "ol/style/Fill";
import Style from "ol/style/Style";
import { getVectorContext } from "ol/render";
import Layer from "ol/layer/Layer";
import LayerGroup from "ol/layer/Group";

export class OlLayerProp {
   // eslint-disable-next-line no-unused-vars
   constructor(public order?: number, public active?: boolean, public maxZoom?: number, public minZoom?: number, public clipAera?: Coordinate[]) { }
}

export type Source = TileLayer | Layer | LayerGroup;

const useLayer = (source: Source | TileImage, map?: Map, clipAera?: Coordinate[]) => {
   const id = useId();
   const layer = useMemo<Source>(() => source instanceof TileImage ? new TileLayer({
      className: id,
      source: source,
      visible: false,
   }) : source, [id, source]);

   const clipLayer = useMemo(() => {
      if (!clipAera || !(layer instanceof TileLayer)) {
         return undefined;
      }

      const result = new VectorLayer({
         style: null,
         source: new VectorSource({ features: [new Feature(new Polygon([clipAera]))] })
      });

      result.getSource()!.on('addfeature', function () {
         layer.setExtent(result.getSource()!.getExtent());
      });

      const style = new Style({
         fill: new Fill({
            color: 'black',
         }),
      });

      layer.on('postrender', (event) => {
         const vectorContext = getVectorContext(event);
         const ctx = (event.context as CanvasRenderingContext2D);

         const compo = ctx.globalCompositeOperation;
         ctx.globalCompositeOperation = 'destination-in';
         result.getSource()!.forEachFeature(feature =>
            vectorContext.drawFeature(feature, style)
         );
         ctx.globalCompositeOperation = compo;
      });

      return result;
   }, [clipAera, layer]);

   useEffect(() => {
      if (clipLayer && map) {
         map.addLayer(clipLayer)
         return () => { map.removeLayer(clipLayer) }
      }
   }, [clipLayer, map]);

   useEffect(() => {
      if (map) {
         map.addLayer(layer);
         return () => { map.removeLayer(layer) };
      }
   }, [map, layer]);

   return layer;
};

export const OlLayer = ({ opacity, source, order, active, maxZoom, minZoom, clipAera }:
   OlLayerProp & {
      opacity?: number,
      source: Source | TileImage,
      clipAera?: Coordinate[]
   }) => {
   const mapContext = useContext(MapContext)!;
   const layer = useLayer(source, mapContext.map, clipAera);

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
         if (layer instanceof LayerGroup) {
            layer.getLayers().forEach(layer => layer.setZIndex(order))
         } else {
            layer?.setZIndex(order);
         }
      }
   }, [order, layer]);

   return <></>;
};