export declare class Page {
    readonly type: string;
    readonly name: string;
    readonly icon: JSX.Element;
    readonly elem: JSX.Element;
    readonly disabled?: boolean;
    constructor({ name, icon, elem, disabled }: {
        name: string;
        icon: JSX.Element;
        elem: JSX.Element;
        disabled?: boolean;
    });
}
export declare class Space {
    constructor(index: number);
    readonly index: number;
    readonly type: string;
    readonly elem: JSX.Element;
}
export declare const App: () => import("react").JSX.Element;
