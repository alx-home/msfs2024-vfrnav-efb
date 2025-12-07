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
import { ServerState } from "@pages/Map/ServerState";
import { useRef } from "react";

export const Menu = ({ setPage, pages, activePage }: { pages: (Page | Space)[], setPage: (_page: string) => void, activePage: string }) => {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  return <div className={'relative z-10 shrink-0 min-w-0 bg-menu shadow-smd flex flex-col'
    + (__MSFS_EMBEDED__ ?
      ' [&_*]:text-[calc(1rem*var(--dpi-scale))] text-[calc(1rem*var(--dpi-scale))]'
      : ' [&_*]:text-[calc(1.5rem*var(--dpi-scale))] text-[calc(1.5rem*var(--dpi-scale))]')
    + ' [&>*]:mb-[--menu-margin] w-[2.5em] first:pt-[var(--menu-padding)]'
  }>
    {pages.map((_page, index) => {
      if (_page.type === 'page') {
        const page = (_page as Page);
        return <button key={page.name}
          disabled={page.disabled}
          className={'shadow-md mx-auto border-r-transparent transition-colors group flex min-w-0 cursor-pointer'
            + ' w-[var(--button-width)] h-[var(--button-height)]'
            + ' items-center rounded-[2px] text-left text-sm border-l-[0.12em]'
            + (page.name === activePage ? ' bg-active-item border-l-white' : ' bg-item border-l-msfs')
            + (page.disabled ? ' opacity-30' : (' hocus:bg-item-hocus hocus:text-gray-600 [&_*]:hocus:invert-0'))}
          onClick={() => setPage(page.name)}
          ref={e => { refs.current[index] = e }}
          onMouseUp={() => refs.current[index]?.blur()}>
          <div className="flex flex-row w-full">
            {{
              ...page.icon, props: {
                ...page.icon.props,
                className: ('h-[0.95em] w-[0.95em] shrink-0 m-auto ' + (page.name === activePage ? '' : 'invert ') + (page.icon.props.className ?? ''))
              }
            }}
          </div>
        </button>;
      } else {
        return _page.elem;
      }
    }
    )}
    <ServerState />
  </div>;
}