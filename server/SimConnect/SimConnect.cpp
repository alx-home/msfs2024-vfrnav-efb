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

#include "main.h"
#include "TrafficInfo.h"

#include <utils/MessageQueue.h>
#include <Windows.h>
#include <SimConnect.h>
#include <synchapi.h>
#include <winbase.h>
#include <winuser.h>
#include <algorithm>
#include <chrono>
#include <condition_variable>
#include <cstdint>
#include <functional>
#include <ios>
#include <iostream>
#include <memory>
#include <mutex>
#include <stdexcept>
#include <string_view>
#include <thread>
#include <tuple>
#include <type_traits>
#include <utility>

SimConnect::SimConnect()
   : MessageQueue{"SimConnect"}
   , thread_{[this](std::stop_token stoken) {
      if (!event_) {
         throw std::runtime_error("Couldn't create event");
      }

      while (Main::Running() && !stoken.stop_requested()) {
         HANDLE handle;
         if (SUCCEEDED(SimConnect_Open(&handle, "MSFS VFRNav'", nullptr, 0, event_, 0))) {
            std::shared_ptr<HANDLE> handle_ptr{
              new HANDLE(handle),
              [](HANDLE* ptr) constexpr {
                 SimConnect_Close(*ptr);
                 delete ptr;
              },
            };
            handle_ = handle_ptr;
            Run(stoken);
         }

         // Wait 5 seconds before retrying
         std::mutex       mutex{};
         std::unique_lock lock{mutex};
         std::condition_variable_any{}.wait_for(lock, stoken, std::chrono::seconds{5}, []() {
            return false;
         });
      }
   }} {}

SimConnect::~SimConnect() {
   MessageQueue::Dispatch([this]() {
      thread_.request_stop();

      if (event_) {
         SetEvent(event_);
      }
   });
}

void
SimConnect::SetServerPort(uint32_t port) {
   MessageQueue::Dispatch([this, port]() {
      server_port_ = port;
      next_check_  = std::chrono::steady_clock::now();
      SetEvent(event_);
   });
}

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

template <typename>
inline constexpr bool ALWAYS_FALSE = false;

template <class T>
T
SimConnect::StaticCast(DWORD const& data) {
   T    result{};
   auto it = reinterpret_cast<char const*>(&data);

   std::apply(
     [&](auto const&... member) constexpr {
        (
          [&]<class M>(M const& member) constexpr {
             if constexpr (std::tuple_element_t<1, M>::VALUE_S == SIMCONNECT_DATATYPE_STRING256) {
                result.*std::get<3>(member) = std::string_view{it};
                it += 256;
             } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                  == SIMCONNECT_DATATYPE_STRING32) {
                result.*std::get<3>(member) = std::string_view{it};
                it += 32;
             } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                  == SIMCONNECT_DATATYPE_STRING8) {
                result.*std::get<3>(member) = std::string_view{it};
                it += 8;
             } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                  == SIMCONNECT_DATATYPE_FLOAT64) {
                static_assert(std::is_same_v<
                              std::remove_reference_t<decltype(result.*std::get<3>(member))>,
                              double>);
                std::move(
                  it, it + sizeof(double), reinterpret_cast<char*>(&(result.*std::get<3>(member)))
                );
                it += sizeof(double);
             } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                  == SIMCONNECT_DATATYPE_FLOAT32) {
                static_assert(std::is_same_v<
                              std::remove_reference_t<decltype(result.*std::get<3>(member))>,
                              float>);
                std::move(
                  it, it + sizeof(float), reinterpret_cast<char*>(&(result.*std::get<3>(member)))
                );
                it += sizeof(float);
             } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                  == SIMCONNECT_DATATYPE_INT32) {
                static_assert(std::is_same_v<
                              std::remove_reference_t<decltype(result.*std::get<3>(member))>,
                              int32_t>);
                std::move(
                  it, it + sizeof(int32_t), reinterpret_cast<char*>(&(result.*std::get<3>(member)))
                );
                it += sizeof(int32_t);
             } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                  == SIMCONNECT_DATATYPE_INT64) {
                static_assert(std::is_same_v<
                              std::remove_reference_t<decltype(result.*std::get<3>(member))>,
                              int64_t>);
                std::move(
                  it, it + sizeof(int64_t), reinterpret_cast<char*>(&(result.*std::get<3>(member)))
                );
                it += sizeof(int64_t);
             } else {
                static_assert(ALWAYS_FALSE<M>, "Unsupported type");
             }
          }(member),
          ...
        );
     },
     T::MEMBERS
   );

   return result;
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
void
SimConnect::RequestDataOnSimObjectType(
  SIMCONNECT_SIMOBJECT_TYPE objectType,
  uint32_t                  radius,
  std::shared_ptr<void*>    handle
) {
   if (!handle) {
      handle = handle_.lock();
      if (!handle) {
         return;
      }
   }

   SimConnect_RequestDataOnSimObjectType(
     *handle,
     static_cast<SIMCONNECT_DATA_REQUEST_ID>(ID),
     static_cast<uint32_t>(ID),
     static_cast<DWORD>(radius),
     objectType
   );
}

void
SimConnect::Run(std::stop_token const& stoken) {
   auto handle = handle_.lock();
   using enum DataId;

   AddToDataDefinition<SET_PORT>(
     handle, "L:VFRNAV_SET_PORT", SIMCONNECT_DATATYPE_FLOAT64, "Number"
   );

   // Define traffic info data structure
   AddToDataDefinition<TRAFFIC_INFO, TrafficInfo>(handle);
   AddToDataDefinition<HELI_TRAFFIC_INFO, TrafficInfo>(handle);

   // Request data for all aircraft in range (radius 0 = unlimited)
   RequestDataOnSimObjectType<TRAFFIC_INFO>(SIMCONNECT_SIMOBJECT_TYPE_AIRCRAFT, 0, handle);
   RequestDataOnSimObjectType<HELI_TRAFFIC_INFO>(SIMCONNECT_SIMOBJECT_TYPE_HELICOPTER, 0, handle);

   sent_port_  = -1;
   next_check_ = std::chrono::steady_clock::now();
   while ((::WaitForSingleObject(
             event_,
             std::max(
               0ll,
               next_check_ == time_point::max()
                 ? INFINITE
                 : 100
                     + std::chrono::duration_cast<std::chrono::milliseconds>(
                         next_check_ - std::chrono::steady_clock::now()
                     )
                         .count()
             )
           )
           == WAIT_OBJECT_0)
          && !ShouldStop(stoken)) {
      MessageQueue::Dispatch([this, handle]() {
         if ((std::chrono::steady_clock::now() >= next_check_) && (sent_port_ != server_port_)) {
            next_check_      = time_point::max();
            sent_port_       = server_port_;
            auto server_port = static_cast<double>(server_port_);

            std::cout << "SimConnect: Setting server port to " << server_port_ << " sent port "
                      << sent_port_ << " (connected: " << std::boolalpha
                      << static_cast<bool>(handle) << ")" << std::endl;
            if (E_FAIL
                == SimConnect_SetDataOnSimObject(
                  *handle,
                  static_cast<uint32_t>(DataId::SET_PORT),
                  SIMCONNECT_OBJECT_ID_USER,
                  0,
                  0,
                  sizeof(server_port),
                  &server_port
                )) {
               std::cerr << "SimConnect: Failed to set server port to " << server_port_
                         << std::endl;

               // Retry sending the port on failure after 5 seconds
               sent_port_  = -1;
               next_check_ = std::chrono::steady_clock::now() + std::chrono::seconds{1};
               SetEvent(event_);
            }
         }
      });

      MessageQueue::Dispatch([this, handle]() {
         SimConnect_CallDispatch(
           *handle,
           [](SIMCONNECT_RECV* data, DWORD, void* self) constexpr {
              reinterpret_cast<SimConnect*>(self)->Dispatch(*data);
           },
           this
         );
      });
   }
}

bool
SimConnect::ShouldStop(std::stop_token const& stoken) const noexcept {
   return !Main::Running() || stoken.stop_requested() || !handle_.lock();
}

void
SimConnect::Dispatch(SIMCONNECT_RECV const& data) {
   auto const handle = handle_.lock();
   if (!handle) {
      return;
   }

   switch (data.dwID) {
      case SIMCONNECT_RECV_ID_OPEN: {
         std::cout << "SimConnect: Connection opened" << std::endl;
      } break;

      case SIMCONNECT_RECV_ID_EXCEPTION: {
         auto const& exception = static_cast<SIMCONNECT_RECV_EXCEPTION const&>(data);
         std::cerr << "SimConnect: Exception (" << exception.dwException << ")" << std::endl;

         // Retry sending the port on exception after 5 seconds
         sent_port_  = -1;
         next_check_ = std::chrono::steady_clock::now() + std::chrono::seconds{1};
         SetEvent(event_);
      } break;

      case SIMCONNECT_RECV_ID_ASSIGNED_OBJECT_ID: {
         // This is the only traffic-related message guaranteed in all SimConnect SDKs
         auto const& assigned = static_cast<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID const&>(data);
         std::cout << "SimConnect: Assigned object ID: " << assigned.dwObjectID << std::endl;
      } break;

      case SIMCONNECT_RECV_ID_SIMOBJECT_DATA_BYTYPE: {
         auto const& simobj = static_cast<SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE const&>(data);
         if (simobj.dwRequestID == static_cast<DWORD>(DataId::TRAFFIC_INFO)
             || simobj.dwRequestID == static_cast<DWORD>(DataId::HELI_TRAFFIC_INFO)) {
            auto traffic = StaticCast<TrafficInfo>(simobj.dwData);

            std::cout << "\nSimConnect: Received traffic info type " << traffic.atc_type_
                      << ", model " << traffic.atc_model_ << ", id " << traffic.atc_id_
                      << ", category " << traffic.category_
                      << (traffic.is_user_sim_ ? " (user sim)" : "") << " at altitude "
                      << traffic.plane_altitude_ << " ft, lat " << traffic.plane_latitude_
                      << ", lon " << traffic.plane_longitude_ << ", ground velocity "
                      << traffic.ground_velocity_ << " knots, heading "
                      << traffic.plane_heading_degrees_true_ << " degrees, vertical speed "
                      << traffic.vertical_speed_ << " ft/s, transponder code "
                      << traffic.transponder_code_ << ", number of engines "
                      << traffic.number_of_engines_ << ", engine type " << traffic.engine_type_
                      << ", from airport " << traffic.atc_from_airport_ << ", to airport "
                      << traffic.atc_to_airport_ << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_QUIT: {
         handle_ = std::shared_ptr<HANDLE>{nullptr};
         SetEvent(event_);
      } break;
   }
}
