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

struct GetMetar {
   bool header_{true};

   std::string icao_{};
   double      lat_{};
   double      lon_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_METAR__", &GetMetar::header_},

     js::_{"icao", &GetMetar::icao_},
     js::_{"lat", &GetMetar::lat_},
     js::_{"lon", &GetMetar::lon_},
   };
};

struct Metar {
   bool header_{true};

   std::optional<std::string> metar_{};
   std::optional<std::string> taf_{};
   std::optional<std::string> local_metar_{};
   std::optional<std::string> local_taf_{};
   std::optional<bool>        cavok_{};
   std::string                icao_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__METAR__", &Metar::header_},

     js::_{"metar", &Metar::metar_},
     js::_{"taf", &Metar::taf_},
     js::_{"localMetar", &Metar::local_metar_},
     js::_{"localTaf", &Metar::local_taf_},
     js::_{"cavok", &Metar::cavok_},
     js::_{"icao", &Metar::icao_},
   };
};

}  // namespace ws::msg
