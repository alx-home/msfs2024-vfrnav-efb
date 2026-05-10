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

#include "FacilityDataType.h"

#include <array>
#include <tuple>
#include <vector>

namespace smc::facility {

struct AirportData : ProcessorImpl<AirportData> {
   struct Runway : ProcessorImpl<Runway> {
      enum class Designator : int32_t {
         NONE   = 0,
         LEFT   = 1,
         RIGHT  = 2,
         CENTER = 3,
         WATER  = 4,
         A      = 5,
         B      = 6,
         LAST   = 7
      };

      double latitude_{};
      double longitude_{};
      double altitude_{};
      float  length_{};
      float  heading_{};

      int32_t    prim_number_{};
      Designator prim_designator_{};

      int32_t    sec_number_{};
      Designator sec_designator_{};

      struct Threshold : ProcessorImpl<Threshold> {
         float   length_{};
         int32_t enabled_{};

         using ProcessorImpl::GetProcessor;
         static constexpr auto MEMBERS =
           std::make_tuple(_m("LENGTH", &Threshold::length_), _m("ENABLE", &Threshold::enabled_));
      };

      Threshold primary_threshold_{};
      Threshold secondary_threshold_{};

      std::string GetDesignatorString(Designator designator) const {
         switch (designator) {
            case Designator::NONE:
               return "";
            case Designator::LEFT:
               return "L";
            case Designator::RIGHT:
               return "R";
            case Designator::CENTER:
               return "C";
            case Designator::WATER:
               return "W";
            case Designator::A:
               return "A";
            case Designator::B:
               return "B";
            default:
               return "?";
         }
      }

      std::string GetPrimaryName() const {
         return std::to_string(prim_number_) + GetDesignatorString(prim_designator_);
      }

      std::string GetSecondaryName() const {
         return std::to_string(sec_number_) + GetDesignatorString(sec_designator_);
      }

      using ProcessorImpl::GetProcessor;
      static constexpr auto MEMBERS = std::make_tuple(
        _m("LATITUDE", &Runway::latitude_),
        _m("LONGITUDE", &Runway::longitude_),
        _m("ALTITUDE", &Runway::altitude_),
        _m("LENGTH", &Runway::length_),
        _m("HEADING", &Runway::heading_),
        _m("PRIMARY_NUMBER", &Runway::prim_number_),
        _m("PRIMARY_DESIGNATOR", &Runway::prim_designator_),
        _m("SECONDARY_NUMBER", &Runway::sec_number_),
        _m("SECONDARY_DESIGNATOR", &Runway::sec_designator_)
      );

      static constexpr auto SECTIONS = std::make_tuple(
        _m("PRIMARY_THRESHOLD", &Runway::primary_threshold_),
        _m("SECONDARY_THRESHOLD", &Runway::secondary_threshold_)
      );
   };
   std::vector<Runway> runways_{};

   using ProcessorImpl::GetProcessor;
   static constexpr auto SECTIONS = std::make_tuple(_m("RUNWAY", &AirportData::runways_));
};

struct Airport : ProcessorImpl<Airport> {
   AirportData data_{};

   using ProcessorImpl::GetProcessor;
   static constexpr auto SECTIONS = std::make_tuple(_m("AIRPORT", &Airport::data_));
};

}  // namespace smc::facility
