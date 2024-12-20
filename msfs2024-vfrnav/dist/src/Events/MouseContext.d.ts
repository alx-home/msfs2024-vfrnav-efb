import { PropsWithChildren } from 'react';
export declare const MouseContext: import('react').Context<{
    cursorType: string;
    cursorChangeHandler: (cursorType: string) => void;
}>;
declare const MouseContextProvider: ({ children }: PropsWithChildren) => import("react").JSX.Element;
export default MouseContextProvider;
