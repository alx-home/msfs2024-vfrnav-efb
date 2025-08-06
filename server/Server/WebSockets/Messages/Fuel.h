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

#include <json/json.h>
#include <vector>

namespace ws::msg {

struct GetFuel {
   bool header_{true};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_FUEL__", &GetFuel::header_},
   };
};

struct Tank {
   std::size_t capacity_{};
   std::size_t value_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"capacity", &Tank::capacity_},
     js::_{"value", &Tank::value_},
   };
};

struct Fuel {
   bool header_{true};

   std::vector<Tank> tanks_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__FUEL__", &Fuel::header_},

     js::_{"tanks", &Fuel::tanks_},
   };
};

}  // namespace ws::msg
