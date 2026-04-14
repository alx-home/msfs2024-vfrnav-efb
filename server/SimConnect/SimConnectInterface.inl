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

#include "SimConnect.h"

#include <utils/MessageQueue.h>
#include <Windows.h>
#include <SimConnect.h>
#include <synchapi.h>
#include <winbase.h>
#include <winuser.h>
#include <type_traits>

using namespace std::chrono_literals;

namespace smc {

template <class TYPE, size_t N>
WPromise<bool>
SimConnect::SetDataOnSimObject(
  DataId                id,
  SIMCONNECT_OBJECT_ID  objectId,
  DWORD                 flags,
  std::array<TYPE, N>&& data
) {
   std::vector<std::byte> raw_data(sizeof(TYPE) * N);
   std::ranges::move(
     reinterpret_cast<std::byte*>(data.data()),
     reinterpret_cast<std::byte*>(data.data()) + sizeof(TYPE) * N,
     raw_data.data()
   );
   return SetDataOnSimObjectImpl(id, objectId, flags, sizeof(TYPE), N, std::move(raw_data));
}

template <class TYPE>
WPromise<bool>
SimConnect::SetDataOnSimObject(
  DataId               id,
  SIMCONNECT_OBJECT_ID objectId,
  DWORD                flags,
  std::vector<TYPE>&&  data
) {
   std::vector<std::byte> raw_data(sizeof(TYPE) * data.size());
   std::ranges::move(
     reinterpret_cast<std::byte*>(data.data()),
     reinterpret_cast<std::byte*>(data.data()) + sizeof(TYPE) * data.size(),
     raw_data.data()
   );
   return SetDataOnSimObjectImpl(
     id, objectId, flags, sizeof(TYPE), data.size(), std::move(raw_data)
   );
}

template <class TYPE>
   requires(!IS_STD_ARRAY<TYPE> && !IS_VECTOR<TYPE>)
WPromise<bool>
SimConnect::SetDataOnSimObject(DataId id, SIMCONNECT_OBJECT_ID objectId, DWORD flags, TYPE&& data) {
   return SetDataOnSimObject(
     id, objectId, flags, std::array<std::remove_cvref_t<TYPE>, 1>{std::forward<TYPE>(data)}
   );
}

}  // namespace smc