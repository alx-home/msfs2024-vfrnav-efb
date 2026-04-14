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

#include <Windows.h>
#include <SimConnect.h>
#include <optional>
#include <vector>

struct Waypoint {
   double                                   lat_{};           // degrees
   double                                   lon_{};           // degrees
   double                                   tolerance_{250};  // meters
   double                                   alt_{};           // feet
   bool                                     is_agl_{};
   std::optional<double>                    speed_{};     // knots
   std::optional<double>                    throttle_{};  // 0 to 16383
   std::optional<bool>                      gear_down_{};
   std::optional<std::pair<double, double>> break_{};
   std::optional<int>                       flaps_{};
   bool                                     delayed_{false};

   using Coords = std::pair<double, double>;

   static Coords ToMeter(Coords const& origin, Coords const& coords);
   static Coords ToDeg(Coords const& origin, Coords const& coords);

   SIMCONNECT_DATA_WAYPOINT Raw() const { return static_cast<SIMCONNECT_DATA_WAYPOINT>(*this); }

   operator SIMCONNECT_DATA_WAYPOINT() const;
};

using Lat    = double;
using Lon    = double;
using Coords = std::pair<Lat, Lon>;
std::vector<Waypoint>
StandardPattern(Coords runwayStart, Coords runwayEnd, bool leftHandTraffic = true);