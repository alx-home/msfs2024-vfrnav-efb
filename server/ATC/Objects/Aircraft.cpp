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

#include "Aircraft.inl"

#include "Aircraft.h"
#include "main.h"
#include "Waypoint.h"

#include "SimConnect/SimConnect.inl"
#include "SimConnect/Data/GearDown.h"
#include "SimConnect/Data/Flaps.h"
#include "utils/Scoped.h"

#include <promise/promise.h>
#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <numbers>
#include <stdexcept>

using namespace std::chrono_literals;
using namespace std::chrono;

Aircraft::Aircraft(Main& main)
   : main_(main) {};

Aircraft::~Aircraft() {
   running_ = false;
   NotifyException<std::runtime_error>("Aircraft destroyed, stopping aircraft loop");
}

WPromise<Aircraft::ObjectId>
Aircraft::SetID() {
   return MakePromise([this] -> Promise<Aircraft::ObjectId> {
      while (true) {
         try {
            auto titles = co_await (co_await main_.SimConnect()).GetTrafficTitles();
            assert(titles.size() > 0);

            co_return co_await (co_await main_.SimConnect())
              .AICreateNonATCAircraft(
                titles.at(0).first,
                "LF-KYUW",
                {
                  .Latitude  = 48.75120,
                  .Longitude = 2.09872,
                  .Altitude  = 1500,
                  .Pitch     = 0,
                  .Bank      = 0,
                  .Heading   = 80,
                  .OnGround  = FALSE,
                  .Airspeed  = 80,
                }
              );
         } catch (smc::Disconnected const&) {
         }

         co_await main_.dispatch_(5s);
      }
   });
}

std::vector<Waypoint>
Aircraft::InitWaypoint() {
   return TransformWaypoints(StandardPattern({48.75133, 2.09865}, {48.75451, 2.11282}, false));
}

double
Aircraft::Distance(double lat1, double lon1, double lat2, double lon2) {
   return 6371000.0
          * std::acos(
            std::sin(lat1 * std::numbers::pi / 180.0) * std::sin(lat2 * std::numbers::pi / 180.0)
            + std::cos(lat1 * std::numbers::pi / 180.0) * std::cos(lat2 * std::numbers::pi / 180.0)
                * std::cos((lon2 - lon1) * std::numbers::pi / 180.0)
          );
}

std::vector<Waypoint>
Aircraft::TransformWaypoints(std::vector<Waypoint> const& waypoints) {
   std::vector<Waypoint> transformed_waypoints{};
   // In the worst case, we can have up to 2 waypoints per original waypoint
   transformed_waypoints.reserve(waypoints.size() * 2);

   for (std::size_t i = 0; i < waypoints.size(); ++i) {
      if ((i == 0) || (i == waypoints.size() - 1) || (waypoints[i].tolerance_ == 0)
          || (waypoints[i].alt_ == 0)) {
         transformed_waypoints.emplace_back(waypoints[i]);
      } else {
         auto const& prev_wp    = waypoints[i - 1];
         auto const& current_wp = waypoints[i];
         auto const& next_wp    = waypoints[i + 1];

         {
            auto const segment_distance =
              Distance(prev_wp.lat_, prev_wp.lon_, current_wp.lat_, current_wp.lon_);
            auto const offset_from_prev = std::clamp(
              segment_distance - std::clamp(current_wp.tolerance_, 0.0, segment_distance),
              0.0,
              segment_distance
            );
            auto const t = (segment_distance > 1e-6) ? (offset_from_prev / segment_distance) : 0.0;

            auto segment_wp = current_wp;
            segment_wp.lat_ = prev_wp.lat_ + (current_wp.lat_ - prev_wp.lat_) * t;
            segment_wp.lon_ = prev_wp.lon_ + (current_wp.lon_ - prev_wp.lon_) * t;
            transformed_waypoints.emplace_back(segment_wp);
         }
         {
            auto const segment_distance =
              Distance(current_wp.lat_, current_wp.lon_, next_wp.lat_, next_wp.lon_);
            auto const t =
              (segment_distance > 1e-6)
                ? (std::clamp(current_wp.tolerance_, 0.0, segment_distance) / segment_distance)
                : 0.0;
            auto segment_wp = current_wp;

            segment_wp.gear_down_ = std::nullopt;
            segment_wp.flaps_     = std::nullopt;
            segment_wp.lat_       = current_wp.lat_ + (next_wp.lat_ - current_wp.lat_) * t;
            segment_wp.lon_       = current_wp.lon_ + (next_wp.lon_ - current_wp.lon_) * t;

            transformed_waypoints.emplace_back(segment_wp);
         }
      }
   }

   return transformed_waypoints;
}

void
Aircraft::Notify() {
   if (!running_) {
      return;
   }

   auto const [_, resolve, _] = [this] constexpr {
      std::shared_lock lock{mutex_};
      return *update_pcv_;
   }();

   (*resolve)();
}

WPromise<void>
Aircraft::Wait(std::optional<std::chrono::steady_clock::duration> duration) {
   return MakePromise(
            [this,
             duration](Resolve<void> const& resolve, Reject const& reject) -> Promise<void, true> {
               {
                  std::unique_lock lock{mutex_};
                  std::get<0>(*update_pcv_)
                    .Then([resolve = resolve.shared_from_this()]() constexpr { (*resolve)(); })
                    .Catch([reject = reject.shared_from_this()](std::exception_ptr exception
                           ) constexpr { (*reject)(std::move(exception)); })
                    .Detach();
               }

               if (duration) {
                  try {
                     co_await main_.Pool(*duration);
                     resolve();
                  } catch (...) {
                     reject(std::current_exception());
                     co_return;
                  }
               }

               co_return;
            }
   ).Finally([this]() constexpr {
      std::unique_lock lock{mutex_};
      // We resolve the promise in case of timeout and reset it for the next wait
      (*std::get<1>(*update_pcv_))();
      update_pcv_ = std::make_unique<PromiseData>(promise::Create<void>());
   });
}

WPromise<void>
Aircraft::AircraftLoop() {
   constexpr double deg2rad = std::numbers::pi / 180.0;
   constexpr double rad2deg = 180.0 / std::numbers::pi;

   return MakePromise([this]() -> Promise<void> {
      auto sim_rate_promise = MakePromise([this]() -> Promise<void> {
         while (running_) {
            auto const sim_rate = co_await (co_await main_.SimConnect()).WatchSimRate(sim_rate_);

            if (sim_rate != sim_rate_) {
               sim_rate_ = sim_rate;

               std::cout << "Sim rate changed: " << sim_rate_ << std::endl;
               Notify();
            }
         }
      });

      SIMCONNECT_RECV_ASSIGNED_OBJECT_ID id{};

      // We loop on aircraft creation until we succeed without an unexpected error
      while (running_) {
         try {
            id = co_await ID;
            std::cout << "Aircraft created with ID: " << id.dwObjectID << std::endl;
            break;
         } catch (smc::Disconnected const&) {
            std::cerr << "SimConnect disconnected while creating aircraft, retrying aircraft loop"
                      << std::endl;
            continue;
         } catch (smc::Timeout const&) {
            std::cerr << "Timeout while creating aircraft, retrying aircraft loop" << std::endl;
            continue;
         } catch (smc::UnknownError const& e) {
            std::cerr << "Error while creating aircraft: " << e.what() << ", stopping aircraft loop"
                      << std::endl;
         } catch (std::exception const& e) {
            std::cerr << "Unexpected error while creating aircraft: " << e.what()
                      << ", stopping aircraft loop" << std::endl;
         }

         running_ = false;
         co_return;
      }

      if (!running_) {
         co_return;
      }

      std::vector<Waypoint> waypoints{};
      auto                  it = waypoints.begin();

      auto const updateWaypoints = [&]() constexpr {
         {
            std::shared_lock lock{mutex_};
            waypoints.reserve(wp_.size());
            std::ranges::copy(wp_, std::back_inserter(waypoints));
         }
         it = waypoints.begin();

         std::vector<SIMCONNECT_DATA_WAYPOINT> sc_waypoints{};
         sc_waypoints.reserve(waypoints.size());
         for (auto const& wp : waypoints) {
            sc_waypoints.emplace_back(wp.Raw());
         }

         return MakePromise([&]() -> Promise<void> {
            co_await (co_await main_.SimConnect())
              .SetDataOnSimObject(
                smc::DataId::SET_WAYPOINTS, id.dwObjectID, 0, std::move(sc_waypoints)
              );
         });
      };

      auto const next_wp = [&] constexpr {
         return MakePromise([&] -> Promise<bool> {
            std::cout << "Waypoint Reached: " << it->lat_ << ", " << it->lon_ << std::endl;
            ++it;

            if (it == waypoints.end()) {
               co_await Wait();
               co_await updateWaypoints();
               co_return true;
            }

            co_return false;
         });
      };

      bool init      = true;
      bool set_extra = true;
      while (running_) {
         try {
            if (init) {
               co_await updateWaypoints();
               init = false;
            }

            if (set_extra) {
               auto& sim_connect = co_await main_.SimConnect();

               if (it->gear_down_) {
                  std::cout << "Setting gear down" << std::endl;
                  co_await sim_connect.SetDataOnSimObject(
                    smc::DataId::SET_GEAR,
                    id.dwObjectID,
                    0,
                    smc::GearDown{.gear_down_ = (it->gear_down_.value() ? 1. : 0.)}
                  );
               }

               if (it->flaps_) {
                  std::cout << "Setting flaps to index " << *it->flaps_ << std::endl;
                  co_await sim_connect.SetDataOnSimObject(
                    smc::DataId::SET_FLAPS, id.dwObjectID, 0, smc::Flaps{.index_ = *it->flaps_}
                  );
               }

               set_extra = false;
            }

            auto const& info = co_await (co_await main_.SimConnect()).GetAircraftInfo(id);

            // Compare aircraft heading with the direction to the next waypoint
            double lat1  = info.lat_ * deg2rad;
            double lon1  = info.lon_ * deg2rad;
            double lat2  = it->lat_ * deg2rad;
            double lon2  = it->lon_ * deg2rad;
            double d_lon = lon2 - lon1;
            double y     = std::sin(d_lon) * std::cos(lat2);
            double x =
              std::cos(lat1) * std::sin(lat2) - std::sin(lat1) * std::cos(lat2) * std::cos(d_lon);
            double heading = std::atan2(y, x) * rad2deg;
            if (heading < 0) {
               heading += 360;
            }

            auto const wp_distance = co_await [&] constexpr {
               return MakePromise([&] -> Promise<double> {
                  auto const wp_distance = Distance(info.lat_, info.lon_, it->lat_, it->lon_);

                  // If the aircraft is not heading towards the waypoint or closed to it, we
                  // consider that it has reached it
                  if ((std::abs(heading - info.true_heading_) > 90)
                      || (wp_distance < 300. + it->tolerance_)) {
                     co_await next_wp();
                     set_extra = true;

                     // Recompute distance to the next waypoint after switching to it
                     co_return Distance(info.lat_, info.lon_, it->lat_, it->lon_);
                  }

                  co_return wp_distance;
               });
            }();

            auto const est_speed = std::max<double>(info.ground_velocity_, it->speed_.value_or(0.))
                                   * 0.51444;  // Convert from knots to m/s

            std::chrono::seconds const next_wp_est_time{static_cast<uint64_t>(
              est_speed > 0 ? std::max(0.0, wp_distance - it->tolerance_) / est_speed
                            : std::numeric_limits<double>::infinity()
            )};

            std::cout << sim_rate_ << std::endl;
            co_await Wait(
              std::clamp(duration_cast<seconds>((next_wp_est_time * 7) / (8 * sim_rate_)), 1s, 30s)
            );
            continue;
         } catch (smc::Disconnected const&) {
            std::cerr << "SimConnect disconnected, stopping aircraft loop" << std::endl;
            running_ = false;
            break;
         } catch (smc::Timeout const&) {
            std::cerr << "Timeout while waiting for SimConnect, retrying aircraft loop"
                      << std::endl;
         } catch (smc::UnknownError const& e) {
            std::cerr << "Error while waiting for SimConnect: " << e.what()
                      << ", retrying aircraft loop" << std::endl;
            running_ = false;
            break;
         } catch (std::exception const& e) {
            std::cerr << "Unexpected error while waiting for SimConnect: " << e.what()
                      << ", retrying aircraft loop" << std::endl;
            running_ = false;
            break;
         }

         // If we catch an error, we wait 5 seconds before retrying
         co_await Wait(5s);
      }

      co_return;
   });
}
