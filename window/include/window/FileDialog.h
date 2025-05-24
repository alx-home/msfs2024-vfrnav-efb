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

#include "json/json.h"
#include <promise/promise.h>
#include <string>
#include <string_view>

namespace dialog {

struct Filter {
   std::string              name_;
   std::vector<std::string> value_;

   static constexpr js::Proto PROTOTYPE{
     js::_{"name", &Filter::name_},
     js::_{"value", &Filter::value_},
   };
};

Promise<std::string> OpenFile(std::string_view path, std::vector<Filter>);
Promise<std::string> OpenFolder(std::string_view path);

}  // namespace dialog