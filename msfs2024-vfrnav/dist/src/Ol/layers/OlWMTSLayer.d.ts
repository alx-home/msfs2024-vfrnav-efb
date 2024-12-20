import { Extent } from 'ol/extent';
import { Projection } from 'ol/proj';
import { OlLayerProp } from './OlLayer';
export declare const OlWMTSLayer: ({ opacity, url, layer, matrixSet, version, format, projection, tileGrid, style, wrapX, map, order, active }: {
    opacity?: number;
    url: string;
    layer: string;
    matrixSet?: string;
    version: string;
    format?: string;
    projection: Projection;
    tileGrid: {
        origin: Extent;
        resolutions: Array<number>;
        matrixIds: Array<string>;
    };
    style?: "normal";
    wrapX?: boolean;
} & OlLayerProp) => import("react").JSX.Element;
