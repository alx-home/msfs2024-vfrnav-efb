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

#pragma once

#include "MSFS.h"
#include "Request.h"
#include "promise/promise.h"

#include <Windows.h>
#include <SimConnect.h>
#include <utils/ThreeWays.h>
#include <utils/Accessor.h>
#include <cassert>
#include <string>

#include <json/json.h>
#include <string>
#include <vector>

struct Frequency {
   std::string name_{};
   std::string icao_{};

   double      value_{};
   std::size_t type_{};

   static constexpr js::Proto PROTOTYPE{js::Proto{
     js::_{"name", &Frequency::name_},
     js::_{"icao", &Frequency::icao_},
     js::_{"value", &Frequency::value_},
     js::_{"type", &Frequency::type_},
   }};

   Frequency() = default;
   Frequency(MSFS::Frequency right, std::string_view icao);
};

struct Runway {
   std::string designation_{};

   float       length_{};
   float       width_{};
   float       direction_{};
   double      elevation_{};
   std::size_t surface_{};
   double      latitude_{};
   double      longitude_{};

   static constexpr js::Proto PROTOTYPE{js::Proto{
     js::_{"designation", &Runway::designation_},
     js::_{"length", &Runway::length_},
     js::_{"width", &Runway::width_},
     js::_{"direction", &Runway::direction_},
     js::_{"elevation", &Runway::elevation_},
     js::_{"surface", &Runway::surface_},
     js::_{"latitude", &Runway::latitude_},
     js::_{"longitude", &Runway::longitude_},
   }};

   Runway() = default;
   Runway(MSFS::Runway right);
};

struct Facility {
   std::string const ICAO{};

   double lat_{};
   double lon_{};

   bool towered_{};

   std::size_t airport_class_{1};  // todo
   std::size_t airspace_type_{};

   std::string best_approach_{};

   std::string fuel1_{};
   std::string fuel2_{};

   std::size_t airport_private_type_{1};  // todo

   std::vector<Frequency> frequencies_{};

   std::vector<Runway> runways_{};

   std::size_t transition_alt_{};
   std::size_t transition_level_{};

   SIMCONNECT_DATA_DEFINITION_ID request_id_{};

   static constexpr js::Proto PROTOTYPE{js::Proto{
     js::_{"icao", &Facility::ICAO},
     js::_{"lat", &Facility::lat_},
     js::_{"lon", &Facility::lon_},
     js::_{"towered", &Facility::towered_},
     js::_{"airportClass", &Facility::airport_class_},
     js::_{"airspaceType", &Facility::airspace_type_},
     js::_{"bestApproach", &Facility::best_approach_},
     js::_{"fuel1", &Facility::fuel1_},
     js::_{"fuel2", &Facility::fuel2_},
     js::_{"airportPrivateType", &Facility::airport_private_type_},
     js::_{"frequencies", &Facility::frequencies_},
     js::_{"runways", &Facility::runways_},
     js::_{"transitionAlt", &Facility::transition_alt_},
     js::_{"transitionLevel", &Facility::transition_level_},
   }};

   Facility() = default;
   Facility(MSFS::Airport right, SIMCONNECT_DATA_DEFINITION_ID request_id);

   friend constexpr auto operator<=>(Facility const& left, Facility const& right) noexcept {
      return left.ICAO <=> right.ICAO;
   }
};

using FacilityList = std::vector<Facility>;

class Facilities
   : public Request
   , public ThreeWay<Facilities> {
public:
   Facilities(Resolve<FacilityList> const& resolve, Reject const& reject);
   Facilities(Facilities const&)     = delete;
   Facilities(Facilities&&) noexcept = default;

   ~Facilities();

   Facilities& operator=(Facilities const&)     = delete;
   Facilities& operator=(Facilities&&) noexcept = delete;

   std::string const ICAO{};

   FacilityList facilities_{};

private:
   Resolve<FacilityList> const* resolve_;
   Reject const*                reject_;
};

struct AirportInfo {
   std::string const ICAO{};
   double            lat_;
   double            lon_;

   AirportInfo(std::string_view icao, double lat, double lon);

   bool operator==(const AirportInfo&) const = default;
};

template <>
struct std::hash<Facility> {
   using is_transparent = void;

   std::size_t operator()(const Facility& elem) const noexcept {
      return std::hash<std::string_view>{}(elem.ICAO);
   }

   std::size_t operator()(std::string_view icao) const noexcept {
      return std::hash<std::string_view>{}(icao);
   }
};

template <>
struct std::hash<AirportInfo> {
   using is_transparent = void;

   std::size_t operator()(const AirportInfo& elem) const noexcept {
      return std::hash<std::string_view>{}(elem.ICAO);
   }

   std::size_t operator()(std::string_view icao) const noexcept {
      return std::hash<std::string_view>{}(icao);
   }
};