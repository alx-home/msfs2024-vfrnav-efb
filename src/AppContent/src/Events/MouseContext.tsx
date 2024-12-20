
import { createContext, PropsWithChildren, useMemo, useState } from "react";

export const MouseContext = createContext<{
   cursorType: string,
   cursorChangeHandler: (_cursorType: string) => void
}>({
   cursorType: "",
   cursorChangeHandler: () => { },
});

const MouseContextProvider = ({ children }: PropsWithChildren) => {
   const [cursorType, setCursorType] = useState("");
   const provider = useMemo(() => ({
      cursorType: cursorType,
      cursorChangeHandler: (cursorType: string) => {
         setCursorType(cursorType);
      },
   }), [cursorType, setCursorType]);

   return (
      <MouseContext.Provider
         value={provider}
      >
         <div style={{ cursor: cursorType }}>
            {children}
         </div>
      </MouseContext.Provider>
   );
};

export default MouseContextProvider;