import { useEffect, useMemo, useState } from "react";

import Arrow from '@alx-home/images/arrow.svg?react';
import { Menu } from "./MapMenu/MapMenu";
import { RecordsToolbar } from "./MapMenu/Menus/Records";

export const ToolBar = ({ menu }: {
   menu: Menu
}) => {
   const [open, setOpen] = useState(false);
   const content = useMemo(() => {
      switch (menu) {
         case Menu.records:
            return <RecordsToolbar />

         default:
            return undefined;
      }
   }, [menu]);

   useEffect(() => {
      setOpen(false)
   }, [content])

   return <div className={"flex flex-col pointer-events-auto transition-all overflow-hidden" + (content ? '' : ' hidden')}>
      <button className="flex bg-slate-900 h-6 hocus:bg-msfs shadow-smd select-none transition-all cursor-pointer justify-center text-center"
         onClick={(e) => {
            setOpen(open => !open)
            e.currentTarget.blur()
         }}
      >
         <Arrow width={20} height={15} className={'transition-all m-auto' + (open ? ' -rotate-90' : ' rotate-90')} />
      </button>
      <div className={"flex min-h-0 transition-all shrink border-t border-gray-700 bg-gray-800 overflow-hidden " + (open ? ' max-h-96' : ' max-h-0')}>
         <div className="flex grow p-4 h-full">{content}</div>
      </div>
   </div>
}