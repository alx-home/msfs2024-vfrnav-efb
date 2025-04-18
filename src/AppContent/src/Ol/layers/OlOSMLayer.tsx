import { OlLayer, OlLayerProp } from "./OlLayer";
import { OSM } from "ol/source";
import { useMemo } from "react";

export const OlOSMLayer = ({
   opacity,
   url,
   crossOrigin,
   order,
   active,
   minZoom,
   maxZoom,
   clipAera
}: OlLayerProp & {
   url?: string,
   crossOrigin?: string | null,
   opacity?: number
}) => {
   const source = useMemo(() => new OSM({ url: url, crossOrigin: crossOrigin ?? null }), [url, crossOrigin]);
   return <OlLayer source={source} opacity={opacity} order={order} active={active} minZoom={minZoom} maxZoom={maxZoom} clipAera={clipAera} />;
};