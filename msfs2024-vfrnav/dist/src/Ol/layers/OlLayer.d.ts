import { Map } from 'ol';
import { TileImage } from 'ol/source';
export declare class OlLayerProp {
    map?: Map | undefined;
    order?: number | undefined;
    active?: boolean | undefined;
    maxZoom?: number | undefined;
    minZoom?: number | undefined;
    constructor(map?: Map | undefined, order?: number | undefined, active?: boolean | undefined, maxZoom?: number | undefined, minZoom?: number | undefined);
}
export declare const OlLayer: ({ opacity, source, map, order, active, maxZoom, minZoom }: OlLayerProp & {
    opacity?: number;
    source: TileImage;
}) => import("react").JSX.Element;
