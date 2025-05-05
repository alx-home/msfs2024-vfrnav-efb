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

import { useCallback } from "react";
import { getSIAAuth } from "./SIA";

const SIACache = new Map<string, Promise<Uint8Array>>();

export const useSIAPDF = (SIAAddr: string, SIAAuth: string) => {
  return useCallback(async (icao: string) => {
    {
      const cached = SIACache.get(icao);
      if (!cached) {
        const addr = SIAAddr.replace('{icao}', icao);

        SIACache.set(icao, fetch(addr, {
          method: 'GET',
          headers: {
            'Auth': getSIAAuth(SIAAuth, addr)
          }
        }).then(async (response) => {
          if (response.ok) {
            return new Uint8Array(await response.arrayBuffer())
          } else {
            throw new Error('SIA fetch ' + icao + ' error: ' + response.statusText);
          }
        }));
      }
    }

    return SIACache.get(icao)!;
  }, [SIAAddr, SIAAuth]);
}