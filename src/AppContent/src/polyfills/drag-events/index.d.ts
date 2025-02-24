/* eslint-disable no-unused-vars */
import { Point } from "./internal/dom-utils.js";
export { Point } from "./internal/dom-utils.js";
export { supportsPassiveEventListener } from "./internal/feature-detection.js";
export declare type DragImageTranslateOverrideFn = (event: TouchEvent, hoverCoordinates: Point, hoveredElement: HTMLElement, translateDragImageFn: (offsetX: number, offsetY: number) => void) => void;
export interface Config {
    forceApply?: boolean;
    dragImageOffset?: Point;
    dragImageCenterOnTouch?: boolean;
    iterationInterval?: number;
    dragStartConditionOverride?: (event: TouchEvent) => boolean;
    dragImageTranslateOverride?: DragImageTranslateOverrideFn;
    defaultActionOverride?: (event: TouchEvent) => void;
    holdToDrag?: number;
    tryFindDraggableTarget?: (event: TouchEvent) => HTMLElement | undefined;
    dragImageSetup?: (element: HTMLElement) => HTMLElement;
    elementFromPoint?: (x: number, y: number) => Element;
}
export declare function polyfill(override?: Config): boolean;
export as namespace MobileDragDrop;

import './index.js'