/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2026 Alexandre GARCIN
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

#include "Templates.h"

#include <algorithm>
#include <map>
#include <set>
#include <stdexcept>

namespace tablet {

std::string
Templates::Load(std::string_view name) {
   auto const bytes{Resource(name)};

   return {reinterpret_cast<char const*>(bytes.data()), bytes.size()};
}

std::string
Templates::Render(std::string_view name, Replacements replacements) {
   return Replace(Load(name), replacements);
}

bool
Templates::IsMarker(std::string_view name) {
   if (name.empty() || name.front() < 'A' || name.front() > 'Z') {
      return false;
   }

   return std::ranges::all_of(name, [](char character) {
      return (character >= 'A' && character <= 'Z') || (character >= '0' && character <= '9')
             || character == '_';
   });
}

std::string
Templates::Replace(std::string_view text, Replacements replacements) {
   std::map<std::string_view, std::string_view> values{};
   std::set<std::string_view>                   used{};

   for (auto const& [name, value] : replacements) {
      if (!IsMarker(name) || !values.emplace(name, value).second) {
         throw std::invalid_argument(
           "Invalid or duplicate template replacement: " + std::string{name}
         );
      }
   }

   std::string output{};
   std::size_t cursor{};

   while (cursor < text.size()) {
      auto const start{text.find('@', cursor)};
      if (start == std::string_view::npos) {
         output.append(text.substr(cursor));
         break;
      }

      output.append(text.substr(cursor, start - cursor));

      auto const end{text.find('@', start + 1)};
      auto const name{
        end == std::string_view::npos ? std::string_view{} : text.substr(start + 1, end - start - 1)
      };
      if (!IsMarker(name)) {
         output += '@';
         cursor = start + 1;
         continue;
      }

      auto const value{values.find(name)};
      if (value == values.end()) {
         throw std::invalid_argument("Missing template replacement: " + std::string{name});
      }

      output.append(value->second);
      used.insert(name);
      cursor = end + 1;
   }

   for (auto const& [name, value] : values) {
      if (!used.contains(name)) {
         throw std::invalid_argument("Unused template replacement: " + std::string{name});
      }
   }

   return output;
}

}  // namespace tablet
