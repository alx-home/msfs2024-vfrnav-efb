/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright (c) 2026 Alexandre GARCIN
 */

#include "../Tablet/Fleet/Package.h"

#include <iostream>
#include <regex>
#include <stdexcept>

int
main() {
   try {
      auto const& resources{tablet::Package::CompiledRig()};
      if (resources.size() != 13) {
         throw std::runtime_error("Expected 12 SDK-compiled tablet resources and update preset");
      }

      for (auto const& [path, bytes] : resources) {
         if (bytes.empty()) {
            throw std::runtime_error("Empty compiled tablet rig resource: " + path);
         }
      }

      if (!resources.contains("en-US.locPak")) {
         throw std::runtime_error("Missing compiled tablet localization package");
      }

      if (
        resources.at("UpdateFrequencyPresets/VFRNAV_Tablet.xml")
          .find("<SizeOnScreenForMaxUpdateFrequency>0</SizeOnScreenForMaxUpdateFrequency>")
        == std::string::npos
      ) {
         throw std::runtime_error("Missing per-frame tablet update preset");
      }
      auto const& behavior{
        resources.at("SimAttachments/Alexhome/EFB_Tablet/model/model.behavior.xml")
      };
      std::regex components{R"(<Component\b[^>]*>)"};
      unsigned   scheduled{};
      for (std::sregex_iterator it{behavior.begin(), behavior.end(), components}, end{}; it != end;
           ++it) {
         if (
           it->str().find("UpdateFrequencyPreset=\"VFRNAV_Tablet_EveryFrame\"") == std::string::npos
         ) {
            throw std::runtime_error("SDK discarded a component update-frequency preset");
         }
         ++scheduled;
      }
      if (
        scheduled != 29 || behavior.find("Frequency=\"60.000000\"") == std::string::npos
        || behavior.find("l23 l23 * l24 l24 * + sqrt sp9") == std::string::npos
        || behavior.find("VFRNAV_INSTANCE_READY") == std::string::npos
      ) {
         throw std::runtime_error("SDK output is missing the final tablet behavior");
      }
      std::regex handles{
        R"(<MouseRect\b[^>]*HighlightNodeId="VFRNAV_HANDLE_[^"]+"[^>]*>[\s\S]*?</MouseRect>)"
      };
      unsigned captured{};
      for (std::sregex_iterator it{behavior.begin(), behavior.end(), handles}, end{}; it != end;
           ++it) {
         auto handle{it->str()};
         if (
           handle.find("LockFlagsTemporary=\"LeftSingle\"") == std::string::npos
           || handle.find("DragFlagsLockable=\"LeftDrag\"") == std::string::npos
         ) {
            throw std::runtime_error("SDK discarded drag pointer capture");
         }
         ++captured;
      }
      if (captured != 7) {
         throw std::runtime_error("Expected pointer capture on all seven tablet drag handles");
      }
      std::cout << "All 12 SDK-compiled tablet resources and update preset are valid.\n";
      return 0;
   } catch (std::exception const& error) {
      std::cerr << error.what() << '\n';
      return 1;
   }
}
