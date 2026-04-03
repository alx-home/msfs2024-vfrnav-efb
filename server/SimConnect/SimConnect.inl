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
#include <cstdint>
#include <memory>
#include <string_view>
#include <chrono>
#include <type_traits>

using namespace std::chrono_literals;

namespace smc {

namespace api {
template <class TYPE, size_t N>
WPromise<void>
SimConnect::SetDataOnSimObject(
  DataId                id,
  SIMCONNECT_OBJECT_ID  objectId,
  DWORD                 flags,
  std::array<TYPE, N>&& data
) {
   return MakePromise(
     [this, id, objectId, flags, data = std::move(data)](
       Resolve<void> const& resolve, Reject const& reject
     ) mutable -> Promise<void, true> {
        if (SetDataOnSimObjectImpl(id, objectId, flags, sizeof(TYPE), N, data.data())) {
           resolve();
        } else {
           MakeReject<UnknownError>(reject, "Failed to set data on sim object");
        }

        co_return;
     }
   );
}

template <class TYPE>
WPromise<void>
SimConnect::SetDataOnSimObject(
  DataId               id,
  SIMCONNECT_OBJECT_ID objectId,
  DWORD                flags,
  std::vector<TYPE>&&  data
) {
   return MakePromise(
     [this, id, objectId, flags, data = std::move(data)](
       Resolve<void> const& resolve, Reject const& reject
     ) mutable -> Promise<void, true> {
        if (SetDataOnSimObjectImpl(id, objectId, flags, sizeof(TYPE), data.size(), data.data())) {
           resolve();
        } else {
           MakeReject<UnknownError>(reject, "Failed to set data on sim object");
        }

        co_return;
     }
   );
}

template <class TYPE>
   requires(!IS_STD_ARRAY<TYPE> && !IS_VECTOR<TYPE>)
WPromise<void>
SimConnect::SetDataOnSimObject(DataId id, SIMCONNECT_OBJECT_ID objectId, DWORD flags, TYPE&& data) {
   return SetDataOnSimObject(
     id, objectId, flags, std::array<std::remove_cvref_t<TYPE>, 1>{std::forward<TYPE>(data)}
   );
}
}  // namespace api

namespace priv {
template <DataId ID>
bool
SimConnect::AddToDataDefinition(
  std::string_view                datumName,
  SIMCONNECT_DATATYPE             datumType,
  std::optional<std::string_view> unitsName
) {
   auto handle = handle_.lock();
   if (!handle) {
      return false;
   }

   return AddToDataDefinition<ID>(handle, datumName, datumType, unitsName);
}

template <DataId ID>
bool
SimConnect::AddToDataDefinition(
  std::shared_ptr<void*> const&   handle,
  std::string_view                datumName,
  SIMCONNECT_DATATYPE             datumType,
  std::optional<std::string_view> unitsName
) {
   return SimConnect_AddToDataDefinition(
            *handle,
            static_cast<uint32_t>(ID),
            datumName.data(),
            unitsName ? unitsName->data() : nullptr,
            datumType
          )
          == S_OK;
}

template <DataId ID, class T>
bool
SimConnect::AddToDataDefinition(std::shared_ptr<void*> const& handle) {
   return std::apply(
     [&](auto&&... member) constexpr {
        return (
          AddToDataDefinition<ID>(
            handle, std::get<0>(member), std::get<1>(member).VALUE_S, std::get<2>(member)
          )
          && ...
        );
     },
     T::MEMBERS
   );
}

template <DataId ID>
bool
SimConnect::AddToFacilityDefinition(std::string_view fieldName) {
   auto handle = handle_.lock();
   if (!handle) {
      return false;
   }

   return AddToFacilityDefinition<ID>(handle, fieldName);
}

template <DataId ID>
bool
SimConnect::AddToFacilityDefinition(
  std::shared_ptr<void*> const& handle,
  std::string_view              fieldName
) {
   return SimConnect_AddToDataDefinition(*handle, static_cast<uint32_t>(ID), fieldName.data())
          == S_OK;
}

template <DataId ID, class T>
bool
SimConnect::AddToFacilityDefinition(std::shared_ptr<void*> const& handle) {
   return std::apply(
     [&](auto&&... member) constexpr {
        return (AddToFacilityDefinition<ID>(handle, std::get<0>(member)) && ...);
     },
     T::MEMBERS
   );
}

template <DataId ID, class T>
bool
SimConnect::AddToDataDefinition() {
   auto handle = handle_.lock();
   if (!handle) {
      return false;
   }
   return AddToDataDefinition<ID, T>(handle);
}

template <DataId ID, class DATA_TYPE>
WPromise<std::vector<DATA_TYPE>>
SimConnect::RequestDataOnSimObjectType(
  SIMCONNECT_SIMOBJECT_TYPE objectType,
  uint32_t                  radius,
  std::shared_ptr<void*>    handle
) {
   return MakePromise(
     [this, handle, objectType, radius](
       Resolve<std::vector<DATA_TYPE>> const& resolve, Reject const& reject
     ) mutable -> Promise<std::vector<DATA_TYPE>, true> {
        if (!handle) {
           handle = handle_.lock();
           if (!handle) {
              MakeReject<Disconnected>(reject);
              co_return;
           }
        }

        auto const request_id = ++request_id_;
        auto const result     = std::make_shared<std::vector<DATA_TYPE>>();
        pending_simobject_type_.emplace(
          request_id,
          [this,
           reject = reject.shared_from_this(),
           result](SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE const& data) {
             if (data.dwDefineID != static_cast<DWORD>(ID)) {
                MakeReject<UnknownError>(
                  *reject, "Received data for unknown request ID or data type mismatch"
                );
                return;
             }

             if (auto const header_size =
                   sizeof(SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE) - sizeof(data.dwSize);
                 Size<DATA_TYPE>() > (data.dwSize - header_size)) {

                MakeReject<UnknownError>(
                  *reject,
                  "Received data size does not match expected size for requested data type ("
                    + std::to_string(data.dwSize - header_size) + " vs "
                    + std::to_string(Size<DATA_TYPE>()) + ")"
                );
                return;
             }

             assert(std::this_thread::get_id() == MessageQueue::ThreadId());
             result->emplace_back(StaticCast<DATA_TYPE>(data.dwData));
          }
        );

        MakePromise(
          [this,
           resolve = resolve.shared_from_this(),
           reject  = reject.shared_from_this(),
           result,
           request_id]() -> Promise<void> {
             // Watch for 200ms after receiving the last data, as SimConnect may send multiple
             // packets for a single request, and we want to wait until we received them all
             // before resolving the promise
             std::size_t count = 0;
             while (true) {
                co_await dispatch_(1s);
                if (!count || (result->size() > count)) {
                   count = result->size();
                   continue;
                }
                break;
             }

             assert(std::this_thread::get_id() == MessageQueue::ThreadId());
             auto handle = handle_.lock();
             if (!handle) {
                MakeReject<Disconnected>(*reject);
                co_return;
             }

             if (pending_simobject_type_.erase(request_id)) {
                std::vector<DATA_TYPE> data = std::move(*result);
                (*resolve)(data);
             } else {
                // If the request is not in the pending map, it means that the connection was
                // lost while waiting for the data, so we reject with a Disconnected error
                MakeReject<Disconnected>(*reject);
             }
          }
        ).Detach();
        if (SimConnect_RequestDataOnSimObjectType(
              *handle,
              static_cast<SIMCONNECT_DATA_REQUEST_ID>(request_id),
              static_cast<uint32_t>(ID),
              static_cast<DWORD>(radius),
              objectType
            )
            != S_OK) {
           pending_simobject_type_.erase(request_id);
           MakeReject<UnknownError>(reject, "Failed to request data on sim object");
           co_return;
        }
     }
   );
}

template <DataId ID, class DATA_TYPE>
WPromise<SimobjectData<DATA_TYPE>>
SimConnect::RequestDataOnSimObject(uint32_t objectId, std::shared_ptr<void*> handle) {
   return MakePromise(
     [this, handle, objectId](
       Resolve<SimobjectData<DATA_TYPE>> const& resolve, Reject const& reject
     ) mutable -> Promise<SimobjectData<DATA_TYPE>, true> {
        if (!handle) {
           handle = handle_.lock();
           if (!handle) {
              MakeReject<Disconnected>(reject);
              co_return;
           }
        }

        if (!MessageQueue::Dispatch(
              [reject = reject.shared_from_this()]() constexpr {
                 MakeReject<Timeout>(*reject, "Timed out while requesting data on sim object");
              },
              5s
            )) {
           MakeReject<UnknownError>(reject, "App is stopping");
           co_return;
        }

        auto const request_id = ++request_id_;
        pending_simobject_.emplace(
          request_id,
          [resolve = resolve.shared_from_this(), reject = reject.shared_from_this()](
            SIMCONNECT_RECV_SIMOBJECT_DATA const&        data,
            std::chrono::steady_clock::time_point const& last_update
          ) {
             if (data.dwDefineID != static_cast<DWORD>(ID)) {
                MakeReject<UnknownError>(
                  *reject, "Received data for unknown request ID or data type mismatch"
                );
                return;
             }

             if (auto const header_size =
                   sizeof(SIMCONNECT_RECV_SIMOBJECT_DATA) - sizeof(data.dwSize);
                 Size<DATA_TYPE>() > (data.dwSize - header_size)) {

                MakeReject<UnknownError>(
                  *reject,
                  "Received data size does not match expected size for requested data type ("
                    + std::to_string(data.dwSize - header_size) + " vs "
                    + std::to_string(Size<DATA_TYPE>()) + ")"
                );
                return;
             }

             SimobjectData<DATA_TYPE> simobject_data{
               .dw_version_       = data.dwVersion,
               .dw_id_            = data.dwID,
               .dw_request_id_    = data.dwRequestID,
               .dw_object_id_     = data.dwObjectID,
               .dw_define_id_     = data.dwDefineID,
               .dw_flags_         = data.dwFlags,
               .dw_entry_number_  = data.dwentrynumber,
               .dw_out_of_        = data.dwoutof,
               .dw_define_count_  = data.dwDefineCount,
               .last_update_time_ = last_update,
               .dw_data_          = StaticCast<DATA_TYPE>(data.dwData),
             };

             (*resolve)(simobject_data);
          }
        );

        if (SimConnect_RequestDataOnSimObject(
              *handle,
              static_cast<SIMCONNECT_DATA_REQUEST_ID>(request_id),
              static_cast<uint32_t>(ID),
              static_cast<DWORD>(objectId),
              SIMCONNECT_PERIOD_ONCE
            )
            != S_OK) {
           pending_simobject_.erase(request_id);
           MakeReject<UnknownError>(reject, "Failed to request data on sim object");
           co_return;
        }
     }
   );
}

}  // namespace priv

}  // namespace smc