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

#pragma once

#include <cstddef>
#include <initializer_list>
#include <span>
#include <string>
#include <string_view>
#include <utility>

namespace tablet {

/** @brief Load authored files embedded by the project's NASM incbin packager. */
class Templates {
public:
   using Replacements = std::initializer_list<std::pair<std::string_view, std::string_view>>;

   /**
    * @brief Copy an embedded template without changing its bytes or line endings.
    *
    * @param name Path relative to the Tablet Templates directory.
    *
    * @return Unmodified template bytes.
    *
    * @throws std::invalid_argument If the resource name is not registered.
    */
   static std::string Load(std::string_view name);

   /**
    * @brief Load a template and replace each @NAME@ marker with its supplied value.
    *
    * @param name Path relative to the Tablet Templates directory.
    * @param replacements Values keyed by the marker name without surrounding @ characters.
    *
    * @return Rendered template text.
    *
    * @throws std::invalid_argument If a marker is missing, duplicated, or unused.
    */
   static std::string Render(std::string_view name, Replacements replacements = {});

   /**
    * @brief Replace uppercase @NAME@ markers in a single pass over the original text.
    *
    * @param text Original template; replacement values are never interpreted as templates.
    * @param replacements Values keyed by the marker name without surrounding @ characters.
    *
    * @return Text with markers replaced.
    *
    * @throws std::invalid_argument If a marker is missing, duplicated, or unused.
    */
   static std::string Replace(std::string_view text, Replacements replacements);

private:
   /** @brief Resolve a template's embedded byte span using the generated resource index.
    *
    * @param name Path relative to the Tablet Templates directory.
    *
    * @return Embedded template bytes.
    *
    * @throws std::invalid_argument If the resource name is not registered. */
   static std::span<std::byte const> Resource(std::string_view name);

   /** @brief Recognize an uppercase identifier used between placeholder delimiters.
    *
    * @param name Identifier to check.
    *
    * @return Whether the identifier is a valid marker. */
   static bool IsMarker(std::string_view name);
};

}  // namespace tablet
