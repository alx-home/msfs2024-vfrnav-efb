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

#include "ATCHandler.h"

#include "main.h"
#include "SimConnect/SimConnect.inl"

#include <SimConnect.h>
#include <promise/promise.h>
#include <shared_mutex>

using namespace std::chrono_literals;

namespace atc::priv {

Handler::Handler(Main& main)
   : MessageQueue{"ATC Main"}
   , main_(main) {
   (void)Dispatch([this]() constexpr { UserAircraftLoop(); });
}

Handler::~Handler() {
   std::unique_lock lock{mutex_};
   running_ = false;

   MessageQueue::Stop();
   cv_.wait(lock, [this] { return pending_ == 0; });
}

WPromise<smc::TrafficInfo>
Handler::GetUserAircraftInfo() noexcept(true) {
   return MakePromise([this]() -> Promise<smc::TrafficInfo> {
      co_await ensure_();
      assert(std::this_thread::get_id() == MessageQueue::ThreadId());

      co_return user_aircraft_info_;
   });
}

void
Handler::UserAircraftLoop() noexcept(true) {
   if (!RegisterPending()) {
      return;
   }

   if (!main_.SimConnect([this](smc::api::SimConnect& simConnect) constexpr {
          simConnect.GetUserAircraftInfo()
            .Then([this](smc::TrafficInfo const& info) -> Promise<void> {
               co_await ensure_();
               assert(std::this_thread::get_id() == MessageQueue::ThreadId());
               user_aircraft_info_ = info;

               // Poll the user aircraft info every 5 seconds to keep it up to date
               co_await dispatch_(5s);
               assert(std::this_thread::get_id() == MessageQueue::ThreadId());
               UserAircraftLoop();
            })
            .Catch([this](smc::Timeout const&) -> Promise<void> {
               std::cerr << "ATC: Timeout while getting user aircraft info" << std::endl;
               // Poll the user aircraft info every 5 seconds to keep it up to date
               co_await dispatch_(5s);
               assert(std::this_thread::get_id() == MessageQueue::ThreadId());
               UserAircraftLoop();
            })
            .Catch([this](smc::Disconnected const&) -> Promise<void> {
               // Poll the user aircraft info every 5 seconds to keep it up to date
               co_await dispatch_(5s);
               assert(std::this_thread::get_id() == MessageQueue::ThreadId());
               UserAircraftLoop();
            })
            .Catch([this](smc::UnknownError const& e) -> Promise<void> {
               std::cerr << "ATC: Error getting user aircraft info: " << e.what() << std::endl;

               // Poll the user aircraft info every 5 seconds to keep it up to date
               co_await dispatch_(5s);
               assert(std::this_thread::get_id() == MessageQueue::ThreadId());
               UserAircraftLoop();
            })
            .Catch([](std::exception const& e) constexpr {
               std::cerr << "ATC: Error getting user aircraft info: " << e.what() << std::endl;
            })
            .Finally([this] constexpr { UnregisterPending(); })
            .Detach();
       })) {
      std::cerr << "ATC: Failed to start user aircraft loop: SimConnect is stopped" << std::endl;
      UnregisterPending();
   }
}

bool
Handler::RegisterPending() {
   std::shared_lock lock{mutex_};

   if (!running_) {
      return false;
   }

   ++pending_;
   return true;
}

void
Handler::UnregisterPending() {
   std::shared_lock lock{mutex_};

   auto const pending = --pending_;
   assert(pending >= 0);
   if (pending == 0) {
      cv_.notify_all();
   }
}

}  // namespace atc::priv