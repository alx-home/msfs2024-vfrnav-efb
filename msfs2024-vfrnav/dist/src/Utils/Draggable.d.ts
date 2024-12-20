import { PropsWithChildren } from 'react';
export declare const Draggable: ({ children, vertical, onOrdersChange, className, active }: PropsWithChildren<{
    vertical: boolean;
    className?: string;
    onOrdersChange?: (orders: number[]) => void;
    active?: boolean;
}>) => import("react").JSX.Element;
