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

#include "RigText.h"
#include "FleetError.h"

#include <fstream>

namespace tablet {

void
RigText::Write(std::filesystem::path const& path, std::string const& text) {
   std::filesystem::create_directories(path.parent_path());

   std::ofstream out{path, std::ios::binary};

   out.exceptions(std::ios::badbit | std::ios::failbit);
   out.write(text.data(), static_cast<std::streamsize>(text.size()));
}

void
RigText::ValidateRelativePath(std::filesystem::path const& path) {
   if (path.empty() || path.has_root_path()) {
      throw FleetError(FleetError::Code::RIG_PATH_MUST_BE_RELATIVE);
   }

   for (auto const& part : path) {
      if (part == ".." || part == ".") {
         throw FleetError(FleetError::Code::RIG_PATH_TRAVERSAL);
      }
   }
}

std::string
RigText::EscapeXml(std::string const& text) {
   std::string out{};

   for (char c : text) {
      switch (c) {
         case '&':
            out += "&amp;";
            break;
         case '<':
            out += "&lt;";
            break;
         case '>':
            out += "&gt;";
            break;
         case '"':
            out += "&quot;";
            break;
         default:
            out += c;
      }
   }

   return out;
}

std::string
RigText::Fragment(std::string_view name, Templates::Replacements replacements) {
   auto text{Templates::Render(name, replacements)};
   if (text.empty() || text.back() != '\n') {
      throw FleetError(FleetError::Code::RIG_FRAGMENT_TERMINAL_LF);
   }

   text.pop_back();

   if (!text.empty() && text.back() == '\r') {
      text.pop_back();
   }

   return text;
}

}  // namespace tablet
