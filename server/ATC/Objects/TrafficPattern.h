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
#include "SimConnect/FacilityData/AirportFacility.h"
#include "SimConnect/SimConnect.h"

#include <Windows.h>
#include <SimConnect.h>

class Main;

struct Pattern {
   Coords<3> begin_;
   Coords<3> end_;
   Coords<3> vertical_;
   Coords<3> integration_;

   Coords<3> upwind_;
   Coords<3> upwind1_;
   Coords<3> upwind2_;

   Coords<3> downwind_;
   Coords<3> downwind1_;
   Coords<3> downwind2_;

   Coords<3> threshold_;

   Coords<3> base_;
   Coords<3> base1_;
   Coords<3> base2_;

   Coords<3> final_;
   Coords<3> final1_;
   Coords<3> final2_;

   Coords<3> alignment_;
   Coords<3> pre_touch_;
   Coords<3> touchdown_;

   std::vector<Waypoint> Join() const;
   std::vector<Waypoint> Circulate() const;
   std::vector<Waypoint> Land() const;

   static WPromise<Pattern> Make(SimConnect& simconnect, std::string_view icao);
   static Pattern           Make(smc::facility::AirportData const& airportData);
   static Pattern Standard(Coords<2> runwayStart, Coords<2> runwayEnd, bool leftHandTraffic = true);
};