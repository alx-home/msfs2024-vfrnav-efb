import { HTMLInputTypeAttribute } from 'react';
export declare const Input: ({ className, active, _default, placeholder, pattern, type, inputMode, validate, reset, onChange }: {
    active: boolean;
    className?: string;
    _default?: string;
    placeholder?: string;
    pattern?: string;
    inputMode?: "email" | "search" | "tel" | "text" | "url" | "none" | "numeric" | "decimal";
    validate?: (value: string) => boolean;
    type?: HTMLInputTypeAttribute;
    reset?: boolean;
    onChange?: (value: string) => void;
}) => import("react").JSX.Element;
