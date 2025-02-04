import { useEffect, useState } from "react";

const useMouseRelease = (active?: boolean) => {
   const [position, setPosition] = useState<{ x: number, y: number } | undefined>();

   useEffect(() => {
      if (active ?? true) {
         const handleMouseUp = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
         };

         document.addEventListener('mouseup', handleMouseUp);
         return () => document.removeEventListener('mouseup', handleMouseUp);
      }
   }, [active]);

   useEffect(() => {
      if (position) {
         setPosition(undefined)
      }
   }, [position])

   return position;
}

export default useMouseRelease;