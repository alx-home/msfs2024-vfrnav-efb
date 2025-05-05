/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If
 * not, see <https://www.gnu.org/licenses/>.
 */

import { Page, Space } from "@app/App";
import { useRef } from "react";

export const Menu = ({ setPage, pages, activePage }: { pages: (Page | Space)[], setPage: (_page: string) => void, activePage: string }) => {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  return <div className={'relative z-10 w-[40px] min-w-[40px!important] bg-menu shadow-smd flex h-full flex-col [&>*]:mt-2 overflow-hidden first:pt-11'}>
    {pages.map((_page, index) => {
      if (_page.type === 'page') {
        const page = (_page as Page);
        return <button key={page.name}
          disabled={page.disabled}
          className={'border-x-2 shadow-md mx-auto w-[34px] border-r-transparent transition-colors group flex h-[32px] min-w-10 cursor-pointer'
            + ' items-center rounded-[2px] p-1 pl-[7px] text-left text-xl border-l-2'
            + (page.name === activePage ? ' bg-active-item border-l-white' : ' bg-item border-l-msfs')
            + (page.disabled ? ' opacity-30' : (' hocus:bg-item-hocus hocus:text-gray-600 [&>*]:hocus:invert-0'))}
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