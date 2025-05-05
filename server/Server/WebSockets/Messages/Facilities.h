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

#include "Messages.h"

#include <json/json.h>

namespace ws::msg {

struct GetFacilities {
   bool header_{true};

   double lat_{};
   double lon_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_FACILITIES__", &GetFacilities::header_},
     js::_{"lat", &GetFacilities::lat_},
     js::_{"lon", &GetFacilities::lon_},
   };
};

struct Frequency {
   std::string name_{};
   std::string icao_{};
   double      value_{};
   std::size_t type_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"name", &Frequency::name_},
     js::_{"icao", &Frequency::icao_},
     js::_{"value", &Frequency::value_},
     js::_{"type", &Frequency::type_},
   };
};

struct Runway {
   std::string designation_{};
   double      length_{};
   double      width_{};
   double      direction_{};
   double      elevation_{};
   std::size_t surface_{};
   double      latitude_{};
   double      longitude_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"designation", &Runway::designation_},
     js::_{"length", &Runway::length_},
     js::_{"width", &Runway::width_},
     js::_{"direction", &Runway::direction_},
     js::_{"elevation", &Runway::elevation_},
     js::_{"surface", &Runway::surface_},
     js::_{"latitude", &Runway::latitude_},
     js::_{"longitude", &Runway::longitude_},
   };
};

struct Facility {

   std::string            icao_{};
   double                 lat_{};
   double                 lon_{};
   bool                   towered_{};
   std::size_t            airport_class_{};
   std::size_t            airspace_type_{};
   std::string            best_approach_{};
   std::string            fuel1_{};
   std::string            fuel2_{};
   std::size_t            airport_private_type_{};
   std::vector<Frequency> frequencies_{};
   std::vector<Runway>    runways_{};
   double                 transition_alt_{};
   double                 transition_level_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"icao", &Facility::icao_},
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
   };
};

struct Facilities {
   bool header_{true};

   std::vector<Facility> facilities_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__FACILITIES__", &Facilities::header_},

     js::_{"facilities", &Facilities::facilities_},
   };
};

}  // namespace ws::msg
