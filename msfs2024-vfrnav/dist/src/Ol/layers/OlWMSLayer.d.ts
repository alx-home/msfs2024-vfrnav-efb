import { OlLayerProp } from './OlLayer';
export declare const OlWMSLayer: ({ opacity, map, url, crossOrigin, order, active }: OlLayerProp & {
    url: string;
    crossOrigin?: string | null;
    opacity?: number;
}) => import("react").JSX.Element;
