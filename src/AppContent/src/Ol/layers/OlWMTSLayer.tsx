import { Extent } from "ol/extent";
import { Projection } from "ol/proj";
import { OlLayer, OlLayerProp } from "./OlLayer";
import { TileImage, WMTS } from "ol/source";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import { useMemo } from "react";

export const OlWMTSLayer = ({
   opacity,
   url,
   layer,
   matrixSet,
   version,
   format,
   projection,
   tileGrid,
   style,
   wrapX,
   order,
   active
}: {
   opacity?: number,
   url: string,
   layer: string,
   matrixSet?: string,
   version: string,
   format?: string,
   projection: Projection,
   tileGrid: {
      origin: Extent,
      resolutions: Array<number>,
      matrixIds: Array<string>,
   },
   style?: 'normal',
   wrapX?: boolean,
} & OlLayerProp) => {
   const source = useMemo<TileImage>(() => new WMTS({
      url: url,
      layer: layer,
      matrixSet: matrixSet ?? 'PM',
      version: version,
      format: format ?? 'image/jpeg',
      projection: projection,
      tileGrid: new WMTSTileGrid(tileGrid),
      style: style ?? 'normal',
      wrapX: wrapX ?? true,
   }), [format, layer, matrixSet, projection, style, tileGrid, url, version, wrapX]);
   return <OlLayer source={source} opacity={opacity} order={order} active={active} />;
};