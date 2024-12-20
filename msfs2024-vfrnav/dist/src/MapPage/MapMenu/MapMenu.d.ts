import { Dispatch, SetStateAction } from 'react';
import { Layer, OnLayerChange } from './Menus/Layers';
import { MapContext } from '../MapPage';
export declare enum Menu {
    layers = 0,
    nav = 1
}
export declare const MapMenu: ({ open, setOpen, menu, layers, onLayerChange, mapContext }: {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    menu: Menu;
    layers: Layer[];
    onLayerChange: OnLayerChange;
    mapContext: MapContext;
}) => import("react").JSX.Element;
