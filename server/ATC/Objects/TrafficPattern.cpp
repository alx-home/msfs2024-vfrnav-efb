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
Pattern::Standard(Coords<2> runwayStart, Coords<2> runwayEnd, bool leftHandTraffic) {
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

   // Target touchdown very early after threshold.
   auto const touchdown = dir * runwayLength * 0.10;

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
         toDeg(end / 2),
         altitude + 500,
       },
     .integration_ =
       {
         toDeg(end + (2. * dist) * (dir + normal)),
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
         slope * (approach_length - (dist - 250)),
       },
     .base2_ =
       {
         toDeg(base2),
         slope * (approach_length - (dist + 250)),
       },
     .final_ =
       {
         toDeg(final),
         slope * (dist),
       },
     .final1_ =
       {
         toDeg(final1),
         slope * (dist + 250),
       },
     .final2_ =
       {
         toDeg(final2),
         slope * (dist - 250),
       },
     .alignment_ =
       {
         toDeg(alignment),
         slope * (dist - 450),
       },
     .pre_touch_ =
       {
         toDeg(-dir * 120),
         1,
       },
     .touchdown_ =
       {
         toDeg(touchdown),
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
       .lat_     = integration_.at(0),
       .lon_     = integration_.at(1),
       .alt_     = integration_.at(2),
       .is_agl_  = true,
       .speed_   = 80,
       .delayed_ = true,
     },
   };
}

std::vector<Waypoint>
Pattern::Circulate() const {
   return {
     {
       .lat_    = downwind1_.at(0),
       .lon_    = downwind1_.at(1),
       .alt_    = downwind1_.at(2),
       .is_agl_ = true,
       .speed_  = 80,
     },
     {
       .lat_    = downwind2_.at(0),
       .lon_    = downwind2_.at(1),
       .alt_    = downwind2_.at(2),
       .is_agl_ = true,
       .speed_  = 80,
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
       .lat_    = base2_.at(0),
       .lon_    = base2_.at(1),
       .alt_    = base2_.at(2),
       .is_agl_ = true,
       .speed_  = 80,
     },
     // Final approach
     {
       .lat_    = final1_.at(0),
       .lon_    = final1_.at(1),
       .alt_    = final1_.at(2),
       .is_agl_ = true,
       .speed_  = 80,
     },
     // Final approach
     {
       .lat_       = final2_.at(0),
       .lon_       = final2_.at(1),
       .alt_       = final2_.at(2),
       .is_agl_    = true,
       .speed_     = 80,
       .gear_down_ = true,
       .flaps_     = 2,
     },
   };
}

std::vector<Waypoint>
Pattern::Land() const {
   return {
     // Alignment point, 400m from final
     {
       .lat_    = alignment_.at(0),
       .lon_    = alignment_.at(1),
       .alt_    = alignment_.at(2),
       .is_agl_ = true,
       .speed_  = 60,
     },
     // Threshold
     {
       .lat_    = pre_touch_.at(0),
       .lon_    = pre_touch_.at(1),
       .alt_    = pre_touch_.at(2),
       .is_agl_ = true,
       .speed_  = 60,
     },
     // Touchdown
     {
       .lat_       = touchdown_.at(0),
       .lon_       = touchdown_.at(1),
       .is_agl_    = true,
       .speed_     = 20,
       .on_ground_ = true,
     },
   };
}

WPromise<Pattern>
Pattern::Make(SimConnect& simconnect, std::string_view icao) {
   return MakePromise([&simconnect, icao = std::string{icao}] -> Promise<Pattern> {
      auto airport = co_await simconnect.GetAirportFacility(icao);
      co_return Make(airport);
   });
}

Pattern
Pattern::Make(smc::facility::AirportData const& airportData) {
   auto const runway = airportData.runways_[0];

   Coords const origin{runway.latitude_, runway.longitude_};
   auto const   heading     = runway.heading_ * std::numbers::pi / 180.0;
   auto const   half_length = runway.length_ / 2.0;
   Coords const dir{std::sin(heading), std::cos(heading)};
   auto const   offset{dir * half_length};

   // @todo thresholds
   Coords const start{-offset};
   Coords const end{offset};

   return Pattern::Standard(Waypoint::ToDeg(origin, start), Waypoint::ToDeg(origin, end), false);
}