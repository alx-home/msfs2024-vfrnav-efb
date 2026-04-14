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
#include "SimConnectInterface.inl"

#include "main.h"

#include <cstdint>
#include <exception>
#include <memory>
#include <SimConnect.h>
#include <synchapi.h>
#include <utils/MessageQueue.h>
#include <utils/Pool.h>
#include <winbase.h>
#include <Windows.h>
#include <winuser.h>

using namespace std::chrono_literals;

namespace smc {

template <class T>
[[nodiscard]] WPromise<T>
SimConnect::Proxy(std::function<WPromise<T>()>&& func) const {
   return MakePromise([this, func = std::move(func)] -> Promise<T> {
      {
         std::exception_ptr exception;
         try {
            co_await Connected();
         } catch (...) {
            exception = std::current_exception();
         }

         if (exception) {
            co_await main_.MainPool::Dispatch();
            std::rethrow_exception(exception);
         }
      }

      co_await Ensure();

      std::exception_ptr exception{};
      try {
         assert(std::this_thread::get_id() == MessageQueue::ThreadId());
         if constexpr (std::is_void_v<T>) {
            co_await func();
            co_await main_.MainPool::Dispatch();
            co_return;
         } else {
            auto result = co_await func();
            co_await main_.MainPool::Dispatch();
            co_return result;
         }
      } catch (QueueStopped const&) {
         throw;
      } catch (...) {
         exception = std::current_exception();
      }

      assert(exception);
      co_await main_.MainPool::Dispatch();
      std::rethrow_exception(exception);
   });
}

template <typename>
inline constexpr bool ALWAYS_FALSE = false;

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

template <DataId ID, class T>
bool
SimConnect::AddToFacilityDefinition(std::shared_ptr<void*> const& handle) {
   if constexpr (requires { T::MEMBERS; }) {
      if (!std::apply(
            [&](auto&&... member) constexpr {
               return (AddToFacilityDefinition<ID>(handle, std::get<0>(member)) && ...);
            },
            T::MEMBERS
          )) {
         return false;
      }
   }

   if constexpr (requires { T::SECTIONS; }) {
      if (!std::apply(
            [&](auto&&... members) constexpr {
               return (
                 [&](auto&& member) constexpr {
                    if (!AddToFacilityDefinition<ID>(
                          handle, "OPEN " + std::string{std::get<0>(member)}
                        )) {
                       return false;
                    }

                    using MEMBER =
                      std::remove_cvref_t<decltype(std::declval<T>().*std::get<1>(member))>;
                    if constexpr (requires { typename MEMBER::value_type; }) {
                       if (!AddToFacilityDefinition<ID, typename MEMBER::value_type>(handle)) {
                          return false;
                       }
                    } else {
                       if (!AddToFacilityDefinition<ID, MEMBER>(handle)) {
                          return false;
                       }
                    }

                    if (!AddToFacilityDefinition<ID>(
                          handle, "CLOSE " + std::string{std::get<0>(member)}
                        )) {
                       return false;
                    }

                    return true;
                 }(members)
                 && ...
               );
            },
            T::SECTIONS
          )) {
         return false;
      }
   }

   return true;
}

template <DataId ID>
bool
SimConnect::AddToFacilityDefinition(
  std::shared_ptr<void*> const& handle,
  std::string_view              fieldName
) {
   return SimConnect_AddToFacilityDefinition(*handle, static_cast<uint32_t>(ID), fieldName.data())
          == S_OK;
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
   auto const request_id = ++request_id_;

   return MakePromise(
            [this, handle, objectType, radius, request_id](
              Resolve<std::vector<DATA_TYPE>> const& resolve, Reject const& reject
            ) mutable -> Promise<std::vector<DATA_TYPE>, true> {
               if (!handle) {
                  handle = handle_.lock();
                  if (!handle) {
                     MakeReject<Disconnected>(reject);
                     co_return;
                  }
               }

               auto const result = std::make_shared<std::vector<DATA_TYPE>>();
               pending_simobject_type_.try_emplace(
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
                 },
                 reject.shared_from_this()
               );

               MakePromise(
                 [this,
                  resolve = resolve.shared_from_this(),
                  reject  = reject.shared_from_this(),
                  result,
                  request_id]() -> Promise<void> {
                    // Watch for 200ms after receiving the last data, as SimConnect may send
                    // multiple packets for a single request, and we want to wait until we received
                    // them all before resolving the promise
                    std::size_t count = 0;
                    while (true) {
                       co_await Wait(1s);
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

                    std::vector<DATA_TYPE> data = std::move(*result);
                    (*resolve)(data);
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
                  MakeReject<UnknownError>(reject, "Failed to request data on sim object");
                  co_return;
               }

               if (!TrackRequestSendId(handle, request_id)) {
                  reject.Apply<UnknownError>("Failed to track data-on-simobject-type request");
                  co_return;
               }
            }
   ).Finally([this, request_id]() {
      assert(std::this_thread::get_id() == MessageQueue::ThreadId());
      ClearTrackedSendId(request_id);
      pending_simobject_type_.erase(request_id);
   });
}

template <DataId ID, class DATA_TYPE>
WPromise<DATA_TYPE>
SimConnect::RequestFacilityData(std::string_view icao, std::string_view region) {
   auto const request_id = ++request_id_;
   return MakePromise(
            [this, request_id, icao = std::string{icao}, region = std::string{region}](
              Resolve<DATA_TYPE> const& resolve, Reject const& reject
            ) -> Promise<DATA_TYPE, true> {
               co_await Ensure();
               auto const handle = handle_.lock();
               if (!handle) {
                  reject.Apply<Disconnected>();
                  co_return;
               }

               pending_facility_.try_emplace(
                 request_id,
                 [result  = DATA_TYPE{},
                  process = std::shared_ptr<facility::Processor>{},
                  reject  = reject.shared_from_this(),
                  resolve = resolve.shared_from_this()](
                   std::variant<
                     std::reference_wrapper<SIMCONNECT_RECV_FACILITY_DATA const>,
                     std::reference_wrapper<SIMCONNECT_RECV_FACILITY_DATA_END const>> const& data
                 ) constexpr mutable {
                    if (!process) {
                       process = result.GetProcessor();
                    }

                    if (std::holds_alternative<
                          std::reference_wrapper<SIMCONNECT_RECV_FACILITY_DATA_END const>>(data)) {
                       if (!process) {
                          MakeReject<UnknownError>(
                            *reject, "Received facility data end without receiving any data"
                          );
                       } else {
                          (*resolve)(std::move(result));
                       }
                    } else if (!process) {
                       MakeReject<UnknownError>(
                         *reject, "Failed to get processor for facility data, cannot process data"
                       );
                    } else {
                       std::string error{};
                       std::tie(process, error) = (*process)(
                         std::get<std::reference_wrapper<SIMCONNECT_RECV_FACILITY_DATA const>>(data)
                           .get()
                       );

                       if (!error.empty()) {
                          MakeReject<UnknownError>(
                            *reject, "Failed to process facility data: " + error
                          );
                       }
                    }
                 },
                 reject.shared_from_this()
               );

               if (SimConnect_RequestFacilityData(
                     *handle,
                     static_cast<SIMCONNECT_DATA_DEFINITION_ID>(ID),
                     static_cast<SIMCONNECT_DATA_REQUEST_ID>(request_id),
                     icao.c_str(),
                     region.c_str()
                   )
                   != S_OK) {
                  reject.Apply<UnknownError>("Failed to request facility data");
                  co_return;
               }

               if (!TrackRequestSendId(handle, request_id)) {
                  reject.Apply<UnknownError>("Failed to track facility data request");
                  co_return;
               }
            }
   ).Finally([this, request_id]() {
      assert(std::this_thread::get_id() == MessageQueue::ThreadId());
      ClearTrackedSendId(request_id);
      pending_facility_.erase(request_id);
   });
}

template <class TYPE>
WPromise<std::vector<SimConnect::FacilityType<TYPE>>>
SimConnect::RequestFacilitiesList(SIMCONNECT_FACILITY_LIST_TYPE type) {
   auto const request_id = ++request_id_;
   return MakePromise(
            [this, type, request_id](
              Resolve<std::vector<FacilityType<TYPE>>> const& resolve, Reject const& reject
            ) -> Promise<std::vector<FacilityType<TYPE>>, true> {
               co_await Ensure();
               auto const handle = handle_.lock();
               if (!handle) {
                  reject.Apply<Disconnected>();
                  co_return;
               }

               auto const remaining =
                 std::make_shared<std::size_t>(std::numeric_limits<std::size_t>::max());

               MakePromise(
                 [this, reject = reject.shared_from_this(), remaining]() -> Promise<void> {
                    co_await Ensure();

                    std::size_t last_remaining = *remaining;
                    while (last_remaining) {
                       co_await Wait(5s);
                       if (*remaining == last_remaining) {
                          MakeReject<Timeout>(
                            *reject, "Timed out while requesting data on sim object"
                          );
                       }

                       last_remaining = *remaining;
                    }
                    co_return;
                 }
               ).Detach();

               pending_facilities_list_.try_emplace(
                 request_id,
                 [result  = std::vector<FacilityType<TYPE>>{},
                  resolve = resolve.shared_from_this(),
                  reject  = reject.shared_from_this(),
                  remaining](SIMCONNECT_RECV_FACILITIES_LIST const& data) constexpr mutable {
                    if (*remaining == std::numeric_limits<std::size_t>::max()) {
                       *remaining = data.dwOutOf;
                    }
                    if (*remaining == 0) {
                       reject->Apply<UnknownError>("Received facilities list with zero total count"
                       );
                       return;
                    }

                    --*remaining;

                    auto const& list = static_cast<TYPE const&>(data);
                    for (std::size_t i = 0; i < data.dwArraySize; ++i) {
                       auto const& livery = list.rgData[i];
                       result.emplace_back(livery);
                    }

                    if (data.dwEntryNumber == (data.dwOutOf - 1)) {
                       assert(*remaining == 0);
                       (*resolve)(std::move(result));
                    }
                 },
                 reject.shared_from_this()
               );
               if (SimConnect_RequestFacilitiesList(*handle, type, request_id) != S_OK) {
                  reject.Apply<UnknownError>("Failed to request facilities list");
                  co_return;
               }

               if (!TrackRequestSendId(handle, request_id)) {
                  reject.Apply<UnknownError>("Failed to track facilities list request");
                  co_return;
               }
            }
   ).Finally([this, request_id]() {
      assert(std::this_thread::get_id() == MessageQueue::ThreadId());
      ClearTrackedSendId(request_id);
      pending_facilities_list_.erase(request_id);
   });
}

template <DataId ID, class DATA_TYPE>
WPromise<SimobjectData<DATA_TYPE>>
SimConnect::RequestDataOnSimObject(uint32_t objectId, std::shared_ptr<void*> handle) {
   auto const request_id = ++request_id_;

   return MakePromise(
            [this, handle, objectId, request_id](
              Resolve<SimobjectData<DATA_TYPE>> const& resolve, Reject const& reject
            ) mutable -> Promise<SimobjectData<DATA_TYPE>, true> {
               if (!handle) {
                  handle = handle_.lock();
                  if (!handle) {
                     throw Disconnected();
                  }
               }

               pending_simobject_.try_emplace(
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
                 },
                 reject.shared_from_this()
               );

               if (SimConnect_RequestDataOnSimObject(
                     *handle,
                     static_cast<SIMCONNECT_DATA_REQUEST_ID>(request_id),
                     static_cast<uint32_t>(ID),
                     static_cast<DWORD>(objectId),
                     SIMCONNECT_PERIOD_ONCE
                   )
                   != S_OK) {
                  MakeReject<UnknownError>(reject, "Failed to request data on sim object");
                  co_return;
               }

               if (!TrackRequestSendId(handle, request_id)) {
                  MakeReject<UnknownError>(reject, "Failed to track data-on-simobject request");
                  co_return;
               }
            }
   ).Finally([this, request_id] constexpr {
      assert(std::this_thread::get_id() == MessageQueue::ThreadId());
      ClearTrackedSendId(request_id);
      pending_simobject_.erase(request_id);
   });
}

}  // namespace smc