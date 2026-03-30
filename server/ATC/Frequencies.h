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

#include <string>
#include <json/json.h>

struct Frequency {
   struct Name {
      std::string local_{"unknown"};
      std::string english_{"unknown"};

      static constexpr js::Proto PROTOTYPE{
        js::_{"local", &Name::local_},
        js::_{"english", &Name::english_},
      };
   };
   Name        name_{};
   double      value_{0};
   std::string type_{"UNKNOWN"};
   std::string hor_{"UNKNOWN"};
   std::string comment_{"UNKNOWN"};

   static constexpr js::Proto PROTOTYPE{
     js::_{"name", &Frequency::name_},
     js::_{"frequency", &Frequency::value_},
     js::_{"type", &Frequency::type_},
     js::_{"hor", &Frequency::hor_},
     js::_{"comment", &Frequency::comment_},
   };
};