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

#include <Windows.h>
#include <SimConnect.h>
#include <promise/promise.h>
#include <promise/CVPromise.h>
#include <promise/Mutex.h>
#include <promise/StatePromise.h>
#include <chrono>
#include <deque>
#include <optional>
#include <shared_mutex>

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
   struct Control {
      static constexpr double CLEAR = std::numeric_limits<double>::quiet_NaN();

      void Update(Control const& target);

      std::optional<double> pitch_{};    // In radians
      std::optional<double> heading_{};  // In degrees
      std::optional<double> speed_{};    // In knots
      std::optional<double> vspeed_{};   // In feet per second
   };
   using ObjectId = SIMCONNECT_RECV_ASSIGNED_OBJECT_ID;

   WPromise<ObjectId>               SetID() const;
   WPromise<smc::TrafficStaticInfo> SetAircraftStaticInfo() const;

   WPromise<void> AircraftLoop();
   WPromise<void> AircraftControlLoop();
   WPromise<void> SimRateLoop();
   WPromise<void> LandAircraft(Waypoint const& target, double slope, double height);
   WPromise<void> LandAircraftRollout(Coords<2> const& direction, double slope);
   WPromise<void> AlignWithWaypoint(Waypoint const& current_wp, smc::TrafficInfo const& info);

   WPromise<void> UpdateControl(Control&& target_control);

   template <class... WAYPOINTS>
   std::deque<Waypoint> TransformWaypoints(std::vector<WAYPOINTS> const&... waypoints);

   WPromise<void> Wait(std::optional<std::chrono::steady_clock::duration> timeout = std::nullopt);
   WPromise<void> Wait(std::optional<std::chrono::steady_clock::time_point> timeout);
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
      explicit TrafficInfoCache(
        Aircraft&                                  self,
        std::chrono::steady_clock::duration const& refresh_rate = std::chrono::seconds(1)
      );
      WPromise<smc::TrafficInfo> operator*();

   private:
      Aircraft& self_;

      smc::TrafficInfo                      cached_info_{};
      std::chrono::steady_clock::time_point last_update_{};
      promise::Mutex                        mutex_{};

      std::chrono::steady_clock::duration const REFRESH_RATE{std::chrono::seconds(1)};
   };

   TrafficInfoCache weak_info_{*this};
   TrafficInfoCache info_{*this, std::chrono::milliseconds(100)};

   WPromise<ObjectId> const ID{SetID()};

   Control        control_{};
   CVPromise      control_cv_{};
   promise::Mutex control_mutex_{};

   WPromise<smc::TrafficStaticInfo> const STATIC_INFO{SetAircraftStaticInfo()};
   WPromise<void> const                   AIRCRAFT_LOOP{AircraftLoop()};
   WPromise<void> const                   AIRCRAFT_CONTROL_LOOP{AircraftControlLoop()};
   WPromise<void> const                   SIM_RATE_PROMISE{SimRateLoop()};
   WPromise<void> const                   INIT_PROMISE{JoinTrafficPattern("LFPN")};
};
