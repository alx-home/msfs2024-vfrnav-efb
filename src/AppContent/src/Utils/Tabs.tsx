import { PropsWithChildren } from "react";
import { Button } from "./Button";

export const Tabs = <Tab extends string,>({ children, tabs, disabled, switchTab, activeTab, names }: PropsWithChildren<{
   activeTab: string,
   tabs: Tab[],
   names?: Record<Tab, string>,
   switchTab: (_tab: Tab) => void,
   disabled?: boolean
}>) => {
   return <div className='flex flex-col [&>:not(:first-child)]:ml-2 shadow-sm'>
      <div className='flex flex-row justify-start h-[29px] min-h-[29px]'>
         <div className='flex flex-row shrink!important [&>:not(:first-child)]:ml-1'>
            {tabs.map(tab =>
               <Button active={!disabled} key={tab} disabled={(activeTab === tab) || disabled} className='px-2'
                  onClick={() => switchTab(tab)}>
                  {names !== undefined ? names[tab] : tab}
               </Button>)}
         </div>
      </div>
      <div className='flex flex-col p-4'>
         {children}
      </div>
   </div>
}