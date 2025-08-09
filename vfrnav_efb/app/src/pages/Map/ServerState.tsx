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

import { useEFBServer, useServer } from '@Utils/useServer'

import serverIcon from "@efb-images/server.svg"
import efbIcon from "@efb-images/efb-server.svg"

const State = ({ state, name, icon }: {
   state: boolean,
   name: string,
   icon: string
}) => {
   return <div className={"group flex relative transition-all hocus:opacity-100 max-w-8 overflow-hidden max-h-6 hocus:max-w-96 pointer-events-auto"
      + " border-solid border-1 [--tw-shadow-opacity:0.6] shadow-md mb-1"}
   >
      <div className={'flex transition-colors group-hocus:opacity-100 duration-1000 px-2' + (state ? " bg-msfs" : " bg-gray-700")}>
         <div className='relative transition-all opacity-0 group-hocus:opacity-100 text-nowrap'>
            {name} {state ? "C" : "Disc"}onnected
         </div>
         <div className='absolute flex flex-col transition-all w-full h-full opacity-100 group-hocus:opacity-0'>
            <img className="my-auto ml-[-0.1rem] justify-center invert max-h-6" src={icon} alt={name} width={16} height={16} />
         </div>
      </div>
   </div>
}

export const ServerState = () => {
   const server = useServer();
   const efb = useEFBServer();

   return <div className="absolute bottom-0 left-0">
      {__MSFS_EMBEDED__ ? <></> : <State name="MSFS" state={efb} icon={efbIcon} />}
      <State name="Server" state={server} icon={serverIcon} />
   </div>
}
