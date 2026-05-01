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
#include "promise/CVPromise.h"
#include "promise/StatePromise.h"

#include <Windows.h>
#include <SimConnect.h>
#include <promise/promise.h>
#include <chrono>
#include <deque>
#include <shared_mutex>

class Main;

class Aircraft {
public:
   using WP = SIMCONNECT_DATA_WAYPOINT;

   Aircraft(Main& main);
   virtual ~Aircraft();

   void Notify();

private:
   using ObjectId = SIMCONNECT_RECV_ASSIGNED_OBJECT_ID;

   WPromise<ObjectId>   SetID();
   WPromise<void>       AircraftLoop();
   WPromise<void>       SimRateLoop();
   WPromise<void>       InitWaypoint();
   std::deque<Waypoint> TransformWaypoints(std::vector<Waypoint> const& waypoints);

   WPromise<void> Wait(std::optional<std::chrono::steady_clock::duration> timeout = std::nullopt);

   static double Distance(double lat1, double lon1, double lat2, double lon2);

   Main&        main_;
   StatePromise state_{};

   std::shared_mutex    mutex_{};
   std::deque<Waypoint> wp_{};

   CVPromise          update_promise_{};
   std::atomic<float> sim_rate_{1.0f};

   WPromise<ObjectId> const ID{SetID()};
   WPromise<void> const     PROMISE{AircraftLoop()};
   WPromise<void> const     SIM_RATE_PROMISE{SimRateLoop()};
   WPromise<void> const     INIT_PROMISE{InitWaypoint()};
};