import { Page, Space } from "@/app/App";
import { useRef } from "react";

export const Menu = ({ setPage, pages, activePage }: { pages: (Page | Space)[], setPage: (_page: string) => void, activePage: string }) => {
   const refs = useRef<(HTMLButtonElement | null)[]>([]);

   return <div className={'w-[40px] bg-menu flex h-full flex-col [&>*]:mt-2 overflow-hidden first:pt-11'}>
      {pages.map((_page, index) => {
         if (_page.type === 'page') {
            const page = (_page as Page);
            return <button key={page.name}
               disabled={page.disabled}
               className={'border-x-2 mx-auto w-[34px] border-r-transparent transition-colors group flex h-[32px] min-w-10  items-center rounded-[2px] p-1 pl-[7px] text-left text-xl bg-item border-l-2'
                  + (page.disabled ? ' opacity-30' : (' hocus:bg-item-hocus hocus:text-gray-600 [&>*]:hocus:invert-0')
                     + (page.name === activePage ? ' bg-active-item border-l-white' : ' border-l-msfs'))}
               onClick={() => setPage(page.name)}
               ref={e => { refs.current[index] = e }}
               onMouseUp={() => refs.current[index]?.blur()}>
               {{
                  ...page.icon, props: {
                     ...page.icon.props,
                     className: ('w-[16px] shrink-0 block ' + (page.name === activePage ? '' : 'invert ') + (page.icon.props.className ?? ''))
                  }
               }}
            </button>;
         } else {
            return _page.elem;
         }
      }
      )}
   </div>;
}