import { PropsWithChildren } from 'react';
export declare const SettingsContext: import('react').Context<{
    speed: number;
    adjustHeading: boolean;
    adjustTime: boolean;
    setSpeed: (speed: number) => void;
    setAdjustHeading: (enable: boolean) => void;
    setAdjustTime: (enable: boolean) => void;
}>;
declare const SettingsContextProvider: ({ children }: PropsWithChildren) => import("react").JSX.Element;
export default SettingsContextProvider;
