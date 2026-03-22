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

#include "../SimConnect.h"

#include <Windows.h>
#include <tuple>

template <typename>
inline constexpr bool ALWAYS_FALSE = false;

namespace smc::priv {

template <class T>
T
SimConnect::StaticCast(DWORD const& data) {
   T    result{};
   auto it = reinterpret_cast<char const*>(&data);

   std::apply(
     [&](auto const&... member) constexpr {
        (
          [&]<class M>(M const& member) constexpr {
             if constexpr (std::tuple_element_t<1, M>::VALUE_S == SIMCONNECT_DATATYPE_STRING256) {
                result.*std::get<3>(member) = std::string_view{it};
                it += 256;
             } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                  == SIMCONNECT_DATATYPE_STRING32) {
                result.*std::get<3>(member) = std::string_view{it};
                it += 32;
             } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                  == SIMCONNECT_DATATYPE_STRING8) {
                result.*std::get<3>(member) = std::string_view{it};
                it += 8;
             } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                  == SIMCONNECT_DATATYPE_FLOAT64) {
                static_assert(std::is_same_v<
                              std::remove_reference_t<decltype(result.*std::get<3>(member))>,
                              double>);
                std::move(
                  it, it + sizeof(double), reinterpret_cast<char*>(&(result.*std::get<3>(member)))
                );
                it += sizeof(double);
             } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                  == SIMCONNECT_DATATYPE_FLOAT32) {
                static_assert(std::is_same_v<
                              std::remove_reference_t<decltype(result.*std::get<3>(member))>,
                              float>);
                std::move(
                  it, it + sizeof(float), reinterpret_cast<char*>(&(result.*std::get<3>(member)))
                );
                it += sizeof(float);
             } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                  == SIMCONNECT_DATATYPE_INT32) {
                static_assert(std::is_same_v<
                              std::remove_reference_t<decltype(result.*std::get<3>(member))>,
                              int32_t>);
                std::move(
                  it, it + sizeof(int32_t), reinterpret_cast<char*>(&(result.*std::get<3>(member)))
                );
                it += sizeof(int32_t);
             } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                  == SIMCONNECT_DATATYPE_INT64) {
                static_assert(std::is_same_v<
                              std::remove_reference_t<decltype(result.*std::get<3>(member))>,
                              int64_t>);
                std::move(
                  it, it + sizeof(int64_t), reinterpret_cast<char*>(&(result.*std::get<3>(member)))
                );
                it += sizeof(int64_t);
             } else {
                static_assert(ALWAYS_FALSE<M>, "Unsupported type");
             }
          }(member),
          ...
        );
     },
     T::MEMBERS
   );

   return result;
}

template <class T>
std::size_t
SimConnect::Size() {
   return [] constexpr {
      std::size_t size = 0;

      std::apply(
        [&](auto const&... member) constexpr {
           (
             [&]<class M>(M const&) constexpr {
                if constexpr (std::tuple_element_t<1, M>::VALUE_S
                              == SIMCONNECT_DATATYPE_STRING256) {
                   size += 256;
                } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                     == SIMCONNECT_DATATYPE_STRING32) {
                   size += 32;
                } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                     == SIMCONNECT_DATATYPE_STRING8) {
                   size += 8;
                } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                     == SIMCONNECT_DATATYPE_FLOAT64) {
                   size += sizeof(double);
                } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                     == SIMCONNECT_DATATYPE_FLOAT32) {
                   size += sizeof(float);
                } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                     == SIMCONNECT_DATATYPE_INT32) {
                   size += sizeof(int32_t);
                } else if constexpr (std::tuple_element_t<1, M>::VALUE_S
                                     == SIMCONNECT_DATATYPE_INT64) {
                   size += sizeof(int64_t);
                } else {
                   static_assert(ALWAYS_FALSE<M>, "Unsupported type");
                }
             }(member),
             ...
           );
        },
        T::MEMBERS
      );

      return size;
   }();
}
}  // namespace smc::priv