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

namespace atc {

Handler::Handler(Main& main)
   : main_(main) {}

Handler::~Handler() { running_ = false; }

smc::TrafficInfo
Handler::GetUserAircraftInfo() noexcept(true) {
   std::shared_lock lock{mutex_};
   return user_aircraft_info_;
}

WPromise<void>
Handler::UserAircraftInfoLoop() noexcept(true) {
   return MakePromise([this]() -> Promise<void> {
      while (running_) {
         co_await main_.SimConnect().Connected();

         try {
            auto const& info = co_await main_.SimConnect().GetUserAircraftInfo();

            std::unique_lock lock{mutex_};
            user_aircraft_info_ = info;
         } catch (smc::Disconnected const&) {
            std::cerr << "ATC: SimConnect disconnected, retrying user aircraft info loop"
                      << std::endl;
         } catch (smc::Timeout const&) {
            std::cerr
              << "ATC: Timeout while waiting for SimConnect, retrying user aircraft info loop"
              << std::endl;
         } catch (smc::UnknownError const& e) {
            std::cerr << "ATC: Error while waiting for SimConnect: "
                      //   << e.what() #TODO: https://github.com/llvm/llvm-project/issues/182584
                      << ", retrying user aircraft info loop" << std::endl;
         } catch (std::exception const& e) {
            std::cerr << "ATC: Unexpected error while waiting for SimConnect: "
                      //   << e.what() #TODO: https://github.com/llvm/llvm-project/issues/182584
                      << ", retrying user aircraft info loop" << std::endl;
         }

         if (!running_) {
            break;
         }

         co_await main_.Wait(5s);
      }
   });
}

}  // namespace atc