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
   , main_(main) {}

Handler::~Handler() {
   std::unique_lock lock{mutex_};
   running_ = false;
   cv_.notify_all();
}

WPromise<smc::TrafficInfo>
Handler::GetUserAircraftInfo() noexcept(true) {
   return MakePromise([this]() -> Promise<smc::TrafficInfo> {
      co_await ensure_();
      assert(std::this_thread::get_id() == MessageQueue::ThreadId());

      co_return user_aircraft_info_;
   });
}

WPromise<void>
Handler::UserAircraftInfoLoop() noexcept(true) {
   return MakePromise([this]() -> Promise<void> {
      while (running_) {
         try {
            auto const& info = co_await (co_await main_.SimConnect()).GetUserAircraftInfo();
            co_await ensure_();
            user_aircraft_info_ = info;

            assert(std::this_thread::get_id() == MessageQueue::ThreadId());
         } catch (smc::Disconnected const&) {
            std::cerr << "ATC: SimConnect disconnected, stopping user aircraft info loop"
                      << std::endl;
         } catch (smc::Timeout const&) {
            std::cerr
              << "ATC: Timeout while waiting for SimConnect, retrying user aircraft info loop"
              << std::endl;
         } catch (smc::UnknownError const& e) {
            std::cerr << "ATC: Error while waiting for SimConnect: " << e.what()
                      << ", retrying user aircraft info loop" << std::endl;
         } catch (std::exception const& e) {
            std::cerr << "ATC: Unexpected error while waiting for SimConnect: " << e.what()
                      << ", retrying user aircraft info loop" << std::endl;
         }

         if (!running_) {
            break;
         }
         co_await dispatch_(5s);
      }
   });
}

}  // namespace atc::priv