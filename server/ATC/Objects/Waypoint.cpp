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
   result.Altitude        = alt_;
   result.ktsSpeed        = speed_.value_or(0);
   result.percentThrottle = throttle_.value_or(0);

   result.Flags = SIMCONNECT_WAYPOINT_COMPUTE_VERTICAL_SPEED;

   if (is_agl_) {
      result.Flags |= SIMCONNECT_WAYPOINT_ALTITUDE_IS_AGL;
   }

   if (alt_ == 0) {
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

std::vector<Waypoint>
StandardPattern(Coords runwayStart, Coords runwayEnd, bool leftHandTraffic) {
   auto const toMeter = [&runwayStart](Coords const& coords) constexpr {
      auto const& origin = runwayStart;

      constexpr double metersPerDegLat = 111320.0;

      double lat_rad = origin.first * std::numbers::pi_v<double> / 180.0;

      double dx = (coords.second - origin.second) * metersPerDegLat * std::cos(lat_rad);
      double dy = (coords.first - origin.first) * metersPerDegLat;

      return Coords{dx, dy};
   };
   auto const toDeg = [&runwayStart](Coords const& meters) constexpr {
      auto const& origin = runwayStart;

      constexpr double metersPerDegLat = 111320.0;

      double lat0 = origin.first;
      double lon0 = origin.second;

      double lat_rad = lat0 * std::numbers::pi_v<double> / 180.0;

      double lon = lon0 + meters.first / (metersPerDegLat * std::cos(lat_rad));
      double lat = lat0 + meters.second / metersPerDegLat;

      return Coords{lat, lon};
   };

   static constexpr auto NM_TO_METER = 1852.0;

   auto const altitude = 1000;  // feet
   // auto const margin   = 500;   // feet
   auto const dist      = 0.8 * NM_TO_METER;  // meters
   auto const flareDist = 100.0;              // meters

   auto const [startX, startY] = toMeter(runwayStart);
   auto const [endX, endY]     = toMeter(runwayEnd);

   auto const runwayLength = std::hypot(endX - startX, endY - startY);
   auto const fullLength   = dist * 2 + runwayLength;

   std::pair const dir    = {(endX - startX) / runwayLength, (endY - startY) / runwayLength};
   auto const      normal = std::make_pair(
     dir.second * (leftHandTraffic ? -1 : 1), dir.first * (leftHandTraffic ? 1 : -1)
   );

   // Upwind
   std::pair const wp1{
     endX + dir.first * dist,
     endY + dir.second * dist,
   };
   // Downwind entry point
   std::pair const wp2{
     wp1.first + normal.first * dist,
     wp1.second + normal.second * dist,
   };
   // Runway threshold
   std::pair const wp3{
     wp2.first - dir.first * (fullLength - dist),
     wp2.second - dir.second * (fullLength - dist),
   };
   // Base leg
   std::pair const wp4{
     wp2.first - dir.first * fullLength,
     wp2.second - dir.second * fullLength,
   };
   // Final approach
   std::pair const wp5{
     wp4.first - normal.first * dist,
     wp4.second - normal.second * dist,
   };
   // Flare point (10m before runway threshold)
   std::pair const wp6{
     startX - dir.first * flareDist,
     startY - dir.second * flareDist,
   };

   auto const wp1_coords = toDeg(wp1);
   auto const wp2_coords = toDeg(wp2);
   auto const wp3_coords = toDeg(wp3);
   auto const wp4_coords = toDeg(wp4);
   auto const wp5_coords = toDeg(wp5);
   auto const wp6_coords = toDeg(wp6);

   return {
     {
       .lat_       = wp1_coords.first,
       .lon_       = wp1_coords.second,
       .alt_       = altitude,
       .is_agl_    = true,
       .speed_     = 80,
       .gear_down_ = false,
     },
     {
       .lat_    = wp2_coords.first,
       .lon_    = wp2_coords.second,
       .alt_    = altitude,
       .is_agl_ = true,
       .speed_  = 70,
     },
     {
       .lat_    = wp3_coords.first,
       .lon_    = wp3_coords.second,
       .alt_    = altitude,
       .is_agl_ = true,
       .speed_  = 70,
     },
     {
       .lat_    = wp4_coords.first,
       .lon_    = wp4_coords.second,
       .alt_    = altitude * 2 / 3,
       .is_agl_ = true,
       .speed_  = 70,
     },
     // Final approach
     {
       .lat_       = wp5_coords.first,
       .lon_       = wp5_coords.second,
       .alt_       = altitude * 1 / 3,
       .is_agl_    = true,
       .speed_     = 60,
       .gear_down_ = true,
       .flaps_     = 2,
     },
     // Flare point
     {
       .lat_       = wp6_coords.first,
       .lon_       = wp6_coords.second,
       .tolerance_ = 0,
       // Scale altitude to be flareDist at the flare point
       .alt_    = (altitude * 1 / 3) * flareDist / dist,
       .is_agl_ = true,
       .speed_  = 20,
     },
     {
       .lat_       = runwayStart.first,
       .lon_       = runwayStart.second,
       .tolerance_ = 0,
       .alt_       = 0,
       .is_agl_    = true,
       .speed_     = 0.,
     },
     {
       .lat_       = (runwayStart.first + runwayEnd.first) * 0.5,
       .lon_       = (runwayStart.second + runwayEnd.second) * 0.5,
       .tolerance_ = 0,
       .alt_       = 0,
       .is_agl_    = true,
       .throttle_  = 0.,
     },
     {
       .lat_       = runwayEnd.first,
       .lon_       = runwayEnd.second,
       .tolerance_ = 0,
       .alt_       = 0,
       .is_agl_    = true,
       .throttle_  = 0.,
     },
   };
}