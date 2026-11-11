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

#include "TransformRig.h"
#include "Rig/RigAssets.h"
#include "Rig/RigModel.h"
#include "Rig/RigText.h"

#include <stdexcept>

namespace tablet {

void
TransformRig::Write(
  std::filesystem::path const& packageRoot,
  std::string const&           rigRoot,
  std::filesystem::path const& sourceModelPath
) {
   std::filesystem::path const relative{rigRoot};

   RigText::ValidateRelativePath(relative);

   auto const destination{packageRoot / relative};
   if (std::filesystem::exists(destination)) {
      throw std::invalid_argument("Rig destination already exists");
   }

   // Kept only for caller compatibility; no stock source is read or copied.
   (void)sourceModelPath;

   auto model{RigModel::Build()};

   std::filesystem::create_directories(destination / "model");

   try {
      RigText::Write(destination / "model" / "rig.gltf", boost::json::serialize(model.model_));
      RigText::Write(
        destination / "model" / "rig.bin", std::string{model.bytes_.begin(), model.bytes_.end()}
      );
      RigAssets::Write(packageRoot, destination, relative.string());
   } catch (...) {
      std::filesystem::remove_all(destination);
      throw;
   }
}

}  // namespace tablet
