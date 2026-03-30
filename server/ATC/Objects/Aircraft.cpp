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

#include "SimConnect/SimConnect.inl"
#include "SimConnect/Data/GearDown.h"
#include "SimConnect/Data/Flaps.h"

#include <promise/promise.h>
#include <algorithm>
#include <chrono>
#include <cmath>
#include <numbers>

using namespace std::chrono_literals;

Aircraft::Aircraft(Main& main)
   : main_(main) {};

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
   return StandardPattern({48.75133, 2.09865}, {48.75451, 2.11282}, false);
   //  return {
   //    {
   //      .lat_      = 48.75435,
   //      .lon_      = 2.11282,
   //      .alt_      = 1000,
   //      .is_agl_   = true,
   //      .throttle_ = 100,
   //    },
   //    {
   //      .lat_    = 48.75797,
   //      .lon_    = 2.13193,
   //      .alt_    = 1000,
   //      .is_agl_ = true,
   //      .speed_  = 80,
   //    },
   //    {
   //      .lat_    = 48.77271,
   //      .lon_    = 2.12648,
   //      .alt_    = 1000,
   //      .is_agl_ = true,
   //      .speed_  = 80,
   //    },
   //    {
   //      .lat_    = 48.76643,
   //      .lon_    = 2.08975,
   //      .alt_    = 1000,
   //      .is_agl_ = true,
   //      .speed_  = 70,
   //    },
   //    {
   //      .lat_       = 48.76349,
   //      .lon_       = 2.07275,
   //      .alt_       = 400,
   //      .is_agl_    = true,
   //      .speed_     = 70,
   //      .gear_down_ = true,
   //    },
   //    {
   //      .lat_    = 48.74747,
   //      .lon_    = 2.08047,
   //      .alt_    = 100,
   //      .is_agl_ = true,
   //      .speed_  = 70,
   //    },
   //    {
   //      .lat_       = 48.75102,
   //      .lon_       = 2.09784,
   //      .tolerance_ = 0,
   //      .alt_       = 1,
   //      .is_agl_    = true,
   //      .speed_     = 20,
   //    },
   //    {
   //      .lat_       = 48.75148,
   //      .lon_       = 2.10000,
   //      .tolerance_ = 0,
   //      .alt_       = 1,
   //      .is_agl_    = true,
   //      .speed_     = 20,
   //    },
   //    {
   //      .lat_       = 48.75264,
   //      .lon_       = 2.10511,
   //      .tolerance_ = 0,
   //      .alt_       = 0,
   //      .speed_     = 0.,
   //    },
   //    {
   //      .lat_       = 48.75289,
   //      .lon_       = 2.10618,
   //      .tolerance_ = 0,
   //      .alt_       = 0,
   //      .throttle_  = 0.,
   //    },
   //  };
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

WPromise<void>
Aircraft::AircraftLoop() {
   return MakePromise([this]() -> Promise<void> {
      auto id = co_await ID;
      co_await main_.Pool(5s);

      auto& simconnect = co_await main_.SimConnect();
      co_await simconnect.SetDataOnSimObject(
        smc::DataId::SET_GEAR, id.dwObjectID, 0, smc::GearDown{.gear_down_ = 1.0}
      );
      co_await simconnect.SetDataOnSimObject(
        smc::DataId::SET_FLAPS, id.dwObjectID, 0, smc::Flaps{.index_ = 2}
      );
      // co_await simconnect.SetFlapsHandleIndex(id, 2);

      std::vector<SIMCONNECT_DATA_WAYPOINT> waypoints{};
      for (std::size_t i = 0; i < wp_.size(); ++i) {
         if ((i == 0) || (i == wp_.size() - 1) || (wp_[i].tolerance_ == 0) || (wp_[i].alt_ == 0)) {
            waypoints.emplace_back(wp_[i].Raw());
         } else {
            auto const& prev_wp    = wp_[i - 1];
            auto const& current_wp = wp_[i];
            auto const& next_wp    = wp_[i + 1];

            {
               auto const segment_distance =
                 Distance(prev_wp.lat_, prev_wp.lon_, current_wp.lat_, current_wp.lon_);
               auto const offset_from_prev = std::clamp(
                 segment_distance - std::clamp(current_wp.tolerance_, 0.0, segment_distance),
                 0.0,
                 segment_distance
               );
               auto const t =
                 (segment_distance > 1e-6) ? (offset_from_prev / segment_distance) : 0.0;

               auto segment_wp = current_wp;
               segment_wp.lat_ = prev_wp.lat_ + (current_wp.lat_ - prev_wp.lat_) * t;
               segment_wp.lon_ = prev_wp.lon_ + (current_wp.lon_ - prev_wp.lon_) * t;
               waypoints.emplace_back(segment_wp.Raw());
            }
            {
               auto const segment_distance =
                 Distance(current_wp.lat_, current_wp.lon_, next_wp.lat_, next_wp.lon_);
               auto const t =
                 (segment_distance > 1e-6)
                   ? (std::clamp(current_wp.tolerance_, 0.0, segment_distance) / segment_distance)
                   : 0.0;
               auto segment_wp = current_wp;

               segment_wp.lat_ = current_wp.lat_ + (next_wp.lat_ - current_wp.lat_) * t;
               segment_wp.lon_ = current_wp.lon_ + (next_wp.lon_ - current_wp.lon_) * t;

               waypoints.emplace_back(segment_wp.Raw());
            }
         }
      }

      co_await (co_await main_.SimConnect())
        .SetDataOnSimObject(smc::DataId::SET_WAYPOINTS, id.dwObjectID, 0, std::move(waypoints));

      co_return;

      // std::size_t wp_index = 0;
      // while (true) {
      //    bool error = false;
      //    try {
      //       co_await main_.ensure_();
      //       auto       wp               = wp_[wp_index];
      //       auto       last_wp          = wp_index == 0 ? wp_.back() : wp_[wp_index - 1];
      //       auto const segment_distance = Distance(last_wp.lat_, last_wp.lon_, wp.lat_, wp.lon_);
      //       co_await main_.Pool();

      //       co_await (co_await main_.SimConnect())
      //         .SetDataOnSimObject(
      //           smc::DataId::SET_WAYPOINTS, id.dwObjectID, 0, std::array<WP, 1>{wp}
      //         );

      //       ++wp_index;
      //       if (wp_index == wp_.size()) {
      //          wp_index = 0;
      //       }

      //       using namespace std::chrono;

      //       double last_distance = std::numeric_limits<double>::max();

      //       bool error                 = false;
      //       auto last_commanded_target = std::optional<std::pair<double, double>>{};
      //       auto next_command_time     = steady_clock::now();
      //       // Wait until the aircraft reaches the current waypoint before sending the next one
      //       while (true) {
      //          try {
      //             auto const& info = co_await (co_await main_.SimConnect()).GetAircraftInfo(id);

      //             auto const [lat, lon, distance, total_distance] =
      //               [&] constexpr -> std::array<double, 4> {
      //                if (wp.interpolate_) {
      //                   if (segment_distance > 1200.0) {
      //                      return Interpolate(
      //                        last_wp.lat_,
      //                        last_wp.lon_,
      //                        wp.lat_,
      //                        wp.lon_,
      //                        info.lat_,
      //                        info.lon_,
      //                        info.true_heading_,
      //                        info.ground_velocity_
      //                      );
      //                   }
      //                }

      //                auto const distance = Distance(info.lat_, info.lon_, wp.lat_, wp.lon_);
      //                return {wp.lat_, wp.lon_, distance, distance};
      //             }();
      //             ScopeExit _{[&]() constexpr { last_distance = total_distance; }};

      //             if (total_distance - last_distance > 300.0) {
      //                std::cout << "Aircraft is moving away from the waypoint" << std::endl;
      //             }

      //             if (total_distance < wp.tolerance_) {
      //                break;
      //             }

      //             std::cout << distance << " " << total_distance << " " << wp.tolerance_ << " "
      //                       << std::min(
      //                            distance, std::max(wp.tolerance_, total_distance -
      //                            wp.tolerance_)
      //                          )
      //                       << std::endl;

      //             auto const now = steady_clock::now();
      //             if (now < next_command_time) {
      //                co_await main_.Pool(next_command_time);
      //                continue;
      //             }

      //             if (last_commanded_target) {
      //                auto const target_delta = Distance(
      //                  lat, lon, last_commanded_target->first, last_commanded_target->second
      //                );

      //                if (target_delta < 25.0 && total_distance > wp.tolerance_ + 120.0) {
      //                   co_await main_.Pool(800ms);
      //                   continue;
      //                }
      //             }
      //             // Estimate time to reach the waypoint based on current ground speed. Using
      //             half
      //             // the remaining distance for polling provides better reactivity when the
      //             aircraft
      //             // deviates from the track (measured by both cross-track and heading
      //             alignment). auto const time_to_next_wp =
      //               steady_clock::now()
      //               + duration_cast<steady_clock::duration>(duration<double>{
      //                 std::min(distance, std::max(wp.tolerance_, total_distance - wp.tolerance_))
      //                 * 0.5
      //                 / (std::max<double>(info.ground_velocity_, wp.speed_.value_or(0.)) *
      //                 0.51444)
      //               });

      //             co_await (co_await main_.SimConnect())
      //               .SetDataOnSimObject(
      //                 smc::DataId::SET_WAYPOINTS,
      //                 id.dwObjectID,
      //                 0,
      //                 Waypoint{
      //                   .lat_      = lat,
      //                   .lon_      = lon,
      //                   .alt_      = wp.alt_,
      //                   .is_agl_   = wp.is_agl_,
      //                   .speed_    = wp.speed_,
      //                   .throttle_ = wp.throttle_,
      //                 }
      //                   .Raw()
      //               );

      //             last_commanded_target = std::make_pair(lat, lon);
      //             next_command_time     = steady_clock::now() + 1200ms;

      //             std::cout << "Setting next waypoint: " << lat << ", " << lon << " - " <<
      //             wp.lat_
      //                       << ", " << wp.lon_ << ", distance: " << distance
      //                       << ", total_distance: " << total_distance << ", index: " << wp_index
      //                       << ", time to next wp: "
      //                       << duration_cast<seconds>(time_to_next_wp -
      //                       steady_clock::now()).count()
      //                       << "s, aircraft speed: " << info.ground_velocity_
      //                       << "kts position: " << info.lat_ << ", " << info.lon_ << std::endl;

      //             // Poll the user aircraft info every time_to_next_wp to keep it up to date
      //             co_await main_.Pool(time_to_next_wp);
      //          } catch (smc::Disconnected const&) {
      //             std::cout << "SimConnect disconnected, stopping aircraft loop" << std::endl;
      //             throw;
      //          } catch (std::exception const& e) {
      //             error = true;
      //             // std::cerr << "Exception in aircraft loop: " << e.what() << std::endl;
      //          } catch (...) {
      //             error = true;
      //             std::cerr << "Unknown exception in aircraft loop" << std::endl;
      //          }

      //          if (error) {
      //             error = false;
      //             // In case of error, wait a bit before retrying to avoid spamming the logs and
      //             // giving time for transient issues to resolve (e.g. temporary SimConnect
      //             hiccup
      //             // or user taking control of the aircraft).
      //             co_await main_.Pool(5s);
      //          }
      //       }
      //    } catch (smc::Disconnected const&) {
      //       std::cout << "SimConnect disconnected, stopping aircraft loop" << std::endl;
      //       throw;
      //    } catch (std::exception const& e) {
      //       error = true;
      //       // std::cerr << "Exception in aircraft loop: " << e.what() << std::endl;
      //    } catch (...) {
      //       error = true;
      //       std::cerr << "Unknown exception in aircraft loop" << std::endl;
      //    }

      //    if (error) {
      //       error = false;
      //       // In case of error, wait a bit before retrying to avoid spamming the logs and giving
      //       // time for transient issues to resolve (e.g. temporary SimConnect hiccup or user
      //       // taking control of the aircraft).
      //       co_await main_.Pool(5s);
      //    }
      // }

      co_return;
   });
}
