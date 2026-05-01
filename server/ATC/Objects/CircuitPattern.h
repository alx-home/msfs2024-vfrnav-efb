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

#include "Waypoint.h"

#include <Windows.h>
#include <SimConnect.h>
#include <utility>
#include <vector>

class Main;

namespace Circuit {

class Pattern {
public:
   Pattern() = default;

   explicit Pattern(std::vector<Waypoint> waypoints);
   virtual ~Pattern() = default;

   using Lat    = double;
   using Lon    = double;
   using Coords = std::pair<Lat, Lon>;
   static Pattern MakeStandard(Coords runwayStart, Coords runwayEnd, bool leftHandTraffic);

private:
   std::vector<Waypoint> waypoints_;
};

}  // namespace Circuit