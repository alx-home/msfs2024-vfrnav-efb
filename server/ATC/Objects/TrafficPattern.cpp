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

#include "TrafficPattern.h"

#include <cmath>
#include <numbers>

Pattern
Pattern::Standard(Coords<2> runwayStart, Coords<2> runwayEnd, double ratio, bool leftHandTraffic) {
   auto const toMeter = [&runwayStart](Coords<2> const& coords) {
      return Waypoint::ToMeter(runwayStart, coords);
   };
   auto const toDeg = [&runwayStart](Coords<2> const& meters) {
      return Waypoint::ToDeg(runwayStart, meters);
   };

   static constexpr auto NM_TO_METER = 1852.0;
   //  static constexpr auto METER_TO_NM = 1.0 / NM_TO_METER;

   auto const altitude = 1'000 * std::sqrt(ratio);  // feet
   // auto const margin   = 500;   // feet
   auto const dist       = ratio * NM_TO_METER;  // meters
   auto const sharp_dist = 250 * ratio;

   auto const approach_length = 3 * dist;
   auto const slope           = altitude / approach_length;

   auto const end = toMeter(runwayEnd);

   auto const runwayLength = end.Length();
   auto const fullLength   = dist * 2 + runwayLength;

   Coords const dir    = end.Normalized();
   Coords const normal = Coords{dir.Orthogonal() * (leftHandTraffic ? 1 : -1)};

   // Upwind
   Coords const upwind{end + dir * dist};
   Coords const upwind1{upwind - dir * sharp_dist};
   Coords const upwind2{upwind + normal * sharp_dist};

   // Downwind entry point
   Coords const downwind{upwind + normal * dist};
   Coords const downwind1{downwind - normal * sharp_dist};
   Coords const downwind2{downwind - dir * sharp_dist};
   Coords const downwind3{end + normal * dist};

   // Runway threshold
   Coords const threshold{downwind - dir * (fullLength - dist)};

   // Base leg
   Coords const base{downwind - dir * fullLength};
   Coords const base1{base + dir * sharp_dist};
   Coords const base2{base - normal * sharp_dist};

   // Final
   Coords const final{-dir * dist};
   Coords const final1{final + normal * sharp_dist};
   Coords const final2{final + dir * sharp_dist};

   // Alignment point on final approach, 400m from final
   Coords const mid_crosswind{final + normal * dist * 0.5};

   auto const touch = dir * runwayLength * 0.25;

   return Pattern{
     .begin_ =
       {
         runwayStart,
         altitude,
       },
     .end_ =
       {
         runwayEnd,
         altitude,
       },
     .vertical_ =
       {
         toDeg(end * 0.5),
         altitude + 500,
       },
     .integration1_ =
       {
         toDeg(end * 0.5 + (1.5 * dist) * normal - normal * sharp_dist),
         altitude + 500,
       },
     .integration2_ =
       {
         toDeg(end * 0.5 + (1.5 * dist) * normal + dir * sharp_dist),
         altitude + 500,
       },

     .integration3_ =
       {
         toDeg(end + (0.5 * dist) * dir + (1.5 * dist) * normal - dir * sharp_dist),
         altitude,
       },
     .integration4_ =
       {
         toDeg(end + (0.5 * dist) * dir + (1.5 * dist) * normal - normal * sharp_dist),
         altitude,
       },

     .upwind_ =
       {
         toDeg(upwind),
         altitude,
       },
     .upwind1_ =
       {
         toDeg(upwind1),
         altitude,
       },
     .upwind2_ =
       {
         toDeg(upwind2),
         altitude,
       },
     .downwind_ =
       {
         toDeg(downwind),
         altitude,
       },
     .downwind1_ =
       {
         toDeg(downwind1),
         altitude,
       },
     .downwind2_ =
       {
         toDeg(downwind2),
         altitude,
       },
     .downwind3_ =
       {
         toDeg(downwind3),
         altitude,
       },
     .threshold_ =
       {
         toDeg(threshold),
         altitude,
       },
     .base_ =
       {
         toDeg(base),
         slope * (approach_length - dist),
       },
     .base1_ =
       {
         toDeg(base1),
         slope * (approach_length - (dist - sharp_dist)),
       },
     .base2_ =
       {
         toDeg(base2),
         slope * (approach_length - (dist + sharp_dist)),
       },
     .final_ =
       {
         toDeg(final),
         slope * (dist),
       },
     .final1_ =
       {
         toDeg(final1),
         slope * (dist + sharp_dist),
       },
     .final2_ =
       {
         toDeg(final2),
         slope * (dist - sharp_dist),
       },
     .mid_crosswind_ =
       {
         toDeg(mid_crosswind),
         slope * (1.5 * dist),
       },
     .touch_ = {
       toDeg(touch),
       0,
     },
   };
}

std::vector<Waypoint>
Pattern::Join() const {
   return {
     {
       .lat_    = vertical_.at(0),
       .lon_    = vertical_.at(1),
       .alt_    = vertical_.at(2),
       .is_agl_ = true,
       .speed_  = 80,
     },
     {
       .lat_     = integration1_.at(0),
       .lon_     = integration1_.at(1),
       .alt_     = integration1_.at(2),
       .is_agl_  = true,
       .speed_   = 80,
       .delayed_ = true,
     },
     {
       .lat_    = integration2_.at(0),
       .lon_    = integration2_.at(1),
       .alt_    = integration2_.at(2),
       .is_agl_ = true,
       .speed_  = 80,
     },
     {
       .lat_    = integration3_.at(0),
       .lon_    = integration3_.at(1),
       .alt_    = integration3_.at(2),
       .is_agl_ = true,
       .speed_  = 80,
     },
     {
       .lat_    = integration4_.at(0),
       .lon_    = integration4_.at(1),
       .alt_    = integration4_.at(2),
       .is_agl_ = true,
       .speed_  = 80,
     },
   };
}

std::vector<Waypoint>
Pattern::Loop() const {
   return {
     {
       .lat_     = downwind3_.at(0),
       .lon_     = downwind3_.at(1),
       .alt_     = downwind3_.at(2),
       .is_agl_  = true,
       .speed_   = 80,
       .delayed_ = true,
     },
     {
       .lat_    = threshold_.at(0),
       .lon_    = threshold_.at(1),
       .alt_    = threshold_.at(2),
       .is_agl_ = true,
       .speed_  = 80,
     },
     {
       .lat_    = base1_.at(0),
       .lon_    = base1_.at(1),
       .alt_    = base1_.at(2),
       .is_agl_ = true,
       .speed_  = 80,
     },
     {
       .lat_       = base2_.at(0),
       .lon_       = base2_.at(1),
       .alt_       = base2_.at(2),
       .is_agl_    = true,
       .speed_     = 80,
       .gear_down_ = true,
       .flaps_     = 2,
     },
     //  // Final approach
     //  {
     //    .lat_    = final1_.at(0),
     //    .lon_    = final1_.at(1),
     //    .alt_    = final1_.at(2),
     //    .is_agl_ = true,
     //    .speed_  = 80,
     //  },
     //  // Final approach
     //  {
     //    .lat_       = final2_.at(0),
     //    .lon_       = final2_.at(1),
     //    .alt_       = final2_.at(2),
     //    .is_agl_    = true,
     //    .speed_     = 80,
     //    .gear_down_ = true,
     //    .flaps_     = 2,
     //  },
   };
}

std::vector<Waypoint>
Pattern::Land() const {
   return {
     // Touchdown
     {
       .lat_    = mid_crosswind_.at(0),
       .lon_    = mid_crosswind_.at(1),
       .is_agl_ = true,
       .speed_  = 80,
       .land_   = Waypoint::Land{.start_ = final_, .end_ = touch_},
     },
   };
}

WPromise<Pattern>
Pattern::Make(SimConnect& simconnect, std::string_view icao, double ratio) {
   return [&simconnect, icao = std::string{icao}, ratio] -> Promise<Pattern> {
      auto airport = co_await simconnect.GetAirportFacility(icao);
      co_return Make(airport, ratio);
   };
}

Pattern
Pattern::Make(smc::facility::AirportData const& airportData, double ratio) {
   auto const runway = airportData.runways_[0];

   Coords const origin{runway.latitude_, runway.longitude_};
   auto const   heading     = runway.heading_ * std::numbers::pi / 180.0;
   auto const   half_length = runway.length_ / 2.0;
   Coords const dir{std::sin(heading), std::cos(heading)};
   auto const   offset{dir * half_length};

   // @todo thresholds
   Coords const start{-offset};
   Coords const end{offset};

   return Pattern::Standard(
     Waypoint::ToDeg(origin, start), Waypoint::ToDeg(origin, end), ratio, false
   );
}