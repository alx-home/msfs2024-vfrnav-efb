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

namespace tablet {
/** @brief Classify scanned and installed aircraft using verified ownership metadata. */
class Inventory {
public:
   /** @brief Verify an installed package and classify source or generator updates.
    *
    * @param plan Aircraft plan to classify.
    * @param output Managed package output directory.
    * @param deep Whether the source is a VFS projection that may expose mounted overlays. */
   static void MarkInstalled(Plan& plan, std::filesystem::path const& output, bool deep);

   /** @brief Detect conflicting non-owned overlays in Community packages.
    *
    * @param plan Aircraft plan to classify.
    * @param paths Fleet source and output locations. */
   static void MarkForeign(Plan& plan, Paths const& paths);

   /** @brief Summarize aircraft classifications in a report.
    *
    * @param report Report whose counts are updated. */
   static void FillCounts(Report& report);

   /** @brief Read verified installed aircraft without requiring source access.
    *
    * @param report Report receiving installed aircraft.
    * @param output Managed package output directory. */
   static void ReadInstalled(Report& report, std::filesystem::path const& output);
};
}  // namespace tablet
