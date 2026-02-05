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

#pragma once

#include "Request.h"
#include "utils/MessageQueue.h"
#include <promise/promise.h>
#include <windows/Event.h>
#include <windows/Window.h>

#include <Windows.h>
#include <SimConnect.h>
#include <handleapi.h>
#include <intsafe.h>
#include <minwindef.h>
#include <synchapi.h>
#include <windef.h>
#include <winnt.h>
#include <winuser.h>
#include <chrono>
#include <cstdint>
#include <map>
#include <memory>
#include <stdexcept>
#include <thread>

namespace sim_connect {

struct Disconnected : std::runtime_error {
   Disconnected()
      : std::runtime_error("MSFS not connected!") {}
};

struct UnknownError : std::runtime_error {
   UnknownError(std::string_view message)
      : std::runtime_error(
          "MSFS error " + (message.size() ? (": " + std::string{message}) : ""_str) + "!"
        ) {}
};

enum class Message : UINT {
   SIMCONNECT_SET_SERVER_PORT = WM_APP,
};

template <Message MESSAGE>
struct Parameter;

template <>
struct Parameter<Message::SIMCONNECT_SET_SERVER_PORT> {
   uint32_t port_;
};

}  // namespace sim_connect

using ServerPortParam = sim_connect::Parameter<sim_connect::Message::SIMCONNECT_SET_SERVER_PORT>;

enum class DataId : uint32_t {
   SET_PORT,
   EVENT_FRAME,
   TRAFFIC,
   TRAFFIC_INFO,
   HELI_TRAFFIC_INFO,
   USER_INFO,
};

class SimConnect : public MessageQueue {
public:
   SimConnect();
   ~SimConnect();

   LRESULT OnMessage(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp);

   void SetServerPort(uint32_t port);

private:
   bool ShouldStop(std::stop_token const& stoken) const noexcept;
   void Run(std::stop_token const& stoken);

   template <DataId ID>
   void AddToDataDefinition(
     std::string_view                datumName,
     SIMCONNECT_DATATYPE             datumType,
     std::optional<std::string_view> unitsName = std::nullopt
   );
   template <DataId ID>
   void AddToDataDefinition(
     std::shared_ptr<void*> const&   handle,
     std::string_view                datumName,
     SIMCONNECT_DATATYPE             datumType,
     std::optional<std::string_view> unitsName = std::nullopt
   );
   template <DataId ID, class T>
   void AddToDataDefinition(std::shared_ptr<void*> const& handle);
   template <DataId ID, class T>
   void AddToDataDefinition();

   template <DataId ID>
   void RequestDataOnSimObjectType(
     SIMCONNECT_SIMOBJECT_TYPE objectType,
     uint32_t                  radius = 0,
     std::shared_ptr<void*>    handle = nullptr
   );

   template <class T>
   T StaticCast(DWORD const& data);

   void Dispatch(SIMCONNECT_RECV const& data);

   SIMCONNECT_DATA_REQUEST_ID request_id_{100};

   struct WaitingRequest : std::map<SIMCONNECT_DATA_REQUEST_ID, std::unique_ptr<Request>> {
      constexpr auto Find(SIMCONNECT_DATA_REQUEST_ID id) {
         if (empty()) {
            assert(false);
            return end();
         } else if (size() == 1) {
            return begin();
         }

         return std::prev(upper_bound(id));
      }

      constexpr auto Find(SIMCONNECT_DATA_REQUEST_ID id) const {
         if (empty()) {
            assert(false);
            return cend();
         } else if (size() == 1) {
            return cbegin();
         }

         return std::prev(upper_bound(id));
      }
   } waiting_requests_{};

   using time_point = std::chrono::steady_clock::time_point;

   win32::Event event_{win32::CreateEvent()};
   int64_t      server_port_{48578};
   int64_t      sent_port_{-1};
   time_point   next_check_{};

   std::weak_ptr<HANDLE> handle_{};

   std::jthread thread_{};
};