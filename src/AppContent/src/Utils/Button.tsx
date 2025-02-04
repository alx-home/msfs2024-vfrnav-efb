import useMouseRelease from '@Events/MouseRelease';
import { PropsWithChildren, MouseEventHandler, useRef, useEffect } from 'react';

export const Button = ({ children, onClick, className, active, disabled }: PropsWithChildren<{
   onClick?: MouseEventHandler<HTMLButtonElement>,
   className?: string,
   active: boolean,
   disabled?: boolean
}>) => {
   const elemRef = useRef<HTMLButtonElement | null>(null);
   const mouseLeave = useMouseRelease(active);

   useEffect(() => {
      if (mouseLeave !== undefined) {
         elemRef.current?.blur();
      }
   }, [mouseLeave]);


   return <button className={"group grow bg-gray-700 p-1 shadow-md flex rounded-sm border-2 border-gray-900 overflow-hidden"
      + ((!(disabled ?? false)) ? ' hocus:bg-gray-800 hocus:drop-shadow-xl hocus:border-msfs has-[:focus]:border-msfs has-[:hover]:border-msfs cursor-pointer' : ' opacity-30')}
      ref={elemRef}
      onClick={e => { onClick?.(e) }}
      disabled={(disabled ?? false) || !(active ?? true)}>
      <div className={'line-clamp-1 w-[100%] overflow-ellipsis text-xl font-semibold text-white ' + (className ?? "")} >
         {children}
      </div>
   </button>;
};