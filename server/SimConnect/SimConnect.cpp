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

#include "SimConnect.inl"

#include "main.h"

#include "Data/GearDown.h"
#include "Data/GroundInfo.h"
#include "Data/ServerPort.h"
#include "Data/TrafficInfo.h"

#include <chrono>
#include <condition_variable>
#include <cstdint>
#include <functional>
#include <iostream>
#include <memory>
#include <mutex>
#include <SimConnect.h>
#include <stdexcept>
#include <string>
#include <string_view>
#include <synchapi.h>
#include <thread>
#include <utils/MessageQueue.h>
#include <utils/Scoped.h>
#include <winbase.h>
#include <Windows.h>
#include <winspool.h>
#include <winuser.h>

using namespace std::chrono_literals;

namespace smc::priv {

SimConnect::SimConnect(Main& main)
   : MessageQueue{"SimConnect"}
   , main_(main)
   , thread_{[this](std::stop_token stoken) {
      if (!event_) {
         throw std::runtime_error("Couldn't create event");
      }

      while (!stoken.stop_requested()) {
         HANDLE handle;
         if (SUCCEEDED(SimConnect_Open(&handle, "MSFS VFRNav'", nullptr, 0, event_, 0))) {
            std::shared_ptr<HANDLE> handle_ptr{
              new HANDLE(handle),
              [this](HANDLE* ptr) constexpr {
                 std::cout << "SimConnect: Disconnected from simulator" << std::endl;
                 SimConnect_Close(*ptr);
                 delete ptr;

                 sent_port_ = -1;
              },
            };
            handle_ = handle_ptr;
            std::cout << "SimConnect: Connected to simulator" << std::endl;
            Run(stoken);
         }

         // Wait 1 second before retrying
         std::mutex       mutex{};
         std::unique_lock lock{mutex};
         std::condition_variable_any{}.wait_for(lock, stoken, 1s, []() { return false; });
      }
   }} {}

SimConnect::~SimConnect() {
   if (!MessageQueue::Dispatch([this]() constexpr {
          assert(thread_.joinable());
          thread_.request_stop();

          if (event_) {
             SetEvent(event_);
          }
       })) {
      assert(false && "Failed to dispatch stop message to SimConnect thread");
   }
}

WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>
SimConnect::AICreateSimulatedObject(
  std::string_view             title,
  SIMCONNECT_DATA_INITPOSITION pos,
  std::shared_ptr<void*>       handle
) {
   return MakePromise(
     [this, handle, title = std::string{title}, pos](
       Resolve<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID> const& resolve, Reject const& reject
     ) mutable -> Promise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID, true> {
        if (!handle) {
           handle = handle_.lock();
           if (!handle) {
              MakeReject<Disconnected>(reject);
              co_return;
           }
        }

        if (!MessageQueue::Dispatch(
              [reject = reject.shared_from_this()]() constexpr {
                 MakeReject<Disconnected>(*reject);
              },
              5s
            )) {
           MakeReject<UnknownError>(reject, "App is stopping");
           co_return;
        }

        auto const request_id = ++request_id_;
        pending_assigned_.emplace(
          request_id,
          [resolve = resolve.shared_from_this()](SIMCONNECT_RECV_ASSIGNED_OBJECT_ID const& assigned
          ) { (*resolve)(assigned); }
        );
        if (SimConnect_AICreateSimulatedObject(*handle, title.data(), pos, request_id) != S_OK) {
           pending_assigned_.erase(request_id);
           MakeReject<UnknownError>(reject, "Failed to create simulated object");
           co_return;
        }
     }
   );
}

WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>
SimConnect::AICreateSimulatedObject(std::string_view title, SIMCONNECT_DATA_INITPOSITION pos) {
   auto handle = handle_.lock();

   if (!handle) {
      return Promise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>::Reject<Disconnected>();
   }

   return AICreateSimulatedObject(title, pos, handle);
}

WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>
SimConnect::AICreateNonATCAircraft(
  std::string_view             title,
  std::string_view             tail_number,
  SIMCONNECT_DATA_INITPOSITION pos,
  std::shared_ptr<void*>       handle
) {
   return MakePromise(
     [this, handle, title = std::string{title}, tail_number = std::string{tail_number}, pos](
       Resolve<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID> const& resolve, Reject const& reject
     ) mutable -> Promise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID, true> {
        if (!handle) {
           handle = handle_.lock();
           if (!handle) {
              MakeReject<Disconnected>(reject);
              co_return;
           }
        }

        if (!MessageQueue::Dispatch(
              [reject = reject.shared_from_this()]() constexpr {
                 MakeReject<Disconnected>(*reject);
              },
              5s
            )) {
           MakeReject<UnknownError>(reject, "App is stopping");
           co_return;
        }

        auto const request_id = ++request_id_;
        if (SimConnect_AICreateNonATCAircraft(
              *handle, title.data(), tail_number.data(), pos, request_id
            )
            == S_OK) {
           pending_assigned_.emplace(
             request_id,
             [&resolve](SIMCONNECT_RECV_ASSIGNED_OBJECT_ID const& assigned) { resolve(assigned); }
           );
        } else {
           MakeReject<UnknownError>(reject, "Failed to create non-ATC aircraft");
           co_return;
        }
     }
   );
}

WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>
SimConnect::AICreateNonATCAircraft(
  std::string_view             title,
  std::string_view             tail_number,
  SIMCONNECT_DATA_INITPOSITION pos
) {
   auto handle = handle_.lock();

   if (!handle) {
      return Promise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>::Reject<Disconnected>();
   }

   return AICreateNonATCAircraft(title, tail_number, pos, handle);
}

WPromise<void>
SimConnect::SetFlapsHandleIndex(ObjectId id, uint32_t index) {
   return MakePromise(
     [this, id, index](Resolve<void> const& resolve, Reject const& reject) -> Promise<void, true> {
        auto const handle = handle_.lock();
        if (!handle) {
           MakeReject<Disconnected>(reject);
           co_return;
        }

        if (SimConnect_TransmitClientEvent(
              *handle,
              id.dwObjectID,
              static_cast<SIMCONNECT_CLIENT_EVENT_ID>(ClientEventId::FLAPS_SET),
              index,
              SIMCONNECT_GROUP_PRIORITY_HIGHEST,
              SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY
            )
            != S_OK) {
           MakeReject<UnknownError>(reject, "Failed to set flaps handle index");
           co_return;
        }

        resolve();
        co_return;
     }
   );
}

bool
SimConnect::SetDataOnSimObjectImpl(
  DataId               id,
  SIMCONNECT_OBJECT_ID objectId,
  DWORD                flags,
  DWORD                unitSize,
  size_t               count,
  void*                data
) {
   auto handle = handle_.lock();
   if (!handle) {
      return false;
   }

   auto const result = SimConnect_SetDataOnSimObject(
     *handle,
     static_cast<uint32_t>(id),
     objectId,
     flags,
     static_cast<DWORD>(count),
     static_cast<DWORD>(unitSize),
     data
   );

   return result == S_OK;
}

void
SimConnect::Run(std::stop_token const& stoken) {
   auto handle = handle_.lock();
   using enum DataId;

   connected_ = false;
   pending_simobject_.clear();
   pending_simobject_type_.clear();

   if (!AddToDataDefinition<SET_PORT, ServerPort>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for server port" << std::endl;
      Sleep(5000);
      return;
   }

   // Define traffic info data structure
   if (!AddToDataDefinition<TRAFFIC_INFO, TrafficInfo>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for traffic info" << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<HELI_TRAFFIC_INFO, TrafficInfo>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for helicopter traffic info"
                << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<GROUND_INFO, GroundInfo>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for ground info" << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<SET_WAYPOINTS>(
         handle, "AI WAYPOINT LIST", SIMCONNECT_DATATYPE_WAYPOINT, "number"
       )) {
      std::cerr << "SimConnect: Failed to add data definition for waypoints" << std::endl;
      Sleep(5000);
      return;
   }

   if (!AddToDataDefinition<SET_GEAR, GearDown>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for gear" << std::endl;
      Sleep(5000);
      return;
   }

   if (SimConnect_MapClientEventToSimEvent(
         *handle, static_cast<SIMCONNECT_CLIENT_EVENT_ID>(ClientEventId::FLAPS_SET), "FLAPS_SET"
       )
       != S_OK) {
      std::cerr << "SimConnect: Failed to map FLAPS_SET event" << std::endl;
      Sleep(5000);
      return;
   }

   if (SimConnect_MapClientEventToSimEvent(
         *handle,
         static_cast<SIMCONNECT_CLIENT_EVENT_ID>(ClientEventId::PARKING_BRAKES_SET),
         "PARKING_BRAKE_SET"
       )
       != S_OK) {
      std::cerr << "SimConnect: Failed to map PARKING_BRAKE_SET event" << std::endl;
      Sleep(5000);
      return;
   }

   (void)MessageQueue::Dispatch([this]() constexpr { SetServerPort(server_port_).Detach(); });

   uint32_t result;
   while ((result = ::WaitForSingleObject(event_, INFINITE)),
          (result == WAIT_OBJECT_0) && !ShouldStop(stoken)) {
      if (!MessageQueue::Dispatch([this, handle]() constexpr {
             SimConnect_CallDispatch(
               *handle,
               [](SIMCONNECT_RECV* data, DWORD, void* self) constexpr {
                  reinterpret_cast<SimConnect*>(self)->Dispatch(*data);
               },
               this
             );
          })) {
         break;
      }
   }
   std::cout << "SimConnect: Stopping SimConnect thread, result " << result << std::endl;
}

void
SimConnect::SetTrafficTitles() {
   traffic_titles_ =
     std::make_shared<WPromise<api::Liveries>>(MakePromise([this] -> Promise<api::Liveries> {
        while (true) {
           auto const handle = handle_.lock();
           if (!handle) {
              co_await dispatch_(5s);
              continue;
           }

           try {
              co_return co_await EnumerateSimObjectsAndLiveries(SIMCONNECT_SIMOBJECT_TYPE_AIRCRAFT);
           } catch (std::exception const& e) {
              //   std::cerr << "SimConnect: Failed to enumerate sim objects and liveries: " <<
              //   e.what()
              //             << std::endl;
              // @todo https://github.com/llvm/llvm-project/issues/182584
           }
           co_await dispatch_(5s);
        }
     }));
}

WPromise<api::Liveries>
SimConnect::GetTrafficTitles() const {
   return MakePromise([this]() -> Promise<api::Liveries> {
      co_await ensure_();

      assert(traffic_titles_);
      co_return (co_await *traffic_titles_);
   });
}

WPromise<api::Liveries>
SimConnect::EnumerateSimObjectsAndLiveries(SIMCONNECT_SIMOBJECT_TYPE objectType) {
   auto const request_id = ++request_id_;
   return MakePromise(
            [this, objectType, request_id](
              Resolve<api::Liveries> const& resolve, Reject const& reject
            ) -> Promise<api::Liveries, true> {
               co_await ensure_();
               auto const handle = handle_.lock();
               if (!handle) {
                  reject.Apply<Disconnected>();
                  co_return;
               }

               auto const remaining =
                 std::make_shared<std::size_t>(std::numeric_limits<std::size_t>::max());

               MakePromise(
                 [this, reject = reject.shared_from_this(), remaining]() -> Promise<void> {
                    co_await ensure_();

                    std::size_t last_remaining = *remaining;
                    while (last_remaining) {
                       co_await dispatch_(5s);
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

               pending_enumerated_simobjects_.emplace(
                 request_id,
                 [result  = api::Liveries{},
                  resolve = resolve.shared_from_this(),
                  reject  = reject.shared_from_this(),
                  remaining](SIMCONNECT_RECV_ENUMERATE_SIMOBJECT_AND_LIVERY_LIST const& data
                 ) constexpr mutable {
                    if (*remaining == std::numeric_limits<std::size_t>::max()) {
                       *remaining = data.dwOutOf;
                    }
                    if (*remaining == 0) {
                       reject->Apply<UnknownError>(
                         "Received sim object enumeration with zero total count"
                       );
                       return;
                    }

                    --*remaining;

                    for (std::size_t i = 0; i < data.dwArraySize; ++i) {
                       auto const& livery = data.rgData[i];
                       result.emplace_back(
                         std::string{livery.AircraftTitle}, std::string{livery.LiveryName}
                       );
                    }

                    if (data.dwEntryNumber == (data.dwOutOf - 1)) {
                       assert(*remaining == 0);
                       (*resolve)(std::move(result));
                    }
                 }
               );
               if (SimConnect_EnumerateSimObjectsAndLiveries(*handle, request_id, objectType)
                   != S_OK) {
                  reject.Apply<UnknownError>("Failed to enumerate sim objects and liveries");
                  co_return;
               }
            }
   ).Finally([this, request_id]() {
      (void
      )Ensure([this, request_id] constexpr { pending_enumerated_simobjects_.erase(request_id); });
   });
}

bool
SimConnect::ShouldStop(std::stop_token const& stoken) const noexcept {
   return stoken.stop_requested() || !handle_.lock();
}

void
SimConnect::Dispatch(SIMCONNECT_RECV const& data) {
   using enum DataId;

   auto const handle = handle_.lock();
   if (!handle) {
      return;
   }

   switch (data.dwID) {
      case SIMCONNECT_RECV_ID_OPEN: {
         std::cout << "SimConnect: Connection opened" << std::endl;
         connected_ = true;
      } break;

      case SIMCONNECT_RECV_ID_EXCEPTION: {
         auto const& exception = static_cast<SIMCONNECT_RECV_EXCEPTION const&>(data);
         std::cerr << "SimConnect: Exception (" << exception.dwException
                   << ") send_id=" << exception.dwSendID << " index=" << exception.dwIndex
                   << std::endl;
      } break;

      case SIMCONNECT_RECV_ID_ASSIGNED_OBJECT_ID: {
         // This is the only traffic-related message guaranteed in all SimConnect SDKs
         auto const& assigned = static_cast<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID const&>(data);
         auto        request  = pending_assigned_.find(assigned.dwRequestID);

         if (request != pending_assigned_.end()) {
            ScopeExit _{[this, request]() constexpr { pending_assigned_.erase(request); }};
            request->second(assigned);
         } else {
            std::cerr << "SimConnect: Received ASSIGNED_OBJECT_ID for unknown request ID "
                      << assigned.dwRequestID << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_ENUMERATE_SIMOBJECT_AND_LIVERY_LIST: {
         auto const& enumerated =
           static_cast<SIMCONNECT_RECV_ENUMERATE_SIMOBJECT_AND_LIVERY_LIST const&>(data);
         auto request = pending_enumerated_simobjects_.find(enumerated.dwRequestID);

         if (request != pending_enumerated_simobjects_.end()) {
            request->second(enumerated);
         } else {
            std::cerr << "SimConnect: Received ENUMERATE_SIMOBJECT_AND_LIVERY_LIST for unknown "
                         "request ID "
                      << enumerated.dwRequestID << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_SIMOBJECT_DATA: {
         auto const& simobj  = static_cast<SIMCONNECT_RECV_SIMOBJECT_DATA const&>(data);
         auto        request = pending_simobject_.find(simobj.dwRequestID);
         if (request != pending_simobject_.end()) {
            ScopeExit _{[this, request]() constexpr { pending_simobject_.erase(request); }};
            request->second(simobj);
         } else {
            std::cerr << "SimConnect: Received SIMOBJECT_DATA for unknown request ID "
                      << simobj.dwRequestID << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_SIMOBJECT_DATA_BYTYPE: {
         auto const& simobj  = static_cast<SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE const&>(data);
         auto        request = pending_simobject_type_.find(simobj.dwRequestID);
         if (request != pending_simobject_type_.end()) {
            request->second(simobj);
         } else {
            std::cerr << "SimConnect: Received SIMOBJECT_DATA_BYTYPE for unknown request ID "
                      << simobj.dwRequestID << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_QUIT: {
         std::cout << "SimConnect: Simulator quit" << std::endl;
         handle_.reset();
         SetEvent(event_);
      } break;
   }
}

}  // namespace smc::priv