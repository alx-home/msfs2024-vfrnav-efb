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

#include "SimConnect/FacilityData/Waypoint.h"
#include "SimConnect/Data/TrafficStaticInfo.h"
#include "SimConnect/Data/TrafficInfo.h"
#include "promise/CVPromise.h"
#include "promise/StatePromise.h"

#include <Windows.h>
#include <SimConnect.h>
#include <promise/promise.h>
#include <chrono>
#include <deque>
#include <shared_mutex>
#include <stdexcept>

class Main;

class Aircraft {
public:
   using WP = SIMCONNECT_DATA_WAYPOINT;

   Aircraft(Main& main);

   Aircraft(Aircraft const&)                = delete;
   Aircraft& operator=(Aircraft const&)     = delete;
   Aircraft(Aircraft&&) noexcept            = delete;
   Aircraft& operator=(Aircraft&&) noexcept = delete;

   virtual ~Aircraft();

   void Notify();

   WPromise<void> JoinTrafficPattern(std::string_view icao);

private:
   using ObjectId = SIMCONNECT_RECV_ASSIGNED_OBJECT_ID;

   WPromise<ObjectId>               SetID() const;
   WPromise<smc::TrafficStaticInfo> SetAircraftStaticInfo() const;

   WPromise<void> AircraftLoop();
   WPromise<void> SimRateLoop();
   WPromise<void> LandAircraft(Waypoint const& target, double slope, double height);
   WPromise<void> LandAircraftRollout(Coords<2> const& direction, double slope);
   WPromise<void> AlignWithWaypoint(Waypoint const& current_wp, smc::TrafficInfo const& info);

   template <class... WAYPOINTS>
   std::deque<Waypoint> TransformWaypoints(std::vector<WAYPOINTS> const&... waypoints);

   WPromise<void> Wait(std::optional<std::chrono::steady_clock::duration> timeout = std::nullopt);
   WPromise<void> WaitReady() const;
   WPromise<void> WaitDone() const;

   static double Distance(double lat1, double lon1, double lat2, double lon2);

   Main&        main_;
   StatePromise state_{};

   std::shared_mutex    mutex_{};
   std::deque<Waypoint> wp_{};

   CVPromise          update_promise_{};
   std::atomic<float> sim_rate_{1.0f};

   class TrafficInfoCache {
   public:
      explicit TrafficInfoCache(Aircraft& self);
      WPromise<smc::TrafficInfo> operator*();

   private:
      WPromise<smc::TrafficInfo> promise_{
        WPromise<smc::TrafficInfo>::Reject<std::runtime_error>("Not updated yet")
      };
      std::chrono::steady_clock::time_point traffic_info_last_update_{};

      Aircraft& self_;
   } traffic_info_{*this};

   WPromise<ObjectId> const               ID{SetID()};
   WPromise<smc::TrafficStaticInfo> const STATIC_INFO{SetAircraftStaticInfo()};
   WPromise<void> const                   PROMISE{AircraftLoop()};
   WPromise<void> const                   SIM_RATE_PROMISE{SimRateLoop()};
   WPromise<void> const                   INIT_PROMISE{JoinTrafficPattern("LFPN")};
};