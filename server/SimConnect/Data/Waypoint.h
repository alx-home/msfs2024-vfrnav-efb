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

   static constexpr auto MEMBERS = std::make_tuple(
     smc::_m{
       &Waypoint::lat_,
       "Plane Latitude",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       "degrees",
     },
     smc::_m{
       &Waypoint::lon_,
       "Plane Longitude",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       "degrees",
     },
     smc::_m{
       &Waypoint::altitude_,
       "Plane Altitude",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       "feet",
     },
     smc::_m{
       &Waypoint::on_ground_,
       "Plane On Ground",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       "bool",
     },

     smc::_m{
       &Waypoint::speed_,
       "Plane Speed",
       smc::_t<SIMCONNECT_DATATYPE_STRING256>{},
       "knots",
     }
   );
};

}  // namespace smc