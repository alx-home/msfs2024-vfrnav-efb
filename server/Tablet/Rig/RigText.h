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

#include <filesystem>
#include <string>
#include "../Templates.h"

namespace tablet {

/** Validates rig paths and preserves authored output bytes. */
class RigText {
public:
   /** @brief Write generated text in binary mode without newline translation.
    *
    * @param path Destination file.
    * @param text Text to write. */
   static void Write(std::filesystem::path const& path, std::string const& text);

   /** @brief Reject a package-relative path that can escape its root.
    *
    * @param path Package-relative path to validate. */
   static void ValidateRelativePath(std::filesystem::path const& path);

   /** @brief Escape text for XML character data and attribute values.
    *
    * @param text Text to escape.
    *
    * @return XML-escaped text. */
   static std::string EscapeXml(std::string const& text);

   /**
    * Renders an inline fragment whose authored terminal LF or CRLF is not part of the output.
    * All other bytes are preserved, including embedded CRLF sequences.
    *
    * @param name Path relative to the Tablet Templates directory.
    * @param replacements Values keyed by marker name.
    *
    * @return Rendered fragment without its terminal newline.
    */
   static std::string Fragment(std::string_view name, Templates::Replacements replacements = {});
};

}  // namespace tablet
