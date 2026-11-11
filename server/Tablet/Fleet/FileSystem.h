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
#include <string_view>
#include <vector>

namespace tablet {
class FileSystem {
public:
   /** @brief Normalize text for case-insensitive simulator comparisons.
    *
    * @param text Text to normalize.
    *
    * @return Lowercase text. */
   static std::string Lower(std::string text);

   /** @brief Remove configuration whitespace and enclosing quote characters.
    *
    * @param text Text to trim.
    *
    * @return Trimmed text. */
   static std::string Trim(std::string text);

   /** @brief Normalize a Windows path for long-path filesystem access.
    *
    * @param path Path to normalize.
    *
    * @return Extended-length path. */
   static std::filesystem::path ExtendedPath(std::filesystem::path const& path);

   /** @brief Reject symbolic links and reparse points in every path component.
    *
    * @param path Path to inspect. */
   static void SafePath(std::filesystem::path path);

   /** @brief Read exact file bytes after checking path safety.
    *
    * @param path File to read.
    *
    * @return File bytes. */
   static std::string ReadBytes(std::filesystem::path const& path);

   /** @brief Read a configuration file and normalize supported Unicode encodings.
    *
    * @param path Configuration file to read.
    *
    * @return Normalized text. */
   static std::string Read(std::filesystem::path const& path);

   /** @brief Calculate the SHA-256 digest used by ownership verification.
    *
    * @param text Bytes to hash.
    *
    * @return Digest string. */
   static std::string Hash(std::string_view text);

   /** @brief Enumerate sorted regular files without following reparse points.
    *
    * @param root Directory to enumerate.
    *
    * @return Sorted file paths. */
   static std::vector<std::filesystem::path> Files(std::filesystem::path const& root);

   /** @brief Validate a relative simulator path and reject traversal.
    *
    * @param text Simulator path to validate.
    *
    * @return Validated relative path. */
   static std::filesystem::path VirtualPath(std::string text);

   /** @brief Find a readable dependency in the ordered content roots.
    *
    * @param roots Content roots in search order.
    * @param relative Relative dependency path.
    *
    * @return Resolved dependency path. */
   static std::filesystem::path
   Resolve(std::vector<std::filesystem::path> const& roots, std::filesystem::path const& relative);

   /** @brief Escape a value for an INI quoted string.
    *
    * @param input Value to escape.
    *
    * @return Escaped value. */
   static std::string QuoteIni(std::string_view input);

   /** @brief Write exact package bytes using long-path support.
    *
    * @param path Destination file.
    * @param bytes Bytes to write. */
   static void Write(std::filesystem::path const& path, std::string_view bytes);

   /** @brief Format an aircraft container name for display.
    *
    * @param name Container name.
    *
    * @return Display name. */
   static std::string Pretty(std::string name);

   /** @brief Best-effort removal of read-only flags during managed cleanup.
    *
    * @param root Directory tree to make writable. */
   static void MakeWritableTree(std::filesystem::path const& root) noexcept;
};
}  // namespace tablet
