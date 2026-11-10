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
#include <stdexcept>
#include <string>
#include <type_traits>
#include <utility>
#include <array>
#include <vector>

template <std::size_t N = 2, std::size_t M = 2>
class Matrix : public std::array<double, N * M> {
public:
   using std::array<double, N * M>::array;

   template <class... ARGS>
      requires(
        (sizeof...(ARGS) <= N * M) && (std::is_arithmetic_v<std::remove_cvref_t<ARGS>> && ...)
      )
   Matrix(ARGS&&... args)
      : std::array<double, N * M>{static_cast<double>(args)...} {}

   Matrix operator-(Matrix const& other) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return Matrix{(this->operator[](I) - other.operator[](I))...};
      }(std::make_index_sequence<N * M>{});
   }

   Matrix operator+(Matrix const& other) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return Matrix{(this->operator[](I) + other.operator[](I))...};
      }(std::make_index_sequence<N * M>{});
   }

   Matrix operator*(double scalar) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return Matrix{(this->operator[](I) * scalar)...};
      }(std::make_index_sequence<N * M>{});
   }

   Matrix operator/(double scalar) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return Matrix{(this->operator[](I) / scalar)...};
      }(std::make_index_sequence<N * M>{});
   }

   Matrix& operator+=(Matrix const& other) {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         ((this->operator[](I) += other.operator[](I)), ...);
         return *this;
      }(std::make_index_sequence<N * M>{});
   }

   Matrix& operator-=(Matrix const& other) {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         ((this->operator[](I) -= other.operator[](I)), ...);
         return *this;
      }(std::make_index_sequence<N * M>{});
   }

   Matrix& operator*=(double scalar) {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         ((this->operator[](I) *= scalar), ...);
         return *this;
      }(std::make_index_sequence<N * M>{});
   }

   Matrix& operator/=(double scalar) {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         ((this->operator[](I) /= scalar), ...);
         return *this;
      }(std::make_index_sequence<N * M>{});
   }

   Matrix operator-() const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return Matrix{(-this->operator[](I))...};
      }(std::make_index_sequence<N * M>{});
   }

   Matrix operator+() const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return Matrix{(+this->operator[](I))...};
      }(std::make_index_sequence<N * M>{});
   }

   Matrix Scaled(double scale) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return Matrix{(this->operator[](I) * scale)...};
      }(std::make_index_sequence<N * M>{});
   }

   bool operator==(Matrix const& other) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return ((this->operator[](I) == other.operator[](I)) && ...);
      }(std::make_index_sequence<N * M>{});
   }

   bool operator!=(Matrix const& other) const { return !(*this == other); }

   bool operator<(Matrix const& other) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return ((this->operator[](I) < other.operator[](I)) && ...);
      }(std::make_index_sequence<N * M>{});
   }

   bool operator>(Matrix const& other) const {
      return [&]<std::size_t... I>(std::index_sequence<I...>) constexpr {
         return ((this->operator[](I) > other.operator[](I)) && ...);
      }(std::make_index_sequence<N * M>{});
   }

   template <std::size_t N2, std::size_t M2>
      requires(M == N2)
   Matrix<N, M2> operator*(Matrix<N2, M2> const& matrice) const {
      Matrix<N, M2> result{};
      for (std::size_t i = 0; i < N; ++i) {
         for (std::size_t j = 0; j < M2; ++j) {
            for (std::size_t k = 0; k < M; ++k) {
               result[i * M2 + j] += this->operator[](i * M + k) * matrice(k, j);
            }
         }
      }
      return result;
   }

   bool operator<=(Matrix const& other) const { return !(*this > other); }

   bool operator>=(Matrix const& other) const { return !(*this < other); }

   friend Matrix operator*(double scalar, Matrix const& matrix) { return matrix * scalar; }
   friend Matrix operator/(double scalar, Matrix const& matrix) { return matrix / scalar; }
};

class DMatrix : public std::vector<double> {
public:
   using std::vector<double>::vector;
   std::size_t const ROWS{0};
   std::size_t const COLS{0};

   template <class... ARGS>
      requires((std::is_arithmetic_v<std::remove_cvref_t<ARGS>> && ...))
   DMatrix(std::size_t rows, std::size_t cols, ARGS&&... args)
      : std::vector<double>{static_cast<double>(args)...}
      , ROWS{rows}
      , COLS{cols} {}

   DMatrix operator-(DMatrix const& other) const {
      if ((ROWS != other.ROWS) || (COLS != other.COLS)) {
         throw std::runtime_error("Cannot subtract matrices of different sizes");
      }

      DMatrix result(ROWS, COLS);

      for (std::size_t i = 0; i < ROWS * COLS; ++i) {
         if (this->operator[](i) != other[i]) {
            result[i] = this->operator[](i) - other[i];
         }
      }

      return result;
   }

   DMatrix operator+(DMatrix const& other) const {
      if ((ROWS != other.ROWS) || (COLS != other.COLS)) {
         throw std::invalid_argument("Cannot add matrices of different sizes");
      }

      DMatrix result(ROWS, COLS);

      for (std::size_t i = 0; i < ROWS * COLS; ++i) {
         if (this->operator[](i) != other[i]) {
            result[i] = this->operator[](i) + other[i];
         }
      }

      return result;
   }

   DMatrix operator*(double scalar) const {
      DMatrix result(ROWS, COLS);

      for (std::size_t i = 0; i < ROWS * COLS; ++i) {
         if (this->operator[](i) != 0.0) {
            result[i] = this->operator[](i) * scalar;
         }
      }

      return result;
   }

   DMatrix operator/(double scalar) const {
      DMatrix result(ROWS, COLS);

      for (std::size_t i = 0; i < ROWS * COLS; ++i) {
         if (this->operator[](i) != 0.0) {
            result[i] = this->operator[](i) / scalar;
         }
      }

      return result;
   }

   DMatrix& operator+=(DMatrix const& other) {
      if ((ROWS != other.ROWS) || (COLS != other.COLS)) {
         throw std::invalid_argument("Cannot add matrices of different sizes");
      }

      for (std::size_t i = 0; i < ROWS * COLS; ++i) {
         this->operator[](i) += other[i];
      }

      return *this;
   }

   DMatrix& operator-=(DMatrix const& other) {
      if ((ROWS != other.ROWS) || (COLS != other.COLS)) {
         throw std::invalid_argument("Cannot subtract matrices of different sizes");
      }

      for (std::size_t i = 0; i < ROWS * COLS; ++i) {
         this->operator[](i) -= other[i];
      }

      return *this;
   }

   DMatrix& operator*=(double scalar) {
      for (std::size_t i = 0; i < ROWS * COLS; ++i) {
         this->operator[](i) *= scalar;
      }
      return *this;
   }

   DMatrix& operator/=(double scalar) {
      for (std::size_t i = 0; i < ROWS * COLS; ++i) {
         this->operator[](i) /= scalar;
      }
      return *this;
   }

   DMatrix operator-() const {
      DMatrix result(ROWS, COLS);
      for (std::size_t i = 0; i < ROWS * COLS; ++i) {
         result[i] = -this->operator[](i);
      }
      return result;
   }

   DMatrix operator+() const {
      DMatrix result(ROWS, COLS);
      for (std::size_t i = 0; i < ROWS * COLS; ++i) {
         result[i] = +this->operator[](i);
      }
      return result;
   }

   DMatrix Scaled(double scale) const {
      DMatrix result(ROWS, COLS);
      for (std::size_t i = 0; i < ROWS * COLS; ++i) {
         result[i] = this->operator[](i) * scale;
      }
      return result;
   }

   bool operator==(DMatrix const& other) const {
      if ((ROWS != other.ROWS) || (COLS != other.COLS)) {
         return false;
      }

      for (std::size_t i = 0; i < ROWS * COLS; ++i) {
         if (this->operator[](i) != other[i]) {
            return false;
         }
      }
      return true;
   }

   bool operator!=(DMatrix const& other) const { return !(*this == other); }

   bool operator<(DMatrix const& other) const {
      if ((ROWS != other.ROWS) || (COLS != other.COLS)) {
         throw std::invalid_argument("Cannot compare matrices of different sizes");
      }

      for (std::size_t i = 0; i < ROWS * COLS; ++i) {
         if (this->operator[](i) >= other[i]) {
            return false;
         }
      }
      return true;
   }

   bool operator>(DMatrix const& other) const {
      if ((ROWS != other.ROWS) || (COLS != other.COLS)) {
         throw std::invalid_argument("Cannot compare matrices of different sizes");
      }

      for (std::size_t i = 0; i < ROWS * COLS; ++i) {
         if (this->operator[](i) <= other[i]) {
            return false;
         }
      }
      return true;
   }

   template <std::size_t N2, std::size_t M2>
   DMatrix operator*(Matrix<N2, M2> const& matrice) const {
      if (COLS != N2) {
         throw std::invalid_argument(
           "Cannot multiply matrices: incompatible sizes (" + std::to_string(ROWS) + "x"
           + std::to_string(COLS) + " and " + std::to_string(N2) + "x" + std::to_string(M2) + ")"
         );
      }

      DMatrix result(ROWS, M2);

      for (std::size_t i = 0; i < ROWS; ++i) {
         for (std::size_t j = 0; j < M2; ++j) {
            for (std::size_t k = 0; k < COLS; ++k) {
               result[i * M2 + j] += this->operator[](i * COLS + k) * matrice(k, j);
            }
         }
      }

      return result;
   }

   bool operator<=(DMatrix const& other) const { return !(*this > other); }

   bool operator>=(DMatrix const& other) const { return !(*this < other); }

   friend DMatrix operator*(double scalar, DMatrix const& matrix) { return matrix * scalar; }
   friend DMatrix operator/(double scalar, DMatrix const& matrix) { return matrix / scalar; }
};

// Deduction guide to allow Matrix{a, b} to deduce Matrix<2>
template <class... ARGS>
   requires(std::is_arithmetic_v<std::remove_cvref_t<ARGS>> && ...)
Matrix(ARGS&&...) -> Matrix<sizeof...(ARGS)>;