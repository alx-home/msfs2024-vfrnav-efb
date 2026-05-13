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

#include "DataType.h"

#include <algorithm>
#include <array>
#include <tuple>

namespace smc {

struct TrafficInfo {
   double altitude_{};
   double ground_altitude_{};
   double lat_{};
   double lon_{};
   double ground_velocity_{};

   double true_heading_{};
   double pitch_{};
   double bank_{};
   double incidence_alpha_{};

   double lateral_velocity_{};
   double yaw_rate_{};

   double world_vertical_velocity_{};
   double world_lat_velocity_{};
   double world_lon_velocity_{};

   int32_t sim_on_ground_{};
   int32_t gear_on_ground_{};
   double  gear_pressure_{};

   double contact1_pressure_{};
   double contact2_pressure_{};
   double contact3_pressure_{};
   double contact4_pressure_{};
   double contact5_pressure_{};
   double contact6_pressure_{};
   double contact7_pressure_{};
   double contact8_pressure_{};
   double contact9_pressure_{};
   double contact10_pressure_{};
   double contact11_pressure_{};
   double contact12_pressure_{};
   double contact13_pressure_{};
   double contact14_pressure_{};
   double contact15_pressure_{};
   double contact16_pressure_{};

   std::array<double TrafficInfo::*, 16> contact_pressures_{
     &TrafficInfo::contact1_pressure_,
     &TrafficInfo::contact2_pressure_,
     &TrafficInfo::contact3_pressure_,
     &TrafficInfo::contact4_pressure_,
     &TrafficInfo::contact5_pressure_,
     &TrafficInfo::contact6_pressure_,
     &TrafficInfo::contact7_pressure_,
     &TrafficInfo::contact8_pressure_,
     &TrafficInfo::contact9_pressure_,
     &TrafficInfo::contact10_pressure_,
     &TrafficInfo::contact11_pressure_,
     &TrafficInfo::contact12_pressure_,
     &TrafficInfo::contact13_pressure_,
     &TrafficInfo::contact14_pressure_,
     &TrafficInfo::contact15_pressure_,
     &TrafficInfo::contact16_pressure_,
   };

   bool TouchingGround() const {
      return std::ranges::any_of(contact_pressures_, [&](auto member) {
         return this->*member > 1.e-5;
      });
   }

   double true_airspeed_{};
   double vspeed_{};

   int32_t transponder_{};

   static constexpr auto MEMBERS = std::make_tuple(

     smc::_m{
       &TrafficInfo::altitude_,
       "PLANE ALTITUDE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet",
     },
     smc::_m{
       &TrafficInfo::ground_altitude_,
       "PLANE ALT ABOVE GROUND",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet",
     },
     smc::_m{
       &TrafficInfo::lat_,
       "PLANE LATITUDE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "degrees",
     },
     smc::_m{
       &TrafficInfo::lon_,
       "PLANE LONGITUDE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "degrees",
     },
     smc::_m{
       &TrafficInfo::ground_velocity_,
       "GROUND VELOCITY",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "knots",
     },
     smc::_m{
       &TrafficInfo::incidence_alpha_,
       "INCIDENCE ALPHA",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
       0,
     },

     smc::_m{
       &TrafficInfo::true_heading_,
       "PLANE HEADING DEGREES TRUE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
     },

     smc::_m{
       &TrafficInfo::bank_,
       "PLANE BANK DEGREES",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
     },

     smc::_m{
       &TrafficInfo::pitch_,
       "PLANE PITCH DEGREES",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
     },

     smc::_m{
       &TrafficInfo::lateral_velocity_,
       "VELOCITY BODY X",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet/second",
     },
     smc::_m{
       &TrafficInfo::yaw_rate_,
       "ROTATION VELOCITY BODY Y",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet/second",
     },

     smc::_m{
       &TrafficInfo::sim_on_ground_,
       "SIM ON GROUND",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "bool",
     },
     smc::_m{
       &TrafficInfo::gear_on_ground_,
       "GEAR IS ON GROUND:0",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "bool",
     },
     smc::_m{
       &TrafficInfo::contact1_pressure_,
       "CONTACT POINT COMPRESSION:0",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact2_pressure_,
       "CONTACT POINT COMPRESSION:1",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact3_pressure_,
       "CONTACT POINT COMPRESSION:2",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact4_pressure_,
       "CONTACT POINT COMPRESSION:3",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact5_pressure_,
       "CONTACT POINT COMPRESSION:4",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact6_pressure_,
       "CONTACT POINT COMPRESSION:5",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact7_pressure_,
       "CONTACT POINT COMPRESSION:6",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact8_pressure_,
       "CONTACT POINT COMPRESSION:7",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact9_pressure_,
       "CONTACT POINT COMPRESSION:8",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact10_pressure_,
       "CONTACT POINT COMPRESSION:9",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact11_pressure_,
       "CONTACT POINT COMPRESSION:10",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact12_pressure_,
       "CONTACT POINT COMPRESSION:11",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact13_pressure_,
       "CONTACT POINT COMPRESSION:12",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact14_pressure_,
       "CONTACT POINT COMPRESSION:13",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact15_pressure_,
       "CONTACT POINT COMPRESSION:14",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },
     smc::_m{
       &TrafficInfo::contact16_pressure_,
       "CONTACT POINT COMPRESSION:15",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "psi",
     },

     smc::_m{
       &TrafficInfo::true_airspeed_,
       "AIRSPEED TRUE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "knots",
     },
     smc::_m{
       &TrafficInfo::vspeed_,
       "VERTICAL SPEED",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet/second",
     },
     smc::_m{
       &TrafficInfo::world_vertical_velocity_,
       "VELOCITY WORLD Y",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet/second",
     },
     smc::_m{
       &TrafficInfo::world_lat_velocity_,
       "VELOCITY WORLD Z",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet/second",
     },
     smc::_m{
       &TrafficInfo::world_lon_velocity_,
       "VELOCITY WORLD X",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet/second",
     },

     smc::_m{
       &TrafficInfo::transponder_,
       "TRANSPONDER CODE:1",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "number",
     }
   );
};

}  // namespace smc