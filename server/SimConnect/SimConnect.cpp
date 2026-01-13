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
#include <winbase.h>
#include <winuser.h>
#include <chrono>
#include <condition_variable>
#include <functional>
#include <ios>
#include <iostream>
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
   MessageQueue::Dispatch([this, port]() {
      server_port_ = port;
      next_check_  = std::chrono::steady_clock::now();
      SetEvent(event_);
   });
}

void
SimConnect::Run(std::stop_token const& stoken) {
   auto handle = handle_.lock();

   SimConnect_AddToDataDefinition(
     *handle,
     static_cast<uint32_t>(DataId::SET_PORT),
     "L:VFRNAV_SET_PORT",
     "Number",
     SIMCONNECT_DATATYPE_FLOAT64
   );

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

      case SIMCONNECT_RECV_ID_QUIT: {
         handle_ = std::shared_ptr<HANDLE>{nullptr};
         SetEvent(event_);
         break;
      }
   }
}
