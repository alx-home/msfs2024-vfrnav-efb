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

struct NavData {
   std::string name_{};
   std::string short_name_{};
   std::size_t order_{};
   std::string data_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"name", &NavData::name_},
     js::_{"shortName", &NavData::short_name_},
     js::_{"order", &NavData::order_},
     js::_{"data", &NavData::data_},
   };
};

struct ExportNav {
   bool header_{true};

   std::vector<NavData> data_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__EXPORT_NAV__", &ExportNav::header_},
     js::_{"data", &ExportNav::data_},
   };
};

struct ImportNav {
   bool header_{true};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__IMPORT_NAV__", &ImportNav::header_},
   };
};

}  // namespace ws::msg
