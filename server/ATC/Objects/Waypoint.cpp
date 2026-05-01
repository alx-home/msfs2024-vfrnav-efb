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
#include <algorithm>
#include <cmath>
#include <numbers>
#include <ranges>

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

std::vector<Waypoint>
StandardPattern(Coords<2> runwayStart, Coords<2> runwayEnd, bool leftHandTraffic) {
   auto const toMeter = [&runwayStart](Coords<2> const& coords) constexpr {
      return Waypoint::ToMeter(runwayStart, coords);
   };
   auto const toDeg = [&runwayStart](Coords<2> const& meters) constexpr {
      return Waypoint::ToDeg(runwayStart, meters);
   };

   static constexpr auto NM_TO_METER = 1852.0;
   //  static constexpr auto METER_TO_NM = 1.0 / NM_TO_METER;

   auto const altitude = 1'000;  // feet
   // auto const margin   = 500;   // feet
   auto const dist = 1.0 * NM_TO_METER;  // meters

   auto const approach_length = 3 * dist;
   auto const slope           = altitude / approach_length;

   auto const end = toMeter(runwayEnd);

   auto const runwayLength = end.Length();
   auto const fullLength   = dist * 2 + runwayLength;

   Coords const dir    = end.Normalized();
   Coords const normal = Coords{dir.Orthogonal() * (leftHandTraffic ? 1 : -1)};

   // Target touchdown very early after threshold.
   auto const touch = dir * runwayLength * 0.25;

   // Upwind
   Coords const upwind{end + dir * dist};
   Coords const upwind1{upwind - dir * 250};
   Coords const upwind2{upwind + normal * 250};

   // Downwind entry point
   Coords const downwind{upwind + normal * dist};
   Coords const downwind1{downwind - normal * 250};
   Coords const downwind2{downwind - dir * 250};

   // Runway threshold
   Coords const threshold{downwind - dir * (fullLength - dist)};

   // Base leg
   Coords const base{downwind - dir * fullLength};
   Coords const base1{base + dir * 250};
   Coords const base2{base - normal * 250};

   // Final
   Coords const final{-dir * dist};
   Coords const final1{final + normal * 250};
   Coords const final2{final + dir * 250};

   // Alignment point on final approach, 400m from final
   Coords const alignment{final2 + dir * 400};

   auto const out = end - dir * 50;

   Coords const parking_point{toMeter({48.75345, 2.11539})};

   return std::vector<Waypoint>{
            {
              .lat_    = upwind1.at(0),
              .lon_    = upwind1.at(1),
              .alt_    = altitude,
              .is_agl_ = true,
              .speed_  = 80,
            },
            {
              .lat_    = upwind2.at(0),
              .lon_    = upwind2.at(1),
              .alt_    = altitude,
              .is_agl_ = true,
              .speed_  = 80,
            },
            {
              .lat_       = downwind1.at(0),
              .lon_       = downwind1.at(1),
              .alt_       = altitude,
              .is_agl_    = true,
              .speed_     = 70,
              .gear_down_ = false,
              .flaps_     = 0,
            },
            {
              .lat_    = downwind2.at(0),
              .lon_    = downwind2.at(1),
              .alt_    = altitude,
              .is_agl_ = true,
              .speed_  = 70,
            },
            {
              .lat_    = threshold.at(0),
              .lon_    = threshold.at(1),
              .alt_    = altitude,
              .is_agl_ = true,
              .speed_  = 70,
            },
            {
              .lat_    = base1.at(0),
              .lon_    = base1.at(1),
              .alt_    = slope * (approach_length - (dist - 250)),
              .is_agl_ = true,
              .speed_  = 70,
            },
            {
              .lat_    = base2.at(0),
              .lon_    = base2.at(1),
              .alt_    = slope * (approach_length - (dist + 250)),
              .is_agl_ = true,
              .speed_  = 70,
            },
            // Final approach
            {
              .lat_    = final1.at(0),
              .lon_    = final1.at(1),
              .alt_    = slope * (dist + 250),
              .is_agl_ = true,
              .speed_  = 60,
            },
            // Final approach
            {
              .lat_       = final2.at(0),
              .lon_       = final2.at(1),
              .alt_       = slope * (dist - 250),
              .is_agl_    = true,
              .speed_     = 60,
              .gear_down_ = true,
              .flaps_     = 2,
            },
            // Alignment point, 400m from final
            {
              .lat_       = alignment.at(0),
              .lon_       = alignment.at(1),
              .tolerance_ = 5,
              .alt_       = slope * (dist - 450),
              .is_agl_    = true,
              .speed_     = 60,
            },
            // Threshold
            {
              .lat_       = 0,
              .lon_       = 0,
              .tolerance_ = 400,
              .alt_       = 50,
              .is_agl_    = true,
              .speed_     = 20,
            },
            // Touchdown
            {
              .lat_       = touch.at(0),
              .lon_       = touch.at(1),
              .tolerance_ = 10,
              .is_agl_    = true,
              .speed_     = 20,
              .on_ground_ = true,
            },
            {
              .lat_       = out.at(0),
              .lon_       = out.at(1),
              .tolerance_ = 10,
              .is_agl_    = true,
              .speed_     = 20.,
              .on_ground_ = true,
            },
            {
              .lat_       = parking_point.at(0),
              .lon_       = parking_point.at(1),
              .tolerance_ = 10,
              .is_agl_    = true,
              .speed_     = 20.,
              .on_ground_ = true,
            },
          }
          | std::ranges::views::transform([&toDeg](Waypoint const& wp) constexpr {
               auto       result = wp;
               auto const coords = toDeg(Coords<2>{wp.lat_, wp.lon_});
               result.lat_       = coords.at(0);
               result.lon_       = coords.at(1);
               return result;
            })
          | std::ranges::to<std::vector>();
}