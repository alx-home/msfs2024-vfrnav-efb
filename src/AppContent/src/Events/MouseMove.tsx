import { useEffect, useState } from "react";

export default function useMouseMove(active?: boolean) {
   const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | undefined>();

   useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
         if (active ?? true) {
            setMousePosition({ x: e.clientX, y: e.clientY });
         }
      };

      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
   }, [active]);

   return (active ?? true) ? mousePosition : undefined;
}