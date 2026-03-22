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
#include <promise/promise.h>
#include <array>

class Main;

struct Waypoint {
   double                lat_{};        // degrees
   double                lon_{};        // degrees
   double                tolerance_{};  // meters
   double                alt_{};        // feet
   bool                  is_agl_{};
   std::optional<double> speed_{};  // knots
   std::optional<double> throttle_{};
   bool                  interpolate_{true};

   SIMCONNECT_DATA_WAYPOINT Raw() const { return static_cast<SIMCONNECT_DATA_WAYPOINT>(*this); }

   operator SIMCONNECT_DATA_WAYPOINT() const;
};
class Aircraft {
public:
   using WP = SIMCONNECT_DATA_WAYPOINT;

   Aircraft(Main& main);
   virtual ~Aircraft() = default;

private:
   using ObjectId = SIMCONNECT_RECV_ASSIGNED_OBJECT_ID;

   WPromise<ObjectId>    SetID();
   WPromise<void>        AircraftLoop();
   std::vector<Waypoint> InitWaypoint();

   static double                Distance(double lat1, double lon1, double lat2, double lon2);
   static std::array<double, 4> Interpolate(
     double                lat1,
     double                lon1,
     double                lat2,
     double                lon2,
     double                distance,
     std::optional<double> full_distance = std::nullopt
   );
   static std::array<double, 4> Interpolate(
     double                lat1,
     double                lon1,
     double                lat2,
     double                lon2,
     double                lat,
     double                lon,
     double                heading,
     double                distance,
     std::optional<double> full_distance = std::nullopt
   );

   static std::pair<double, double> Alignment(
     double heading,
     double lat,
     double lon,
     double lat1,
     double lon1,
     double lat2,
     double lon2
   );

   Main& main_;

   std::vector<Waypoint> wp_{InitWaypoint()};

   WPromise<ObjectId> const ID{SetID()};
   WPromise<void> const     PROMISE{AircraftLoop()};
};