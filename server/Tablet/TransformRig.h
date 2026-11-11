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
inline constexpr auto K_SHIFT_LVAR{"VFRNAV_EFB_SHIFT"};

/** @brief Shared model identifiers and geometry constants for generated tablet rigs. */
struct RigInfo {
   static constexpr auto   MODEL_FILE{"model\\model.xml"};
   static constexpr auto   MOUNT_NODE{"TABLET_MOUNT"};
   static constexpr auto   SUGGESTED_ALIAS{"VFRNAV_EFB_RIG"};
   static constexpr auto   SCREEN_MATERIAL{"TABLET_Screen"};
   static constexpr auto   TOGGLE_INPUT_EVENT{"VFRNAV_EFB_VISIBILITY_TOGGLE"};
   static constexpr double SCREEN_CENTER_X{-0.00010980106890201569};
   static constexpr double SCREEN_CENTER_Y{0.000000007450580596923828};
   static constexpr double SCREEN_SURFACE_Z{-0.006342912092804909};
   static constexpr double GIZMO_SURFACE_CLEARANCE{0.0005};
};

/**
 * Generates developer prototype source assets for a cockpit tablet transform rig.
 */
class TransformRig {
public:
   /**
    * Writes the procedural rig beneath packageRoot/rigRoot.
    *
    * The generated prototype nests the installed stock tablet at TABLET_MOUNT; it does not copy
    * stock source assets. The edit model references the installed stock glTF and uses a separate
    * model-only attachment. Native rendering, transform propagation, input arbitration, stock
    * hide-control propagation, and simulator behavior require SDK/runtime validation.
    * Edit mode scales only the native tablet mount away, leaving the aircraft's bracket visible.
    * Global hiding synchronizes the shared stock tablet/bracket hide control in both directions,
    * so the original mount button and VFRNav controls operate the same visibility state.
    * All components use a per-frame preset, independent of projected size or viewing direction.
    *
    * Resizing is uniform only. Drags use press-anchored normalized screen displacement rather than
    * camera-invariant 3D projection. Move directions are tablet-local, using press-captured
    * BANK/PITCH/HEADING with model X negated at the public-coordinate boundaries. Rotation rings
    * compose a rotation about the captured tablet-local axis (blue bank ring reverses horizontal
    * drag), then recover the animation Euler
    * angles, including at the pitch poles. The native
    * bridge sets K_SHIFT_LVAR while Shift is held; finite nonzero values provide 4x drag gain.
    * Update repairs nonfinite/out-of-contract pose fields, while RESET_POSE_REQUEST explicitly
    * restores all initial pose values. Visibility requests are handled by the rig update logic.
    * The WASM bridge saves valid poses after 500ms idle and restores them by aircraft config path.
    * A per-model instance generation prevents inherited LVars from leaking between aircraft.
    * All seven drag handles temporarily lock pointer input on left press so moving pick geometry
    * cannot lose the drag when viewed obliquely; release/unlock ends that capture.
    *
    * The generated keyboard profile is aircraft-specific and rebindable, and localization assets
    * must be compiled through a Localization asset group. Compile generated source with the SDK
    * before simulator testing.
    *
    * @param packageRoot Owned build-output directory; the stock package must not be used.
    * @param rigRoot Package-relative rig path.
    * @param sourceModelPath Retained for compatibility; stock source is neither read nor copied.
    */
   static void Write(
     std::filesystem::path const& packageRoot,
     std::string const&           rigRoot,
     std::filesystem::path const& sourceModelPath
   );
};
}  // namespace tablet
