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
#include "Coords.h"

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

   struct TaxiPath : ProcessorImpl<TaxiPath> {
      enum class Type : int32_t {
         NONE        = 0,
         TAXI        = 1,
         RUNWAY      = 2,
         PARKING     = 3,
         PATH        = 4,
         CLOSED      = 5,
         VEHICLE     = 6,
         ROAD        = 7,
         PAINTEDLINE = 8
      };

      Type               type_{};
      int32_t            runway_number_{};
      Runway::Designator runway_designator_{};

      int32_t start_{};
      int32_t end_{};
      int32_t name_index_{};

      using ProcessorImpl::GetProcessor;
      static constexpr auto MEMBERS = std::make_tuple(
        _m("TYPE", &TaxiPath::type_),
        _m("RUNWAY_NUMBER", &TaxiPath::runway_number_),
        _m("RUNWAY_DESIGNATOR", &TaxiPath::runway_designator_),
        _m("START", &TaxiPath::start_),
        _m("END", &TaxiPath::end_),
        _m("NAME_INDEX", &TaxiPath::name_index_)
      );
   };
   std::vector<TaxiPath> taxi_paths_{};

   struct TaxiName : ProcessorImpl<TaxiName> {
      std::array<char, 32> name_{};

      using ProcessorImpl::GetProcessor;
      static constexpr auto MEMBERS = std::make_tuple(_m("NAME", &TaxiName::name_));
   };
   std::vector<TaxiName> taxi_names_{};

   struct TaxiPoint : ProcessorImpl<TaxiPoint> {
      enum class Type : int32_t {
         NONE                   = 0,
         NORMAL                 = 1,
         HOLD_SHORT             = 2,
         ILS_HOLD_SHORT         = 4,
         HOLD_SHORT_NO_DRAW     = 5,
         ILS_HOLD_SHORT_NO_DRAW = 6
      };
      Type type_{};
      enum class Orientation : int32_t {
         FORWARD = 0,
         REVERSE = 1,
      };
      Orientation orientation_{};
      float       x_{};  // meters offset from airport reference point
      float       y_{};  // meters offset from airport reference point

      using ProcessorImpl::GetProcessor;
      static constexpr auto MEMBERS = std::make_tuple(
        _m("TYPE", &TaxiPoint::type_),
        _m("ORIENTATION", &TaxiPoint::orientation_),
        _m("BIAS_X", &TaxiPoint::x_),
        _m("BIAS_Z", &TaxiPoint::y_)
      );
   };
   std::vector<TaxiPoint> taxi_points_{};

   struct TaxiParking : ProcessorImpl<TaxiParking> {
      enum class ParkingType : int32_t {
         NONE            = 0,
         RAMP_GA         = 1,
         RAMP_GA_SMALL   = 2,
         RAMP_GA_MEDIUM  = 3,
         RAMP_GA_LARGE   = 4,
         RAMP_CARGO      = 5,
         RAMP_MIL_CARGO  = 6,
         RAMP_MIL_COMBAT = 7,
         GATE_SMALL      = 8,
         GATE_MEDIUM     = 9,
         GATE_HEAVY      = 10,
         DOCK_GA         = 11,
         FUEL            = 12,
         VEHICLE         = 13,
         RAMP_GA_EXTRA   = 14,
         GATE_EXTRA      = 15
      };
      ParkingType parking_type_{};

      enum class Type : int32_t {
         NONE                   = 0,
         NORMAL                 = 1,
         HOLD_SHORT             = 2,
         ILS_HOLD_SHORT         = 4,
         HOLD_SHORT_NO_DRAW     = 5,
         ILS_HOLD_SHORT_NO_DRAW = 6
      };
      Type type_{};

      enum class Orientation : int32_t {
         FORWARD = 0,
         REVERSE = 1,
      };
      Orientation orientation_{};

      int32_t  name_{};
      int32_t  suffix_{};
      uint32_t number_{};

      float heading_{};
      float x_{};  // meters offset from airport reference point
      float y_{};  // meters offset from airport reference point

      using ProcessorImpl::GetProcessor;
      static constexpr auto MEMBERS = std::make_tuple(
        _m("TYPE", &TaxiParking::parking_type_),
        _m("TAXI_POINT_TYPE", &TaxiParking::type_),
        _m("ORIENTATION", &TaxiParking::orientation_),
        _m("HEADING", &TaxiParking::heading_),
        _m("BIAS_X", &TaxiParking::x_),
        _m("BIAS_Z", &TaxiParking::y_),
        _m("NAME", &TaxiParking::name_),
        _m("SUFFIX", &TaxiParking::suffix_),
        _m("NUMBER", &TaxiParking::number_)
      );
   };
   std::vector<TaxiParking> taxi_parkings_{};

   std::vector<TaxiPoint>::const_iterator   FindClosestTaxiPoint(Coords<2> position) const;
   std::vector<TaxiParking>::const_iterator FindClosestParkingPoint(Coords<2> position) const;
   std::vector<Coords<2>>                   GetTaxiPath(
     std::vector<TaxiPoint>::const_iterator from,
     std::vector<TaxiPoint>::const_iterator to
   ) const;

   using ProcessorImpl::GetProcessor;

   double lat_{};
   double lon_{};
   double altitude_{};

   static constexpr auto MEMBERS = std::make_tuple(
     _m("LATITUDE", &AirportData::lat_),
     _m("LONGITUDE", &AirportData::lon_),
     _m("ALTITUDE", &AirportData::altitude_)
   );
   static constexpr auto SECTIONS = std::make_tuple(
     _m("RUNWAY", &AirportData::runways_),
     _m("TAXI_POINT", &AirportData::taxi_points_),
     _m("TAXI_PARKING", &AirportData::taxi_parkings_),
     _m("TAXI_NAME", &AirportData::taxi_names_),
     _m("TAXI_PATH", &AirportData::taxi_paths_)
   );
};

struct Airport : ProcessorImpl<Airport> {
   AirportData data_{};

   using ProcessorImpl::GetProcessor;
   static constexpr auto SECTIONS = std::make_tuple(_m("AIRPORT", &Airport::data_));
};

}  // namespace smc::facility
