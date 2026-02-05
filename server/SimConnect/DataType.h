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

#include <Windows.h>
#include <SimConnect.h>
#include <optional>
#include <string_view>
#include <tuple>

namespace sm {
template <SIMCONNECT_DATATYPE VALUE>
struct Type {
   static constexpr SIMCONNECT_DATATYPE VALUE_S = VALUE;
};
template <SIMCONNECT_DATATYPE VALUE>
using _t = Type<VALUE>;

template <SIMCONNECT_DATATYPE TYPE, class CLASS, class T>
using _m = std::tuple<std::string_view, _t<TYPE>, std::optional<std::string_view>, T CLASS::*>;
}  // namespace sm