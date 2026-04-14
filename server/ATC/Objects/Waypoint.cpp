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
#include <ranges>

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

Coords
Waypoint::ToMeter(Coords const& origin, Coords const& coords) {
   constexpr double metersPerDegLat = 111320.0;

   double lat_rad = origin.first * std::numbers::pi_v<double> / 180.0;

   double dx = (coords.second - origin.second) * metersPerDegLat * std::cos(lat_rad);
   double dy = (coords.first - origin.first) * metersPerDegLat;

   return Coords{dx, dy};
}

Coords
Waypoint::ToDeg(Coords const& origin, Coords const& coords) {
   constexpr double metersPerDegLat = 111320.0;

   double lat0 = origin.first;
   double lon0 = origin.second;

   double lat_rad = lat0 * std::numbers::pi_v<double> / 180.0;

   double lon = lon0 + coords.first / (metersPerDegLat * std::cos(lat_rad));
   double lat = lat0 + coords.second / metersPerDegLat;

   return Coords{lat, lon};
}

std::vector<Waypoint>
StandardPattern(Coords runwayStart, Coords runwayEnd, bool leftHandTraffic) {
   auto const toMeter = [&runwayStart](Coords const& coords) constexpr {
      return Waypoint::ToMeter(runwayStart, coords);
   };
   auto const toDeg = [&runwayStart](Coords const& meters) constexpr {
      return Waypoint::ToDeg(runwayStart, meters);
   };

   static constexpr auto NM_TO_METER = 1852.0;
   //  static constexpr auto METER_TO_NM = 1.0 / NM_TO_METER;

   auto const altitude = 1000;  // feet
   // auto const margin   = 500;   // feet
   auto const dist = 1. * NM_TO_METER;  // meters

   auto const [endX, endY] = toMeter(runwayEnd);

   auto const runwayLength = std::hypot(endX, endY);
   auto const fullLength   = dist * 2 + runwayLength;

   std::pair const dir    = {endX / runwayLength, endY / runwayLength};
   auto const      normal = std::make_pair(
     dir.second * (leftHandTraffic ? -1 : 1), dir.first * (leftHandTraffic ? 1 : -1)
   );

   // Touchdown point, 20m from runway start
   auto const [touchX, touchY] = std::make_pair(dir.first * 20, dir.second * 20);

   // Upwind
   std::pair const upwind{
     endX + dir.first * dist,
     endY + dir.second * dist,
   };
   // Downwind entry point
   std::pair const downwind{
     upwind.first + normal.first * dist,
     upwind.second + normal.second * dist,
   };
   // Runway threshold
   std::pair const threshold{
     downwind.first - dir.first * (fullLength - dist),
     downwind.second - dir.second * (fullLength - dist),
   };
   // Base leg
   std::pair const base{
     downwind.first - dir.first * fullLength,
     downwind.second - dir.second * fullLength,
   };

   // Final
   std::pair const final{
     base.first - normal.first * dist,
     base.second - normal.second * dist,
   };

   Coords const pre_flare{touchX - dir.first * 300, touchY - dir.second * 300};
   Coords const pre_flare2{touchX - dir.first * 100, touchY - dir.second * 100};
   Coords const pre_touchdown{touchX - dir.first * 5, touchY - dir.second * 5};
   Coords const touchdown{touchX, touchY};
   Coords const decel_point{touchX + dir.first * 100, touchY + dir.second * 100};

   Coords const mid_point{endX * 0.5, endY * 0.5};

   return std::vector<Waypoint>{
            {
              .lat_    = upwind.first,
              .lon_    = upwind.second,
              .alt_    = altitude,
              .is_agl_ = true,
              .speed_  = 80,
            },
            {
              .lat_       = downwind.first,
              .lon_       = downwind.second,
              .alt_       = altitude,
              .is_agl_    = true,
              .speed_     = 70,
              .gear_down_ = false,
              .flaps_     = 0,
            },
            {
              .lat_    = threshold.first,
              .lon_    = threshold.second,
              .alt_    = altitude,
              .is_agl_ = true,
              .speed_  = 70,
            },
            {
              .lat_    = base.first,
              .lon_    = base.second,
              .alt_    = altitude * 2 / 3,
              .is_agl_ = true,
              .speed_  = 70,
            },
            // Final approach
            {
              .lat_       = final.first,
              .lon_       = final.second,
              .alt_       = altitude * 1 / 3,
              .is_agl_    = true,
              .speed_     = 60,
              .gear_down_ = true,
              .flaps_     = 3,
            },
            // Pre-flare point, 300m from touchdown
            {
              .lat_       = pre_flare.first,
              .lon_       = pre_flare.second,
              .tolerance_ = 0,
              .alt_       = 10,
              .is_agl_    = true,
              .speed_     = 45.,
              .break_     = std::make_pair(1.0, 1.0),
            },
            // Pre-flare point, 100m from touchdown
            {
              .lat_       = pre_flare2.first,
              .lon_       = pre_flare2.second,
              .tolerance_ = 0,
              .alt_       = 5,
              .is_agl_    = true,
              .speed_     = 35.,
              .throttle_  = 30.,
            },
            //  Pre-Touchdown, 5m from touchdown
            {
              .lat_       = pre_touchdown.first,
              .lon_       = pre_touchdown.second,
              .tolerance_ = 0,
              .alt_       = 1,
              .is_agl_    = true,
              .speed_     = 20.,
              .throttle_  = 0.,
            },
            //  Touchdown
            {
              .lat_       = touchdown.first,
              .lon_       = touchdown.second,
              .tolerance_ = 0,
              .alt_       = 0,
              .is_agl_    = true,
              .speed_     = 20.,
              .throttle_  = 0.,
            },
            {
              .lat_       = decel_point.first,
              .lon_       = decel_point.second,
              .tolerance_ = 0,
              .alt_       = 0,
              .is_agl_    = true,
              .speed_     = 8.,
              .throttle_  = 0.,
            },
            {
              .lat_       = mid_point.first,
              .lon_       = mid_point.second,
              .tolerance_ = 0,
              .alt_       = 0,
              .is_agl_    = true,
              .speed_     = 4.,
              .throttle_  = 0.,
              .flaps_     = 0,
            },
            {
              .lat_       = runwayEnd.first,
              .lon_       = runwayEnd.second,
              .tolerance_ = 0,
              .alt_       = 0,
              .is_agl_    = true,
              .speed_     = 0.,
              .throttle_  = 0.,
              .break_     = std::make_pair(1.0, 1.0),
            },
          }
          | std::ranges::views::transform([&toDeg](Waypoint const& wp) constexpr {
               auto       result = wp;
               auto const coords = toDeg({wp.lat_, wp.lon_});
               result.lat_       = coords.first;
               result.lon_       = coords.second;
               return result;
            })
          | std::ranges::to<std::vector>();
}