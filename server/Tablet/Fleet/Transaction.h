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

#include "State.h"
#include <filesystem>
#include <map>
#include <string>
#include <set>

namespace tablet {

/** @brief Own temporary package staging cleanup for a fleet transaction. */
class StagingDirectory {
public:
   /** @brief Take responsibility for removing the staging directory after installation.
    *
    * @param path Staging directory to clean up. */
   explicit StagingDirectory(std::filesystem::path path);

   /** @brief Clear read-only flags and remove remaining staged files without throwing. */
   ~StagingDirectory();

   /** @brief Disallow copying directory cleanup ownership. */
   StagingDirectory(StagingDirectory const&) = delete;

   /** @brief Disallow assignment of directory cleanup ownership. */
   StagingDirectory& operator=(StagingDirectory const&) = delete;

private:
   std::filesystem::path path_{};
};

/** @brief Commit managed overlay changes while preserving rollback information. */
class Transaction {
public:
   /** @brief Stage selected patches and commit verified package changes with rollback.
    *
    * @param plans Patch plans indexed by aircraft ID.
    * @param selected Aircraft IDs to apply.
    * @param output Managed package output directory.
    * @param report Report receiving operation results. */
   static void Apply(
     std::map<std::string, Plan>& plans,
     std::set<std::string> const& selected,
     std::filesystem::path const& output,
     Report&                      report
   );
};

}  // namespace tablet
