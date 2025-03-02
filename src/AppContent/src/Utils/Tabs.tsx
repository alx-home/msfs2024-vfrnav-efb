import { PropsWithChildren } from "react";
import { Button } from "./Button";

export const Tabs = <Tab,>({ children, tabs, disabled, switchTab, activeTab }: PropsWithChildren<{
   activeTab: string,
   tabs: Tab[],
   switchTab: (_tab: Tab) => void,
   disabled?: boolean
}>) => {
   return <div className='flex flex-col [&>:not(:first-child)]:ml-2 shadow-sm'>
      <div className='flex flex-row justify-start h-[29px] min-h-[29px]'>
         <div className='flex flex-row shrink!important [&>:not(:first-child)]:ml-1'>
            {tabs.map(tab =>
               <Button active={!disabled} key={tab as string} disabled={(activeTab === tab) || disabled} className='px-2'
                  onClick={() => switchTab(tab)}>
                  {tab as string}
               </Button>)}
         </div>
      </div>
      <div className='flex flex-col p-4'>
         {children}
      </div>
   </div>
}