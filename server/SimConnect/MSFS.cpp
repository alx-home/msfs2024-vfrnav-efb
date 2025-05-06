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

#include "MSFS.h"

namespace MSFS {
std::array<std::string, 45> Runway::s__number_str = []() constexpr {
   std::array<std::string, 45> result{""};

   for (std::size_t i = 1; i < 37; ++i) {
      if (i > 9) {
         result.at(i) =
           std::string{static_cast<char>(('0' + (i / 10)))} + static_cast<char>('0' + (i % 10));
      } else {
         result.at(i) = '0' + i;
      }
   };

   result.at(37) = "N";
   result.at(38) = "NE";
   result.at(39) = "E";
   result.at(40) = "SE";
   result.at(41) = "S";
   result.at(42) = "SW";
   result.at(43) = "W";
   result.at(44) = "NW";

   return result;
}();
}  // namespace MSFS