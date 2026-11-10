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

#include "Objects/Aircraft.h"
#include "SimConnect/Data/TrafficInfo.h"

#include <Windows.h>
#include <SimConnect.h>

#include <utils/MessageQueue.h>
#include <utils/MessageQueueProxy.inl>
#include <utils/Pool.h>
#include <json/json.h>
#include <promise/promise.h>
#include <condition_variable>
#include <set>

class Main;

namespace atc {

class Handler {
public:
   using ObjectId = SIMCONNECT_RECV_ASSIGNED_OBJECT_ID;

   Handler(Main& main);
   virtual ~Handler();

private:
   smc::TrafficInfo GetUserAircraftInfo() noexcept(true);

   WPromise<void> UserAircraftInfoLoop() noexcept(true);

   [[maybe_unused]] Main& main_;  //@todo remove maybe_unused

   smc::TrafficInfo     user_aircraft_info_{};
   WPromise<void> const USER_AIRCRAFT_INFO_LOOP{UserAircraftInfoLoop()};

   std::set<ObjectId> aircrafts_{};
   Aircraft           aircraft_{main_};

   std::shared_mutex mutex_{};
   bool              running_{true};
};

}  // namespace atc