export declare class Layer {
    src: string;
    alt: string;
    order: number;
    active: boolean;
    constructor(src: string, alt: string, order: number, active: boolean);
}
export type OnLayerChange = (layers: {
    index: number;
    order?: number;
    active?: boolean;
}[]) => void;
export declare const Layers: ({ layers, onLayerChange }: {
    layers: Layer[];
    onLayerChange: OnLayerChange;
}) => import("react").JSX.Element;
