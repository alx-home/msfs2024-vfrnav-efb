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

#include "../Fleet.h"
#include <filesystem>
#include <map>
#include <optional>
#include <string>
#include <vector>

namespace tablet {
/** @brief Relative path and digest used to verify a managed package file. */
struct FileHash {
   std::string path_{};
   std::string hash_{};
};

/** @brief Captured stock source and its origin and digest for overlay verification. */
struct StockFile {
   std::string path_{};
   std::string origin_{};
   std::string hash_{};
   std::string text_{};
};

/** @brief Stored ownership and provenance metadata for a generated overlay. */
class Ownership {
   friend class Fleet;
   friend class Package;
   friend class Planner;
   friend class Inventory;
   friend class Transaction;

   std::string            owner_{};
   std::string            package_{};
   std::string            container_{};
   std::string            efb_{};
   unsigned               schema_{};
   std::vector<FileHash>  files_{};
   std::vector<StockFile> stock_{};
   std::vector<FileHash>  generator_{};
};

/** @brief Planned aircraft overlay, collected stock inputs, and previous ownership. */
class Plan {
   friend class Fleet;
   friend class Package;
   friend class Planner;
   friend class Inventory;
   friend class Transaction;

   Aircraft                           info_{};
   std::filesystem::path              root_{};
   std::filesystem::path              aircraft_{};
   std::map<std::string, std::string> files_{};
   std::map<std::string, StockFile>   stock_{};
   std::optional<Ownership>           previous_{};
};
}  // namespace tablet
