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

namespace tablet {
/** @brief Read, verify, and generate managed overlay package metadata and resources. */
class Package {
public:
   /** @brief Read the ownership inventory and recorded source metadata.
    *
    * @param directory Managed package directory.
    *
    * @return Parsed ownership metadata. */
   static Ownership ReadOwner(std::filesystem::path const& directory);

   /** @brief Verify package identity, completeness, and every owned file hash.
    *
    * @param directory Managed package directory.
    * @param owner Expected ownership metadata. */
   static void VerifyOwned(std::filesystem::path const& directory, Ownership const& owner);

   /** @brief Generate layout, manifest, and ownership inventories.
    *
    * @param packageDir Package directory to populate.
    * @param owner Ownership metadata to record.
    * @param title Package title. */
   static void WritePackageFiles(
     std::filesystem::path const& packageDir,
     Ownership const&             owner,
     std::string const&           title
   );

   /** @brief Load and validate the immutable SDK-compiled rig resources.
    *
    * @return Resource paths and bytes. */
   static std::map<std::string, std::string> const& CompiledRig();

   /** @brief Return aircraft-specific copies of the SDK-compiled rig resources.
    *
    * @param aircraftId Stable aircraft identifier.
    *
    * @return Namespaced resource paths and bytes. */
   static std::map<std::string, std::string> CompiledRig(std::string const& aircraftId);

   /** @brief Return the virtual attachment root for one aircraft.
    *
    * @param aircraftId Stable aircraft identifier.
    *
    * @return Aircraft-specific virtual attachment root. */
   static std::string RigRoot(std::string const& aircraftId);

   /** @brief Return the attachment alias for one aircraft.
    *
    * @param aircraftId Stable aircraft identifier.
    *
    * @return Aircraft-specific attachment alias. */
   static std::string RigAlias(std::string const& aircraftId);

   /** @brief Detect installed rig resources from an older generator.
    *
    * @param owner Installed ownership metadata.
    *
    * @return Whether the generator resources differ. */
   static bool GeneratorChanged(Ownership const& owner);

   /** @brief Derive the stable managed package name for an aircraft.
    *
    * @param plan Aircraft patch plan.
    *
    * @return Managed package name. */
   static std::string PackageName(Plan const& plan);

private:
   friend class Fleet;
   friend class Planner;
   friend class Inventory;
   friend class Transaction;

   static constexpr auto OWNER{"alexhome.efb-fleet"};
   static constexpr auto MARKER{"alexhome-efb-owner.json"};
   static constexpr auto MAIN_PACKAGE{"alexhome-msfs2024-vfrnav"};
   static constexpr auto RIG_ROOT{"SimAttachments\\Alexhome\\EFB_Tablet"};
};
}  // namespace tablet
