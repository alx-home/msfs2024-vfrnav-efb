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

#include "Waypoint.h"

#include <cmath>
#include <numbers>

Waypoint::
operator SIMCONNECT_DATA_WAYPOINT() const {
   SIMCONNECT_DATA_WAYPOINT result{};
   static_assert(sizeof(result) == sizeof(SIMCONNECT_DATA_WAYPOINT), "Size mismatch");

   result.Latitude        = lat_;
   result.Longitude       = lon_;
   result.Altitude        = alt_.value_or(0);
   result.ktsSpeed        = speed_.value_or(0);
   result.percentThrottle = throttle_.value_or(0);

   result.Flags = 0;

   // For landing/rollout points, let the simulator handle flare and touchdown dynamics
   // instead of forcing a computed vertical speed profile.
   if (alt_.has_value() && (alt_.value() > 0)) {
      result.Flags |= SIMCONNECT_WAYPOINT_COMPUTE_VERTICAL_SPEED;
   }

   if (is_agl_) {
      result.Flags |= SIMCONNECT_WAYPOINT_ALTITUDE_IS_AGL;
   }

   if (on_ground_) {
      result.Flags |= SIMCONNECT_WAYPOINT_ON_GROUND | SIMCONNECT_WAYPOINT_ALTITUDE_IS_AGL;
   }

   if (speed_.has_value()) {
      result.Flags |= SIMCONNECT_WAYPOINT_SPEED_REQUESTED;
   }

   if (throttle_.has_value()) {
      result.Flags |= SIMCONNECT_WAYPOINT_THROTTLE_REQUESTED;
   }

   return result;
}

Coords<2>
Waypoint::ToMeter(Coords<2> const& origin, Coords<2> const& coords) {
   constexpr double metersPerDegLat = 111320.0;

   double lat_rad = origin.at(0) * std::numbers::pi_v<double> / 180.0;

   double dx = (coords.at(1) - origin.at(1)) * metersPerDegLat * std::cos(lat_rad);
   double dy = (coords.at(0) - origin.at(0)) * metersPerDegLat;

   return Coords{dx, dy};
}

Coords<2>
Waypoint::ToDeg(Coords<2> const& origin, Coords<2> const& coords) {
   constexpr double metersPerDegLat = 111320.0;

   double lat0 = origin.at(0);
   double lon0 = origin.at(1);

   double lat_rad = lat0 * std::numbers::pi_v<double> / 180.0;

   double lon = lon0 + coords.at(0) / (metersPerDegLat * std::cos(lat_rad));
   double lat = lat0 + coords.at(1) / metersPerDegLat;

   return Coords{lat, lon};
}

template <std::size_t N, class VALUE>
   requires(N >= 2)
std::vector<VALUE>
Waypoint::Simplify(
  std::vector<Coords<N>> const&                       points,
  double                                              distance,
  std::function<VALUE(Coords<N> const&, std::size_t)> transform
) {
   if (points.size() < 2) {
      std::vector<VALUE> passthrough{};
      passthrough.reserve(points.size());
      for (std::size_t i = 0; i < points.size(); ++i) {
         passthrough.push_back(transform(points[i], i));
      }
      return passthrough;
   }

   // Build an N-dimensional metric space where [lat, lon] are projected to meters.
   Coords<2> const        origin{points.front()[0], points.front()[1]};
   std::vector<Coords<N>> metric;
   metric.reserve(points.size());
   for (auto const& p : points) {
      Coords<2> projected = ToMeter(origin, {p[0], p[1]});
      Coords<N> mp{};
      mp[0] = projected[0];
      mp[1] = projected[1];
      if constexpr (N > 2) {
         [&]<std::size_t... I>(std::index_sequence<I...>) {
            ((mp[I + 2] = p[I + 2]), ...);
         }(std::make_index_sequence<N - 2>{});
      }
      metric.emplace_back(mp);
   }

   auto sq_distance = [&](Coords<N> const& a, Coords<N> const& b) -> double {
      double d2 = 0.0;
      for (std::size_t k = 0; k < N; ++k) {
         if (std::isnan(a[k]) || std::isnan(b[k])) {
            continue;
         }
         double const d = a[k] - b[k];
         d2 += d * d;
      }
      return d2;
   };

   auto point_segment_sq_distance =
     [&](Coords<N> const& p, Coords<N> const& a, Coords<N> const& b) -> double {
      Coords<N> ab{};
      Coords<N> ap{};
      double    ab2 = 0.0;
      double    t   = 0.0;

      for (std::size_t k = 0; k < N; ++k) {
         if (std::isnan(p[k]) || std::isnan(a[k]) || std::isnan(b[k])) {
            continue;
         }
         ab[k] = b[k] - a[k];
         ap[k] = p[k] - a[k];
         ab2 += ab[k] * ab[k];
         t += ap[k] * ab[k];
      }

      if (ab2 <= 1e-9) {
         return sq_distance(p, a);
      }

      t = std::clamp(t / ab2, 0.0, 1.0);

      Coords<N> proj = a;
      for (std::size_t k = 0; k < N; ++k) {
         if (std::isnan(p[k]) || std::isnan(a[k]) || std::isnan(b[k])) {
            continue;
         }
         proj[k] = a[k] + t * ab[k];
      }

      return sq_distance(p, proj);
   };

   // Minimize the number of control points while keeping every skipped point
   // within the user-provided error tolerance from the reduced path.
   double const      tolerance  = std::max(distance, 1.0);
   double const      tolerance2 = tolerance * tolerance;
   auto const        last_index = points.size() - 1;
   std::vector<bool> keep(points.size(), false);
   keep[0]          = true;
   keep[last_index] = true;

   auto simplify = [&](auto&& self, std::size_t start, std::size_t end) -> void {
      if (end <= start + 1) {
         return;
      }

      std::size_t furthest_index = start;
      double      max_d2         = -1.0;
      for (std::size_t i = start + 1; i < end; ++i) {
         double const d2 = point_segment_sq_distance(metric[i], metric[start], metric[end]);
         if (d2 > max_d2) {
            max_d2         = d2;
            furthest_index = i;
         }
      }

      if (max_d2 > tolerance2) {
         keep[furthest_index] = true;
         self(self, start, furthest_index);
         self(self, furthest_index, end);
      }
   };

   simplify(simplify, 0, last_index);

   std::vector<VALUE> control_points;
   control_points.reserve(points.size());
   for (std::size_t i = 0; i < points.size(); ++i) {
      if (keep[i]) {
         control_points.emplace_back(transform(points[i], i));
      }
   }

   return control_points;
}

template std::vector<Coords<2>> Waypoint::Simplify<2, Coords<2>>(
  std::vector<Coords<2>> const&,
  double,
  std::function<Coords<2>(Coords<2> const&, std::size_t)>
);
template std::vector<Coords<3>> Waypoint::Simplify<3, Coords<3>>(
  std::vector<Coords<3>> const&,
  double,
  std::function<Coords<3>(Coords<3> const&, std::size_t)>
);
template std::vector<Waypoint> Waypoint::Simplify<3, Waypoint>(
  std::vector<Coords<3>> const&,
  double,
  std::function<Waypoint(Coords<3> const&, std::size_t)>
);
template std::vector<Waypoint> Waypoint::Simplify<2, Waypoint>(
  std::vector<Coords<2>> const&,
  double,
  std::function<Waypoint(Coords<2> const&, std::size_t)>
);