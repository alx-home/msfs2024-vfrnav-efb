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

namespace tablet {

/** Emits the authored SDK rig assets without changing template bytes. */
class RigAssets {
public:
   /** @brief Write behaviors, native references, input profiles, and localization.
    *
    * @param packageRoot Root of the output package.
    * @param destination Output directory for authored resources.
    * @param rigRoot Path used to reference the rig resources. */
   static void Write(
     std::filesystem::path const& packageRoot,
     std::filesystem::path const& destination,
     std::string const&           rigRoot
   );
};

}  // namespace tablet
