import { OlLayerProp } from './OlLayer';
import { Feature } from 'ol';
import { default as VectorLayer } from 'ol/layer/Vector';
import { MapContext } from '../../MapPage/MapPage';
export declare const OlRouteLayer: ({ map, mapContext, onAddFeature, order, zIndex }: {
    mapContext: MapContext;
    onAddFeature: (feature: Feature, layer: VectorLayer) => void;
    zIndex: number;
} & OlLayerProp) => import("react").JSX.Element;
