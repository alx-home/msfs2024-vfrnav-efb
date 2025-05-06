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

#include "Facilities.h"

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
#include <functional>
#include <map>
#include <stdexcept>
#include <string_view>
#include <thread>
#include <unordered_map>
#include <unordered_set>

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
   SIMCONNECT_GET_FACILITIES_LIST = WM_APP,
};

template <Message MESSAGE>
struct Parameter;

template <>
struct Parameter<Message::SIMCONNECT_GET_FACILITIES_LIST> {
   double lat_;
   double lon_;

   Resolve<FacilityList> const& resolve_;
   Reject const&                reject_;
};

}  // namespace sim_connect

using FacilityParam = sim_connect::Parameter<sim_connect::Message::SIMCONNECT_GET_FACILITIES_LIST>;

class SimConnect {
public:
   SimConnect();

   LRESULT OnMessage(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp);

   void Dispatch(std::function<void()>) const;

   template <sim_connect::Message MESSAGE>
   constexpr void Post(sim_connect::Parameter<MESSAGE> parameter) {
      PostMessage(
        message_window_.get(),
        static_cast<UINT>(MESSAGE),
        0,
        reinterpret_cast<LPARAM>(new sim_connect::Parameter<MESSAGE>(std::move(parameter)))
      );
   }

private:
   enum class DataDefinitionId : SIMCONNECT_DATA_DEFINITION_ID {
      AIRPORT  = 1000,
      VOR      = 2000,
      WAYPOINT = 3000
   };

   void Run();
   void Dispatch(SIMCONNECT_RECV const& data);

   void RegisterFacility(DataDefinitionId id, std::string_view name);

   void RegisterAirportFacilities();
   void RegisterVorFacilities();
   void RegisterWaypointFacilities();

   bool                       connected_ = false;
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
   std::unordered_set<AirportInfo> airport_list_{};
   std::unordered_set<Facility>    facilities_{};

   win32::Event event_{win32::CreateEvent()};

   std::unique_ptr<HANDLE, void (*)(HANDLE*)> handle_{
     nullptr,
     [](HANDLE* ptr) constexpr {
        SimConnect_Close(*ptr);
        delete ptr;
     },
   };

   win32::WinPtr message_window_{nullptr, nullptr};
   std::jthread  message_window_thread_{};
   std::jthread  thread_{};
};