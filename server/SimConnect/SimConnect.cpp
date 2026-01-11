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

#include <utils/MessageQueue.h>
#include <Windows.h>
#include <SimConnect.h>
#include <synchapi.h>
#include <winuser.h>
#include <chrono>
#include <condition_variable>
#include <functional>
#include <ios>
#include <memory>
#include <mutex>
#include <stdexcept>
#include <thread>

enum class DataId : uint32_t {
   SET_PORT,
   EVENT_FRAME,
};

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
   server_port_ = port;
}

void
SimConnect::Run(std::stop_token const& stoken) {
   auto handle = handle_.lock();

   while ((::WaitForSingleObject(event_, INFINITE) == WAIT_OBJECT_0) && !ShouldStop(stoken)) {
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
   switch (data.dwID) {
      case SIMCONNECT_RECV_ID_OPEN: {
         auto const handle = handle_.lock();

         if (handle) {
            SimConnect_AddToDataDefinition(
              *handle,
              static_cast<uint32_t>(DataId::SET_PORT),
              "L:VFRNAV_SET_PORT",
              "Number",
              SIMCONNECT_DATATYPE_FLOAT64
            );
            sent_port_ = -1;
            SimConnect_SubscribeToSystemEvent(
              *handle, static_cast<uint32_t>(DataId::EVENT_FRAME), "Frame"
            );
         }
      } break;

      case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
      case SIMCONNECT_RECV_ID_EVENT_FRAME: {
         using namespace std::chrono_literals;

         auto const now = std::chrono::steady_clock::now();
         if ((sent_port_ != server_port_) && ((now - last_port_send_) > 5s)) {
            last_port_send_   = now;
            auto const handle = handle_.lock();

            sent_port_ = server_port_;
            std::cout << "SimConnect: Setting server port to " << sent_port_
                      << " (connected: " << std::boolalpha << static_cast<bool>(handle) << ")"
                      << std::endl;
            if (handle) {
               SimConnect_SetDataOnSimObject(
                 *handle,
                 static_cast<uint32_t>(DataId::SET_PORT),
                 SIMCONNECT_OBJECT_ID_USER,
                 0,
                 0,
                 sizeof(sent_port_),
                 &sent_port_
               );
            }
         }
      } break;

      case SIMCONNECT_RECV_ID_EXCEPTION: {
         // Retry sending the port on exception
         sent_port_ = -1;

         auto const& exception = static_cast<SIMCONNECT_RECV_EXCEPTION const&>(data);
         std::cerr << "SimConnect: Exception (" << exception.dwException << ")" << std::endl;
      } break;

      case SIMCONNECT_RECV_ID_QUIT: {
         MessageQueue::Dispatch([this]() {
            handle_ = std::shared_ptr<HANDLE>{nullptr};
            SetEvent(event_);
         });
         break;
      }
   }
}
