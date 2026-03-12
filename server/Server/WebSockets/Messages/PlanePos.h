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

struct PlanePosContent {
   std::size_t           date_{};
   double                lat_{};
   double                lon_{};
   double                altitude_{};
   double                ground_{};
   double                heading_{};
   double                vertical_speed_{};
   double                wind_velocity_{};
   double                wind_direction_{};
   std::optional<double> indicated_air_speed_{};
   std::optional<double> true_air_speed_{};
   std::optional<double> ground_velocity_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"date", &PlanePosContent::date_},
     js::_{"lat", &PlanePosContent::lat_},
     js::_{"lon", &PlanePosContent::lon_},
     js::_{"altitude", &PlanePosContent::altitude_},
     js::_{"ground", &PlanePosContent::ground_},
     js::_{"heading", &PlanePosContent::heading_},
     js::_{"verticalSpeed", &PlanePosContent::vertical_speed_},
     js::_{"windVelocity", &PlanePosContent::wind_velocity_},
     js::_{"windDirection", &PlanePosContent::wind_direction_},
     js::_{"indicatedAirSpeed", &PlanePosContent::indicated_air_speed_},
     js::_{"trueAirSpeed", &PlanePosContent::true_air_speed_},
     js::_{"groundVelocity", &PlanePosContent::ground_velocity_},
   };
};

struct PlanePos : PlanePosContent {
   bool header_{true};

   static constexpr js::Proto PROTOTYPE{js::Extend{
     PlanePosContent::PROTOTYPE,
     js::_{"__PLANE_POS__", &PlanePos::header_},
   }};
};

struct PlanePos2 : PlanePosContent {
   std::optional<bool> header_{true};

   static constexpr js::Proto PROTOTYPE{js::Extend{
     PlanePosContent::PROTOTYPE,
     js::_{"__PLANE_POS__", &PlanePos2::header_},
   }};
};

struct PlaneBlob {
   bool header_{true};

   std::size_t                id_{};
   std::string                value_{};
   std::optional<std::size_t> version_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__PLANE_BLOB__", &PlaneBlob::header_},

     js::_{"id", &PlaneBlob::id_},
     js::_{"value", &PlaneBlob::value_},
     js::_{"version", &PlaneBlob::version_},
   };
};

}  // namespace ws::msg
