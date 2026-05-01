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
#include <optional>
#include <utility>
#include <vector>

template <std::size_t N = 2>
class Coords : public std::array<double, N> {
public:
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
};

// Deduction guide to allow Coords{a, b} to deduce Coords<2>
template <class... ARGS>
Coords(ARGS&&...) -> Coords<sizeof...(ARGS)>;

struct Waypoint {
   double                                   lat_{};           // degrees
   double                                   lon_{};           // degrees
   double                                   tolerance_{200};  // meters
   std::optional<double>                    alt_{};           // feet
   bool                                     is_agl_{};
   std::optional<double>                    speed_{};     // knots
   std::optional<double>                    throttle_{};  // 0 to 16383
   std::optional<bool>                      gear_down_{};
   std::optional<std::pair<double, double>> break_{};
   std::optional<int>                       flaps_{};
   bool                                     on_ground_{false};

   bool delayed_{false};
   bool send_{true};

   static Coords<2> ToMeter(Coords<2> const& origin, Coords<2> const& coords);
   static Coords<2> ToDeg(Coords<2> const& origin, Coords<2> const& coords);

   SIMCONNECT_DATA_WAYPOINT Raw() const { return static_cast<SIMCONNECT_DATA_WAYPOINT>(*this); }

   operator SIMCONNECT_DATA_WAYPOINT() const;
};

using Lat = double;
using Lon = double;

std::vector<Waypoint>
StandardPattern(Coords<2> runwayStart, Coords<2> runwayEnd, bool leftHandTraffic = true);