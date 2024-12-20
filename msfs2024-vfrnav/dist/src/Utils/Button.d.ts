import { PropsWithChildren, MouseEventHandler } from 'react';
export declare const Button: ({ children, onClick, className, active, disabled }: PropsWithChildren<{
    onClick?: MouseEventHandler<HTMLButtonElement>;
    className?: string;
    active: boolean;
    disabled?: boolean;
}>) => import("react").JSX.Element;
