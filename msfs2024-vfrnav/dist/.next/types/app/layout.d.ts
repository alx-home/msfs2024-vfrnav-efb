type SegmentParams<T extends Object = any> = T extends Record<string, any> ? {
    [K in keyof T]: T[K] extends string ? string | string[] | undefined : never;
} : T;
export interface PageProps {
    params?: Promise<SegmentParams>;
    searchParams?: Promise<any>;
}
export interface LayoutProps {
    children?: React.ReactNode;
    params?: Promise<SegmentParams>;
}
export {};
