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

#include "CircuitPattern.h"
#include <cmath>
#include <numbers>

namespace Circuit {

Pattern::Pattern(std::vector<Waypoint> waypoints)
   : waypoints_(std::move(waypoints)) {}

Pattern
Pattern::MakeStandard(Coords runwayStart, Coords runwayEnd, bool leftHandTraffic) {
   auto const altitude = 1000;  // feet
   // auto const margin   = 500;   // feet
   auto const dist = 0.8;  // nautical miles

   auto const degToMeter = 1852.0 / 360.0 * std::numbers::pi_v<double> * 6371000.0
                           * std::cos(runwayStart.first * std::numbers::pi_v<double> / 180.0);

   auto const startX = runwayStart.first * degToMeter;
   auto const startY = runwayStart.second * degToMeter;
   auto const endX   = runwayEnd.first * degToMeter;
   auto const endY   = runwayEnd.second * degToMeter;

   auto const runwayLength = std::hypot(endX - startX, endY - startY);
   auto const fullLength   = dist * 2 + runwayLength;

   std::pair const dir    = {(endX - startX) / runwayLength, (endY - startY) / runwayLength};
   auto const      normal = std::make_pair(
     dir.second * (leftHandTraffic ? -1 : 1), dir.first * (leftHandTraffic ? 1 : -1)
   );

   // Upwind
   std::pair const wp1{
     startX + dir.first * dist,
     startY + dir.second * dist,
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

   return Pattern{std::vector<Waypoint>{
     {
       .lat_    = wp1.first / degToMeter,
       .lon_    = wp1.second / degToMeter,
       .alt_    = altitude,
       .is_agl_ = true,
       .speed_  = 80,
     },
     {
       .lat_    = wp2.first / degToMeter,
       .lon_    = wp2.second / degToMeter,
       .alt_    = altitude,
       .is_agl_ = true,
       .speed_  = 80,
     },
     {
       .lat_    = wp3.first / degToMeter,
       .lon_    = wp3.second / degToMeter,
       .alt_    = altitude,
       .is_agl_ = true,
       .speed_  = 70,
     },
     {
       .lat_    = wp4.first / degToMeter,
       .lon_    = wp4.second / degToMeter,
       .alt_    = altitude * 2 / 3,
       .is_agl_ = true,
       .speed_  = 70,
     },
     // Final approach
     {
       .lat_       = wp5.first / degToMeter,
       .lon_       = wp5.second / degToMeter,
       .alt_       = altitude * 1 / 3,
       .is_agl_    = true,
       .speed_     = 70,
       .gear_down_ = true,
     },
     {
       .lat_       = runwayStart.first / degToMeter,
       .lon_       = runwayStart.second / degToMeter,
       .tolerance_ = 0,
       .alt_       = 0,
       .is_agl_    = true,
       .speed_     = 20.,
       .throttle_  = 20.,
     },
     {
       .lat_       = (runwayStart.first + runwayEnd.first) * 0.5 / degToMeter,
       .lon_       = (runwayStart.second + runwayEnd.second) * 0.5 / degToMeter,
       .tolerance_ = 0,
       .alt_       = 0,
       .is_agl_    = true,
       .speed_     = 0.,
     },
   }};
}

}  // namespace Circuit