import { useEffect, useRef, useState } from "react";

const useMouseMove = (active?: boolean) => {
   const savedPosition = useRef<{ x: number, y: number }>(undefined);
   const [position, setPosition] = useState<{ x: number, y: number }>();
   const [needsUpdate, setNeedsUpdate] = useState(0);

   useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
         savedPosition.current = { x: e.clientX, y: e.clientY };
         if (active) {
            setNeedsUpdate(count => count + 1);
         }
      };

      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
   }, [active]);

   useEffect(() => {
      if (active) {
         setPosition(savedPosition.current);
      } else {
         setPosition(undefined);
      }
   }, [active, needsUpdate])

   return position;
}

export default useMouseMove;