import { OlLayer, OlLayerProp } from "./OlLayer";
import { BingMaps } from "ol/source";
import { useMemo } from "react";

export const OlBingLayer = ({
   opacity,
   order,
   active,
   minZoom,
   maxZoom,
   clipAera
}: OlLayerProp & {
   opacity?: number
}) => {
   const source = useMemo(() => new BingMaps({
      key: "@TODO",
      imagerySet: 'AerialWithLabels'
   }), []);
   return <OlLayer source={source} opacity={opacity} order={order} active={active} minZoom={minZoom} maxZoom={maxZoom} clipAera={clipAera} />;
};