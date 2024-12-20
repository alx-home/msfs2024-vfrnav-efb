import { useEffect, useState } from "react";

export default function useMouseDrag(dragging: boolean) {
   const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | undefined>();

   useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
         if (dragging) {
            setMousePosition({ x: e.clientX, y: e.clientY });
         }
      };

      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
   }, [dragging]);

   return dragging ? mousePosition : undefined;
}