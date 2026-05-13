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

#include "AirportFacility.h"

#include "FacilityDataType.inl"
#include "Waypoint.h"

#include <limits>
#include <queue>

namespace smc::facility {

template struct ProcessorImpl<AirportData::Runway::Threshold>;
template struct ProcessorImpl<AirportData::Runway>;
template struct ProcessorImpl<AirportData>;
template struct ProcessorImpl<Airport>;

std::vector<AirportData::TaxiPoint>::const_iterator
AirportData::FindClosestTaxiPoint(Coords<2> position) const {
   auto   best      = taxi_points_.end();
   double best_dist = std::numeric_limits<double>::max();

   auto const pos = Waypoint::ToMeter({lat_, lon_}, position);

   for (auto it = taxi_points_.begin(); it != taxi_points_.end(); ++it) {
      Coords const p{it->x_, it->y_};

      auto const dist = (p - pos).Length();

      if (dist < best_dist) {
         best_dist = dist;
         best      = it;
      }
   }

   return best;
}

std::vector<AirportData::TaxiParking>::const_iterator
AirportData::FindClosestParkingPoint(Coords<2> position) const {
   auto   best      = taxi_parkings_.end();
   double best_dist = std::numeric_limits<double>::max();

   auto const pos = Waypoint::ToMeter({lat_, lon_}, position);

   for (auto it = taxi_parkings_.begin(); it != taxi_parkings_.end(); ++it) {
      Coords const p{it->x_, it->y_};

      auto const dist = (p - pos).Length();

      if (dist < best_dist) {
         best_dist = dist;
         best      = it;
      }
   }

   return best;
}

std::vector<Coords<2>>
AirportData::GetTaxiPath(
  std::vector<TaxiPoint>::const_iterator startIt,
  std::vector<TaxiPoint>::const_iterator goalIt
) const {
   if (taxi_points_.empty()) {
      assert(false);
      return {};
   }

   if ((startIt == taxi_points_.end()) || (goalIt == taxi_points_.end())) {
      assert(false);
      return {};
   }

   std::size_t const pointCount = taxi_points_.size();
   std::size_t const start      = std::distance(taxi_points_.cbegin(), startIt);
   std::size_t const goal       = std::distance(taxi_points_.cbegin(), goalIt);

   std::vector<std::vector<std::tuple<std::size_t, double, AirportData::TaxiPath::Type>>> graph(
     pointCount
   );

   for (auto const& path : taxi_paths_) {
      if (
        (path.type_ == smc::facility::AirportData::TaxiPath::Type::CLOSED)
        || (path.type_ == smc::facility::AirportData::TaxiPath::Type::VEHICLE)
        || (path.type_ == smc::facility::AirportData::TaxiPath::Type::NONE)
        || (path.type_ == smc::facility::AirportData::TaxiPath::Type::PAINTEDLINE)
        || (path.type_ == smc::facility::AirportData::TaxiPath::Type::PARKING)
        || (path.type_ == smc::facility::AirportData::TaxiPath::Type::ROAD)
      ) {
         continue;
      }

      assert(path.start_ < static_cast<int>(pointCount));
      assert(path.end_ < static_cast<int>(pointCount));
      assert(path.start_ != path.end_);
      auto const u = taxi_points_.at(path.start_);
      auto const v = taxi_points_.at(path.end_);

      Coords<2> const p0{u.x_, u.y_};
      Coords<2> const p1{v.x_, v.y_};

      double const cost = (p1 - p0).Length();

      graph.at(path.start_).emplace_back(path.end_, cost, path.type_);
      graph.at(path.end_).emplace_back(path.start_, cost, path.type_);
   }

   std::vector<double> distance(pointCount, std::numeric_limits<double>::infinity());
   std::vector<std::pair<std::size_t, AirportData::TaxiPath::Type>> parent(
     pointCount, {std::numeric_limits<std::size_t>::max(), AirportData::TaxiPath::Type::NONE}
   );

   using QueueNode = std::tuple<double, std::size_t>;  // distance, node, type
   std::priority_queue<QueueNode, std::vector<QueueNode>, std::greater<>> queue;

   distance.at(start) = 0.0;
   queue.emplace(0.0, start);

   while (!queue.empty()) {
      auto const [currentDistance, node] = queue.top();
      queue.pop();

      if (currentDistance > distance.at(node)) {
         continue;
      }

      if (node == goal) {
         break;
      }

      for (auto const& [next, edgeCost, edgeType] : graph.at(node)) {
         double const candidate = currentDistance + edgeCost;
         if (candidate < distance.at(next)) {
            distance.at(next) = candidate;
            assert(edgeType != AirportData::TaxiPath::Type::NONE);
            parent.at(next) = {node, edgeType};
            queue.emplace(candidate, next);
         }
      }
   }

   if (!std::isfinite(distance.at(goal))) {
      assert(false && "No path found between taxi points");
      return {};
   }

   auto const origin = Coords<2>{lat_, lon_};

   std::vector<Coords<2>> route{};
   TaxiPath::Type         type = TaxiPath::Type::PARKING;
   for (std::size_t node = goal; node != std::numeric_limits<std::size_t>::max();
        type = parent.at(node).second, node = parent.at(node).first) {
      if (type == TaxiPath::Type::RUNWAY) {
         continue;
      }

      auto const& p = taxi_points_.at(node);
      route.emplace_back(Waypoint::ToDeg(origin, {p.x_, p.y_}));
   }
   std::ranges::reverse(route);

   return route;
}

}  // namespace smc::facility
