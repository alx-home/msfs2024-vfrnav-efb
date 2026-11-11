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

#include "../Tablet/TransformRig.h"
#include "../Tablet/Rig/RigText.h"
#include "../Tablet/Templates.h"
#include <Utils/FindMSFS.h>

#include <filesystem>
#include <fstream>
#include <iostream>
#include <stdexcept>

namespace fs = std::filesystem;
/** Builds development-only simulator projects without installing a package. */
class TabletRigPrototype {
private:
   /** Writes a development asset without newline translation. */
   static void Write(fs::path const& path, std::string const& text) {
      fs::create_directories(path.parent_path());
      std::ofstream out{path, std::ios::binary};
      out.exceptions(std::ios::badbit | std::ios::failbit);
      out << text;
   }

   /** Reads a projected stock fixture with a contextual failure message. */
   static std::string Read(fs::path const& path, char const* missing) {
      std::ifstream in{path, std::ios::binary};
      if (!in) {
         throw std::runtime_error(std::string{missing} + ": " + path.string());
      }

      return {std::istreambuf_iterator<char>{in}, std::istreambuf_iterator<char>{}};
   }

   /** Resolves the installed simulator's projected aircraft root. */
   static fs::path ProjectedAirplanes() {
      auto simulator{::FindMSFS()};

      if (simulator.empty()) {
         throw std::runtime_error("Cannot locate the MSFS installation.");
      }

      fs::path root{simulator};

      if (!fs::is_regular_file(root / "UserCfg.opt")) {
         root /= "LocalCache";
      }

      return root / "VFSProjection" / "SimObjects" / "Airplanes";
   }

   static constexpr char const* K_SAAB_CONTAINER{"microsoft-aircraft-saab-s340b"};
   static constexpr char const* K_SAAB_EFB_PRESET{"presets\\vfrnav\\saab340b_cargo_unoloaded_efb"};

   struct SaabEfbSources {
      fs::path container_{};
      // Thumbnails, navigation graph and texture.cfg are rejected by ModularSimObject as unlisted
      // files.
      fs::path extras_{};
   };

   /**
    * Adds a separate cargo EFB preset beside the untouched stock one.
    * Encrypted stock configuration cannot be copied; common configuration still merges.
    */
   static SaabEfbSources
   WriteSaabCargoEfbPreset(fs::path const& output, std::string const& rig_root) {
      auto stock{
        ProjectedAirplanes() / K_SAAB_CONTAINER / "presets" / "microsoft"
        / "saab340b_cargo_unoloaded"
      };
      if (!fs::is_regular_file(stock / "config" / "attached_objects.cfg")) {
         throw std::runtime_error(
           "Enable VFS Projection to read the stock Saab 340B cargo preset."
         );
      }

      auto source{output / "saab340-cargo-efb"};
      auto extras{output / "saab340-cargo-efb-extras"};
      fs::remove_all(source);
      fs::remove_all(extras);
      // ModularSimObject sources must be laid out as .../SimObjects/Airplanes/<container>.
      auto container{source / "SimObjects" / "Airplanes" / K_SAAB_CONTAINER};
      auto preset{container / fs::path{K_SAAB_EFB_PRESET}};
      for (auto name :
           {"ai.cfg",
            "cameras.cfg",
            "cockpit.cfg",
            "flight_performance.cfg",
            "gameplay.cfg",
            "reference_points.cfg"}) {
         Write(
           preset / "config" / name,
           Read(stock / "config" / name, "Missing stock Saab cargo preset file")
         );
      }

      auto attachments{
        Read(stock / "config" / "attached_objects.cfg", "Missing stock Saab cargo attachments")
      };
      if (
        attachments.find("Part_Exterior_Fuselage_Cargo") == std::string::npos
        || attachments.find("[SIM_ATTACHMENT.3]") != std::string::npos
      ) {
         throw std::runtime_error(
           "Unexpected stock Saab 340B cargo attachments; refusing to generate the EFB preset."
         );
      }

      Write(
        preset / "config" / "attached_objects.cfg",
        attachments + tablet::Templates::Render("rig/saab-attachment.cfg", {{"RIG_ROOT", rig_root}})
      );
      Write(preset / "config" / "aircraft.cfg", tablet::Templates::Render("rig/saab-aircraft.cfg"));
      for (auto const& entry : fs::directory_iterator{stock / "navigation_graph"}) {
         fs::create_directories(extras / "navigation_graph");
         fs::copy_file(
           entry.path(),
           extras / "navigation_graph" / entry.path().filename(),
           fs::copy_options::overwrite_existing
         );
      }

      for (auto const& entry : fs::directory_iterator{stock / "thumbnail"}) {
         fs::create_directories(extras / "thumbnail");
         fs::copy_file(
           entry.path(),
           extras / "thumbnail" / entry.path().filename(),
           fs::copy_options::overwrite_existing
         );
      }

      // Reuse the stock cargo textures instead of duplicating them.
      Write(extras / "texture" / "texture.cfg", tablet::Templates::Render("rig/saab-texture.cfg"));
      return {.container_ = container, .extras_ = extras};
   }

public:
   /** Generates or refreshes an explicitly owned development SDK project. */
   static int Run(int argc, char** argv) {
      try {
         if (argc != 3 && !(argc == 4 && std::string{argv[3]} == "--refresh")) {
            throw std::runtime_error(
              "Usage: tablet_rig_prototype <repo-root> <output-directory> [--refresh]"
            );
         }

         auto repo{fs::absolute(argv[1])};
         auto output{fs::absolute(argv[2])};
         bool refresh{argc == 4};
         auto package_name{"alexhome-efb-rig-" + output.filename().string()};
         if (refresh) {
            if (
              !fs::is_regular_file(output / "prototype.xml")
              || !fs::is_regular_file(output / (package_name + ".xml"))
            ) {
               throw std::runtime_error(
                 "Refresh requires an existing generated development project."
               );
            }
         } else if (fs::exists(output)) {
            throw std::runtime_error(
              "Output already exists; choose a fresh directory or explicitly use --refresh."
            );
         }

         // A fresh virtual model path avoids reusing DevMode's loaded behavior cache.
         auto rig_root{"SimAttachments\\VFRNAV\\" + output.filename().string()};
         auto rig{output / fs::path{rig_root}};
         if (refresh) {
            if (
              !fs::is_regular_file(rig / "model" / "rig.gltf")
              || !fs::is_regular_file(rig / "model" / "model.xml")
            ) {
               throw std::runtime_error("Refresh requires the generated rig model files.");
            }

            auto backup{output / "previous-rig"};
            for (unsigned revision{2}; fs::exists(backup); ++revision) {
               backup = output / ("previous-rig-" + std::to_string(revision));
            }

            fs::rename(rig, backup);
            std::cout << "Preserved previous generated rig in " << backup << '\n';
         }

         tablet::TransformRig::Write(output, rig_root, {});
         // Localization must not live inside the SimAttachmentLib source tree (nested asset group).
         auto localization{output / "rig-localization"};
         fs::remove_all(localization);
         fs::rename(rig / "Localization", localization);
         // Action discovery uses preset/input; device profiles use aircraft-root inputs.
         auto input_patch{output / "h500-input-patch"};
         fs::create_directories(input_patch);
         fs::copy_file(
           rig / "input" / "action.actiondb",
           input_patch / "action.actiondb",
           fs::copy_options::overwrite_existing
         );
         fs::remove(input_patch / "keyboard.xml");
         auto          patch{output / "h500-patch"};
         auto          old_config{repo / "build" / "h500-efb-patch" / "attached_objects.cfg"};
         std::ifstream original{old_config, std::ios::binary};
         if (!original) {
            throw std::runtime_error("The cached H500C development fixture is missing.");
         }

         std::string config{
           std::istreambuf_iterator<char>{original}, std::istreambuf_iterator<char>{}
         };
         std::string old_path{R"(SimAttachments\Instruments\Alexhome_H500_Efb\model\Tablet.xml)"};
         auto        index{config.find(old_path)};
         if (
           index == std::string::npos
           || config.find(old_path, index + old_path.size()) != std::string::npos
         ) {
            throw std::runtime_error(
              "Expected exactly one previously tested H500C tablet attachment."
            );
         }

         config.replace(index, old_path.size(), rig_root + "\\model\\model.xml");
         auto        section_end{config.find('[', index)};
         std::string old_offset{"attach_offset = 0.25, 0.35, 1.2"};
         auto        offset{config.find(old_offset, index)};
         if (
           offset == std::string::npos
           || (section_end != std::string::npos && offset >= section_end)
         ) {
            throw std::runtime_error("Expected the tested H500C tablet attachment offset.");
         }

         // The animated rig supplies its own vertical and forward translation.
         config.replace(
           offset, old_offset.size(), tablet::RigText::Fragment("rig/h500-offset.cfg")
         );
         Write(patch / "attached_objects.cfg", config);
         auto saab{WriteSaabCargoEfbPreset(output, rig_root)};
         // Each Copy group needs its own source directory; the builder rejects reused ones.
         auto saab_input{output / "saab340-input-patch"};
         auto saab_keyboard{output / "saab340-aircraft-inputs"};
         fs::create_directories(saab_input);
         fs::create_directories(saab_keyboard);
         fs::copy_file(
           input_patch / "action.actiondb",
           saab_input / "action.actiondb",
           fs::copy_options::overwrite_existing
         );
         fs::copy_file(
           output / "aircraft-inputs" / "keyboard.xml",
           saab_keyboard / "keyboard.xml",
           fs::copy_options::overwrite_existing
         );
         auto original_tablet_patch{output / "h500-original-tablet-patch"};
         if (refresh) {
            if (!fs::is_regular_file(original_tablet_patch / "attached_objects.cfg")) {
               throw std::runtime_error(
                 "Refresh requires the existing original-tablet replacement configuration."
               );
            }
         } else {
            auto original_tablet_config{
              ProjectedAirplanes() / "oh6a" / "attachments" / "taog" / "int_front_civ" / "config"
              / "attached_objects.cfg"
            };
            std::ifstream tablet_config{original_tablet_config, std::ios::binary};
            if (!tablet_config) {
               throw std::runtime_error(
                 "Enable VFS Projection to read the original H500C tablet attachment configuration."
               );
            }

            std::string replacement{
              std::istreambuf_iterator<char>{tablet_config}, std::istreambuf_iterator<char>{}
            };
            auto tablet_begin{replacement.find("[SIM_ATTACHMENT.0]")};
            auto tablet_end{replacement.find("[SIM_ATTACHMENT.1]", tablet_begin)};
            auto tablet_reference{
              replacement.find("simattachments\\instruments\\asobo_tablet_generic_8_3")
            };
            if (
              tablet_begin == std::string::npos || tablet_end == std::string::npos
              || tablet_reference == std::string::npos || tablet_reference < tablet_begin
              || tablet_reference >= tablet_end
            ) {
               throw std::runtime_error(
                 "Unexpected H500C front attachment configuration; refusing tablet removal."
               );
            }

            replacement.erase(tablet_begin, tablet_end - tablet_begin);
            Write(original_tablet_patch / "attached_objects.cfg", replacement);
         }

         auto xml{[](fs::path const& path) {
            std::string result{};
            for (char ch : path.string()) {
               if (ch == '&') {
                  result += "&amp;";
               } else if (ch == '<') {
                  result += "&lt;";
               } else if (ch == '>') {
                  result += "&gt;";
               } else {
                  result += ch;
               }
            }

            return result;
         }};
         Write(
           output / (package_name + ".xml"),
           tablet::RigText::Fragment(
             "rig/prototype-package.xml",
             {{"RIG_DIR", xml(rig.parent_path())},
              {"RIG_ROOT", xml(rig_root)},
              {"EDIT_MODEL_DIR", xml(output / "edit-model")},
              {"UPDATE_PRESET_DIR", xml(output / "UpdateFrequencyPresets")},
              {"LOCALIZATION_DIR", xml(localization)},
              {"INPUT_DIR", xml(input_patch)},
              {"KEYBOARD_DIR", xml(output / "aircraft-inputs")},
              {"PATCH_DIR", xml(patch)},
              {"ORIGINAL_TABLET_DIR", xml(original_tablet_patch)},
              {"SAAB_CONTAINER_DIR", xml(saab.container_)},
              {"SAAB_EXTRAS_DIR", xml(saab.extras_)},
              {"SAAB_INPUT_DIR", xml(saab_input)},
              {"SAAB_KEYBOARD_DIR", xml(saab_keyboard)},
              {"TOOLBAR_HTML_DIR", xml(repo / "build" / "efb_tablet_panel" / "html_ui")},
              {"TOOLBAR_DEFINITION_DIR", xml(repo / "build" / "efb_tablet_panel" / "InGamePanels")}}
           )
         );
         Write(
           output / "prototype.xml",
           tablet::RigText::Fragment("rig/prototype-project.xml", {{"PACKAGE_NAME", package_name}})
         );
         std::cout
           << "Generated development-only project: " << (output / "prototype.xml")
           << "\nOpen and build in DevMode, then reload the H500C. No Community package was "
              "installed.\n";
         return 0;
      } catch (std::exception const& error) {
         std::cerr << "Tablet rig prototype: " << error.what() << '\n';
         return 1;
      }
   }
};

/** Runs the development-only rig project generator. */
int
main(int argc, char** argv) {
   return TabletRigPrototype::Run(argc, argv);
}
