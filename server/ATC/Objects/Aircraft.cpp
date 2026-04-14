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

#include "Aircraft.h"

#include "main.h"
#include "Waypoint.h"

#include "SimConnect/SimConnect.h"
#include "SimConnect/SimConnect.inl"
#include "SimConnect/Data/GearDown.h"
#include "SimConnect/Data/Flaps.h"
#include "SimConnect/Data/Break.h"
#include "promise/CVPromise.h"
#include "utils/Scoped.h"

#include <promise/promise.h>
#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <mutex>
#include <numbers>
#include <shared_mutex>
#include <stdexcept>

using namespace std::chrono_literals;
using namespace std::chrono;

Aircraft::Aircraft(Main& main)
   : main_(main) {
   auto const _ = main_.MainPool::Dispatch([this] constexpr { state_.Ready(); });
};

Aircraft::~Aircraft() {
   auto const _ = main_.MainPool::Dispatch([this] constexpr { state_.Done(); });
}

WPromise<Aircraft::ObjectId>
Aircraft::SetID() {
   return MakePromise([this] -> Promise<Aircraft::ObjectId> {
      ScopeExit _{[] constexpr { std::cout << "Aircraft[set_id]: SetID loop ended" << std::endl; }};

      co_await state_.Wait();

      while (true) {
         try {
            auto titles =
              *(co_await promise::Race(main_.SimConnect().GetTrafficTitles(), state_.WaitDone()));
            assert(titles.size() > 0);

            co_return *(co_await promise::Race(
              main_.SimConnect().AICreateNonATCAircraft(
                titles.at(0).first,
                titles.at(0).second,
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
              ),
              state_.WaitDone()
            ));
         } catch (smc::Disconnected const&) {
         } catch (smc::Timeout const&) {
         } catch (std::exception const& e) {
            std::cerr << "Aircraft: Failed to create aircraft: " << e.what() << std::endl;
            break;
         } catch (...) {
            std::cerr << "Aircraft: Failed to create aircraft with unknown error" << std::endl;
            break;
         }

         co_await promise::Race(state_.WaitDone(), main_.Wait(5s));
      }

      throw std::runtime_error("Aircraft destroyed before ID was assigned");
   });
}

WPromise<void>
Aircraft::InitWaypoint() {
   return MakePromise([this] -> Promise<void> {
      ScopeExit _{[] constexpr {
         std::cout << "Aircraft[init_waypoint]: InitWaypoint loop ended" << std::endl;
      }};

      co_await state_.Wait();

      while (true) {
         try {
            auto       airport = *(co_await promise::Race(
              main_.SimConnect().GetAirportFacility("LFPN"), state_.WaitDone()
            ));
            auto const runway  = airport.runways_[0];

            auto const origin      = std::make_pair(runway.latitude_, runway.longitude_);
            auto const heading     = runway.heading_ * std::numbers::pi / 180.0;
            auto const half_length = runway.length_ / 2.0;
            auto const dir         = std::make_pair(std::sin(heading), std::cos(heading));
            auto const offset = std::make_pair(dir.first * half_length, dir.second * half_length);

            // @todo thresholds
            auto const start = std::make_pair(-offset.first, -offset.second);
            auto const end   = std::make_pair(+offset.first, +offset.second);

            auto const wp = TransformWaypoints(
              StandardPattern(Waypoint::ToDeg(origin, start), Waypoint::ToDeg(origin, end), false)
            );

            {
               std::unique_lock lock{mutex_};
               wp_ = std::move(wp);
            }

            Notify();
            break;
         } catch (smc::Disconnected const&) {
         } catch (smc::Timeout const&) {
         } catch (std::exception const& e) {
            std::cerr << "Aircraft[init_waypoint]: Failed to initialize waypoints: " << e.what()
                      << std::endl;
            co_return;
         } catch (...) {
            std::cerr
              << "Aircraft[init_waypoint]: Failed to initialize waypoints with unknown error"
              << std::endl;
            co_return;
         }

         co_await promise::Race(state_.WaitDone(), main_.Wait(5s));
      }
      co_return;
   });
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

std::deque<Waypoint>
Aircraft::TransformWaypoints(std::vector<Waypoint> const& waypoints) {
   std::deque<Waypoint> transformed_waypoints{};

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
            segment_wp.break_     = std::nullopt;
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
   update_promise_.Notify();
}

WPromise<void>
Aircraft::Wait(std::optional<std::chrono::steady_clock::duration> duration) {
   return ([&] constexpr {
             if (duration) {
                return promise::Race(*update_promise_, main_.Wait(*duration), state_.WaitDone());
             } else {
                return promise::Race(*update_promise_, state_.WaitDone());
             }
          }())
     .Finally([this]() constexpr { update_promise_.Reset(); });
}

WPromise<void>
Aircraft::SimRateLoop() {
   return MakePromise([this]() -> Promise<void> {
      ScopeExit _{[] constexpr {
         std::cout << "Aircraft[sim_rate]: Sim rate loop ended" << std::endl;
      }};

      co_await state_.Wait();
      std::cout << "Aircraft[sim_rate]: Sim rate loop started" << std::endl;

      while (true) {
         try {
            auto const sim_rate = *(
              co_await promise::Race(main_.SimConnect().WatchSimRate(sim_rate_), state_.WaitDone())
            );

            if (sim_rate != sim_rate_) {
               sim_rate_ = sim_rate;
               Notify();
            }

            continue;
         } catch (smc::Disconnected const&) {
            std::cerr << "Aircraft[sim_rate]: SimConnect disconnected while watching sim rate, "
                         "retrying sim rate loop"
                      << std::endl;
         } catch (smc::Timeout const&) {
            std::cerr
              << "Aircraft[sim_rate]: Timeout while watching sim rate, retrying sim rate loop"
              << std::endl;
         } catch (CVPromise::End const&) {
            std::cerr << "Aircraft[sim_rate]: Stop requested, stopping sim rate loop" << std::endl;
            throw;
         } catch (std::exception const& e) {
            std::cerr << "Aircraft[sim_rate]: Error while watching sim rate: "
                      // << e.what() #TODO: https://github.com/llvm/llvm-project/issues/182584
                      << ", retrying sim rate loop" << std::endl;
         } catch (...) {
            std::cerr
              << "Aircraft[sim_rate]: Unknown error while watching sim rate, retrying sim rate loop"
              << std::endl;
         }

         co_await promise::Race(main_.Wait(5s), state_.WaitDone());
      }
   });
}

WPromise<void>
Aircraft::AircraftLoop() {
   constexpr double deg2rad = std::numbers::pi / 180.0;
   constexpr double rad2deg = 180.0 / std::numbers::pi;

   return MakePromise([this]() -> Promise<void> {
      ScopeExit _{[] constexpr { std::cout << "Aircraft[main_loop]: loop ended" << std::endl; }};

      co_await state_.Wait();

      SIMCONNECT_RECV_ASSIGNED_OBJECT_ID id{};

      // We loop on aircraft creation until we succeed without an unexpected error
      while (true) {
         try {
            id = co_await ID;
            std::cout << "Aircraft[main_loop]: Aircraft created with ID: " << id.dwObjectID
                      << std::endl;
            break;
         } catch (smc::Disconnected const&) {
            std::cerr << "Aircraft[main_loop]: SimConnect disconnected while creating aircraft, "
                         "retrying aircraft loop"
                      << std::endl;
            continue;
         } catch (smc::Timeout const&) {
            std::cerr
              << "Aircraft[main_loop]: Timeout while creating aircraft, retrying aircraft loop"
              << std::endl;
            continue;
         } catch (smc::UnknownError const& e) {
            std::cerr << "Aircraft[main_loop]: Error while creating aircraft: " << e.what()
                      << ", stopping aircraft loop" << std::endl;
         } catch (std::exception const& e) {
            std::cerr << "Aircraft[main_loop]: Unexpected error while creating aircraft: "
                      << e.what() << ", stopping aircraft loop" << std::endl;
         }

         co_return;
      }

      double                  alignment_correction = 0.;
      bool                    init_wp              = false;
      std::optional<Waypoint> current_wp{};
      auto const              updateWaypoints = [&](bool has_lock = false) constexpr {
         current_wp = std::nullopt;

         std::vector<SIMCONNECT_DATA_WAYPOINT> sc_waypoints{};
         {
            std::optional<std::shared_lock<std::shared_mutex>> const lock{
              has_lock ? std::nullopt
                                    : std::make_optional<std::shared_lock<std::shared_mutex>>(mutex_)
            };

            sc_waypoints.reserve(wp_.size());
            for (auto const& wp : wp_) {
               if (wp.delayed_ && sc_waypoints.size()) {
                  break;
               }
               auto raw = wp.Raw();

               if (sc_waypoints.size()) {
                  auto const to_meter = [&](double lat, double lon) constexpr {
                     return Waypoint::ToMeter({raw.Latitude, raw.Longitude}, {lat, lon});
                  };
                  auto const to_deg = [&](double x, double y) constexpr {
                     return Waypoint::ToDeg({raw.Latitude, raw.Longitude}, {x, y});
                  };
                  auto const last =
                    to_meter(sc_waypoints.back().Latitude, sc_waypoints.back().Longitude);
                  auto const dist = std::hypot(last.first, last.second);
                  auto const dir  = std::make_pair(
                    -last.second / dist, last.first / dist
                  );  // Perpendicular to the direction to the last waypoint

                  auto const corrected =
                    to_deg(dir.first * alignment_correction, dir.second * alignment_correction);

                  // Apply alignment correction if needed to ensure the aircraft converges to the
                  // runway centerline.
                  raw.Latitude  = corrected.first;
                  raw.Longitude = corrected.second;
               }
               sc_waypoints.emplace_back(raw);
            }
            if (wp_.size()) {
               init_wp    = true;
               current_wp = std::make_optional(wp_.front());
            }
         }

         return promise::Race(
           main_.SimConnect().SetDataOnSimObject(
             smc::DataId::SET_WAYPOINTS, id.dwObjectID, 0, std::move(sc_waypoints)
           ),
           state_.WaitDone()
         );
      };

      auto const next_wp = [&](bool invalid_heading) constexpr {
         if (current_wp) {
            if (invalid_heading) {
               std::cout << "Aircraft[main_loop]: Waypoint Skipped (invalid heading): "
                         << current_wp->lat_ << ", " << current_wp->lon_ << std::endl;
            } else {
               std::cout << "Aircraft[main_loop]: Waypoint Reached: " << current_wp->lat_ << ", "
                         << current_wp->lon_ << std::endl;
            }
         }

         current_wp = std::nullopt;

         std::unique_lock<std::shared_mutex> const lock{mutex_};

         wp_.pop_front();
         if (wp_.size()) {
            init_wp    = true;
            current_wp = std::make_optional(wp_.front());
         }

         return current_wp.has_value();
      };

      while (true) {
         try {
            if (!current_wp) {
               {
                  std::shared_lock lock{mutex_};
                  co_await updateWaypoints(true);
               }
               if (!current_wp) {
                  co_await Wait();
               }
               continue;
            }

            if (init_wp) {
               auto& sim_connect = main_.SimConnect();

               if (current_wp->gear_down_) {
                  std::cout << "Aircraft[main_loop]: Setting gear "
                            << (current_wp->gear_down_.value() ? "down" : "up") << std::endl;
                  co_await promise::Race(
                    sim_connect.SetDataOnSimObject(
                      smc::DataId::SET_GEAR,
                      id.dwObjectID,
                      0,
                      smc::GearDown{.gear_down_ = (current_wp->gear_down_.value() ? 1. : 0.)}
                    ),
                    state_.WaitDone()
                  );
               }

               if (current_wp->flaps_) {
                  std::cout << "Aircraft[main_loop]: Setting flaps to index " << *current_wp->flaps_
                            << std::endl;
                  co_await promise::Race(
                    sim_connect.SetDataOnSimObject(
                      smc::DataId::SET_FLAPS,
                      id.dwObjectID,
                      0,
                      smc::Flaps{.index_ = *current_wp->flaps_}
                    ),
                    state_.WaitDone()
                  );
               }

               if (current_wp->break_) {
                  std::cout << "Aircraft[main_loop]: Setting break to " << current_wp->break_->first
                            << ", " << current_wp->break_->second << std::endl;
                  co_await promise::Race(
                    sim_connect.SetDataOnSimObject(
                      smc::DataId::SET_BREAK,
                      id.dwObjectID,
                      0,
                      smc::Break{
                        .left_  = static_cast<int32_t>(current_wp->break_->first * 32'000),
                        .right_ = static_cast<int32_t>(current_wp->break_->second * 32'000)
                      }
                    ),
                    state_.WaitDone()
                  );
               }

               init_wp = false;
            }

            auto const& info =
              *(co_await promise::Race(main_.SimConnect().GetAircraftInfo(id), state_.WaitDone()));

            // Compare aircraft heading with the direction to the next waypoint
            double lat1  = info.lat_ * deg2rad;
            double lon1  = info.lon_ * deg2rad;
            double lat2  = current_wp->lat_ * deg2rad;
            double lon2  = current_wp->lon_ * deg2rad;
            double d_lon = lon2 - lon1;
            double y     = std::sin(d_lon) * std::cos(lat2);
            double x =
              std::cos(lat1) * std::sin(lat2) - std::sin(lat1) * std::cos(lat2) * std::cos(d_lon);
            double heading = std::atan2(y, x) * rad2deg;
            if (heading < 0) {
               heading += 360;
            }

            auto const wp_distance = [&] constexpr -> std::optional<double> {
               auto const wp_distance =
                 Distance(info.lat_, info.lon_, current_wp->lat_, current_wp->lon_);

               // If the aircraft is not heading towards the waypoint or closed to it, we
               // consider that it has reached it

               auto const heading_diff =
                 std::fmod((heading - info.true_heading_) + 540.0, 360.0) - 180.0;
               auto const invalid_heading = (std::abs(heading_diff) > 90);
               if (invalid_heading || (wp_distance < 300. + current_wp->tolerance_)) {
                  if (invalid_heading) {
                     std::cout << "Aircraft[main_loop]: Invalid heading to waypoint: " << heading
                               << " vs " << info.true_heading_ << " diff: " << heading_diff
                               << std::endl;
                  }

                  next_wp(invalid_heading);
                  return std::nullopt;
               }

               return wp_distance;
            }();

            if (!wp_distance) {
               continue;
            }

            auto const est_speed =
              std::max<double>(info.ground_velocity_, current_wp->speed_.value_or(0.))
              * 0.51444;  // Convert from knots to m/s

            std::chrono::seconds const next_wp_est_time{static_cast<uint64_t>(
              est_speed > 0 ? std::max(0.0, *wp_distance - current_wp->tolerance_) / est_speed
                            : std::numeric_limits<double>::infinity()
            )};

            co_await Wait(
              std::clamp(duration_cast<seconds>((next_wp_est_time * 7) / (8 * sim_rate_)), 1s, 30s)
            );
            continue;
         } catch (smc::Timeout const&) {
            std::cerr
              << "Aircraft[main_loop]: Timeout while waiting for SimConnect, retrying aircraft loop"
              << std::endl;
         }

         // If we catch an error, we wait 5 seconds before retrying
         co_await Wait(5s);
      }

      std::cout << "Aircraft[main_loop]: loop stopped" << std::endl;
      co_return;
   });
}
