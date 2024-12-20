import { NavData } from './MapMenu/Menus/Nav';
import { Dispatch, MutableRefObject, SetStateAction } from 'react';
export declare class MapContext {
    readonly addNavRef: MutableRefObject<(() => void) | undefined>;
    readonly cancelRef: MutableRefObject<(() => void) | undefined>;
    readonly navData: NavData[];
    readonly setNavData: Dispatch<SetStateAction<NavData[]>>;
    readonly counter: number;
    readonly setCounter: Dispatch<SetStateAction<number>>;
    readonly flash: boolean;
    readonly setFlash: Dispatch<SetStateAction<boolean>>;
    readonly flashKey: number;
    readonly setFlashKey: Dispatch<SetStateAction<number>>;
    constructor(addNavRef: MutableRefObject<(() => void) | undefined>, cancelRef: MutableRefObject<(() => void) | undefined>, navData: NavData[], setNavData: Dispatch<SetStateAction<NavData[]>>, counter: number, setCounter: Dispatch<SetStateAction<number>>, flash: boolean, setFlash: Dispatch<SetStateAction<boolean>>, flashKey: number, setFlashKey: Dispatch<SetStateAction<number>>);
    triggerFlash(value?: boolean): void;
    addNav(): void;
    reorderNav(orders: number[]): void;
    cancel(): void;
    editNav(name: string, newName: string): void;
    activeNav(name: string, active: boolean): void;
    removeNav(name: string): void;
    static readonly use: () => MapContext;
}
export declare const MapPage: ({ active }: {
    active: boolean;
}) => import("react").JSX.Element;
