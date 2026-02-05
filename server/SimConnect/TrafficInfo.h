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

#include "DataType.h"

#include <string>
#include <tuple>

struct TrafficInfo {
   std::string atc_type_{};
   std::string atc_model_{};
   std::string atc_id_{};
   std::string category_{};

   int32_t is_user_sim_{};
   int32_t wing_span_{};

   float  plane_altitude_{};
   double plane_latitude_{};
   double plane_longitude_{};
   float  ground_velocity_{};

   float plane_heading_degrees_true_{};

   int32_t sim_on_ground_{};

   float airspeed_true_{};
   float vertical_speed_{};

   int32_t transponder_code_{};

   int32_t number_of_engines_{};
   int32_t engine_type_{};

   std::string atc_from_airport_{};
   std::string atc_to_airport_{};

   static constexpr std::tuple MEMBERS{
     sm::_m{
       "ATC Type",
       sm::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
       &TrafficInfo::atc_type_,
     },
     sm::_m{
       "ATC Model",
       sm::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
       &TrafficInfo::atc_model_,
     },
     sm::_m{
       "ATC Id",
       sm::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
       &TrafficInfo::atc_id_,
     },
     sm::_m{
       "Category",
       sm::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
       &TrafficInfo::category_,
     },

     sm::_m{
       "Is User Sim",
       sm::_t<SIMCONNECT_DATATYPE_INT32>{},
       "bool",
       &TrafficInfo::is_user_sim_,
     },
     sm::_m{
       "Wing Span",
       sm::_t<SIMCONNECT_DATATYPE_INT32>{},
       "feet",
       &TrafficInfo::wing_span_,
     },

     sm::_m{
       "Plane Altitude",
       sm::_t<SIMCONNECT_DATATYPE_FLOAT32>{},
       "feet",
       &TrafficInfo::plane_altitude_,
     },
     sm::_m{
       "Plane Latitude",
       sm::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "degrees",
       &TrafficInfo::plane_latitude_
     },
     sm::_m{
       "Plane Longitude",
       sm::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "degrees",
       &TrafficInfo::plane_longitude_
     },
     sm::_m{
       "Ground Velocity",
       sm::_t<SIMCONNECT_DATATYPE_FLOAT32>{},
       "knots",
       &TrafficInfo::ground_velocity_
     },

     sm::_m{
       "Plane Heading Degrees True",
       sm::_t<SIMCONNECT_DATATYPE_FLOAT32>{},
       "degrees",
       &TrafficInfo::plane_heading_degrees_true_
     },

     sm::_m{
       "Sim On Ground",
       sm::_t<SIMCONNECT_DATATYPE_INT32>{},
       "bool",
       &TrafficInfo::sim_on_ground_,
     },
     sm::_m{
       "Airspeed True",
       sm::_t<SIMCONNECT_DATATYPE_FLOAT32>{},
       "knots",
       &TrafficInfo::airspeed_true_,
     },
     sm::_m{
       "Vertical Speed",
       sm::_t<SIMCONNECT_DATATYPE_FLOAT32>{},
       "feet per second",
       &TrafficInfo::vertical_speed_
     },
     sm::_m{
       "Transponder Code:1",
       sm::_t<SIMCONNECT_DATATYPE_INT32>{},
       "number",
       &TrafficInfo::transponder_code_
     },
     sm::_m{
       "Number of Engines",
       sm::_t<SIMCONNECT_DATATYPE_INT32>{},
       "number",
       &TrafficInfo::number_of_engines_
     },
     sm::_m{
       "Engine Type",
       sm::_t<SIMCONNECT_DATATYPE_INT32>{},
       "number",
       &TrafficInfo::engine_type_,
     },

     sm::_m{
       "AI Traffic Fromairport",
       sm::_t<SIMCONNECT_DATATYPE_STRING32>{},
       std::nullopt,
       &TrafficInfo::atc_from_airport_
     },
     sm::_m{
       "AI Traffic Toairport",
       sm::_t<SIMCONNECT_DATATYPE_STRING32>{},
       std::nullopt,
       &TrafficInfo::atc_to_airport_
     }
   };
};