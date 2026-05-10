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

   double altitude_{};
   double ground_altitude_{};
   double lat_{};
   double lon_{};
   double ground_velocity_{};

   double true_heading_{};
   double pitch_{};
   double bank_{};

   double static_pitch_{};
   double static_cg_to_ground_{};

   double lateral_velocity_{};
   double yaw_rate_{};

   int32_t sim_on_ground_{};

   double true_airspeed_{};
   double vspeed_{};

   int32_t transponder_{};

   int32_t num_engines_{};
   int32_t engine_type_{};

   std::string atc_from_airport_{};
   std::string atc_to_airport_{};

   static constexpr auto MEMBERS = std::make_tuple(
     smc::_m{
       "ATC TYPE",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
       &TrafficInfo::atc_type_,
     },
     smc::_m{
       "ATC MODEL",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
       &TrafficInfo::atc_model_,
     },
     smc::_m{
       "ATC ID",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
       &TrafficInfo::atc_id_,
     },
     smc::_m{
       "CATEGORY",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
       &TrafficInfo::category_,
     },

     smc::_m{
       "IS USER SIM",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "bool",
       &TrafficInfo::is_user_sim_,
     },
     smc::_m{
       "WING SPAN",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "feet",
       &TrafficInfo::wing_span_,
     },

     smc::_m{
       "PLANE ALTITUDE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet",
       &TrafficInfo::altitude_,
     },
     smc::_m{
       "PLANE ALT ABOVE GROUND",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet",
       &TrafficInfo::ground_altitude_,
     },
     smc::_m{
       "PLANE LATITUDE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "degrees",
       &TrafficInfo::lat_
     },
     smc::_m{
       "PLANE LONGITUDE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "degrees",
       &TrafficInfo::lon_
     },
     smc::_m{
       "GROUND VELOCITY",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "knots",
       &TrafficInfo::ground_velocity_
     },

     smc::_m{
       "STATIC PITCH",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
       &TrafficInfo::static_pitch_
     },
     smc::_m{
       "STATIC CG TO GROUND",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet",
       &TrafficInfo::static_cg_to_ground_
     },

     smc::_m{
       "PLANE HEADING DEGREES TRUE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
       &TrafficInfo::true_heading_
     },

     smc::_m{
       "PLANE BANK DEGREES",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
       &TrafficInfo::bank_
     },

     smc::_m{
       "PLANE PITCH DEGREES",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
       &TrafficInfo::pitch_
     },

     smc::_m{
       "VELOCITY BODY X",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet per second",
       &TrafficInfo::lateral_velocity_
     },
     smc::_m{
       "ROTATION VELOCITY BODY Y",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet per second",
       &TrafficInfo::yaw_rate_
     },

     smc::_m{
       "SIM ON GROUND",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "bool",
       &TrafficInfo::sim_on_ground_,
     },
     smc::_m{
       "AIRSPEED TRUE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "knots",
       &TrafficInfo::true_airspeed_,
     },
     smc::_m{
       "VERTICAL SPEED",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet per second",
       &TrafficInfo::vspeed_
     },
     smc::_m{
       "TRANSPONDER CODE:1",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "number",
       &TrafficInfo::transponder_
     },
     smc::_m{
       "NUMBER OF ENGINES",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "number",
       &TrafficInfo::num_engines_
     },
     smc::_m{
       "ENGINE TYPE",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "number",
       &TrafficInfo::engine_type_,
     },

     smc::_m{
       "AI TRAFFIC FROMAIRPORT",
       smc::_t<SIMCONNECT_DATATYPE_STRING32>{},
       std::nullopt,
       &TrafficInfo::atc_from_airport_
     },
     smc::_m{
       "AI TRAFFIC TOAIRPORT",
       smc::_t<SIMCONNECT_DATATYPE_STRING32>{},
       std::nullopt,
       &TrafficInfo::atc_to_airport_
     }
   );
};

}  // namespace smc