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
#include "TrafficPattern.h"

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
#include <ranges>
#include <shared_mutex>
#include <stdexcept>
#include <string>

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

            auto const& [title, livery] = titles.at(272);
            co_return *(co_await promise::Race(
              main_.SimConnect().AICreateNonATCAircraft(
                title,
                livery,
                "LF-KYUW",
                {
                  .Latitude  = 48.76219,
                  .Longitude = 2.09394,
                  .Altitude  = 2000,
                  .Pitch     = 0,
                  .Bank      = 0,
                  .Heading   = 180,
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
Aircraft::JoinTrafficPattern(std::string_view icao) {
   return MakePromise([this, icao = std::string{icao}] -> Promise<void> {
      ScopeExit _{[] constexpr {
         std::cout << "Aircraft[init_waypoint]: JoinTrafficPattern loop ended" << std::endl;
      }};

      co_await state_.Wait();

      while (true) {
         try {
            auto const airport_data = *(
              co_await promise::Race(main_.SimConnect().GetAirportFacility(icao), state_.WaitDone())
            );

            auto const pattern = Pattern::Make(airport_data);
            auto const origin  = Coords<2>{airport_data.lat_, airport_data.lon_};

            auto const taxi_start_it =
              airport_data.FindClosestTaxiPoint({pattern.end_[0], pattern.end_[1]});
            auto const taxi_end_it = airport_data.FindClosestTaxiPoint(Waypoint::ToDeg(
              origin, {airport_data.taxi_parkings_[14].x_, airport_data.taxi_parkings_[14].y_}
            ));

            auto const taxi_start = Waypoint::ToDeg(origin, {taxi_start_it->x_, taxi_start_it->y_});
            auto const taxi_end   = Waypoint::ToDeg(origin, {taxi_end_it->x_, taxi_end_it->y_});

            std::cout << "Aircraft[init_waypoint]: Taxi start: (" << taxi_start[0] << ", "
                      << taxi_start[1] << "), Taxi end: (" << taxi_end[0] << ", " << taxi_end[1]
                      << ")" << std::endl;

            auto taxi = airport_data.GetTaxiPath(taxi_start, taxi_end)
                        | std::views::transform([](Coords<2> const& coords) {
                             return Waypoint{
                               .lat_       = coords[0],
                               .lon_       = coords[1],
                               .alt_       = 0,
                               .is_agl_    = true,
                               .on_ground_ = true,
                             };
                          })
                        | std::ranges::to<std::vector<Waypoint>>();

            for (auto const& wp : taxi) {
               std::cout << "Aircraft[init_waypoint]: Taxi waypoint: (" << wp.lat_ << ", "
                         << wp.lon_ << ")" << std::endl;
            }

            auto const wp = TransformWaypoints(
              pattern.Join(), pattern.Circulate(), pattern.Land(), std::move(taxi)
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

template <class... WAYPOINTS>
std::deque<Waypoint>
Aircraft::TransformWaypoints(std::vector<WAYPOINTS> const&... waypoints_list) {
   std::deque<Waypoint> transformed_waypoints{};

   for (auto const& waypoints : {std::vector<Waypoint>{waypoints_list}...}) {
      for (std::size_t i = 0; i < waypoints.size(); ++i) {
         transformed_waypoints.emplace_back(waypoints[i]);
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

      std::optional<Waypoint> current_wp{};
      auto const              updateWaypoints = [&](bool has_lock = false) constexpr {
         std::cout << "Aircraft[main_loop]: Updating waypoints" << std::endl;

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
                  std::cout << "Aircraft[main_loop]: Delaying waypoint: " << wp.lat_ << ", "
                            << wp.lon_ << std::endl;
                  break;
               } else if (wp.delayed_) {
                  std::cout << "Aircraft[main_loop]: Delayed waypoint: " << wp.lat_ << ", "
                            << wp.lon_ << std::endl;
               }

               if (wp.send_) {
                  sc_waypoints.emplace_back(wp.Raw());
               }
            }
            if (wp_.size()) {
               current_wp = std::make_optional(wp_.front());
            }
         }

         if (sc_waypoints.empty()) {
            return Promise<std::optional<bool>>::Resolve(true);
         }
         return promise::Race(
           main_.SimConnect().SetDataOnSimObject(
             smc::DataId::SET_WAYPOINTS, id.dwObjectID, 0, std::move(sc_waypoints)
           ),
           state_.WaitDone()
         );
      };

      auto const next_wp = [&](bool invalid_heading) constexpr {
         return MakePromise([&] -> Promise<bool> {
            if (current_wp) {
               if (!invalid_heading) {
                  std::cout << "Aircraft[main_loop]: Waypoint Reached: " << current_wp->lat_ << ", "
                            << current_wp->lon_
                            << (current_wp->alt_.has_value()
                                  ? ", alt: " + std::to_string(*current_wp->alt_)
                                  : "")
                            << std::endl;
               }

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
            }

            current_wp = std::nullopt;

            std::unique_lock<std::shared_mutex> const lock{mutex_};

            wp_.pop_front();
            if (wp_.size()) {
               if (wp_.front().delayed_) {
                  co_return false;
               }
               current_wp = std::make_optional(wp_.front());
            }

            co_return current_wp.has_value();
         });
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

            auto const& info =
              *(co_await promise::Race(main_.SimConnect().GetAircraftInfo(id), state_.WaitDone()));

            auto const wp_distance = co_await MakePromise([&] -> Promise<std::optional<double>> {
               auto const wp_distance =
                 Distance(info.lat_, info.lon_, current_wp->lat_, current_wp->lon_);

               if (current_wp->entered_) {
                  if (wp_distance > current_wp->last_distance_) {
                     co_await next_wp(false);
                     co_return std::nullopt;
                  }
                  current_wp->last_distance_ = wp_distance;
               } else if (wp_distance < 600.) {
                  current_wp->entered_       = true;
                  current_wp->last_distance_ = wp_distance;
               } else {
                  co_return wp_distance - 300.;
               }

               co_return wp_distance;
            });

            if (!wp_distance) {
               continue;
            }

            assert(*wp_distance >= 0);

            auto const est_speed =
              std::max<double>(info.ground_velocity_, current_wp->speed_.value_or(0.))
              * 0.51444;  // Convert from knots to m/s

            std::chrono::seconds const next_wp_est_time{static_cast<uint64_t>(
              est_speed > 0 ? *wp_distance
                                / (
                                  // Over estimating the speed by 5% to avoid being late on the
                                  // next waypoint in case of speed variations
                                  est_speed * 1.05
                                )
                            : std::numeric_limits<double>::infinity()
            )};

            co_await Wait(std::clamp(
              duration_cast<seconds>(next_wp_est_time / sim_rate_.load()),
              duration_cast<seconds>(10ms),
              10s
            ));
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
