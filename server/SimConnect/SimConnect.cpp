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

#include "Facilities.h"
#include "main.h"
#include "json/json.h"
#include "windows/Window.h"

#include <Windows.h>
#include <SimConnect.h>
#include <synchapi.h>
#include <winuser.h>
#include <algorithm>
#include <chrono>
#include <condition_variable>
#include <functional>
#include <ios>
#include <memory>
#include <mutex>
#include <thread>
#include <variant>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wlanguage-extension-token"
#pragma clang diagnostic ignored "-Wgnu-anonymous-struct"
#pragma clang diagnostic ignored "-Wnested-anon-types"
#pragma clang diagnostic ignored "-Wdeprecated-missing-comma-variadic-parameter"
#include <boost/beast.hpp>
#include <boost/asio.hpp>
#pragma clang diagnostic pop

// static double
// DistanceRad(double lat1, double long1, double lat2, double long2) {
//    auto const dist =
//      std::sin(lat1) * std::sin(lat2) + std::cos(lat1) * std::cos(lat2) * std::cos(long1 - long2);
//    return 6'371'000. * std::acos(dist);
// }

namespace sim_connect::internal {
enum class Message : UINT {
   SIMCONNECT_GET_FACILITIES_LIST = WM_APP,

   // Internal
   SIMCONNECT_DISPATCH_MSG,

   DESTROY = WM_DESTROY,
};

}  // namespace sim_connect::internal

namespace MSFS {

template <class TYPE>
TYPE
Cast(SIMCONNECT_RECV_FACILITY_DATA const& facility) {
   TYPE type{};
   std::copy_n(
     reinterpret_cast<std::byte const*>(&facility.Data),
     sizeof(TYPE),
     reinterpret_cast<std::byte*>(&type)
   );

   return type;
}
}  // namespace MSFS

SimConnect::SimConnect()
   : message_window_thread_([this]() {
      {
         std::unique_lock lock{mutex_};
         message_window_ = win32::CreateMessageWindow<"VFRNav.SimConnect">(*this);
         cv_.notify_all();
      }

      MSG msg;
      while (GetMessageW(&msg, nullptr, 0, 0) > 0) {
         TranslateMessage(&msg);
         DispatchMessageW(&msg);
      };
   })
   , thread_{[this]() {
      {
         std::unique_lock lock{mutex_};
         if (!message_window_ || !IsWindow(message_window_.get())) {
            cv_.wait(lock);
         }
      }

      while (Main::Running()) {
         assert(message_window_);
         assert(IsWindow(message_window_.get()));

         Run();

         // Disconnect
         connected_ = false;
         std::this_thread::sleep_for(std::chrono::seconds{5});
      }
   }} {}

#pragma region Message Handler
LRESULT
SimConnect::OnMessage(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
   using namespace sim_connect::internal;
   using enum Message;

   switch (static_cast<Message>(msg)) {
      case SIMCONNECT_DISPATCH_MSG: {
         if (auto f = reinterpret_cast<std::function<void()>*>(lp); f) {
            auto _ = std::unique_ptr<std::function<void()>>(f);
            (*f)();
         }

         return 0;
      }

      case SIMCONNECT_GET_FACILITIES_LIST: {
         // if (auto param = reinterpret_cast<FacilityParam*>(lp); param) {
         //    auto _ = std::unique_ptr<FacilityParam>(param);

         //    if (!connected_) {
         //       MakeReject<sim_connect::Disconnected>(param->reject_);
         //       return 0;
         //    }

         //    auto const lat = (param->lat_ * std::numbers::pi) / 180.;
         //    auto const lon = (param->lon_ * std::numbers::pi) / 180.;

         //    struct Query {
         //       std::string_view icao_;
         //       double           distance_;
         //    };

         //    std::size_t size{0};

         //    // Compute the list of Airports for facility requests
         //    auto query{
         //      airport_list_
         //      | std::ranges::views::transform([&lat, &lon](AirportInfo const& elem) constexpr {
         //           // Convert the list into query
         //           return Query{
         //             .icao_     = elem.ICAO,
         //             .distance_ = DistanceRad(
         //               (elem.lat_ * std::numbers::pi) / 180.,
         //               (elem.lon_ * std::numbers::pi) / 180.,
         //               lat,
         //               lon
         //             )
         //           };
         //        })
         //      | std::ranges::views::filter([](Query const& elem) constexpr {
         //           // Reduce the list to airports within 100 km radius
         //           return elem.distance_ < 100'000;
         //        })
         //      | std::ranges::to<std::vector>()
         //    };

         //    // Sort Airports by distance
         //    std::ranges::sort(query, {}, &Query::distance_);

         //    auto facilities = std::make_unique<Facilities>(param->resolve_, param->reject_);

         //    // Do not ask about airports that have already been provided
         //    auto query_view =
         //      query | std::ranges::views::filter([&, this](Query const& name) constexpr {
         //         auto const bucket =
         //           facilities_.hash_function()(name.icao_) % facilities_.bucket_count();
         //         for (auto it = facilities_.begin(bucket); it != facilities_.end(bucket); ++it) {
         //            if (it->ICAO == name.icao_) {

         //               if (size <= 500) {
         //                  ++size;
         //                  facilities->facilities_.emplace_back(*it);
         //               }

         //               return false;
         //            }
         //         }

         //         return size < 500;
         //      });

         //    if (size == 500) {
         //       // We already have in cache everything ==> resolve
         //    } else {
         //       // Request facilities (up to 500)

         //       std::size_t request_id = request_id_;
         //       std::ranges::for_each_n(
         //         query_view.begin(),
         //         std::min<std::size_t>(query.size(), 500 - size),
         //         [this](auto const& elem) constexpr {
         //            if (auto const result = SimConnect_RequestFacilityData(
         //                  *handle_,
         //                  static_cast<SIMCONNECT_DATA_DEFINITION_ID>(DataDefinitionId::AIRPORT),
         //                  request_id_,
         //                  elem.icao_.data()
         //                );
         //                result == S_OK) {
         //               ++request_id_;
         //            } else {
         //               std::cerr << "Couldn't register " << elem.icao_ << " Facility (" << result
         //                         << ")" << std::endl;
         //            }
         //         }
         //       );

         //       if (request_id != request_id_) {
         //          auto const& [it, emplaced] =
         //            waiting_requests_.emplace(request_id, std::move(facilities));
         //          if (emplaced) {
         //             it->second->refcount_ = request_id_ - request_id;
         //          } else {
         //             assert(false);
         //          }
         //       } else {
         //          // We couldn't request any information ==> reject
         //       }
         //    }
         // }

         return 0;
      }

      case DESTROY: {
         connected_ = false;
         return 0;
      }
   }

   return DefWindowProcW(hwnd, msg, wp, lp);
}
#pragma endregion

#pragma region Run
void
SimConnect::Run() {
   using namespace MSFS;
   using enum sim_connect::internal::Message;
   connected_ = true;
}
#pragma endregion

void
SimConnect::Dispatch(std::function<void()> fun) const {
   using enum sim_connect::internal::Message;
   assert(message_window_);
   assert(IsWindow(message_window_.get()));

   PostMessage(
     message_window_.get(),
     static_cast<UINT>(SIMCONNECT_DISPATCH_MSG),
     0,
     (LPARAM) new std::function<void()>(std::move(fun))
   );
}
