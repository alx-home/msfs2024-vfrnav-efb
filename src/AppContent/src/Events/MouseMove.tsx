import { useEffect, useMemo, useState } from "react";

export default function useMouseMove(active?: boolean) {
   const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | undefined>();
   const result = useMemo(() => (active ?? true) ? mousePosition : undefined, [active, mousePosition]);

   useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
         setMousePosition({ x: e.clientX, y: e.clientY });
      };

      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
   }, []);

   return result;
}