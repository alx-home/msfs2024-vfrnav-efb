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

#include "RigAssets.h"
#include "RigText.h"
#include "../Templates.h"

#include <array>

namespace tablet {
namespace {
std::string
RotationMath(int axis) {
   // R = Ry(heading) Rx(pitch) Rz(bank); post-multiplication rotates a tablet-local axis.
   std::string code{
     "(M:Relative" + std::string{axis == 0 ? "Y" : "X"}
     + ") (O:VFRNAV_MOUSE_START) - (O:VFRNAV_DRAG_SHIFT) 3 * 1 + * "
     + std::string{axis == 1 ? "-180" : "180"}
     + " * dgrd sp8 "
       "(O:VFRNAV_START_HEADING) dgrd sin sp0 "
       "(O:VFRNAV_START_HEADING) dgrd cos sp1 "
       "(O:VFRNAV_START_PITCH) dgrd sin sp2 "
       "(O:VFRNAV_START_PITCH) dgrd cos sp3 "
       "(O:VFRNAV_START_BANK) dgrd sin sp4 "
       "(O:VFRNAV_START_BANK) dgrd cos sp5 "
       "l8 sin sp6 l8 cos sp7 "
       "l1 l5 * l0 l2 * l4 * + sp10 "
       "l0 l2 * l5 * l1 l4 * - sp11 "
       "l0 l3 * sp12 "
       "l3 l4 * sp13 l3 l5 * sp14 0 l2 - sp15 "
       "l1 l2 * l4 * l0 l5 * - sp16 "
       "l0 l4 * l1 l2 * l5 * + sp17 "
       "l1 l3 * sp18 "
   };

   for (int row{0}; row < 3; ++row) {
      auto                       x{"l" + std::to_string(10 + row * 3)};
      auto                       y{"l" + std::to_string(11 + row * 3)};
      auto                       z{"l" + std::to_string(12 + row * 3)};
      std::array<std::string, 3> columns{};
      if (axis == 0) {
         columns = {x, y + " l7 * " + z + " l6 * +", z + " l7 * " + y + " l6 * -"};
      } else if (axis == 1) {
         columns = {x + " l7 * " + y + " l6 * +", y + " l7 * " + x + " l6 * -", z};
      } else {
         columns = {x + " l7 * " + z + " l6 * -", y, x + " l6 * " + z + " l7 * +"};
      }
      for (int column{0}; column < 3; ++column) {
         code += columns[column] + " sp" + std::to_string(20 + row * 3 + column) + " ";
      }
   }

   code += "l23 l23 * l24 l24 * + sqrt sp9 "
           "0 l25 - l9 atg2 rddg sp30 "
           "l9 1e-12 &gt; if{ "
           "l22 l28 atg2 rddg sp31 l23 l24 atg2 rddg sp32 "
           "} els{ 0 l26 - l20 atg2 rddg sp31 0 sp32 } "
           "l8 0 == if{ "
           "(O:VFRNAV_START_PITCH) sp30 (O:VFRNAV_START_HEADING) sp31 "
           "(O:VFRNAV_START_BANK) sp32 } ";

   return code;
}

std::string
RotationHandles() {
   std::string handles{};
   for (int axis{0}; axis < 3; ++axis) {
      auto        mouse{axis == 0 ? "Y" : "X"};
      std::string capture{
        "(L:VFRNAV_EFB_PITCH, Number) (&gt;O:VFRNAV_START_PITCH) "
        "(L:VFRNAV_EFB_BANK, Number) (&gt;O:VFRNAV_START_BANK) "
        "(L:VFRNAV_EFB_HEADING, Number) (&gt;O:VFRNAV_START_HEADING) "
        "(L:VFRNAV_EFB_DRAG_CANCEL, Number) (&gt;O:VFRNAV_DRAG_CANCEL) "
        "(M:Relative"
        + std::string{mouse}
        + ") (&gt;O:VFRNAV_MOUSE_START) (O:VFRNAV_CURRENT_SHIFT) "
          "(&gt;O:VFRNAV_DRAG_SHIFT) 1 (&gt;O:VFRNAV_DRAG_ACTIVE)"
      };

      auto rotation{RotationMath(axis)};
      auto callback{Templates::Render(
        "rig/rotation-callback.rpn",
        {{"CAPTURE", capture}, {"MOUSE", mouse}, {"ROTATION", rotation}}
      )};

      auto index{std::to_string(axis)};
      handles +=
        Templates::Render("rig/rotation-handle.xml", {{"AXIS", index}, {"CALLBACK", callback}});
   }

   return handles;
}
}  // namespace

void
RigAssets::Write(
  std::filesystem::path const& packageRoot,
  std::filesystem::path const& destination,
  std::string const&           rigRoot
) {
   auto handles{RotationHandles()};

   RigText::Write(
     destination / "model" / "model.xml",
     Templates::Render("rig/model.xml", {{"ROTATION_HANDLES", handles}})
   );
   RigText::Write(
     packageRoot / "UpdateFrequencyPresets" / "VFRNAV_Tablet.xml",
     Templates::Render("rig/update-frequency.xml")
   );
   RigText::Write(
     packageRoot / "edit-model" / "attachment.cfg",
     Templates::Render("rig/edit-model-attachment.cfg")
   );
   RigText::Write(
     packageRoot / "edit-model" / "model" / "model.xml",
     Templates::Render("rig/edit-model-model.xml")
   );
   RigText::Write(
     packageRoot / "edit-model" / "texture" / "texture.cfg", Templates::Render("rig/texture.cfg")
   );
   RigText::Write(destination / "attachment.cfg", Templates::Render("rig/attachment.cfg"));
   RigText::Write(
     destination / "input" / "action.actiondb",
     Templates::Render("rig/action.actiondb", {{"RIG_ROOT", RigText::EscapeXml(rigRoot)}})
   );
   RigText::Write(
     packageRoot / "aircraft-inputs" / "keyboard.xml", Templates::Render("rig/keyboard.xml")
   );
   RigText::Write(
     destination / "Localization" / "VFRNAV_EFB.loc", Templates::Render("rig/localization.loc")
   );
   RigText::Write(
     destination / "config" / "attached_objects.cfg",
     Templates::Render("rig/attached_objects.cfg", {{"RIG_ROOT", rigRoot}})
   );
}

}  // namespace tablet
