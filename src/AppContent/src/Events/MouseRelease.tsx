import { useEffect, useState } from "react";

const useMouseRelease = () => {
   const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | undefined>();

   useEffect(() => {
      const handleMouseUp = (e: MouseEvent) => {
         setMousePosition({ x: e.clientX, y: e.clientY });
      };

      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
   }, []);

   useEffect(() => {
      if (mousePosition !== undefined) {
         setMousePosition(undefined);
      }
   }, [mousePosition]);

   return mousePosition;
}

export default useMouseRelease;