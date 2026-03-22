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

#include "Aircraft.h"
#include "SimConnect/Data/TrafficInfo.h"

#include <Windows.h>
#include <SimConnect.h>

#include <utils/MessageQueue.h>
#include <utils/MessageQueueProxy.inl>
#include <utils/Poll.h>
#include <json/json.h>
#include <promise/promise.h>
#include <condition_variable>
#include <set>

class Main;

namespace atc {

class Handler {
public:
   using ObjectId = SIMCONNECT_RECV_ASSIGNED_OBJECT_ID;

protected:
   Handler()          = default;
   virtual ~Handler() = default;

public:
   // [[nodiscard]] virtual WPromise<bool>        SetServerPort(uint32_t port)          = 0;
   // [[nodiscard]] virtual WPromise<double>      GetGroundInfo(double lat, double lon) = 0;
   [[nodiscard]] virtual WPromise<smc::TrafficInfo> GetUserAircraftInfo() noexcept(true) = 0;
};

namespace priv {

class Handler
   : public atc::Handler
   , private MessageQueue {
public:
   Handler(Main& main);
   ~Handler() override;

private:
   WPromise<smc::TrafficInfo> GetUserAircraftInfo() noexcept(true) override;

   void UserAircraftLoop() noexcept(true);
   bool RegisterPending();
   void UnregisterPending();

   [[maybe_unused]] Main& main_;  //@todo remove maybe_unused

   std::set<ObjectId> aircrafts_{};
   smc::TrafficInfo   user_aircraft_info_{};
   Aircraft           aircraft_{main_};

   std::atomic<std::size_t> pending_{0};

   std::condition_variable_any cv_{};
   std::shared_mutex           mutex_{};
   bool                        running_{true};

   friend class utils::queue::Proxy<Handler, atc::Handler>;
};
}  // namespace priv

using ATCHandler = utils::queue::Proxy<atc::priv::Handler, atc::Handler>;

}  // namespace atc