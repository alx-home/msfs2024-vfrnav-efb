import { useEffect, useState } from "react";

export default function useKeyUp() {
   const [key, setKey] = useState<string | undefined>();

   useEffect(() => {
      const handleKeyUp = (e: KeyboardEvent) => {
         setKey(e.key);
      };

      document.addEventListener('keyup', handleKeyUp);
      return () => document.removeEventListener('keyup', handleKeyUp);
   }, []);

   useEffect(() => {
      if (key) {
         setKey(undefined);
      }
   }, [key]);

   return key;
}