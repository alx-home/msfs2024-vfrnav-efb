import { useEffect, useState } from "react";

export default function useMouseMove(active?: boolean) {
   const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | undefined>();

   useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
         if (active) {
            setMousePosition({ x: e.clientX, y: e.clientY });
         } else {
            setMousePosition(undefined);
         }
      };

      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
   }, [active]);

   return mousePosition;
}