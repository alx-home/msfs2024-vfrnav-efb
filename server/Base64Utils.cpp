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

#include "Base64Utils.h"

#include <algorithm>
#include <array>
#include <cassert>
#include <fstream>
#include <span>
#include <vector>
#include <ranges>

std::string
Base64Open(std::string_view path) {
   std::vector<std::byte> data;
   {
      std::ifstream file{path.data(), std::ios::binary};
      if (file.is_open()) {
         file.seekg(0, std::ios::end);
         data.resize(static_cast<std::size_t>(file.tellg()));
         file.seekg(0, std::ios::beg);
         file.read(reinterpret_cast<char*>(data.data()), data.size());
      }
   }

   if (data.empty()) {
      return "";
   } else {
      static constexpr std::array const ENCODING_TABLE{
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
        'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
        'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
        'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'
      };

      auto num_fill = 3 - (data.size() % 3);
      if (num_fill == 3) {
         num_fill = 0;
      }

      data.resize(data.size() + num_fill);
      std::ranges::fill_n(data.end() - num_fill, num_fill, std::byte{});

      assert(!(data.size() % 3));

      using namespace std::ranges;

      std::string encoded;
      encoded.resize(4 * (data.size() / 3));

      auto out_it = encoded.begin();

      for (auto it = data.begin(); it != data.end(); it += 3) {
         uint32_t triple = (static_cast<int>(it[0]) << 0x10) + (static_cast<int>(it[1]) << 0x08)
                           + static_cast<int>(it[2]);

         *out_it = ENCODING_TABLE[(triple >> 3 * 6) & 0x3F];
         ++out_it;
         *out_it = ENCODING_TABLE[(triple >> 2 * 6) & 0x3F];
         ++out_it;
         *out_it = ENCODING_TABLE[(triple >> 1 * 6) & 0x3F];
         ++out_it;
         *out_it = ENCODING_TABLE[(triple >> 0 * 6) & 0x3F];
         ++out_it;
      }

      std::ranges::fill_n(encoded.end() - num_fill, num_fill, '=');
      return encoded;
   }
}