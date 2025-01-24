import { useEffect, useState } from "react";

export default function useMouseMove(active?: boolean) {
   const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | undefined>();
   const [resultPosition, setResultPosition] = useState<{ x: number, y: number } | undefined>();

   useEffect(() => {
      if (active) {
         setResultPosition(mousePosition);
      } else {
         setResultPosition(undefined);
      }
   }, [active, mousePosition]);

   useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
         setMousePosition({ x: e.clientX, y: e.clientY });
      };

      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
   }, []);

   return resultPosition;
}