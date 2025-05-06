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

#include "Messages.h"

#include <json/json.h>

namespace ws::msg {

struct PlanePos : Header {
   bool header_{true};

   std::size_t date_{};
   double      lat_{};
   double      lon_{};
   double      altitude_{};
   double      ground_{};
   double      heading_{};
   double      vertical_speed_{};
   double      wind_velocity_{};
   double      wind_direction_{};

   static constexpr js::Proto PROTOTYPE{
     js::Extend{
       Header::PROTOTYPE,

       js::_{"__PLANE_POS__", &PlanePos::header_},

       js::_{"date", &PlanePos::date_},
       js::_{"lat", &PlanePos::lat_},
       js::_{"lon", &PlanePos::lon_},
       js::_{"altitude", &PlanePos::altitude_},
       js::_{"ground", &PlanePos::ground_},
       js::_{"heading", &PlanePos::heading_},
       js::_{"verticalSpeed", &PlanePos::vertical_speed_},
       js::_{"windVelocity", &PlanePos::wind_velocity_},
       js::_{"windDirection", &PlanePos::wind_direction_},
     },
   };
};

struct PlanePoses : Header {
   bool header_{true};

   std::size_t           id_{};
   std::vector<PlanePos> value_{};

   static constexpr js::Proto PROTOTYPE{
     js::Extend{
       Header::PROTOTYPE,

       js::_{"__PLANE_POSES__", &PlanePoses::header_},

       js::_{"id", &PlanePoses::id_},
       js::_{"value", &PlanePoses::value_},
     },
   };
};

}  // namespace ws::msg
