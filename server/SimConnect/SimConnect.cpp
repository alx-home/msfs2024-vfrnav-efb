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
#include "MSFS.h"
#include "windows/Window.h"

#include <Windows.h>
#include <SimConnect.h>
#include <synchapi.h>
#include <winuser.h>
#include <algorithm>
#include <chrono>
#include <functional>
#include <memory>
#include <numbers>
#include <ranges>
#include <stdexcept>
#include <thread>

static double
DistanceRad(double lat1, double long1, double lat2, double long2) {
   auto const dist =
     std::sin(lat1) * std::sin(lat2) + std::cos(lat1) * std::cos(lat2) * std::cos(long1 - long2);
   return 6'371'000. * std::acos(dist);
}

namespace sim_connect::internal {
enum class Message : UINT {
   SIMCONNECT_GET_FACILITIES_LIST = WM_APP,

   // Internal
   SIMCONNECT_DISPATCH_MSFS_MSG,
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
      message_window_ = win32::CreateMessageWindow<"VFRNav.SimConnect">(*this);

      SetEvent(event_);

      MSG msg;
      while (GetMessageW(&msg, nullptr, 0, 0) > 0) {
         TranslateMessage(&msg);
         DispatchMessageW(&msg);
      };
   })
   , thread_{[this]() {
      if (!event_) {
         throw std::runtime_error("Couldn't create event");
      }

      if (::WaitForSingleObject(event_, INFINITE) != WAIT_OBJECT_0) {
         throw std::runtime_error("Unexpected event error");
      }

      while (Main::Running()) {
         assert(message_window_);
         assert(IsWindow(message_window_.get()));

         HANDLE handle;
         if (SUCCEEDED(SimConnect_Open(&handle, "MSFS VFRNav'", nullptr, 0, event_, 0))) {
            handle_.reset(new HANDLE(handle));
            Run();

            // Disconnect
            handle_ = nullptr;
         }
         std::this_thread::sleep_for(std::chrono::seconds{5});
      }
   }} {}

#pragma region Message Handler
LRESULT
SimConnect::OnMessage(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
   using namespace sim_connect::internal;
   using enum Message;

   switch (static_cast<Message>(msg)) {
      case SIMCONNECT_DISPATCH_MSFS_MSG: {
         SimConnect_CallDispatch(
           *handle_,
           [](SIMCONNECT_RECV* data, DWORD, void* self) constexpr {
              reinterpret_cast<SimConnect*>(self)->Dispatch(*data);
           },
           this
         );

         return 0;
      }

      case SIMCONNECT_DISPATCH_MSG: {
         if (auto f = reinterpret_cast<std::function<void()>*>(lp); f) {
            auto _ = std::unique_ptr<std::function<void()>>(f);
            (*f)();
         }

         return 0;
      }

      case SIMCONNECT_GET_FACILITIES_LIST: {
         if (auto param = reinterpret_cast<FacilityParam*>(lp); param) {
            auto _ = std::unique_ptr<FacilityParam>(param);

            if (!connected_) {
               MakeReject<sim_connect::Disconnected>(param->reject_);
               return 0;
            }

            auto const lat = (param->lat_ * std::numbers::pi) / 180.;
            auto const lon = (param->lon_ * std::numbers::pi) / 180.;

            struct Query {
               std::string_view icao_;
               double           distance_;
            };

            std::size_t size{0};

            // Compute the list of Airports for facility requests
            auto query{
              airport_list_
              | std::ranges::views::transform([&lat, &lon](AirportInfo const& elem) constexpr {
                   // Convert the list into query
                   return Query{
                     .icao_     = elem.ICAO,
                     .distance_ = DistanceRad(
                       (elem.lat_ * std::numbers::pi) / 180.,
                       (elem.lon_ * std::numbers::pi) / 180.,
                       lat,
                       lon
                     )
                   };
                })
              | std::ranges::views::filter([](Query const& elem) constexpr {
                   // Reduce the list to airports within 100 km radius
                   return elem.distance_ < 100'000;
                })
              | std::ranges::to<std::vector>()
            };

            // Sort Airports by distance
            std::ranges::sort(query, {}, &Query::distance_);

            auto facilities = std::make_unique<Facilities>(param->resolve_, param->reject_);

            // Do not ask about airports that have already been provided
            auto query_view =
              query | std::ranges::views::filter([&, this](Query const& name) constexpr {
                 auto const bucket =
                   facilities_.hash_function()(name.icao_) % facilities_.bucket_count();
                 for (auto it = facilities_.begin(bucket); it != facilities_.end(bucket); ++it) {
                    if (it->ICAO == name.icao_) {

                       if (size <= 500) {
                          ++size;
                          facilities->facilities_.emplace_back(*it);
                       }

                       return false;
                    }
                 }

                 return size < 500;
              });

            if (size == 500) {
               // We already have in cache everything ==> resolve
            } else {
               // Request facilities (up to 500)

               std::size_t request_id = request_id_;
               std::ranges::for_each_n(
                 query_view.begin(),
                 std::min<std::size_t>(query.size(), 500 - size),
                 [this](auto const& elem) constexpr {
                    if (auto const result = SimConnect_RequestFacilityData(
                          *handle_,
                          static_cast<SIMCONNECT_DATA_DEFINITION_ID>(DataDefinitionId::AIRPORT),
                          request_id_,
                          elem.icao_.data()
                        );
                        result == S_OK) {
                       ++request_id_;
                    } else {
                       std::cerr << "Couldn't register " << elem.icao_ << " Facility (" << result
                                 << ")" << std::endl;
                    }
                 }
               );

               if (request_id != request_id_) {
                  auto const& [it, emplaced] =
                    waiting_requests_.emplace(request_id, std::move(facilities));
                  if (emplaced) {
                     it->second->refcount_ = request_id_ - request_id;
                  } else {
                     assert(false);
                  }
               } else {
                  // We couldn't request any information ==> reject
               }
            }
         }

         return 0;
      }

      case DESTROY: {
         if (event_) {
            connected_ = false;
            SetEvent(event_);
         }

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

   Dispatch([this]() constexpr {
      SimConnect_SubscribeToFacilities(
        *handle_, SIMCONNECT_FACILITY_LIST_TYPE_AIRPORT, request_id_
      );
      ++request_id_;

      RegisterAirportFacilities();
   });

   while ((::WaitForSingleObject(event_, INFINITE) == WAIT_OBJECT_0) && Main::Running()
          && connected_) {
      assert(message_window_);
      assert(IsWindow(message_window_.get()));

      PostMessage(message_window_.get(), static_cast<UINT>(SIMCONNECT_DISPATCH_MSFS_MSG), 0, 0);
   }
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

void
SimConnect::Dispatch(SIMCONNECT_RECV const& data) {
   using namespace MSFS;

   switch (data.dwID) {
#pragma region Dispatch Airports
      case SIMCONNECT_RECV_ID_AIRPORT_LIST: {
         auto const& raw_airport_list = static_cast<SIMCONNECT_RECV_AIRPORT_LIST const&>(data);
         auto airport_list = std::span(raw_airport_list.rgData, raw_airport_list.dwArraySize);

         for (auto const& elem : airport_list) {
            airport_list_.emplace(elem.Ident, elem.Latitude, elem.Longitude);
         }

      } break;
#pragma endregion

#pragma region Dispatch Facilities
      case SIMCONNECT_RECV_ID_FACILITY_DATA: {
         auto const& facility_data = static_cast<SIMCONNECT_RECV_FACILITY_DATA const&>(data);

         switch (facility_data.Type) {
            case SIMCONNECT_FACILITY_DATA_AIRPORT: {
               auto const& msfs_airport = MSFS::Cast<MSFS::Airport>(facility_data);

               if (auto const it = waiting_requests_.Find(facility_data.UserRequestId);
                   it != waiting_requests_.end()) {
                  // assert(facilities_.find(msfs_airport) == facilities_.end());
                  // facilities_.emplace(msfs_airport); todo
                  static_cast<::Facilities&>(*it->second)
                    .facilities_.emplace_back(msfs_airport, facility_data.UserRequestId);
               } else {
                  assert(false);
               }
            } break;

            case SIMCONNECT_FACILITY_DATA_RUNWAY: {
               if (auto const it = waiting_requests_.Find(facility_data.UserRequestId);
                   it != waiting_requests_.end()) {
                  auto& facilities = static_cast<::Facilities&>(*it->second).facilities_;
                  if (auto it = std::ranges::find(
                        facilities.begin(),
                        facilities.end(),
                        facility_data.UserRequestId,
                        &Facility::request_id_
                      );
                      it != facilities.end()) {
                     it->runways_.emplace_back(MSFS::Cast<MSFS::Runway>(facility_data));
                  } else {
                     assert(false);
                  }
               } else {
                  assert(false);
               }
            } break;

            case SIMCONNECT_FACILITY_DATA_FREQUENCY: {
               if (auto const it = waiting_requests_.Find(facility_data.UserRequestId);
                   it != waiting_requests_.end()) {
                  auto& facilities = static_cast<::Facilities&>(*it->second).facilities_;
                  if (auto it = std::ranges::find(
                        facilities.begin(),
                        facilities.end(),
                        facility_data.UserRequestId,
                        &Facility::request_id_
                      );
                      it != facilities.end()) {
                     it->frequencies_.emplace_back(
                       MSFS::Cast<MSFS::Frequency>(facility_data), it->ICAO
                     );
                  } else {
                     assert(false);
                  }
               } else {
                  assert(false);
               }
            } break;

            case SIMCONNECT_FACILITY_DATA_VOR: {
               // auto vor = MSFS::Cast<MSFS::Vor>(facility_data);

               // auto it = g_RequestIdMap.find(pFacilityData->UserRequestId);
               // if (it != g_RequestIdMap.end()) {
               //    Runway* r = nullptr;

               //    for (auto& p : g_AirportMap) {
               //       Runway* tmp = p.second.FindRunway(it->second);
               //       if (tmp) {
               //          r = tmp;
               //          break;
               //       }
               //    }

               //    if (r) {
               //       r->AddIls(pFacilityData->UserRequestId, *vor);
               //    }
               // }
            } break;

            case SIMCONNECT_FACILITY_DATA_WAYPOINT: {
               // auto frequency = MSFS::Cast<MSFS::Waypoint>(facility_data);
               // Do something with wpt
            }
         }
      } break;

      case SIMCONNECT_RECV_ID_FACILITY_DATA_END: {
         [[maybe_unused]] auto const& facility_data =
           static_cast<SIMCONNECT_RECV_FACILITY_DATA_END const&>(data);

         if (auto it = waiting_requests_.Find(facility_data.RequestId);
             it != waiting_requests_.end()) {
            if (it->second->refcount_ == 1) {
               // Resolve current request
               waiting_requests_.erase(it);
            } else {
               --it->second->refcount_;
               assert(it->second->refcount_ > 0);
            }
         }
      } break;

      case SIMCONNECT_RECV_ID_FACILITY_MINIMAL_LIST: {
         [[maybe_unused]] auto const& msg =
           static_cast<SIMCONNECT_RECV_FACILITY_MINIMAL_LIST const&>(data);
         assert(false);

         // for (unsigned i = 0; i < msg.dwArraySize; ++i) {
         //    auto const& fm = msg.rgData[i];

         //    fprintf(
         //      stdout,
         //      "ICAO => Type: %c, Ident: %s, Region: %s, Airport: %s => Lat: %lf, Lat: %lf, Alt: "
         //      "%lf\n",
         //      fm.icao.Type,
         //      fm.icao.Ident,
         //      fm.icao.Region,
         //      fm.icao.Airport,
         //      fm.lla.Latitude,
         //      fm.lla.Longitude,
         //      fm.lla.Altitude
         //    );
         // }

         // int randIndex = rand() % msg.dwArraySize;
         // SimConnect_RequestFacilityData(
         //   *handle_,
         //   FACILITY_DATA_DEF_WPT,
         //   FACILITY_DATA_DEF_REQUEST_START + g_RequestCount,
         //   msg->rgData[randIndex].icao.Ident,
         //   msg->rgData[randIndex].icao.Region
         // );
      } break;
#pragma endregion

#pragma region Dispatch Exceptions
      case SIMCONNECT_RECV_ID_EXCEPTION: {
         [[maybe_unused]] auto const& exception =
           static_cast<SIMCONNECT_RECV_EXCEPTION const&>(data);
         std::cerr << "SimConnect: Exception (" << exception.dwException << ")" << std::endl;
      } break;

      case SIMCONNECT_RECV_ID_QUIT: {
         connected_ = false;
         break;
      }

#pragma endregion
   }
}

void
SimConnect::RegisterFacility(DataDefinitionId id, std::string_view name) {
   if (auto const result = SimConnect_AddToFacilityDefinition(
         *handle_, static_cast<SIMCONNECT_DATA_DEFINITION_ID>(id), name.data()
       );
       result != S_OK) {
      std::cerr << "Couldn't register " << name << " Facility (" << result << ")" << std::endl;
   }
}

void
SimConnect::RegisterAirportFacilities() {
   using namespace MSFS;
   using enum DataDefinitionId;

#pragma region Register Airport
   RegisterFacility(AIRPORT, "OPEN AIRPORT");
   {
      RegisterFacility(AIRPORT, "ICAO");
      RegisterFacility(AIRPORT, "LATITUDE");
      RegisterFacility(AIRPORT, "LONGITUDE");

      // CLASS ?
      // Airspace type ?

      // best approach ?

      // fuel ?

      // TOWERED ?
      RegisterFacility(AIRPORT, "IS_CLOSED");

      // private type ?

      RegisterFacility(AIRPORT, "N_FREQUENCIES");
      RegisterFacility(AIRPORT, "N_RUNWAYS");

      RegisterFacility(AIRPORT, "TRANSITION_ALTITUDE");
      RegisterFacility(AIRPORT, "TRANSITION_LEVEL");

      RegisterFacility(AIRPORT, "OPEN FREQUENCY");
      {
         RegisterFacility(AIRPORT, "NAME");
         RegisterFacility(AIRPORT, "FREQUENCY");
         RegisterFacility(AIRPORT, "TYPE");
      }
      RegisterFacility(AIRPORT, "CLOSE FREQUENCY");

      RegisterFacility(AIRPORT, "OPEN RUNWAY");
      {
         RegisterFacility(AIRPORT, "PRIMARY_NUMBER");
         RegisterFacility(AIRPORT, "PRIMARY_DESIGNATOR");

         RegisterFacility(AIRPORT, "SECONDARY_NUMBER");
         RegisterFacility(AIRPORT, "SECONDARY_DESIGNATOR");

         RegisterFacility(AIRPORT, "LENGTH");
         RegisterFacility(AIRPORT, "WIDTH");
         RegisterFacility(AIRPORT, "HEADING");
         RegisterFacility(AIRPORT, "ALTITUDE");

         RegisterFacility(AIRPORT, "SURFACE");

         RegisterFacility(AIRPORT, "LATITUDE");
         RegisterFacility(AIRPORT, "LONGITUDE");
      }
      RegisterFacility(AIRPORT, "CLOSE RUNWAY");
   }
   RegisterFacility(AIRPORT, "CLOSE AIRPORT");
#pragma endregion
}

#pragma region Register Vor
// void
// SimConnect::RegisterVorFacilities() {
//    using namespace MSFS;
//    using enum DataDefinitionId;

//    RegisterFacility(VOR, "OPEN VOR");
//    RegisterFacility(VOR, "VOR_LATITUDE");
//    RegisterFacility(VOR, "VOR_LONGITUDE");
//    RegisterFacility(VOR, "VOR_ALTITUDE");
//    RegisterFacility(VOR, "DME_LATITUDE");
//    RegisterFacility(VOR, "DME_LONGITUDE");
//    RegisterFacility(VOR, "DME_ALTITUDE");
//    RegisterFacility(VOR, "GS_LATITUDE");
//    RegisterFacility(VOR, "GS_LONGITUDE");
//    RegisterFacility(VOR, "GS_ALTITUDE");
//    RegisterFacility(VOR, "TACAN_LATITUDE");
//    RegisterFacility(VOR, "TACAN_LONGITUDE");
//    RegisterFacility(VOR, "TACAN_ALTITUDE");
//    RegisterFacility(VOR, "IS_NAV");
//    RegisterFacility(VOR, "IS_DME");
//    RegisterFacility(VOR, "IS_TACAN");
//    RegisterFacility(VOR, "HAS_GLIDE_SLOPE");
//    RegisterFacility(VOR, "DME_AT_NAV");
//    RegisterFacility(VOR, "DME_AT_GLIDE_SLOPE");
//    RegisterFacility(VOR, "HAS_BACK_COURSE");
//    RegisterFacility(VOR, "FREQUENCY");
//    RegisterFacility(VOR, "TYPE");
//    RegisterFacility(VOR, "NAV_RANGE");
//    RegisterFacility(VOR, "MAGVAR");
//    RegisterFacility(VOR, "LOCALIZER");
//    RegisterFacility(VOR, "LOCALIZER_WIDTH");
//    RegisterFacility(VOR, "GLIDE_SLOPE");
//    RegisterFacility(VOR, "NAME");
//    RegisterFacility(VOR, "CLOSE VOR");
// }
#pragma endregion

#pragma region Register Waypoint
// void
// SimConnect::RegisterWaypointFacilities() {
//    using namespace MSFS;
//    using enum DataDefinitionId;

//    RegisterFacility(WAYPOINT, "OPEN WAYPOINT");
//    RegisterFacility(WAYPOINT, "LATITUDE");
//    RegisterFacility(WAYPOINT, "LONGITUDE");
//    RegisterFacility(WAYPOINT, "ALTITUDE");
//    RegisterFacility(WAYPOINT, "TYPE");
//    RegisterFacility(WAYPOINT, "MAGVAR");
//    RegisterFacility(WAYPOINT, "N_ROUTES");
//    RegisterFacility(WAYPOINT, "CLOSE WAYPOINT");
// }
#pragma endregion
