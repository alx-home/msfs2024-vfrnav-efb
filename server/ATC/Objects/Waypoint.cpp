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

#include "Waypoint.h"

#include <cmath>
#include <numbers>

Waypoint::operator SIMCONNECT_DATA_WAYPOINT() const {
   SIMCONNECT_DATA_WAYPOINT result{};
   static_assert(sizeof(result) == sizeof(SIMCONNECT_DATA_WAYPOINT), "Size mismatch");

   result.Latitude        = lat_;
   result.Longitude       = lon_;
   result.Altitude        = alt_.value_or(0);
   result.ktsSpeed        = speed_.value_or(0);
   result.percentThrottle = throttle_.value_or(0);

   result.Flags = 0;

   // For landing/rollout points, let the simulator handle flare and touchdown dynamics
   // instead of forcing a computed vertical speed profile.
   if (alt_.has_value() && (alt_.value() > 0)) {
      result.Flags |= SIMCONNECT_WAYPOINT_COMPUTE_VERTICAL_SPEED;
   }

   if (is_agl_) {
      result.Flags |= SIMCONNECT_WAYPOINT_ALTITUDE_IS_AGL;
   }

   if (on_ground_) {
      result.Flags |= SIMCONNECT_WAYPOINT_ON_GROUND | SIMCONNECT_WAYPOINT_ALTITUDE_IS_AGL;
   }

   if (speed_.has_value()) {
      result.Flags |= SIMCONNECT_WAYPOINT_SPEED_REQUESTED;
   }

   if (throttle_.has_value()) {
      result.Flags |= SIMCONNECT_WAYPOINT_THROTTLE_REQUESTED;
   }

   return result;
}

Coords<2>
Waypoint::ToMeter(Coords<2> const& origin, Coords<2> const& coords) {
   constexpr double metersPerDegLat = 111320.0;

   double lat_rad = origin.at(0) * std::numbers::pi_v<double> / 180.0;

   double dx = (coords.at(1) - origin.at(1)) * metersPerDegLat * std::cos(lat_rad);
   double dy = (coords.at(0) - origin.at(0)) * metersPerDegLat;

   return Coords{dx, dy};
}

Coords<2>
Waypoint::ToDeg(Coords<2> const& origin, Coords<2> const& coords) {
   constexpr double metersPerDegLat = 111320.0;

   double lat0 = origin.at(0);
   double lon0 = origin.at(1);

   double lat_rad = lat0 * std::numbers::pi_v<double> / 180.0;

   double lon = lon0 + coords.at(0) / (metersPerDegLat * std::cos(lat_rad));
   double lat = lat0 + coords.at(1) / metersPerDegLat;

   return Coords{lat, lon};
}