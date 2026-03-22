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

struct Waypoint {
   std::string lat_{};
   std::string lon_{};
   std::string altitude_{};
   std::string on_ground_{};
   std::string speed_{};

   static constexpr std::tuple MEMBERS{
     smc::_m{
       "Plane Latitude",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       "degrees",
       &Waypoint::lat_,
     },
     smc::_m{
       "Plane Longitude",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       "degrees",
       &Waypoint::lon_,
     },
     smc::_m{
       "Plane Altitude",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       "feet",
       &Waypoint::altitude_,
     },
     smc::_m{
       "Plane On Ground",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       "bool",
       &Waypoint::on_ground_,
     },

     smc::_m{
       "Plane Speed",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       "knots",
       &Waypoint::speed_,
     },
   };
};

}  // namespace smc