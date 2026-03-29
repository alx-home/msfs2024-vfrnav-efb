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

#include <string>
#include <tuple>

namespace smc {

struct TrafficInfo {
   std::string atc_type_{};
   std::string atc_model_{};
   std::string atc_id_{};
   std::string category_{};

   int32_t is_user_sim_{};
   int32_t wing_span_{};

   float  altitude_{};
   double lat_{};
   double lon_{};
   float  ground_velocity_{};

   float true_heading_{};

   int32_t sim_on_ground_{};

   float true_airspeed_{};
   float vspeed_{};

   int32_t transponder_{};

   int32_t num_engines_{};
   int32_t engine_type_{};

   std::string atc_from_airport_{};
   std::string atc_to_airport_{};

   static constexpr std::tuple MEMBERS{
     smc::_m{
       "ATC Type",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
       &TrafficInfo::atc_type_,
     },
     smc::_m{
       "ATC Model",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
       &TrafficInfo::atc_model_,
     },
     smc::_m{
       "ATC Id",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
       &TrafficInfo::atc_id_,
     },
     smc::_m{
       "Category",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
       &TrafficInfo::category_,
     },

     smc::_m{
       "Is User Sim",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "bool",
       &TrafficInfo::is_user_sim_,
     },
     smc::_m{
       "Wing Span",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "feet",
       &TrafficInfo::wing_span_,
     },

     smc::_m{
       "Plane Altitude",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT32>{},
       "feet",
       &TrafficInfo::altitude_,
     },
     smc::_m{
       "Plane Latitude",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "degrees",
       &TrafficInfo::lat_
     },
     smc::_m{
       "Plane Longitude",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "degrees",
       &TrafficInfo::lon_
     },
     smc::_m{
       "Ground Velocity",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT32>{},
       "knots",
       &TrafficInfo::ground_velocity_
     },

     smc::_m{
       "Plane Heading Degrees True",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT32>{},
       "degrees",
       &TrafficInfo::true_heading_
     },

     smc::_m{
       "Sim On Ground",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "bool",
       &TrafficInfo::sim_on_ground_,
     },
     smc::_m{
       "Airspeed True",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT32>{},
       "knots",
       &TrafficInfo::true_airspeed_,
     },
     smc::_m{
       "Vertical Speed",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT32>{},
       "feet per second",
       &TrafficInfo::vspeed_
     },
     smc::_m{
       "Transponder Code:1",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "number",
       &TrafficInfo::transponder_
     },
     smc::_m{
       "Number of Engines",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "number",
       &TrafficInfo::num_engines_
     },
     smc::_m{
       "Engine Type",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "number",
       &TrafficInfo::engine_type_,
     },

     smc::_m{
       "AI Traffic Fromairport",
       smc::_t<SIMCONNECT_DATATYPE_STRING32>{},
       std::nullopt,
       &TrafficInfo::atc_from_airport_
     },
     smc::_m{
       "AI Traffic Toairport",
       smc::_t<SIMCONNECT_DATATYPE_STRING32>{},
       std::nullopt,
       &TrafficInfo::atc_to_airport_
     }
   };
};

}  // namespace smc