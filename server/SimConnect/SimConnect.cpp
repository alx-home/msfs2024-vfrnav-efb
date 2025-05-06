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

#include <Windows.h>
#include <SimConnect.h>
#include <chrono>
#include <memory>
#include <thread>

namespace MSFS {
#pragma pack(push, 1)
struct Airport {
   double latitude_;
   double longitude_;
   double altitude_;
   float  magvar_;
   char   name_[32];
   double tower_latitude_;
   double tower_longitude_;
   double tower_altitude_;
   int    n_runways_;
   int    n_frequencies_;
   int    n_helipads_;
   int    n_approaches_;
   int    n_departures_;
   int    n_arrivals_;
   int    n_taxi_points_;
   int    n_taxi_parkings_;
   int    n_taxi_paths_;
   int    n_taxi_names_;
   int    n_jetways_;
};

struct Runway {
   double latitude_;
   double longitude_;
   double altitude_;
   float  heading_;
   float  length_;
   float  width_;
   char   primary_ils_icao_[8];
   char   primary_ils_region_[8];
   int    primary_number_;
   int    primary_designator_;
   char   secondary_ils_icao_[8];
   char   secondary_ils_region_[8];
   int    secondary_number_;
   int    secondary_designator_;
};

struct Frequency {
   int  type_;
   int  frequency_;
   char name_[64];
};

struct Vor {
   double   vor_lat_;
   double   vor_lon_;
   double   vor_alt_;
   double   dme_lat_;
   double   dme_lon_;
   double   dme_alt_;
   double   gs_lat_;
   double   gs_lon_;
   double   gs_alt_;
   double   tacan_lat_;
   double   tacan_lon_;
   double   tacan_alt_;
   int      is_nav_;
   int      is_dme_;
   int      is_tacan_;
   int      has_glide_slope_;
   int      dme_at_nav_;
   int      dme_at_glide_slope_;
   int      has_back_course_;
   unsigned frequency_;
   int      type_;
   float    range_;
   float    magvar_;
   float    localizer_;
   float    localier_width_;
   float    glide_slope_;
   char     name_[64];
};

struct Waypoint {
   double lat_;
   double lon_;
   double alt_;
   int    type_;
   float  magvar_;
   int    n_routes_;
};
#pragma pack(pop)

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
   : thread_{[this]() {
      while (Main::Running()) {
         HANDLE handle;
         if (SUCCEEDED(SimConnect_Open(&handle, "Send Event A", nullptr, 0, 0, 0))) {
            handle_.reset(new HANDLE(handle));
            Run();
         }
         std::this_thread::sleep_for(std::chrono::seconds{5});
      }
   }} {}

void
SimConnect::Run() {
   connected_ = true;
   while (Main::Running() && connected_) {
      SimConnect_CallDispatch(
        *handle_,
        [](SIMCONNECT_RECV* data, DWORD, void* self) constexpr {
           reinterpret_cast<SimConnect*>(self)->Dispatch(*data);
        },
        this
      );
   }
}

void
SimConnect::Dispatch(SIMCONNECT_RECV const& data) {
   switch (data.dwID) {
      case SIMCONNECT_RECV_ID_FACILITY_DATA: {
         auto const& facility_data = static_cast<SIMCONNECT_RECV_FACILITY_DATA const&>(data);

         switch (facility_data.Type) {
            case SIMCONNECT_FACILITY_DATA_AIRPORT: {
               // auto airport = MSFS::Cast<MSFS::Airport>(facility_data);

               // auto it = g_AirportMap.find(pFacilityData->UserRequestId);
               // if (it != g_AirportMap.end()) {
               //    it->second.Init(*a, pFacilityData->UniqueRequestId);
               // }
            } break;

            case SIMCONNECT_FACILITY_DATA_RUNWAY: {
               // auto runway = MSFS::Cast<MSFS::Runway>(facility_data);

               // auto it = g_AirportMap.find(pFacilityData->UserRequestId);
               // if (it != g_AirportMap.end()) {
               //    it->second.AddRunway(*runway, pFacilityData->UniqueRequestId);
               // }
            } break;

            case SIMCONNECT_FACILITY_DATA_FREQUENCY: {
               // auto frequency = MSFS::Cast<MSFS::Frequency>(facility_data);

               // auto it = g_AirportMap.find(pFacilityData->UserRequestId);
               // if (it != g_AirportMap.end()) {
               //    it->second.AddFrequency(*frequency);
               // }
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
         // auto const& facility_data = static_cast<SIMCONNECT_RECV_FACILITY_DATA_END const&>(data);

         // g_WaitingRequest.erase(facility_data.RequestId);
         // if (g_WaitingRequest.size() == 0) {
         //    DoSomething();
         // }
      } break;

      case SIMCONNECT_RECV_ID_EXCEPTION: {
         // auto const& exception = static_cast<SIMCONNECT_RECV_EXCEPTION const&>(data);
         // pException                            = pException;
      } break;

      case SIMCONNECT_RECV_ID_FACILITY_MINIMAL_LIST: {
         // auto const& msg = static_cast<SIMCONNECT_RECV_FACILITY_MINIMAL_LIST const&>(data);

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
   }
}