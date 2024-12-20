import { Dispatch, PropsWithChildren, SetStateAction } from 'react';
import { Feature } from 'ol';
import { default as VectorLayer } from 'ol/layer/Vector';
import { MapContext } from '../../MapPage';
export declare class NavData {
    id: number;
    order: number;
    name: string;
    active: boolean;
    shortName: string;
    feature: Feature;
    layer: VectorLayer;
    constructor(id: number, order: number, name: string, active: boolean, shortName: string, feature: Feature, layer: VectorLayer);
}
export declare const NavItem: ({ name, shortName, active, mapContext, setDraggable }: {
    active: boolean;
    name: string;
    shortName: string;
    mapContext: MapContext;
    setDraggable?: Dispatch<SetStateAction<boolean>>;
}) => import("react").JSX.Element;
export declare const Nav: ({ children, mapContext }: PropsWithChildren<{
    mapContext: MapContext;
}>) => import("react").JSX.Element;
