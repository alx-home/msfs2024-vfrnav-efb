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

#include "SimConnect/SimConnect.inl"

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
                  .Latitude  = 48.75079,
                  .Longitude = 2.09638,
                  .Altitude  = 1000,
                  .Pitch     = 0,
                  .Bank      = 0,
                  .Heading   = 90,
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

Waypoint::operator SIMCONNECT_DATA_WAYPOINT() const {
   SIMCONNECT_DATA_WAYPOINT result{};
   static_assert(sizeof(result) == sizeof(SIMCONNECT_DATA_WAYPOINT), "Size mismatch");

   result.Latitude        = lat_;
   result.Longitude       = lon_;
   result.Altitude        = alt_;
   result.ktsSpeed        = speed_.value_or(0);
   result.percentThrottle = throttle_.value_or(0);

   result.Flags = SIMCONNECT_WAYPOINT_COMPUTE_VERTICAL_SPEED;

   if (is_agl_) {
      result.Flags |= SIMCONNECT_WAYPOINT_ALTITUDE_IS_AGL;
   }

   if (alt_ == 0) {
      result.Flags |= SIMCONNECT_WAYPOINT_ON_GROUND | SIMCONNECT_WAYPOINT_ALTITUDE_IS_AGL;
   }

   if (speed_) {
      result.Flags |= SIMCONNECT_WAYPOINT_SPEED_REQUESTED;
   }

   if (throttle_) {
      result.Flags |= SIMCONNECT_WAYPOINT_THROTTLE_REQUESTED;
   }

   return result;
}

std::vector<Waypoint>
Aircraft::InitWaypoint() {
   return {
     {
       .lat_       = 48.75435,
       .lon_       = 2.11282,
       .tolerance_ = 500,
       .alt_       = 1000,
       .is_agl_    = true,
       .throttle_  = 100,
     },
     {
       .lat_       = 48.75797,
       .lon_       = 2.13193,
       .tolerance_ = 1000,
       .alt_       = 1000,
       .is_agl_    = true,
       .speed_     = 80,
     },
     {
       .lat_       = 48.77271,
       .lon_       = 2.12648,
       .tolerance_ = 1000,
       .alt_       = 1000,
       .is_agl_    = true,
       .speed_     = 80,
     },
     {
       .lat_       = 48.76643,
       .lon_       = 2.08975,
       .tolerance_ = 200,
       .alt_       = 1000,
       .is_agl_    = true,
       .speed_     = 70,
     },
     {
       .lat_       = 48.75947,
       .lon_       = 2.04889,
       .tolerance_ = 1000,
       .alt_       = 600,
       .is_agl_    = true,
       .speed_     = 70,
     },
     {
       .lat_       = 48.74329,
       .lon_       = 2.05610,
       .tolerance_ = 1000,
       .alt_       = 500,
       .is_agl_    = true,
       .speed_     = 70,
     },
     {
       .lat_       = 48.74759,
       .lon_       = 2.07908,
       .tolerance_ = 200,
       .alt_       = 200,
       .is_agl_    = true,
       .speed_     = 70,
     },
     {
       .lat_         = 48.75143,
       .lon_         = 2.09885,
       .tolerance_   = 200,
       .alt_         = 0,
       .speed_       = 70,
       .interpolate_ = false,
     },
     {
       .lat_       = 48.75279,
       .lon_       = 2.20503,
       .tolerance_ = 500,
       .alt_       = 0,
       .speed_     = 20,
     },
   };
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

std::array<double, 4>
Aircraft::Interpolate(
  double                lat1,
  double                lon1,
  double                lat2,
  double                lon2,
  double                distance,
  std::optional<double> full_distance
) {
   auto const total_distance = full_distance.value_or(Distance(lat1, lon1, lat2, lon2));
   if (total_distance == 0) {
      return {lat1, lon1, 0, 0};
   }

   auto const step_distance = std::min(distance, total_distance);

   auto const ratio   = step_distance / total_distance;
   auto const new_lat = lat1 + (lat2 - lat1) * ratio;
   auto const new_lon = lon1 + (lon2 - lon1) * ratio;

   return {new_lat, new_lon, step_distance, total_distance};
}

std::array<double, 4>
Aircraft::Interpolate(
  double                lat1,
  double                lon1,
  double                lat2,
  double                lon2,
  double                lat,
  double                lon,
  double                heading,
  double                distance,
  std::optional<double> full_distance
) {
   auto const total_distance = full_distance.value_or(Distance(lat, lon, lat2, lon2));
   if (total_distance == 0) {
      return {lat2, lon2, 0, 0};
   }

   constexpr double earth_radius       = 6371000.0;
   auto const       ref_lat_rad        = ((lat1 + lat2 + lat) / 3.0) * std::numbers::pi / 180.0;
   auto const       meters_per_deg_lat = std::numbers::pi * earth_radius / 180.0;
   auto const       meters_per_deg_lon = meters_per_deg_lat * std::cos(ref_lat_rad);

   // Near the poles, fallback to direct interpolation to avoid numerical issues.
   if (std::abs(meters_per_deg_lon) < 1e-6) {
      return Interpolate(lat, lon, lat2, lon2, distance, total_distance);
   }

   auto const bx = (lon2 - lon1) * meters_per_deg_lon;
   auto const by = (lat2 - lat1) * meters_per_deg_lat;
   auto const px = (lon - lon1) * meters_per_deg_lon;
   auto const py = (lat - lat1) * meters_per_deg_lat;

   auto const ab_len2 = bx * bx + by * by;

   // If the segment is very short, fallback to direct interpolation
   if (ab_len2 < 200 * 200) {
      return Interpolate(lat, lon, lat2, lon2, distance, total_distance);
   }

   // Project current position onto the segment, then aim a look-ahead point on the segment.
   auto t = (px * bx + py * by) / ab_len2;
   if (t < 0.0) {
      t = 0.0;
   } else if (t > 1.0) {
      t = 1.0;
   }

   auto const ab_len     = std::sqrt(ab_len2);
   auto const look_ahead = std::min(distance, total_distance);
   auto const s_proj     = t * ab_len;

   // Heading convention is 0=N, 90=E. Convert heading to local XY (x=east, y=north).
   auto const heading_rad = heading * std::numbers::pi / 180.0;
   auto const hx          = std::sin(heading_rad);
   auto const hy          = std::cos(heading_rad);

   auto const ux = bx / ab_len;
   auto const uy = by / ab_len;

   // Progress factor in [0.1, 1.0]: when facing opposite to the route, guidance advances less
   // along-track to prioritize re-alignment; when aligned, full look-ahead is used.
   auto const along_heading = hx * ux + hy * uy;
   auto const progress      = std::clamp((along_heading + 1.0) * 0.5, 0.1, 1.0);
   auto const s_goal        = std::min(ab_len, s_proj + look_ahead * progress);

   auto const gx = ux * s_goal;
   auto const gy = uy * s_goal;

   auto const target_lat = lat1 + gy / meters_per_deg_lat;
   auto const target_lon = lon1 + gx / meters_per_deg_lon;

   return {target_lat, target_lon, look_ahead * progress, total_distance};
}

std::pair<double, double>
Aircraft::Alignment(
  double heading,
  double lat,
  double lon,
  double lat1,
  double lon1,
  double lat2,
  double lon2
) {
   constexpr double earth_radius       = 6371000.0;
   auto const       ref_lat_rad        = ((lat1 + lat2 + lat) / 3.0) * std::numbers::pi / 180.0;
   auto const       meters_per_deg_lat = std::numbers::pi * earth_radius / 180.0;
   auto const       meters_per_deg_lon = meters_per_deg_lat * std::cos(ref_lat_rad);

   auto const bx = (lon2 - lon1) * meters_per_deg_lon;
   auto const by = (lat2 - lat1) * meters_per_deg_lat;
   auto const px = (lon - lon1) * meters_per_deg_lon;
   auto const py = (lat - lat1) * meters_per_deg_lat;

   auto const ab_len2 = bx * bx + by * by;
   auto const ab_len  = std::sqrt(ab_len2);

   if (ab_len < 1e-6 || std::abs(meters_per_deg_lon) < 1e-6) {
      return {0.0, 0.0};
   }

   // Perpendicular (cross-track) distance from pos to the segment line.
   auto const cross_track = std::abs(px * by - py * bx) / ab_len;

   // Track heading: 0=N, 90=E (same convention as true heading).
   auto track_heading = std::atan2(bx, by) * 180.0 / std::numbers::pi;
   if (track_heading < 0.0) {
      track_heading += 360.0;
   }

   auto heading_error = std::fmod(std::abs(heading - track_heading), 360.0);
   if (heading_error > 180.0) {
      heading_error = 360.0 - heading_error;
   }

   return {cross_track, heading_error};
}

WPromise<void>
Aircraft::AircraftLoop() {
   return MakePromise([this]() -> Promise<void> {
      auto id = co_await ID;

      std::size_t wp_index = 0;
      while (true) {
         bool error = false;
         try {
            co_await main_.ensure_();
            auto wp      = wp_[wp_index];
            auto last_wp = wp_index == 0 ? wp_.back() : wp_[wp_index - 1];
            co_await main_.Pool();

            co_await (co_await main_.SimConnect())
              .SetDataOnSimObject(
                smc::DataId::SET_WAYPOINTS, id.dwObjectID, 0, std::array<WP, 1>{wp}
              );

            ++wp_index;
            if (wp_index == wp_.size()) {
               wp_index = 0;
            }

            using namespace std::chrono;

            double last_distance = std::numeric_limits<double>::max();

            bool error = false;
            // Wait until the aircraft reaches the current waypoint before sending the next one
            while (true) {
               try {
                  auto const& info = co_await (co_await main_.SimConnect()).GetAircraftInfo(id);

                  auto const [lat, lon, distance, total_distance] =
                    [&] constexpr -> std::array<double, 4> {
                     if (wp.interpolate_) {
                        auto const [cross_track, heading_error] = Alignment(
                          info.true_heading_,
                          info.lat_,
                          info.lon_,
                          last_wp.lat_,
                          last_wp.lon_,
                          wp.lat_,
                          wp.lon_
                        );

                        if ((cross_track > 100.0) || (heading_error > 4.0)) {
                           std::cout << "Aircraft is off track: cross_track=" << cross_track
                                     << "m, heading_error=" << heading_error << "deg" << std::endl;
                           // Convert heading error to an equivalent meter penalty to keep a single
                           // scalar. 50 deg heading error contributes as much as being 400m off the
                           // path, which seems like a reasonable scale.
                           constexpr double heading_penalty_per_degree = 8.0;
                           auto const heading_penalty = heading_error * heading_penalty_per_degree;

                           auto const misalignment = cross_track + heading_penalty;

                           // Larger misalignment -> shorter look-ahead -> faster correction
                           // updates.
                           auto const interpolation_distance =
                             std::max(300.0, 300'000.0 / misalignment);

                           return Interpolate(
                             last_wp.lat_,
                             last_wp.lon_,
                             wp.lat_,
                             wp.lon_,
                             info.lat_,
                             info.lon_,
                             info.true_heading_,
                             interpolation_distance
                           );
                        }
                     }

                     auto const distance = Distance(info.lat_, info.lon_, wp.lat_, wp.lon_);
                     return {wp.lat_, wp.lon_, distance, distance};
                  }();
                  ScopeExit _{[&]() constexpr { last_distance = total_distance; }};

                  if (total_distance - last_distance > 300.0) {
                     std::cout << "Aircraft is moving away from the waypoint" << std::endl;
                  }

                  if (total_distance < wp.tolerance_) {
                     break;
                  }

                  std::cout << distance << " " << total_distance << " " << wp.tolerance_ << " "
                            << std::min(
                                 distance, std::max(wp.tolerance_, total_distance - wp.tolerance_)
                               )
                            << std::endl;
                  // Estimate time to reach the waypoint based on current ground speed. Using half
                  // the remaining distance for polling provides better reactivity when the aircraft
                  // deviates from the track (measured by both cross-track and heading alignment).
                  auto const time_to_next_wp =
                    steady_clock::now()
                    + duration_cast<steady_clock::duration>(duration<double>{
                      std::min(distance, std::max(wp.tolerance_, total_distance - wp.tolerance_))
                      * 0.5
                      / (std::max<double>(info.ground_velocity_, wp.speed_.value_or(0.)) * 0.51444)
                    });

                  co_await (co_await main_.SimConnect())
                    .SetDataOnSimObject(
                      smc::DataId::SET_WAYPOINTS,
                      id.dwObjectID,
                      0,
                      Waypoint{
                        .lat_      = lat,
                        .lon_      = lon,
                        .alt_      = wp.alt_,
                        .is_agl_   = wp.is_agl_,
                        .speed_    = wp.speed_,
                        .throttle_ = wp.throttle_,
                      }
                        .Raw()
                    );

                  std::cout << "Setting next waypoint: " << lat << ", " << lon << " - " << wp.lat_
                            << ", " << wp.lon_ << ", distance: " << distance
                            << ", total_distance: " << total_distance << ", index: " << wp_index
                            << ", time to next wp: "
                            << duration_cast<seconds>(time_to_next_wp - steady_clock::now()).count()
                            << "s" << std::endl;

                  // Poll the user aircraft info every time_to_next_wp to keep it up to date
                  co_await main_.Pool(time_to_next_wp);
               } catch (smc::Disconnected const&) {
                  std::cout << "SimConnect disconnected, stopping aircraft loop" << std::endl;
                  throw;
               } catch (std::exception const& e) {
                  error = true;
                  // std::cerr << "Exception in aircraft loop: " << e.what() << std::endl;
               } catch (...) {
                  error = true;
                  std::cerr << "Unknown exception in aircraft loop" << std::endl;
               }

               if (error) {
                  error = false;
                  // In case of error, wait a bit before retrying to avoid spamming the logs and
                  // giving time for transient issues to resolve (e.g. temporary SimConnect hiccup
                  // or user taking control of the aircraft).
                  co_await main_.Pool(5s);
               }
            }
         } catch (smc::Disconnected const&) {
            std::cout << "SimConnect disconnected, stopping aircraft loop" << std::endl;
            throw;
         } catch (std::exception const& e) {
            error = true;
            // std::cerr << "Exception in aircraft loop: " << e.what() << std::endl;
         } catch (...) {
            error = true;
            std::cerr << "Unknown exception in aircraft loop" << std::endl;
         }

         if (error) {
            error = false;
            // In case of error, wait a bit before retrying to avoid spamming the logs and giving
            // time for transient issues to resolve (e.g. temporary SimConnect hiccup or user
            // taking control of the aircraft).
            co_await main_.Pool(5s);
         }
      }

      co_return;
   });
}
