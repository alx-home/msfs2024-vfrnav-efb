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
#include <WinBase.h>
#include <WinUser.h>
#include <cstdint>
#include <memory>
#include <string_view>
#include <tuple>

template <DataId ID>
void
SimConnect::AddToDataDefinition(
  std::string_view                datumName,
  SIMCONNECT_DATATYPE             datumType,
  std::optional<std::string_view> unitsName
) {
   auto handle = handle_.lock();
   if (!handle) {
      return;
   }

   AddToDataDefinition<ID>(handle, datumName, datumType, unitsName);
}

template <DataId ID>
void
SimConnect::AddToDataDefinition(
  std::shared_ptr<void*> const&   handle,
  std::string_view                datumName,
  SIMCONNECT_DATATYPE             datumType,
  std::optional<std::string_view> unitsName
) {
   SimConnect_AddToDataDefinition(
     *handle,
     static_cast<uint32_t>(ID),
     datumName.data(),
     unitsName ? unitsName->data() : nullptr,
     datumType
   );
}

template <DataId ID, class T>
void
SimConnect::AddToDataDefinition(std::shared_ptr<void*> const& handle) {
   std::apply(
     [&](auto&&... member) constexpr {
        (AddToDataDefinition<ID>(
           handle, std::get<0>(member), std::get<1>(member).VALUE_S, std::get<2>(member)
         ),
         ...);
     },
     T::MEMBERS
   );
}

template <DataId ID>
void
SimConnect::AddToFacilityDefinition(std::string_view fieldName) {
   auto handle = handle_.lock();
   if (!handle) {
      return;
   }

   AddToFacilityDefinition<ID>(handle, fieldName);
}

template <DataId ID>
void
SimConnect::AddToFacilityDefinition(
  std::shared_ptr<void*> const& handle,
  std::string_view              fieldName
) {
   SimConnect_AddToDataDefinition(*handle, static_cast<uint32_t>(ID), fieldName.data());
}

template <DataId ID, class T>
void
SimConnect::AddToFacilityDefinition(std::shared_ptr<void*> const& handle) {
   std::apply(
     [&](auto&&... member) constexpr {
        (AddToFacilityDefinition<ID>(handle, std::get<0>(member)), ...);
     },
     T::MEMBERS
   );
}

template <DataId ID, class T>
void
SimConnect::AddToDataDefinition() {
   auto handle = handle_.lock();
   if (!handle) {
      return;
   }
   AddToDataDefinition<ID, T>(handle);
}

template <DataId ID>
bool
SimConnect::RequestDataOnSimObjectType(
  SIMCONNECT_SIMOBJECT_TYPE objectType,
  uint32_t                  radius,
  std::shared_ptr<void*>    handle
) {
   if (!handle) {
      handle = handle_.lock();
      if (!handle) {
         return false;
      }
   }

   auto const request_id = ++request_id_;
   return SimConnect_RequestDataOnSimObjectType(
            *handle,
            static_cast<SIMCONNECT_DATA_REQUEST_ID>(request_id),
            static_cast<uint32_t>(ID),
            static_cast<DWORD>(radius),
            objectType
          )
          == S_OK;
}

template <DataId ID, class DATA_TYPE>
WPromise<SimobjectData<DATA_TYPE>>
SimConnect::RequestDataOnSimObject(
  SIMCONNECT_PERIOD      period,
  uint32_t               objectId,
  std::shared_ptr<void*> handle
) {
   return MakePromise(
     [this, handle, period, objectId](
       Resolve<SimobjectData<DATA_TYPE>> const& resolve, Reject const& reject
     ) mutable -> Promise<SimobjectData<DATA_TYPE>, true> {
        if (!handle) {
           handle = handle_.lock();
           if (!handle) {
              MakeReject<std::runtime_error>(reject, "Not connected to simulator");
              co_return;
           }
        }

        MessageQueue::Dispatch(
          [reject = reject.shared_from_this()]() constexpr {
             MakeReject<std::runtime_error>(
               *reject, "Timed out while requesting data on sim object"
             );
          },
          std::chrono::seconds{5}
        );

        auto const request_id = ++request_id_;
        if (SimConnect_RequestDataOnSimObject(
              *handle,
              static_cast<SIMCONNECT_DATA_REQUEST_ID>(request_id),
              static_cast<uint32_t>(ID),
              static_cast<DWORD>(objectId),
              period
            )
            == S_OK) {
           pending_simobject_.emplace(
             request_id,
             [&resolve, &reject](SIMCONNECT_RECV_SIMOBJECT_DATA const& data) {
                if (data.dwDefineID != static_cast<DWORD>(ID)) {
                   MakeReject<std::runtime_error>(
                     reject, "Received data for unknown request ID or data type mismatch"
                   );
                   return;
                }

                if (auto const header_size =
                      sizeof(SIMCONNECT_RECV_SIMOBJECT_DATA) - sizeof(data.dwSize);
                    sizeof(DATA_TYPE) != (data.dwSize - header_size)) {

                   MakeReject<std::runtime_error>(
                     reject,
                     "Received data size does not match expected size for requested data type"
                   );
                   return;
                }

                SimobjectData<DATA_TYPE> simobject_data{
                  .dw_version_      = data.dwVersion,
                  .dw_id_           = data.dwID,
                  .dw_request_id_   = data.dwRequestID,
                  .dw_object_id_    = data.dwObjectID,
                  .dw_define_id_    = data.dwDefineID,
                  .dw_flags_        = data.dwFlags,
                  .dw_entry_number_ = data.dwentrynumber,
                  .dw_out_of_       = data.dwoutof,
                  .dw_define_count_ = data.dwDefineCount,
                  .dw_data_         = StaticCast<DATA_TYPE>(data.dwData),
                };

                resolve(simobject_data);
             }
           );
        } else {
           MakeReject<std::runtime_error>(reject, "Failed to request data on sim object");
           co_return;
        }
     }
   );
}
