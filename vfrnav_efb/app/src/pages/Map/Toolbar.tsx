import { useState } from "react";

import Arrow from '@alx-home/images/arrow.svg?react';

export const ToolBar = () => {
   const [open, setOpen] = useState(false);

   return <div className="relative flex flex-col-reverse pointer-events-auto transition-all overflow-hidden max-h-full">
      <div className={"flex min-h-0 transition-all shrink border-t border-gray-700 bg-gray-800 overflow-hidden " + (open ? ' max-h-full' : ' max-h-0')}>
         <div className="flex grow m-4 h-full">dsfjkhsxf</div>
      </div>
      <button className="flex bg-slate-900 h-6 hocus:bg-msfs shadow-smd select-none transition-all cursor-pointer justify-center text-center"
         onClick={(e) => {
            setOpen(open => !open)
            e.currentTarget.blur()
         }}
      >
         <Arrow width={20} height={15} className={'transition-all m-auto' + (open ? ' -rotate-90' : ' rotate-90')} />
      </button>
   </div>
}