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
#include "Ini.h"
#include <array>
#include <filesystem>
#include <string>
#include <vector>

namespace tablet {
/** @brief Build guarded patch plans from aircraft presets and resolved dependencies. */
class Planner {
public:
   /** @brief Inspect modular presets and collect a guarded aircraft patch plan.
    *
    * @param root Source container root.
    * @param aircraft Aircraft directory to inspect.
    * @param roots Dependency search roots.
    * @param mode Discovery mode.
    * @param output Managed package output directory.
    *
    * @return Aircraft patch plan and diagnostics. */
   static Plan Inspect(
     std::filesystem::path const&              root,
     std::filesystem::path const&              aircraft,
     std::vector<std::filesystem::path> const& roots,
     std::string const&                        mode,
     std::filesystem::path const&              output
   );

   /** @brief Compare source and generator metadata without mistaking mounted overlays.
    *
    * @param plan Current aircraft plan.
    * @param owner Installed ownership metadata.
    * @param deep Whether the source is a VFS projection that may expose mounted overlays.
    *
    * @return Whether the stock source or generator changed. */
   static bool StockChanged(Plan const& plan, Ownership const& owner, bool deep);

private:
   /** @brief Preserve an existing tablet mount when replacing its rig.
    *
    * @param sec Attachment section to adjust. */
   static void CompensateRigDefaultPose(Section& sec);

   /** @brief Configure a section to reference the compiled tablet rig.
    *
    * @param sec Attachment section to configure.
    * @param rigRoot Path to the generated rig resources.
    * @param rigAlias Alias for the generated rig.
    * @param compensateDefaultPose Whether to preserve the existing mount's default pose. */
   static void ConfigureRigAttachment(
     Section&           sec,
     std::string const& rigRoot,
     std::string const& rigAlias,
     bool               compensateDefaultPose = false
   );

   /** @brief Add the first unused attachment index with the requested pose.
    *
    * @param attachments Attachment configuration to update.
    * @param rigRoot Path to the generated rig resources.
    * @param rigAlias Alias for the generated rig.
    * @param x X offset.
    * @param y Y offset.
    * @param z Z offset. */
   static void AddRigAttachment(
     Ini&               attachments,
     std::string const& rigRoot,
     std::string const& rigAlias,
     double             x,
     double             y,
     double             z
   );

   /** @brief Record source hashes while recovering stock text beneath owned overlays.
    *
    * @param plan Plan receiving source hashes.
    * @param file Source file to read.
    * @param roots Dependency search roots.
    *
    * @return Recovered source text. */
   static std::string Track(
     Plan&                                     plan,
     std::filesystem::path const&              file,
     std::vector<std::filesystem::path> const& roots
   );

   /** @brief Resolve either supported attachment model reference form.
    *
    * @param sec Attachment section containing the model reference.
    * @param roots Dependency search roots.
    *
    * @return Resolved model path. */
   static std::filesystem::path
   AttachmentModel(Section const& sec, std::vector<std::filesystem::path> const& roots);

   /** @brief Recognize an attachment belonging to this generator.
    *
    * @param sec Attachment section to inspect.
    *
    * @return Whether the attachment belongs to the generator. */
   static bool OwnRig(Section const& sec);

   /** @brief Detect tablet attachments and reject unsafe multifunction replacements.
    *
    * @param sec Attachment section to inspect.
    * @param roots Dependency search roots.
    * @param plan Plan receiving diagnostics.
    *
    * @return Whether the attachment is a supported tablet. */
   static bool
   IsTablet(Section const& sec, std::vector<std::filesystem::path> const& roots, Plan& plan);

   /** @brief Replace tablet attachments with a single managed rig.
    *
    * @param cfg Attachment configuration to update.
    * @param roots Dependency search roots.
    * @param plan Plan receiving diagnostics.
    * @param rigPlaced Tracks whether a managed rig has already been placed.
    *
    * @return Whether the configuration changed. */
   static bool ReplaceTabletsWithRig(
     Ini&                                      cfg,
     std::vector<std::filesystem::path> const& roots,
     Plan&                                     plan,
     bool&                                     rigPlaced
   );

   /** @brief Estimate a tablet pose from the pilot camera with a warned fallback.
    *
    * @param plan Plan receiving source metadata and warnings.
    * @param preset Preset to inspect.
    * @param roots Dependency search roots.
    *
    * @return Estimated three-dimensional offset. */
   static std::array<double, 3> PilotOffset(
     Plan&                                     plan,
     std::filesystem::path const&              preset,
     std::vector<std::filesystem::path> const& roots
   );

   /** @brief Plan a preset overlay including supported nested attachments.
    *
    * @param plan Plan receiving overlay changes and diagnostics.
    * @param preset Preset to patch.
    * @param roots Dependency search roots. */
   static void PatchPreset(
     Plan&                                     plan,
     std::filesystem::path const&              preset,
     std::vector<std::filesystem::path> const& roots
   );
};
}  // namespace tablet
