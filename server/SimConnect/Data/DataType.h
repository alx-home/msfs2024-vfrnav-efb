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

#include <Windows.h>
#include <SimConnect.h>
#include <optional>
#include <string_view>
#include <tuple>

namespace smc {
template <SIMCONNECT_DATATYPE VALUE>
struct Type {
   static constexpr SIMCONNECT_DATATYPE VALUE_S = VALUE;
};
template <SIMCONNECT_DATATYPE VALUE>
using _t = Type<VALUE>;

template <SIMCONNECT_DATATYPE TYPE, class CLASS, class T>
struct _m {
   std::string_view                name_{};
   _t<TYPE>                        type_{};
   std::optional<std::string_view> unit_{};
   T CLASS::* member_{};

   constexpr _m(
     std::string_view                name,
     _t<TYPE>                        type,
     std::optional<std::string_view> unit,
     T CLASS::* member
   )
      : name_{name}
      , type_{type}
      , unit_{unit}
      , member_{member} {}
};

template <SIMCONNECT_DATATYPE TYPE, class CLASS, class T>
constexpr auto
make_m(
  std::string_view                name,
  _t<TYPE>                        type,
  std::optional<std::string_view> unit,
  T CLASS::* member
) -> _m<TYPE, CLASS, T> {
   return _m<TYPE, CLASS, T>{name, type, unit, member};
}
}  // namespace smc

namespace std {
template <SIMCONNECT_DATATYPE TYPE, class CLASS, class T>
struct tuple_size<smc::_m<TYPE, CLASS, T>> : std::integral_constant<size_t, 4> {};

template <size_t INDEX, SIMCONNECT_DATATYPE TYPE, class CLASS, class T>
struct tuple_element<INDEX, smc::_m<TYPE, CLASS, T>> {
   using type = std::conditional_t<
     INDEX == 0,
     std::string_view,
     std::conditional_t<
       INDEX == 1,
       smc::_t<TYPE>,
       std::conditional_t<INDEX == 2, std::optional<std::string_view>, T CLASS::*>>>;
};

template <size_t INDEX, SIMCONNECT_DATATYPE TYPE, class CLASS, class T>
constexpr auto&
get(smc::_m<TYPE, CLASS, T>& member) noexcept {
   if constexpr (INDEX == 0) {
      return member.name_;
   } else if constexpr (INDEX == 1) {
      return member.type_;
   } else if constexpr (INDEX == 2) {
      return member.unit_;
   } else {
      return member.member_;
   }
}

template <size_t INDEX, SIMCONNECT_DATATYPE TYPE, class CLASS, class T>
constexpr auto const&
get(smc::_m<TYPE, CLASS, T> const& member) noexcept {
   if constexpr (INDEX == 0) {
      return member.name_;
   } else if constexpr (INDEX == 1) {
      return member.type_;
   } else if constexpr (INDEX == 2) {
      return member.unit_;
   } else {
      return member.member_;
   }
}
}  // namespace std