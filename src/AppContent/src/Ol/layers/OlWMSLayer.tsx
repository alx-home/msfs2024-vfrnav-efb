import { OlLayer, OlLayerProp } from "./OlLayer";
import { TileWMS } from "ol/source";
import { useMemo } from "react";

export const OlWMSLayer = ({
   opacity,
   url,
   crossOrigin,
   order,
   active,
   minZoom,
   maxZoom,
   clipAera
}: OlLayerProp & {
   url: string,
   crossOrigin?: string | null,
   opacity?: number
}) => {
   const source = useMemo(() => new TileWMS({
      params: {
         url: url,
         crossOrigin: crossOrigin ?? "anonymous"
      },
   }), [crossOrigin, url]);
   return <OlLayer source={source} opacity={opacity} order={order} active={active} minZoom={minZoom} maxZoom={maxZoom} clipAera={clipAera} />;
};