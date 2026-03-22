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

#include "ServerPort.h"

#include <chrono>
#include <condition_variable>
#include <cstdint>
#include <functional>
#include <iostream>
#include <memory>
#include <mutex>
#include <SimConnect.h>
#include <stdexcept>
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

namespace priv {

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
              MakeReject<sim_connect::Disconnected>(reject);
              co_return;
           }
        }

        if (!MessageQueue::Dispatch(
              [reject = reject.shared_from_this()]() constexpr {
                 MakeReject<sim_connect::Disconnected>(*reject);
              },
              5s
            )) {
           MakeReject<sim_connect::UnknownError>(reject, "App is stopping");
           co_return;
        }

        auto const request_id = ++request_id_;
        if (SimConnect_AICreateSimulatedObject(*handle, title.data(), pos, request_id) == S_OK) {
           pending_assigned_.emplace(
             request_id,
             [&resolve](SIMCONNECT_RECV_ASSIGNED_OBJECT_ID const& assigned) { resolve(assigned); }
           );
        } else {
           MakeReject<sim_connect::UnknownError>(reject, "Failed to create simulated object");
           co_return;
        }
     }
   );
}

void
SimConnect::Run(std::stop_token const& stoken) {
   auto handle = handle_.lock();
   using enum DataId;

   connected_ = false;

   if (!AddToDataDefinition<SET_PORT, ServerPort>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for server port" << std::endl;
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
         std::cerr << "SimConnect: Exception (" << exception.dwException << ")" << std::endl;
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

      case SIMCONNECT_RECV_ID_QUIT: {
         std::cout << "SimConnect: Simulator quit" << std::endl;
         handle_.reset();
         SetEvent(event_);
      } break;
   }
}

}  // namespace priv