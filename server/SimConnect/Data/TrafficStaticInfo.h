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

struct TrafficStaticInfo {
   std::string atc_type_{};
   std::string atc_model_{};
   std::string atc_id_{};
   std::string category_{};

   int32_t is_user_sim_{};
   int32_t wing_span_{};

   double static_pitch_{};
   double static_cg_to_ground_{};

   double design_vc_{};
   double design_vs0_{};
   double design_vs1_{};

   int32_t num_engines_{};
   int32_t engine_type_{};

   std::string atc_from_airport_{};
   std::string atc_to_airport_{};

   static constexpr auto MEMBERS = std::make_tuple(
     smc::_m{
       &TrafficStaticInfo::atc_type_,
       "ATC TYPE",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
     },
     smc::_m{
       &TrafficStaticInfo::atc_model_,
       "ATC MODEL",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
     },
     smc::_m{
       &TrafficStaticInfo::atc_id_,
       "ATC ID",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
     },
     smc::_m{
       &TrafficStaticInfo::category_,
       "CATEGORY",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       std::nullopt,
     },

     smc::_m{
       &TrafficStaticInfo::is_user_sim_,
       "IS USER SIM",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "bool",
     },
     smc::_m{
       &TrafficStaticInfo::wing_span_,
       "WING SPAN",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "feet",
     },

     smc::_m{
       &TrafficStaticInfo::static_pitch_,
       "STATIC PITCH",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
     },
     smc::_m{
       &TrafficStaticInfo::static_cg_to_ground_,
       "STATIC CG TO GROUND",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet",
     },

     smc::_m{
       &TrafficStaticInfo::design_vc_,
       "DESIGN SPEED VC",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet/second",
     },
     smc::_m{
       &TrafficStaticInfo::design_vs0_,
       "DESIGN SPEED VS0",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "knots",
     },
     smc::_m{
       &TrafficStaticInfo::design_vs1_,
       "DESIGN SPEED VS1",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "knots",
     },

     smc::_m{
       &TrafficStaticInfo::num_engines_,
       "NUMBER OF ENGINES",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "number",
     },
     smc::_m{
       &TrafficStaticInfo::engine_type_,
       "ENGINE TYPE",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "number",
     },

     smc::_m{
       &TrafficStaticInfo::atc_from_airport_,
       "AI TRAFFIC FROMAIRPORT",
       smc::_t<SIMCONNECT_DATATYPE_STRING32>{},
       std::nullopt,
     },
     smc::_m{
       &TrafficStaticInfo::atc_to_airport_,
       "AI TRAFFIC TOAIRPORT",
       smc::_t<SIMCONNECT_DATATYPE_STRING32>{},
       std::nullopt,
     }
   );
};

}  // namespace smc