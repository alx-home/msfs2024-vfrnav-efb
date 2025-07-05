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
#include <functional>
#include <memory>
#include <mutex>
#include <stdexcept>
#include <thread>

enum class DataId : uint32_t {
   SET_PORT,
};

SimConnect::SimConnect()
   : MessageQueue{"SimConnect"}
   , thread_{[this]() {
      if (!event_) {
         throw std::runtime_error("Couldn't create event");
      }

      if (::WaitForSingleObject(event_, INFINITE) != WAIT_OBJECT_0) {
         throw std::runtime_error("Unexpected event error");
      }

      while (Main::Running() && !stop_) {
         HANDLE handle;
         if (SUCCEEDED(SimConnect_Open(&handle, "MSFS VFRNav'", nullptr, 0, event_, 0))) {
            handle_.reset(new HANDLE(handle));
            Run();

            // Disconnect
            handle_ = nullptr;
         }

         std::unique_lock lock{mutex_};
         cv_.wait_for(lock, std::chrono::seconds{5}, [this]() { return stop_; });
      }
   }} {
   MessageQueue::Dispatch([this]() { SetEvent(event_); });
}

SimConnect::~SimConnect() {
   MessageQueue::Dispatch([this]() {
      std::unique_lock lock{mutex_};
      stop_      = true;
      connected_ = false;
      cv_.notify_all();
      lock.unlock();

      if (event_) {
         SetEvent(event_);
      }

      thread_.request_stop();
   });
}

void
SimConnect::SetServerPort(uint32_t port) {
   MessageQueue::Dispatch([this, port]() {
      server_port_ = port;

      if (connected_) {
         SimConnect_SetDataOnSimObject(
           *handle_,
           static_cast<uint32_t>(DataId::SET_PORT),
           SIMCONNECT_OBJECT_ID_USER,
           0,
           0,
           sizeof(server_port_),
           &server_port_
         );
      }
   });
}

void
SimConnect::Run() {
   connected_ = true;

   SimConnect_AddToDataDefinition(
     *handle_,
     static_cast<uint32_t>(DataId::SET_PORT),
     "L:VFRNAV_SET_PORT",
     "Number",
     SIMCONNECT_DATATYPE_FLOAT64
   );

   while ((::WaitForSingleObject(event_, INFINITE) == WAIT_OBJECT_0) && Main::Running() && !stop_
          && connected_) {
      MessageQueue::Dispatch([this]() {
         SimConnect_CallDispatch(
           *handle_,
           [](SIMCONNECT_RECV* data, DWORD, void* self) constexpr {
              reinterpret_cast<SimConnect*>(self)->Dispatch(*data);
           },
           this
         );
      });
   }
}

void
SimConnect::Dispatch(SIMCONNECT_RECV const& data) {
   switch (data.dwID) {
      case SIMCONNECT_RECV_ID_OPEN: {
         /// @todo better
         std::this_thread::sleep_for(std::chrono::seconds{5});
         SetServerPort(server_port_);
      } break;

      case SIMCONNECT_RECV_ID_EXCEPTION: {
         [[maybe_unused]] auto const& exception =
           static_cast<SIMCONNECT_RECV_EXCEPTION const&>(data);
         std::cerr << "SimConnect: Exception (" << exception.dwException << ")" << std::endl;
      } break;

      case SIMCONNECT_RECV_ID_QUIT: {
         connected_ = false;
         break;
      }
   }
}
