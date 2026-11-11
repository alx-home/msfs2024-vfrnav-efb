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

#include <filesystem>
#include <array>
#include <iomanip>
#include <sstream>
#include <boost/json.hpp>
#include <windows.h>
#include <bcrypt.h>
#include <fstream>
#include <iostream>

namespace fs = std::filesystem;
/** Stages hash-verified SDK runtime assets from generated rig sources. */
class FleetRigSources {
private:
   /** Reads an asset without newline translation. */
   static std::string Read(fs::path const& path) {
      std::ifstream input{path, std::ios::binary};
      if (!input) {
         throw std::runtime_error("Missing rig asset: " + path.string());
      }
      return {std::istreambuf_iterator<char>{input}, std::istreambuf_iterator<char>{}};
   }

   /** Computes the SHA256 used by the compiled source manifest. */
   static std::string Hash(std::string const& bytes) {
      BCRYPT_ALG_HANDLE algorithm{};
      if (BCryptOpenAlgorithmProvider(&algorithm, BCRYPT_SHA256_ALGORITHM, nullptr, 0) < 0) {
         throw std::runtime_error("SHA256 initialization failed.");
      }
      struct Close {
         BCRYPT_ALG_HANDLE value_{};
         /** Releases the SHA256 algorithm provider. */
         ~Close() { BCryptCloseAlgorithmProvider(value_, 0); }
      } close{algorithm};
      std::array<unsigned char, 32> output{};
      if (
        bytes.size() > ULONG_MAX
        || BCryptHash(
             algorithm,
             nullptr,
             0,
             reinterpret_cast<PUCHAR>(const_cast<char*>(bytes.data())),
             static_cast<ULONG>(bytes.size()),
             output.data(),
             static_cast<ULONG>(output.size())
           ) < 0
      ) {
         throw std::runtime_error("SHA256 failed.");
      }
      std::ostringstream result{};
      for (auto byte : output) {
         result << std::hex << std::setw(2) << std::setfill('0') << +byte;
      }
      return result.str();
   }

public:
   /** Generates sources, verifies their hashes, and stages the compiled runtime. */
   static int Run(int argc, char** argv) {
      try {
         if (argc != 3) {
            throw std::runtime_error(
              "Usage: tablet_fleet_rig_sources <build-output> <compiled-resources|--generate>"
            );
         }
         auto           output{fs::absolute(argv[1])};
         constexpr auto rigRoot{"SimAttachments\\Alexhome\\EFB_Tablet"};
         if (fs::exists(output / rigRoot)) {
            if (!fs::is_regular_file(output / "sources.stamp")) {
               throw std::runtime_error(
                 "Existing rig source output is not owned by this build helper."
               );
            }
            fs::remove_all(output / rigRoot);
         }
         tablet::TransformRig::Write(output, rigRoot, {});
         auto localization{output / "rig-localization"};
         fs::create_directories(localization);
         fs::copy_file(
           output / rigRoot / "Localization" / "VFRNAV_EFB.loc",
           localization / "VFRNAV_EFB.loc",
           fs::copy_options::overwrite_existing
         );
         fs::remove_all(output / rigRoot / "Localization");
         // Emit the SDK project even when changed sources still need compilation.
         tablet::RigText::Write(
           output / "alexhome-efb-tablet-runtime.xml",
           tablet::RigText::Fragment(
             "rig/fleet-package.xml",
             {{"RIG_DIR", (output / "SimAttachments" / "Alexhome").string()},
              {"LOCALIZATION_DIR", localization.string()},
              {"EDIT_MODEL_DIR", (output / "edit-model").string()},
              {"UPDATE_PRESET_DIR", (output / "UpdateFrequencyPresets").string()}}
           )
         );
         tablet::RigText::Write(
           output / "project.xml", tablet::RigText::Fragment("rig/fleet-project.xml")
         );
         auto stamp{tablet::RigText::Fragment("rig/fleet-sources.stamp")};
         stamp += "\r\n";
         tablet::RigText::Write(output / "sources.stamp", stamp);
         if (std::string_view{argv[2]} == "--generate") {
            return 0;
         }
         auto resources{fs::absolute(argv[2])};
         auto manifest{boost::json::parse(Read(resources / "source-hashes.json")).as_object()};
         for (auto const& source : manifest.at("sources").as_object()) {
            if (
              Hash(Read(output / fs::path{std::string{source.key()}}))
              != std::string{source.value().as_string()}
            ) {
               throw std::runtime_error(
                 "Rig source changed; recompile with the SDK and refresh compiled resources and "
                 "source-hashes.json before packaging."
               );
            }
         }
         fs::remove_all(output / "runtime");
         for (auto const& asset : manifest.at("compiled").as_object()) {
            auto relative{fs::path{std::string{asset.key()}}};
            if (Hash(Read(resources / relative)) != std::string{asset.value().as_string()}) {
               throw std::runtime_error("Compiled rig resource hash mismatch.");
            }
            fs::create_directories((output / "runtime" / relative).parent_path());
            fs::copy_file(
              resources / relative,
              output / "runtime" / relative,
              fs::copy_options::overwrite_existing
            );
         }
         return 0;
      } catch (std::exception const& error) {
         std::cerr << error.what() << '\n';
         return 1;
      }
   }
};

/** Runs the compiled fleet source staging helper. */
int
main(int argc, char** argv) {
   return FleetRigSources::Run(argc, argv);
}
