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

#include <array>
#include <cstdint>
#include <string>

namespace MSFS {

#pragma pack(push, 1)

#pragma region Airport
struct Airport {
   char    icao_[8];
   double  latitude_;
   double  longitude_;
   int8_t  towered_;
   int32_t n_frequencies_;
   int32_t n_runways_;

   float transition_alt_;
   float transition_level_;
};

#pragma endregion

#pragma region Runway
struct Runway {
   static constexpr std::array<char const*, 7> DESIGNATOR_STR{"", "L", "R", "C", "W", "A", "B"};
   static std::array<std::string, 45>          s__number_str;

   int32_t primary_number_;  // todo NORTH/WIDTH/...
   int32_t primary_designator_;
   int32_t secondary_number_;  // todo NORTH/WIDTH/...
   int32_t secondary_designator_;
   float   length_;
   float   width_;
   float   heading_;
   double  altitude_;
   int32_t surface_;
   double  latitude_;
   double  longitude_;
};
#pragma endregion

#pragma region Freq/Vor
struct Frequency {
   char    name_[64];
   int32_t frequency_;
   int32_t type_;
};

struct Vor {
   double   vor_lat_;
   double   vor_lon_;
   double   vor_alt_;
   double   dme_lat_;
   double   dme_lon_;
   double   dme_alt_;
   double   gs_lat_;
   double   gs_lon_;
   double   gs_alt_;
   double   tacan_lat_;
   double   tacan_lon_;
   double   tacan_alt_;
   int      is_nav_;
   int      is_dme_;
   int      is_tacan_;
   int      has_glide_slope_;
   int      dme_at_nav_;
   int      dme_at_glide_slope_;
   int      has_back_course_;
   unsigned frequency_;
   int      type_;
   float    range_;
   float    magvar_;
   float    localizer_;
   float    localier_width_;
   float    glide_slope_;
   char     name_[64];
};
#pragma endregion

#pragma region Waypoint
struct Waypoint {
   double lat_;
   double lon_;
   double alt_;
   int    type_;
   float  magvar_;
   int    n_routes_;
};
#pragma endregion
#pragma pack(pop)
}  // namespace MSFS