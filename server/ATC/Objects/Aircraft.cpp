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

#include "SimConnect/Data/ManualControl.h"
#include "SimConnect/FacilityData/Waypoint.h"

#include "Exceptions.h"
#include "main.h"
#include "TrafficPattern.h"

#include "SimConnect/Data/TrafficInfo.h"
#include "SimConnect/SimConnect.h"
#include "SimConnect/SimConnect.inl"
#include "SimConnect/Data/Flaps.h"
#include "SimConnect/Data/Break.h"
#include "promise/CVPromise.h"
#include "utils/Scoped.h"

#include <promise/promise.h>
#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <deque>
#include <iomanip>
#include <iostream>
#include <limits>
#include <mutex>
#include <numbers>
#include <ranges>
#include <shared_mutex>
#include <stdexcept>
#include <string>

#define LAND_LOGGING
#define WAYPOINT_LOGGING

using namespace std::chrono_literals;
using namespace std::chrono;

namespace {

class PIDController {
public:
   struct Params {
      double kp_{};
      double ki_{};
      double kd_{};
      double window_s_{5.0};  // sliding window duration for integral (seconds)
   };

   explicit PIDController(Params params)
      : params_(params) {}

   double Update(
     double                                error,
     std::chrono::steady_clock::time_point now = std::chrono::steady_clock::now()
   ) {
      auto const dt = std::max(1e-3, std::chrono::duration<double>(now - last_time_).count());
      last_time_    = now;

      double integral = [&] {
         double integral = 0.0;

         if (params_.ki_ != 0.) {
            auto const cutoff = now
                                - std::chrono::duration_cast<std::chrono::steady_clock::duration>(
                                  std::chrono::duration<double>(params_.window_s_)
                                );

            // Sliding window integral: accumulate (time, error*dt) samples, drop old ones
            window_.emplace_back(now, error * dt);

            while (!window_.empty() && window_.front().first < cutoff) {
               window_.pop_front();
            }

            for (auto const& [t, v] : window_) {
               integral += v;
            }

            return params_.ki_ * integral;
         } else if (window_.size()) {
            window_.clear();
         }

         return 0.0;
      }();

      auto const derivate = (params_.kd_ == 0.) ? 0 : -params_.kd_ * (error - last_error_) / dt;
      last_error_         = error;

      auto const output = params_.kp_ * error + integral + derivate;

      last_output_ = output;
      return output;
   }

   double LastOutput() const { return last_output_; }

private:
   Params                                                               params_;
   std::deque<std::pair<std::chrono::steady_clock::time_point, double>> window_;
   double                                                               last_error_{};
   double                                                               last_output_{};
   std::chrono::steady_clock::time_point last_time_{std::chrono::steady_clock::now()};
};

class Mean {
public:
   struct Params {
      double alpha_{};
      double initial_{};
   };

   explicit Mean(Params params)
      : params_(params)
      , last_output_(params_.initial_) {}

   double Update(double value) {
      last_output_ = params_.alpha_ * value + (1. - params_.alpha_) * last_output_;
      return last_output_;
   }

   double Value() const { return last_output_; }

          operator double() const { return last_output_; }
   double operator*() const { return last_output_; }

private:
   Params params_;
   double last_output_{};
};

class LowPassFilter {
public:
   struct Params {
      double initial_{};
      double alpha_{1.};
      double delta_min_{-std::numeric_limits<double>::infinity()};
      double delta_max_{std::numeric_limits<double>::infinity()};
   };

   explicit LowPassFilter(Params params)
      : params_(params)
      , state_(params_.initial_) {
      params_.alpha_ = std::clamp(params_.alpha_, 0.0, 1.0);
   }

   double Update(double input) {
      delta_ =
        std::clamp((input - state_) * params_.alpha_, params_.delta_min_, params_.delta_max_);
      state_ += delta_;
      return state_;
   }

   double Delta() { return delta_; }

private:
   Params params_{};
   double state_{};
   double delta_{};
};

}  // namespace

Aircraft::Aircraft(Main& main)
   : main_(main) {
   auto const _ = main_.MainPool::Dispatch([this] { state_.Ready(); });
};

Aircraft::~Aircraft() {
   auto const _ = main_.MainPool::Dispatch([this] { state_.Done(); });
}

WPromise<Aircraft::ObjectId>
Aircraft::SetID() const {
   return [this] -> Promise<Aircraft::ObjectId> {
      ScopeExit _{[] { std::cout << "Aircraft[set_id]: SetID loop ended" << std::endl; }};

      co_await WaitReady();

      while (true) {
         try {
            auto titles = co_await main_.SimConnect().GetTrafficTitles();
            assert(titles.size() > 0);

            // std::mt19937                          rng(std::random_device{}());
            // std::uniform_int_distribution<size_t> dist(0, titles.size() - 1);

            auto const& [title, livery]{*std::next(
              titles.begin(), 999
              //   dist(rng)
            )};

            std::cout << "Aircraft: Creating aircraft with title \"" << title << "\" and livery \""
                      << livery << "\"" << std::endl;

            co_return co_await main_.SimConnect().AICreateNonATCAircraft(
              title,
              livery,
              "LF-KYUW",
              {
                // .Latitude  = 48.76219,
                // .Longitude = 2.09394,
                // .Altitude  = 2000,

                .Latitude  = 48.73222,
                .Longitude = 2.08188,
                .Altitude  = 1000,
                .Pitch     = 0,
                .Bank      = 0,

                // .Heading = 180,
                .Heading = 370,

                .OnGround = FALSE,
                .Airspeed = 140,
              }
            );
         } catch (smc::Disconnected const&) {
         } catch (smc::Timeout const&) {
         } catch (std::exception const& e) {
            std::cerr << "Aircraft: Failed to create aircraft: " << e.what() << std::endl;
            break;
         } catch (...) {
            std::cerr << "Aircraft: Failed to create aircraft with unknown error" << std::endl;
            break;
         }

         co_await promise::Race(WaitDone(), main_.Wait(5s));
      }

      throw std::runtime_error("Aircraft destroyed before ID was assigned");
   };
}

WPromise<smc::TrafficStaticInfo>
Aircraft::SetAircraftStaticInfo() const {
   return [this] -> Promise<smc::TrafficStaticInfo> {
      co_return co_await promise::Race(main_.SimConnect().GetAircraftStaticInfo(co_await ID));
   };
}

WPromise<void>
Aircraft::JoinTrafficPattern(std::string_view icao) {
   return [this, icao = std::string{icao}] -> Promise<void> {
      ScopeExit _{[] {
         std::cout << "Aircraft[init_waypoint]: JoinTrafficPattern loop ended" << std::endl;
      }};

      co_await WaitReady();

      while (true) {
         try {
            auto const [airport_data, static_info] = *(co_await promise::Race(
              promise::All(main_.SimConnect().GetAirportFacility(icao), STATIC_INFO), WaitDone()
            ));

            auto const pattern =
              Pattern::Make(airport_data, std::max(1., std::exp2(static_info.design_vs0_ / 80.)));
            auto const origin = Coords<2>{airport_data.lat_, airport_data.lon_};

            Coords const taxi_parking{Waypoint::ToDeg(
              origin, {airport_data.taxi_parkings_[14].x_, airport_data.taxi_parkings_[14].y_}
            )};

            auto const taxi_start_it =
              airport_data.FindClosestTaxiPoint({pattern.end_[0], pattern.end_[1]});
            auto const taxi_end_it = airport_data.FindClosestTaxiPoint(taxi_parking);

            auto const taxi_start = Waypoint::ToDeg(origin, {taxi_start_it->x_, taxi_start_it->y_});
            auto const taxi_end   = Waypoint::ToDeg(origin, {taxi_end_it->x_, taxi_end_it->y_});

            std::cout << "Aircraft[init_waypoint]: Taxi start: (" << taxi_start[0] << ", "
                      << taxi_start[1] << "), Taxi end: (" << taxi_end[0] << ", " << taxi_end[1]
                      << ")" << std::endl;

            auto taxi = airport_data.GetTaxiPath(taxi_start_it, taxi_end_it)
                        | std::views::transform([](Coords<2> const& coords) {
                             return Waypoint{
                               .lat_       = coords[0],
                               .lon_       = coords[1],
                               .is_agl_    = true,
                               .on_ground_ = true,
                             };
                          })
                        | std::ranges::to<std::vector<Waypoint>>();

            taxi.emplace_back(
              Waypoint{
                .lat_       = taxi_parking[0],
                .lon_       = taxi_parking[1],
                .is_agl_    = true,
                .on_ground_ = true,
              }
            );

            auto const wp =
              TransformWaypoints(pattern.Join(), pattern.Loop(), pattern.Land(), std::move(taxi));

#ifdef WAYPOINT_LOGGING
            for (auto const& cwp : wp) {
               std::cout << R"_( <ATCWaypoint id="WP1">
               <WorldPosition>)_"
                         << std::fixed << std::setprecision(5) << cwp.lat_ << ", " << cwp.lon_
                         << R"_(, +000000.00</WorldPosition>
               <ATCWaypointType>User</ATCWaypointType>
             </ATCWaypoint>)_"
                         << std::endl;
               if (cwp.land_) {
                  std::cout << R"_( <ATCWaypoint id="WP2">
               <WorldPosition>)_"
                            << std::fixed << std::setprecision(5) << cwp.land_->start_[0] << ", "
                            << cwp.land_->start_[1] << R"_(, +000000.00</WorldPosition>
               <ATCWaypointType>User</ATCWaypointType>
             </ATCWaypoint>)_"
                            << std::endl;
                  std::cout << R"_( <ATCWaypoint id="WP2">
               <WorldPosition>)_"
                            << std::fixed << std::setprecision(5) << cwp.land_->end_[0] << ", "
                            << cwp.land_->end_[1] << R"_(, +000000.00</WorldPosition>
               <ATCWaypointType>User</ATCWaypointType>
             </ATCWaypoint>)_"
                            << std::endl;
               }
            }
#endif

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

         co_await promise::Race(WaitDone(), main_.Wait(5s));
      }
      co_return;
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

template <class... WAYPOINTS>
std::deque<Waypoint>
Aircraft::TransformWaypoints(std::vector<WAYPOINTS> const&... waypoints_list) {
   std::deque<Waypoint> transformed_waypoints{};

   for (auto const& waypoints : {std::vector<Waypoint>{waypoints_list}...}) {
      for (std::size_t i = 0; i < waypoints.size(); ++i) {
         assert(!std::isnan(waypoints[i].lat_) && !std::isinf(waypoints[i].lat_));
         assert(!std::isnan(waypoints[i].lon_) && !std::isinf(waypoints[i].lon_));

         assert(
           !waypoints[i].alt_ || !(std::isnan(*waypoints[i].alt_) || std::isinf(*waypoints[i].alt_))
         );
         assert(
           !waypoints[i].speed_
           || !(std::isnan(*waypoints[i].speed_) || std::isinf(*waypoints[i].speed_))
         );
         assert(
           !waypoints[i].throttle_
           || !(std::isnan(*waypoints[i].throttle_) || std::isinf(*waypoints[i].throttle_))
         );

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
   if (duration) {
      return promise::Race(*update_promise_, main_.Wait(*duration), WaitDone());
   } else {
      return promise::Race(*update_promise_, WaitDone());
   }
}

WPromise<void>
Aircraft::WaitReady() const {
   return promise::Race(state_.WaitWithReject(), main_.WaitTerminate());
}

WPromise<void>
Aircraft::WaitDone() const {
   return promise::Race(state_.WaitDoneWithReject(), main_.WaitTerminate());
}

WPromise<void>
Aircraft::SimRateLoop() {
   return [this]() -> Promise<void> {
      ScopeExit _{[] { std::cout << "Aircraft[sim_rate]: Sim rate loop ended" << std::endl; }};

      co_await WaitReady();
      std::cout << "Aircraft[sim_rate]: Sim rate loop started" << std::endl;

      while (true) {
         try {
            auto const sim_rate =
              *(co_await promise::Race(main_.SimConnect().WatchSimRate(sim_rate_), WaitDone()));

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
         } catch (AppStopping const&) {
            std::cerr << "Aircraft[sim_rate]: App Stopping, stopping sim rate loop" << std::endl;
            throw;
         } catch (std::exception const& e) {
            std::cerr << "Aircraft[sim_rate]: Error while watching sim rate: " << e.what()
                      << ", retrying sim rate loop" << std::endl;
         } catch (...) {
            std::cerr
              << "Aircraft[sim_rate]: Unknown error while watching sim rate, retrying sim rate loop"
              << std::endl;
         }

         co_await promise::Race(main_.Wait(5s), WaitDone());
      }
   };
}

WPromise<void>
Aircraft::LandAircraftRollout(Coords<2> const& direction, double slope) {
   return [this, direction, slope]() -> Promise<void> {
      std::cout << "Aircraft[rollout]: Rollout loop started" << std::endl;
      ScopeExit _{[] { std::cout << "Aircraft[rollout]: Rollout loop ended" << std::endl; }};

      auto&      sim_connect = main_.SimConnect();
      auto const id          = co_await ID;

      auto const runway_heading_rad = std::fmod(
        std::atan2(direction[0], direction[1]) + 2.0 * std::numbers::pi, 2.0 * std::numbers::pi
      );

      auto const [init_info, static_info] =
        *(co_await promise::Race(promise::All(*traffic_info_, STATIC_INFO), WaitDone()));

      auto const    target_pitch = -static_info.static_pitch_ - slope;
      LowPassFilter pitch_filter{{
        .initial_   = init_info.pitch_,  // radians
        .delta_min_ = -0.2 * std::numbers::pi / 180.0,
        .delta_max_ = 0.2 * std::numbers::pi / 180.0,
      }};

      // Zero pitch and lock to runway heading.
      co_await promise::Race(
        promise::All(
          sim_connect.SetDataOnSimObject(smc::DataId::SET_BANK_CONTROL, id.dwObjectID, 0, 0.0),
          sim_connect.SetDataOnSimObject(
            smc::DataId::SET_HEADING_CONTROL, id.dwObjectID, 0, runway_heading_rad
          )
        ),
        WaitDone()
      );

      auto speed_filter = LowPassFilter{{
        .initial_   = init_info.ground_velocity_,  // knots
        .delta_min_ = -1,
        .delta_max_ = 1,
      }};

      std::size_t low_speed_samples = 0;

      while (true) {
         auto const& info = *(co_await promise::Race(*traffic_info_, WaitDone()));

         auto const gs_kts = info.ground_velocity_;

         if (gs_kts <= 25.0) {
            ++low_speed_samples;
         } else {
            low_speed_samples = 0;
         }

#ifdef LAND_LOGGING
         std::cout << " on_ground=" << static_cast<int>(info.sim_on_ground_)
                   << " vspeed=" << info.vspeed_ << std::endl;
#endif

         // Require several consecutive low-speed samples to avoid exiting on a transient read.
         if ((low_speed_samples >= 6) && info.sim_on_ground_) {
#ifdef LAND_LOGGING
            std::cout << "Aircraft[rollout]: Ground speed " << gs_kts
                      << "kts sustained low enough, stopping rollout control" << std::endl;
#endif
            co_return;
         }

         auto const next_speed = speed_filter.Update(22);
#ifdef LAND_LOGGING
         std::cout << "Aircraft[rollout]: gs=" << gs_kts << "kts low_count=" << low_speed_samples
                   << ", next_speed=" << next_speed << std::endl;
#endif

         auto const new_pitch_rad = pitch_filter.Update(target_pitch);
         co_await promise::Race(
           promise::All(
             sim_connect.SetDataOnSimObject(
               smc::DataId::SET_SPEED_CONTROL,
               id.dwObjectID,
               0,
               smc::SpeedControl{
                 .vertical_ = std::min(
                   0.,
                   (std::cos(new_pitch_rad) * std::sin(new_pitch_rad) * next_speed - 5) * 1.68781
                 ),
                 .longitudinal_ = next_speed * 1.68781,
                 .lateral_      = 0.0,
               }
             ),
             sim_connect.SetDataOnSimObject(
               smc::DataId::SET_PITCH_CONTROL, id.dwObjectID, 0, new_pitch_rad
             ),
             main_.Wait(100ms)
           ),
           WaitDone()
         );
      }
   };
}

WPromise<void>
Aircraft::LandAircraft(Waypoint const& target, double slope, double height) {
   using namespace std::chrono;

   return [this, target, slope, touch_alt = height] -> Promise<void> {
      auto& sim_connect = main_.SimConnect();
      std::cout << "Aircraft[main_loop]: Setting landing mode" << std::endl;
      ScopeExit _{[] { std::cout << "Aircraft[main_loop]: Landing loop ended" << std::endl; }};

      auto const id = co_await ID;

      auto const [init_info, static_info] = *(co_await promise::Race(
        promise::All(sim_connect.AIReleaseControl(id.dwObjectID), *traffic_info_, STATIC_INFO),
        WaitDone()
      ));

      assert(target.land_);
      Coords<2> const origin{target.land_->start_[0], target.land_->start_[1]};

      auto const planar_dir =
        Waypoint::ToMeter(origin, {target.land_->end_[0], target.land_->end_[1]});

      // Approach origin (FAF / extended centerline) sits on a 3° glide slope above touchdown.
      auto       glide_slope = 3.0 * std::numbers::pi / 180.0;
      auto       flare_slope = 6.0 * std::numbers::pi / 180.0;
      auto const axis_len =
        planar_dir.Length() - 50 * std::clamp(static_info.design_vs0_ / 80. - 1., 0.0, 1.0);
      auto       delta_alt = axis_len * std::tan(glide_slope);
      auto const axis      = planar_dir.Normalized();

      PIDController pitch_pid{{.kp_ = 4}};
      PIDController heading_pid{{.kp_ = 4}};

      LowPassFilter pitch_filter{{
        .initial_   = init_info.pitch_,  // radians
        .alpha_     = 0.2,
        .delta_min_ = -1. * std::numbers::pi / 180.0,
        .delta_max_ = 1. * std::numbers::pi / 180.0,
      }};

      auto const init_speed = init_info.ground_velocity_ * 0.514444;        // knots to m/s
      auto const end_speed  = (static_info.design_vs0_ * 1.10) * 0.514444;  // knots to m/s

      bool flare       = false;
      auto last_update = steady_clock::now();
#ifdef LAND_LOGGING
      auto last_log = last_update;
#endif
      // double prev_alt = std::numeric_limits<double>::infinity();
      while (true) {
         try {
            auto const info = *(co_await promise::Race(*traffic_info_, WaitDone()));

            auto const now = steady_clock::now();
            last_update    = now;

            auto const alt_grd = info.ground_altitude_ - static_info.static_cg_to_ground_;

            // If the gear is on the ground or we are very close to it with the flare already
            // initiated, switch to rollout mode.
            // bool alt_stable  = std::fabs(prev_alt - alt_grd) < 0.001 * 0.3048;
            // bool near_ground = alt_grd < 1.2 * 0.3048;
            if (flare && info.TouchingGround())  //(info.gear_on_ground_ || (near_ground &&
                                                 // alt_stable)))
            {
               co_await LandAircraftRollout(planar_dir.Normalized(), slope);
               co_return;
            }

            // prev_alt = alt_grd;

            auto const heading_rad = info.true_heading_;
            auto const altitude    = info.altitude_;
            auto const aircraft_pos{
              Waypoint::ToMeter(origin, {info.lat_, info.lon_}),
            };
            Coords const aircraft_dir{std::sin(heading_rad), std::cos(heading_rad)};

            // aircraft_pos projection on approach axis.
            auto const pos_along_axis{(aircraft_pos * axis) * axis};
            auto const pos_to_axis{pos_along_axis - aircraft_pos};
            auto const along_axis_m = aircraft_pos * axis;
            auto const alignment    = std::pow(
              std::cos(
                std::remainder(heading_rad - std::atan2(axis[0], axis[1]), 2.0 * std::numbers::pi)
              ),
              2
            );

            auto const along_progress  = std::clamp(along_axis_m / axis_len, 0.0, 1.0);
            auto const along_progress2 = along_progress < 0.8 ? 0.0 : (along_progress - 0.8) * 5.0;

            // -------------------------------------------------------
            // ------------------- Lateral control -------------------
            // -------------------------------------------------------

            auto const heading_guidance = [&]() {
               // lookahead distance proportional to speed
               auto const lookahead_m = 4 * info.true_airspeed_;
               auto const aiming      = (pos_to_axis + lookahead_m * axis).Normalized();
               return std::fmod(
                 std::atan2(aiming[0], aiming[1]) + 2.0 * std::numbers::pi, 2.0 * std::numbers::pi
               );
            }();

            auto const heading_error =
              std::remainder(heading_rad - heading_guidance, 2.0 * std::numbers::pi);

            // -------------------------------------------------------
            // ----------------- Longitudinal control ----------------
            // -------------------------------------------------------

            // Target speed along the approach varies from 80 knots at the start to 60 knots
            // at the threshold, to ensure a smooth touchdown. Convert to m/s.
            auto const target_speed = init_speed * (1. - along_progress)
                                      + (flare ? end_speed * 0.4 : end_speed) * along_progress;

            // -------------------------------------------------------
            // ------------------ Vertical control -------------------
            // -------------------------------------------------------

            // Target the glideslope altitude at the aircraft's projected position on the
            // axis. Stay on the MSL glideslope most of the way, then blend to local ground
            // altitude near touchdown so the wheels actually reach the runway.
            auto const ground_alt_m = alt_grd * 0.3048;
            auto const altitude_m   = altitude * 0.3048;
            auto const touch_alt_m  = touch_alt * 0.3048;
            auto const blend_alt_m =
              (altitude_m - touch_alt_m) * (1.0 - along_progress2) + ground_alt_m * along_progress2;

            auto const vel_dir = std::atan2(
              info.world_vertical_velocity_ * 0.3048,
              std::hypot(info.world_lat_velocity_, info.world_lon_velocity_) * 0.3048
            );

            flare |= ((axis_len - along_axis_m) < 200);

            auto const target_alt_m   = flare ? 0 : delta_alt * (1.0 - along_progress);
            auto const deltaAlt       = blend_alt_m - target_alt_m;
            auto const pitch_guidance = [&]() {
               Coords const pos_to_axis{0, -deltaAlt};
               auto const   slope = flare ? flare_slope : -glide_slope;
               Coords const axis{std::cos(slope), std::sin(slope)};

               auto const lookhead_dist = 4 * info.true_airspeed_;
               auto const lookahead     = lookhead_dist * alignment * axis;
               auto const aiming        = (pos_to_axis + lookahead);
               return std::atan2(aiming[1], aiming[0]);
            }();
            auto const vel_error = std::remainder(pitch_guidance - vel_dir, 2.0 * std::numbers::pi);

            auto const target_vel = pitch_pid.Update(vel_error);

            auto const pitch_cmd = std::clamp(
              -target_vel,
              -(flare ? flare_slope : 15.0 * std::numbers::pi / 180.0),
              15.0 * std::numbers::pi / 180.0
            );
            auto const new_pitch_rad = pitch_filter.Update(pitch_cmd);

            // Force 5kts vspeed at flare to ensure wheels contact the ground
            auto const flare_vspeed =
              flare
                ? std::min(
                    0.,
                    std::cos(new_pitch_rad) * (std::sin(new_pitch_rad) * info.true_airspeed_ - 5)
                  )
                : 0;

            // -------------------------------------------------------
            // ----------------------- Logging -----------------------
            // -------------------------------------------------------

#ifdef LAND_LOGGING
            if (now - last_log > 100ms) {
               auto const speed = std::max(1.0, info.ground_velocity_ * 0.514444);  // knots to m/s
               auto const speed_error = target_speed - speed;

               last_log                     = now;
               auto const restore_flags     = std::cout.flags();
               auto const restore_precision = std::cout.precision();

               constexpr int w_section = 10;
               constexpr int w_label   = 7;
               constexpr int w_value   = 5;
               constexpr int w_field   = 20;

               auto const log_field =
                 [&](std::string_view label, auto value, std::string_view suffix = "") {
                    std::ostringstream field;
                    field << std::left << std::setw(w_label) << label << std::right << std::fixed
                          << std::setprecision(3) << std::setw(w_value) << value << suffix;
                    std::cout << std::left << std::setfill(' ') << std::setw(w_field)
                              << field.str();
                 };

               auto const log_section =
                 [&](std::string_view name, auto&& write_fields, bool terminal = false) {
                    std::ostringstream section;
                    section << '[' << name << ']';
                    std::cout << "    " << std::left << std::setfill(' ') << std::setw(w_section)
                              << section.str() << ' ';
                    write_fields();
                    if (terminal) {
                       std::cout << std::endl;
                    } else {
                       std::cout << '\n';
                    }
                 };

               std::cout << std::fixed << std::setprecision(3) << "Aircraft[landing]\n";

               log_section("general", [&] {
                  log_field("prog", along_progress * 100.0, "%");
                  log_field("prog2", along_progress2 * 100.0, "%");
                  log_field("along", along_axis_m, "m");
                  log_field("flare", flare ? "yes" : "no");
                  log_field("align", alignment * 100.0, "%");
               });

               log_section("vertical", [&] {
                  log_field("err", deltaAlt, "m");
                  log_field("alt", altitude * 0.3048, "m");
                  log_field("trgt", target_alt_m, "m");
                  log_field("blnd", blend_alt_m, "m");
                  log_field("grd", ground_alt_m, "m");
               });
               log_section("pitch", [&] {
                  log_field("cur", vel_dir * 180.0 / std::numbers::pi, "deg");
                  log_field("cmd", pitch_cmd * 180.0 / std::numbers::pi, "deg");
                  log_field("new", new_pitch_rad * 180.0 / std::numbers::pi, "deg");
                  log_field("err", vel_error * 180.0 / std::numbers::pi, "deg");
                  log_field("pid", target_vel * 180.0 / std::numbers::pi, "deg");
               });

               log_section("speed", [&] {
                  log_field("err", speed_error);
                  log_field("curr", info.true_airspeed_, "kts");
                  log_field("tgt", target_speed * 1.94384, "kts");
                  log_field("vs", flare_vspeed, "kts");
               });

               log_section(
                 "heading",
                 [&] {
                    log_field("hdg", heading_rad * 180.0 / std::numbers::pi, "deg");
                    log_field("cmd", heading_guidance * 180.0 / std::numbers::pi, "deg");
                    log_field("err", heading_error * 180.0 / std::numbers::pi, "deg");
                 },
                 true
               );

               std::cout.flags(restore_flags);
               std::cout.precision(restore_precision);
            }
#endif

            // -------------------------------------------------------
            // ------------------ Command updates --------------------
            // -------------------------------------------------------

            co_await promise::Race(
              promise::All(
                sim_connect.SetDataOnSimObject(
                  smc::DataId::SET_PITCH_CONTROL, id.dwObjectID, 0, new_pitch_rad
                ),
                sim_connect.SetDataOnSimObject(
                  smc::DataId::SET_AI_HEADING,
                  id.dwObjectID,
                  0,
                  heading_guidance * 180.0 / std::numbers::pi
                ),
                sim_connect.SetDataOnSimObject(
                  smc::DataId::SET_AI_SPEED, id.dwObjectID, 0, target_speed * 1.94384
                ),
                sim_connect.SetDataOnSimObject(
                  smc::DataId::SET_VSPEED_CONTROL,
                  id.dwObjectID,
                  0,
                  flare_vspeed * 1.68781  // knots to ft/s
                ),
                main_.Wait(
                  100ms
                  //  milliseconds{static_cast<uint64_t>(std::clamp(1'000. /
                  //  std::fabs(tot_error), 5., 5.))}
                )
              ),
              WaitDone()
            );

            continue;
         } catch (smc::Timeout const&) {
            std::cerr << "Aircraft[landing]: Timeout while controlling landing, retrying loop"
                      << std::endl;
         }

         // If we catch an error, we wait 1 seconds before retrying
         co_await Wait(1s);
      }
   };
}

WPromise<void>
Aircraft::AlignWithWaypoint(Waypoint const& current_wp, smc::TrafficInfo const& info) {
   return [this, &current_wp, &info] -> Promise<void> {
      std::cout << "Aircraft[align_loop]: Waypoint is on ground, aligning heading and bank to 0"
                << std::endl;

      ScopeExit _{[] {
         std::cout << "Aircraft[align_loop]: Finished aligning to ground waypoint, resuming "
                   << "normal control" << std::endl;
      }};

      auto&      sim_connect = main_.SimConnect();
      auto const id          = co_await ID;

      auto const target_heading_rad = std::remainder(
        std::atan2(current_wp.lon_ - info.lon_, current_wp.lat_ - info.lat_), 2.0 * std::numbers::pi
      );

      LowPassFilter heading_filter{
        {.initial_ = info.true_heading_, .delta_min_ = -0.2, .delta_max_ = 0.2}
      };
      LowPassFilter bank_filter{{.initial_ = info.bank_, .delta_min_ = -0.2, .delta_max_ = 0.2}};

      while (true) {
         auto const current_info = *(co_await promise::Race(*traffic_info_, WaitDone()));

         if (
           (std::remainder(current_info.true_heading_ - target_heading_rad, 2.0 * std::numbers::pi)
            < 2 * std::numbers::pi / 180.0)
           && (std::fabs(current_info.bank_) < 1 * std::numbers::pi / 180.0)
         ) {
            break;
         }

         // If the waypoint is on ground, we force bank control to 0 and heading
         // control to the target heading to avoid weird behavior of the sim.
         co_await promise::Race(
           promise::All(
             sim_connect.SetDataOnSimObject(
               smc::DataId::SET_BANK_CONTROL, id.dwObjectID, 0, bank_filter.Update(0)
             ),
             sim_connect.SetDataOnSimObject(
               smc::DataId::SET_HEADING_CONTROL,
               id.dwObjectID,
               0,
               heading_filter.Update(target_heading_rad)
             ),
             main_.Wait(5ms)
           ),
           WaitDone()
         );
      }
   };
}

WPromise<void>
Aircraft::AircraftLoop() {
   return [this] -> Promise<void> {
      ScopeExit _{[] { std::cout << "Aircraft[main_loop]: loop ended" << std::endl; }};

      co_await WaitReady();

      SIMCONNECT_RECV_ASSIGNED_OBJECT_ID id{};
      auto&                              sim_connect = main_.SimConnect();

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
      auto const              updateWaypoints = [&](bool has_lock = false) {
         std::cout << "Aircraft[main_loop]: Updating waypoints" << std::endl;

         std::vector<SIMCONNECT_DATA_WAYPOINT> sc_waypoints{};
         {
            std::optional<std::shared_lock<std::shared_mutex>> const lock{
              has_lock ? std::nullopt
                       : std::make_optional<std::shared_lock<std::shared_mutex>>(mutex_)
            };

            sc_waypoints.reserve(wp_.size());
            bool was_on_ground = false;
            for (auto const& wp : wp_) {
               if (wp.delayed_ && sc_waypoints.size()) {
                  std::cout << "Aircraft[main_loop]: Delaying waypoint: " << wp.lat_ << ", "
                            << wp.lon_ << std::endl;
                  break;
               } else if (wp.delayed_) {
                  std::cout << "Aircraft[main_loop]: Delayed waypoint: " << wp.lat_ << ", "
                            << wp.lon_ << std::endl;
               }

               if (wp.land_) {
                  sc_waypoints.emplace_back(wp.Raw());
                  break;
               }

               if (wp.send_) {
                  sc_waypoints.emplace_back(wp.Raw());
               }

               if (was_on_ground && (sc_waypoints.size() == 1)) {
                  // Send waypoint one by one for ground taxi to avoid weird behavior when sending
                  // multiple waypoints.
                  // Keeps one ahead in the buffer to avoid stopping the aircraft between waypoints.
                  break;
               }

               if (wp.send_) {
                  was_on_ground = wp.on_ground_;
               }
            }
         }

         if (sc_waypoints.empty()) {
            return Promise<void>::Resolve();
         }
         return promise::Race(
           sim_connect.SetDataOnSimObject(
             smc::DataId::SET_WAYPOINTS, id.dwObjectID, 0, std::move(sc_waypoints)
           ),
           WaitDone()
         );
      };

      auto const next_wp{[&](smc::TrafficInfo const&) {
         return WPromise{[&] -> Promise<bool> {
            std::unique_lock<std::shared_mutex> lock{mutex_};

            if (wp_.size()) {
               current_wp = std::make_optional(wp_.front());
               wp_.pop_front();

               std::cout << "Aircraft[main_loop]: Next Waypoint: " << current_wp->lat_ << ", "
                         << current_wp->lon_
                         << (current_wp->alt_.has_value()
                               ? ", alt: " + std::to_string(*current_wp->alt_)
                               : "")
                         << std::endl;

               if (current_wp->gear_down_) {
                  std::cout << "Aircraft[main_loop]: Setting gear "
                            << (*current_wp->gear_down_ ? "down" : "up") << std::endl;
                  co_await promise::Race(
                    sim_connect.SetDataOnSimObject(
                      smc::DataId::SET_GEAR, id.dwObjectID, 0, *current_wp->gear_down_ ? 1. : 0.
                    ),
                    WaitDone()
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
                    WaitDone()
                  );
               }

               // if (current_wp->on_ground_) {
               //    co_await AlignWithWaypoint(*current_wp, info);
               // }

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
                    WaitDone()
                  );
               }

               if (current_wp->land_) {
                  lock.unlock();
                  std::cout << "Aircraft[main_loop]: Starting landing sequence" << std::endl;

                  auto const [touch_alt, end_alt] = *(co_await promise::Race(
                    promise::All(
                      sim_connect.GetGroundInfo(
                        current_wp->land_->start_[0], current_wp->land_->start_[1]
                      ),
                      sim_connect.GetGroundInfo(
                        current_wp->land_->end_[0], current_wp->land_->end_[1]
                      )
                    ),
                    WaitDone()
                  ));
                  auto const slope                = std::atan2(
                    end_alt - touch_alt,
                    Distance(
                      current_wp->land_->start_[0],
                      current_wp->land_->start_[1],
                      current_wp->land_->end_[0],
                      current_wp->land_->end_[1]
                    )
                  );
                  co_await LandAircraft(*current_wp, slope, touch_alt);

                  current_wp = std::nullopt;
                  co_return true;
               }
            }

            co_await updateWaypoints(true);
            co_return current_wp.has_value();
         }};
      }};

      while (true) {
         try {
            std::cout << "Aircraft[main_loop]: Get Aircraft Info" << std::endl;
            auto const info = *(co_await promise::Race(*traffic_info_, WaitDone()));

            if (!current_wp) {
               co_await next_wp(info);

               if (!current_wp) {
                  co_await Wait();
               }
               continue;
            }

            auto const wp_distance = co_await [&] -> Promise<std::optional<double>> {
               auto const wp_distance =
                 Distance(info.lat_, info.lon_, current_wp->lat_, current_wp->lon_);

               // If we're farther from the current waypoint than the minimum distance we've seen,
               // it's likely that we've passed it, so we move to the next one.
               if (wp_distance > current_wp->min_distance_) {
                  co_await next_wp(info);
                  co_return std::nullopt;
               }

               if (wp_distance < current_wp->min_distance_) {
                  current_wp->min_distance_ = wp_distance;
               }

               co_return wp_distance;
            };

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

            co_await Wait(
              std::clamp(
                duration_cast<seconds>(next_wp_est_time / sim_rate_.load()),
                duration_cast<seconds>(100ms),
                10s
              )
            );
            continue;
         } catch (smc::Timeout const&) {
            std::cerr
              << "Aircraft[main_loop]: Timeout while waiting for SimConnect, retrying aircraft loop"
              << std::endl;
         }

         // If we catch an error, we wait 1 seconds before retrying
         co_await Wait(1s);
      }

      std::cout << "Aircraft[main_loop]: loop stopped" << std::endl;
      co_return;
   };
}

Aircraft::TrafficInfoCache::TrafficInfoCache(Aircraft& self)
   : self_(self) {}

WPromise<smc::TrafficInfo>
Aircraft::TrafficInfoCache::operator*() {
   auto const now = std::chrono::steady_clock::now();
   if ((now - traffic_info_last_update_) > 100ms) {
      traffic_info_last_update_ = now;
      promise_                  = [this] -> Promise<smc::TrafficInfo> {
         co_return co_await self_.main_.SimConnect().GetAircraftInfo(co_await self_.ID);
      };
   }

   return promise_;
}