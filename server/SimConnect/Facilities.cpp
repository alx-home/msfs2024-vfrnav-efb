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

#include "Facilities.h"

#include "SimConnect.h"

Frequency::Frequency(MSFS::Frequency right, std::string_view icao)
   : name_{std::move(right.name_)}
   , icao_{std::move(icao)}
   , value_{std::move(right.frequency_) / 1'000'000.}
   , type_{static_cast<std::size_t>(std::move(right.type_))} {}

Runway::Runway(MSFS::Runway right)
   : length_{std::move(right.length_)}
   , width_{std::move(right.width_)}
   , direction_{std::move(right.heading_)}
   , elevation_{std::move(right.altitude_)}
   , surface_{static_cast<std::size_t>(right.surface_)}
   , latitude_{std::move(right.latitude_)}
   , longitude_{std::move(right.longitude_)} {
   static constexpr auto DESIGNATOR_STR = [](int32_t designator) constexpr -> std::string {
      return MSFS::Runway::DESIGNATOR_STR.at(static_cast<std::size_t>(designator));
   };
   static constexpr auto NUMBER_STR = [](int32_t designator) constexpr -> std::string {
      return MSFS::Runway::s__number_str.at(static_cast<std::size_t>(designator));
   };

   designation_ = NUMBER_STR(right.primary_number_) + DESIGNATOR_STR(right.primary_designator_)
                  + "-" + NUMBER_STR(right.secondary_number_)
                  + DESIGNATOR_STR(right.secondary_designator_);
}

Facility::Facility(MSFS::Airport right, SIMCONNECT_DATA_DEFINITION_ID request_id)
   : ICAO{std::move(right.icao_)}
   , lat_{std::move(right.latitude_)}
   , lon_{std::move(right.longitude_)}
   , request_id_(request_id) {
   assert(ICAO == right.icao_);

   // altitude_ = std::move(right.altitude_);

   // std::size_t airport_class_{};
   // std::size_t airspace_type_{};

   // std::string best_approach_{};

   // std::string fuel1_{};
   // std::string fuel2_{};

   // std::size_t airport_private_type_{};

   // towered_

   // magvar_          = std::move(right.magvar_);
   // tower_latitude_  = std::move(right.tower_latitude_);
   // tower_longitude_ = std::move(right.tower_longitude_);
   // tower_altitude_  = std::move(right.tower_altitude_);

   frequencies_.reserve(right.n_frequencies_);
   runways_.reserve(right.n_runways_);

   // std::size_t transition_alt_{};
   // std::size_t transition_level_{};

   // n_helipads_      = static_cast<std::size_t>(std::move(right.n_helipads_));
   // n_approaches_    = static_cast<std::size_t>(std::move(right.n_approaches_));
   // n_departures_    = static_cast<std::size_t>(std::move(right.n_departures_));
   // n_arrivals_      = static_cast<std::size_t>(std::move(right.n_arrivals_));
   // n_taxi_points_   = static_cast<std::size_t>(std::move(right.n_taxi_points_));
   // n_taxi_parkings_ = static_cast<std::size_t>(std::move(right.n_taxi_parkings_));
   // n_taxi_paths_    = static_cast<std::size_t>(std::move(right.n_taxi_paths_));
   // n_taxi_names_    = static_cast<std::size_t>(std::move(right.n_taxi_names_));
   // n_jetways_       = static_cast<std::size_t>(std::move(right.n_jetways_));
}

Facilities::Facilities(Resolve<FacilityList> const& resolve, Reject const& reject)
   : resolve_(&resolve)
   , reject_(&reject) {}

Facilities::~Facilities() {
   if (facilities_.size()) {
      (*resolve_)(facilities_);
   } else {
      MakeReject<sim_connect::UnknownError>(*reject_, "Couldn't retrieve facilities");
   }
}

AirportInfo::AirportInfo(std::string_view icao, double lat, double lon)
   : ICAO(icao)
   , lat_(lat)
   , lon_(lon) {}