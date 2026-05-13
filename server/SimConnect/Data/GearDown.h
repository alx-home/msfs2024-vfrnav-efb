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

#include "DataType.h"
#include <SimConnect.h>

#include <tuple>

namespace smc {

struct GearDown {
   double gear_down_{};

   static constexpr auto MEMBERS = std::make_tuple(
     smc::_m{
       &GearDown::gear_down_,
       "GEAR HANDLE POSITION",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "percent over 100",
     }
   );
};

}  // namespace smc