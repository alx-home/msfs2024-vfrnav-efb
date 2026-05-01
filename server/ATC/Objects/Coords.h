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
#include <cmath>
#include <type_traits>
#include <utility>
#include <array>

template <std::size_t N = 2>
class Coords : public std::array<double, N> {
public:
   using std::array<double, N>::array;

   template <class... ARGS>
      requires((sizeof...(ARGS) <= N) && (std::is_arithmetic_v<std::remove_cvref_t<ARGS>> && ...))
   Coords(ARGS&&... args)
      : std::array<double, N>{static_cast<double>(args)...} {}

   template <std::size_t N2, class... ARGS>
      requires((N2 < N) && (sizeof...(ARGS) == N - N2))
   Coords(Coords<N2> const& other, ARGS... padding) {
      std::copy(other.begin(), other.end(), this->begin());
      std::fill(this->begin() + N2, this->end(), padding...);
   }

   Coords operator-(Coords const& other) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return Coords{(this->operator[](I) - other.operator[](I))...};
      }(std::make_index_sequence<N>{});
   }

   Coords operator+(Coords const& other) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return Coords{(this->operator[](I) + other.operator[](I))...};
      }(std::make_index_sequence<N>{});
   }

   Coords operator*(double scalar) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return Coords{(this->operator[](I) * scalar)...};
      }(std::make_index_sequence<N>{});
   }

   Coords operator/(double scalar) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return Coords{(this->operator[](I) / scalar)...};
      }(std::make_index_sequence<N>{});
   }

   Coords& operator+=(Coords const& other) {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         ((this->operator[](I) += other.operator[](I)), ...);
         return *this;
      }(std::make_index_sequence<N>{});
   }

   Coords& operator-=(Coords const& other) {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         ((this->operator[](I) -= other.operator[](I)), ...);
         return *this;
      }(std::make_index_sequence<N>{});
   }

   Coords& operator*=(double scalar) {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         ((this->operator[](I) *= scalar), ...);
         return *this;
      }(std::make_index_sequence<N>{});
   }

   Coords& operator/=(double scalar) {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         ((this->operator[](I) /= scalar), ...);
         return *this;
      }(std::make_index_sequence<N>{});
   }

   Coords operator-() const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return Coords{(-this->operator[](I))...};
      }(std::make_index_sequence<N>{});
   }

   Coords operator+() const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return Coords{(+this->operator[](I))...};
      }(std::make_index_sequence<N>{});
   }

   double Length() const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return std::sqrt(((this->operator[](I) * this->operator[](I)) + ...));
      }(std::make_index_sequence<N>{});
   }

   Coords Normalized() const {
      double length = this->Length();
      if (length == 0) {
         Coords zero{};
         std::fill(zero.begin(), zero.end(), 0.0);
         return zero;
      }
      return *this / length;
   }

   template <class...>
      requires(N == 2)
   Coords Orthogonal() const {
      return Coords{-this->operator[](1), this->operator[](0)};
   }

   template <class...>
      requires(N == 2)
   Coords Rotated(double angle_rad) const {
      double cos_angle = std::cos(angle_rad);
      double sin_angle = std::sin(angle_rad);
      return Coords{
        this->operator[](0) * cos_angle - this->operator[](1) * sin_angle,
        this->operator[](0) * sin_angle + this->operator[](1) * cos_angle
      };
   }

   Coords Scaled(double scale) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return Coords{(this->operator[](I) * scale)...};
      }(std::make_index_sequence<N>{});
   }

   Coords Clamped(double max_length) const {
      double length = this->Length();
      if (length > max_length) {
         return this->Scaled(max_length / length);
      }
      return *this;
   }

   Coords Limited(double max_length) const {
      double length = this->Length();
      if (length > max_length) {
         return this->Scaled(max_length / length);
      }
      return *this;
   }

   template <std::size_t N2>
      requires(N2 < N)
   explicit(false) operator Coords<N2>() const {
      Coords<N2> result{};
      std::copy(this->begin(), this->begin() + N2, result.begin());
      return result;
   }

   bool operator==(Coords const& other) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return ((this->operator[](I) == other.operator[](I)) && ...);
      }(std::make_index_sequence<N>{});
   }

   bool operator!=(Coords const& other) const { return !(*this == other); }

   bool operator<(Coords const& other) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return ((this->operator[](I) < other.operator[](I)) && ...);
      }(std::make_index_sequence<N>{});
   }

   bool operator>(Coords const& other) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return ((this->operator[](I) > other.operator[](I)) && ...);
      }(std::make_index_sequence<N>{});
   }

   bool operator<=(Coords const& other) const { return !(*this > other); }

   bool operator>=(Coords const& other) const { return !(*this < other); }

   friend Coords operator*(double scalar, Coords const& coords) { return coords * scalar; }
   friend Coords operator/(double scalar, Coords const& coords) { return coords / scalar; }
};

// Deduction guide to allow Coords{a, b} to deduce Coords<2>
template <class... ARGS>
   requires(std::is_arithmetic_v<std::remove_cvref_t<ARGS>> && ...)
Coords(ARGS&&...) -> Coords<sizeof...(ARGS)>;

// Deduction guide to allow Coords{a, b} to deduce Coords<2>
template <std::size_t T, class... ARGS>
   requires(std::is_arithmetic_v<std::remove_cvref_t<ARGS>> && ...)
Coords(Coords<T> const&, ARGS&&...) -> Coords<T + sizeof...(ARGS)>;

using Lat = double;
using Lon = double;