import { useEffect, useState, useRef, useCallback } from 'react';

export interface Dim { width: number, height: number };

export const useResize = (): [Dim | undefined, (_value: HTMLElement | null) => void] => {
   const [dimensions, setDimensions] = useState<Dim>();
   const ref = useRef<HTMLElement | null>(null);
   const setRef = useCallback((value: HTMLElement | null) => ref.current = value, []);

   useEffect(() => {
      const obj = ref.current;
      let observer: ResizeObserver | undefined;
      if (obj) {
         observer = new ResizeObserver(() => {
            const { width, height } = obj.getBoundingClientRect();
            setDimensions({ width: Math.round(width), height: Math.round(height) });
         });

         observer.observe(obj);
      }

      return () => observer?.unobserve(obj!);
   }, [ref]);

   return [dimensions, setRef];
}
