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

#include "../Tablet/Fleet.h"
#include "../Tablet/Fleet/Ini.h"

#include <json/json.inl>
#include <boost/json.hpp>
#include <promise/Pool.h>
#include <windows.h>
#include <algorithm>
#include <cctype>
#include <cmath>
#include <cstdlib>
#include <exception>
#include <filesystem>
#include <fstream>
#include <future>
#include <iostream>
#include <map>
#include <sstream>
#ifdef _MSC_VER
#   include <crtdbg.h>
#endif

namespace fs = std::filesystem;
#define CHECK(c)                                                            \
   do {                                                                     \
      if (!(c)) {                                                           \
         std::cerr << "CHECK failed at " << __LINE__ << ": " << #c << '\n'; \
         return 1;                                                          \
      }                                                                     \
   } while (false)
void
Write(fs::path const& path, std::string_view text) {
   fs::create_directories(path.parent_path());
   std::ofstream out{path, std::ios::binary};
   out.exceptions(std::ios::badbit | std::ios::failbit);
   out.write(text.data(), static_cast<std::streamsize>(text.size()));
}
std::string
Read(fs::path const& path) {
   std::ifstream in{path, std::ios::binary};
   if (!in) {
      throw std::runtime_error("Missing test file: " + path.string());
   }
   return {std::istreambuf_iterator<char>{in}, std::istreambuf_iterator<char>{}};
}
std::map<std::string, std::string>
Snapshot(fs::path const& root) {
   std::map<std::string, std::string> result;
   for (auto const& file : fs::recursive_directory_iterator{root}) {
      if (file.is_regular_file()) {
         result[file.path().lexically_relative(root).generic_string()] = Read(file.path());
      }
   }
   return result;
}

/** @brief Pool executing the parallel per-aircraft fleet processing in tests. */
promise::Pool<8>&
TestPool() {
   static promise::Pool<8> pool{"fleet-test"};
   return pool;
}

/** @brief Synchronously await a fleet operation, rethrowing any rejection. */
template <class VALUE>
VALUE
Await(WPromise<VALUE> promise) {
   promise.WaitDone();

   if (promise.Rejected()) {
      std::rethrow_exception(promise.Exception());
   }

   return promise.Value();
}

/** @brief Synchronous test bridge over the asynchronous fleet manager. */
tablet::Report
Manage(
  tablet::Paths const&            paths,
  std::string const&              mode,
  std::string const&              action,
  std::vector<std::string> const& selection = {}
) {
   return Await(tablet::Fleet::Manage(TestPool(), paths, mode, action, selection));
}

/** @brief Synchronous test bridge over the asynchronous JSON fleet manager. */
std::string
Manage(std::string const& mode, std::string const& action) {
   return Await(tablet::Fleet::Manage(TestPool(), mode, action));
}

int
PlacementTests(fs::path const& root) {
   tablet::Paths paths{
     .community_  = root / "Community",
     .projection_ = {},
     .output_     = root / "output",
     .containers_ = {}
   };
   auto source{paths.community_ / "placement-source"};
   auto plane{source / "SimObjects" / "Airplanes" / "PlacementPlane"};
   auto preset{plane / "presets" / "Maker" / "Main" / "config"};
   auto common{plane / "common" / "config" / "cameras.cfg"};
   Write(preset / "aircraft.cfg", "[FLTSIM.0]\nisuserselectable=1\n");
   Write(preset / "attached_objects.cfg", "[VERSION]\nmajor=1\nminor=0\n");
   Write(
     common,
     "[VIEWS]\neyepoint=43.720741,-1.723061,4.355627\n"
     "[CAMERADEFINITION.0]\nTitle=Pilot\nInitialXyz=0.012242,-0.229998,-1.041841\n"
   );
   auto scan{Manage(paths, "standard", "scan")};
   CHECK(scan.available_ == 1);
   auto id{scan.aircraft_.front().id_};
   auto package{paths.output_ / ("alexhome-efb-" + id)};
   auto output{package / (preset / "attached_objects.cfg").lexically_relative(source)};
   auto placement{[&](double x, double y, double z) {
      tablet::Ini config{Read(output)};
      auto        text{config.Get("sim_attachment.0").Get("attach_offset")};
      std::ranges::replace(text, ',', ' ');
      std::istringstream input{text};
      double             actual_x{}, actual_y{}, actual_z{};
      return (input >> actual_x >> actual_y >> actual_z) && std::abs(actual_x - x) < .0001
             && std::abs(actual_y - y) < .0001 && std::abs(actual_z - z) < .0001;
   }};
   CHECK(Manage(paths, "standard", "apply", {id}).generated_ == 1);
   CHECK(placement(
     -1.723061 * .3048 + .012242,
     4.355627 * .3048 - .229998 - .64,
     43.720741 * .3048 - 1.041841 - .87
   ));

   Write(preset / "cameras.cfg", "[CAMERADEFINITION.0]\nTitle=Pilot\nInitialXyz=1,2,3\n");
   CHECK(Manage(paths, "standard", "apply", {id}).generated_ == 1);
   CHECK(placement(-1.723061 * .3048 + 1, 4.355627 * .3048 + 2 - .64, 43.720741 * .3048 + 3 - .87));

   Write(preset / "cameras.cfg", "[VIEWS]\neyepoint=10,20,30\n[CAMERADEFINITION.0]\nTitle=Pilot\n");
   CHECK(Manage(paths, "standard", "apply", {id}).generated_ == 1);
   CHECK(placement(20 * .3048, 30 * .3048 - .64, 10 * .3048 - .87));

   Write(preset / "cameras.cfg", "[VIEWS]\neyepoint=10,20,30\n");
   CHECK(Manage(paths, "standard", "apply", {id}).generated_ == 1);
   CHECK(placement(20 * .3048 + .012242, 30 * .3048 - .229998 - .64, 10 * .3048 - 1.041841 - .87));

   for (auto invalid : {"nan,0,0", "1,2", "1,2,3,4", "1e999,0,0"}) {
      Write(
        preset / "cameras.cfg",
        std::string{"[VIEWS]\neyepoint="} + invalid
          + "\n[CAMERADEFINITION.0]\nTitle=Pilot\nInitialXyz=0,0,0\n"
      );
      auto report{Manage(paths, "standard", "apply", {id})};
      CHECK(!report.aircraft_.front().warnings_.empty());
      CHECK(placement(
        -1.723061 * .3048 + .012242,
        4.355627 * .3048 - .229998 - .64,
        43.720741 * .3048 - 1.041841 - .87
      ));
   }

   // A previous generator can own a valid package with an obsolete calculated placement.
   auto old_text{Read(output)};
   auto start{old_text.find("attach_offset = ")};
   CHECK(start != std::string::npos);
   old_text.replace(start, old_text.find('\n', start) - start, "attach_offset = 0, 0, 0\r");
   Write(output, old_text);
   auto marker{package / "alexhome-efb-owner.json"};
   auto owner{boost::json::parse(Read(marker)).as_object()};
   for (auto& entry : owner.at("files").as_array()) {
      if (
        entry.as_object().at("path").as_string()
        == output.lexically_relative(package).generic_string()
      ) {
         entry.as_object().at("hash") = tablet::FileSystem::Hash(old_text);
      }
   }
   Write(marker, boost::json::serialize(owner));
   CHECK(Manage(paths, "standard", "scan").outdated_ == 1);
   CHECK(Manage(paths, "standard", "apply", {id}).generated_ == 1);
   CHECK(placement(
     -1.723061 * .3048 + .012242,
     4.355627 * .3048 - .229998 - .64,
     43.720741 * .3048 - 1.041841 - .87
   ));
   return 0;
}

int
PresetNamesTests(fs::path const& root) {
   tablet::Paths paths{
     .community_  = root / "Community",
     .projection_ = root / "VFS",
     .output_     = root / "output",
     .containers_ = {}
   };
   auto source{paths.community_ / "protected-helicopter"};
   auto plane{source / "SimObjects" / "Airplanes" / "oh6a"};
   for (auto name : {"500c", "500c_cargo", "oh6a", "Hidden"}) {
      auto config{plane / "presets" / "taog" / name / "config"};
      Write(
        config / "aircraft.cfg",
        std::string_view{name} == "Hidden" ? "[FLTSIM.0]\nisuserselectable=0\n" : "\x01"
      );
      Write(config / "attached_objects.cfg", "[VERSION]\nmajor=1\nminor=0\n");
   }
   Write(
     plane / "common" / "config" / "cameras.cfg",
     "[VIEWS]\neyepoint=0,0,0\n[CAMERADEFINITION.0]\nTitle=Pilot\nInitialXyz=0,0,0\n"
   );
   std::vector<std::string> expected{"500c", "500c_cargo", "oh6a"};
   auto                     scan{Manage(paths, "standard", "scan")};
   CHECK(scan.available_ == 1 && scan.aircraft_.front().name_ == "Oh6a");
   CHECK(scan.aircraft_.front().preset_names_ == expected);
   CHECK(scan.aircraft_.front().preset_count_ == expected.size());
   auto json{boost::json::parse(js::Stringify(scan))};
   CHECK(json.at("aircraft").as_array().front().at("presetNames").as_array().size() == 3);
   CHECK(Manage(paths, "standard", "apply", {scan.aircraft_.front().id_}).generated_ == 1);
   auto inventory{Manage(paths, "standard", "installed")};
   CHECK(inventory.aircraft_.size() == 1 && inventory.aircraft_.front().preset_names_ == expected);
   fs::create_directories(paths.projection_ / "SimObjects" / "Airplanes");
   fs::copy(
     plane, paths.projection_ / "SimObjects" / "Airplanes" / "oh6a", fs::copy_options::recursive
   );
   auto deep{Manage(paths, "deep", "scan")};
   CHECK(deep.aircraft_.size() == 1 && deep.aircraft_.front().preset_names_ == expected);
   return 0;
}

class SimulatorPathsTest {
private:
   class Environment {
   public:
      /** @brief Override a CRT environment variable for this process only. */
      Environment(char const* name, fs::path const& value)
         : name_{name} {
         std::size_t size{};

         if (getenv_s(&size, nullptr, 0, name_)) {
            throw std::runtime_error("Cannot read test environment.");
         }

         if (size) {
            previous_.resize(size);

            if (getenv_s(&size, previous_.data(), previous_.size(), name_)) {
               throw std::runtime_error("Cannot save test environment.");
            }

            previous_.resize(size - 1);
         }

         if (_putenv_s(name_, value.string().c_str())) {
            throw std::runtime_error("Cannot set test environment.");
         }
      }

      /** @brief Restore the original environment even when an assertion fails. */
      ~Environment() {
         if (_putenv_s(name_, previous_.c_str())) {
            std::cerr << "Cannot restore test environment: " << name_ << '\n';
         }
      }

      /** @brief Keep restoration ownership unique. */
      Environment(Environment const&) = delete;

      /** @brief Keep restoration ownership unique. */
      Environment& operator=(Environment const&) = delete;

   private:
      char const* name_;
      std::string previous_{};
   };

public:
   /** @brief Verify shared discovery, store cache paths, precedence, and missing configuration. */
   static int Run(fs::path const& root) {
      auto        appdata{root / "Roaming"};
      auto        local_appdata{root / "Local"};
      Environment roaming{"APPDATA", appdata};
      Environment local{"LOCALAPPDATA", local_appdata};

      try {
         tablet::Fleet::FindPaths();
         CHECK(false);
      } catch (std::runtime_error const& error) {
         CHECK(std::string_view{error.what()} == "Cannot locate the MSFS installation.");
      }

      auto store{local_appdata / "Packages" / "Microsoft.Limitless_8wekyb3d8bbwe"};
      auto cache{store / "LocalCache"};
      auto packages{root / "Installed Packages"};
      auto config{"InstalledPackagesPath \"" + packages.string() + "\"\r\n"};
      fs::create_directories(store);

      try {
         tablet::Fleet::FindPaths();
         CHECK(false);
      } catch (std::runtime_error const& error) {
         CHECK(std::string_view{error.what()} == "Cannot locate Community from MSFS UserCfg.opt.");
      }

      Write(cache / "UserCfg.opt", config);

      auto store_paths{tablet::Fleet::FindPaths()};
      CHECK(store_paths.community_ == packages / "Community");
      CHECK(store_paths.projection_ == cache / "VFSProjection");

      auto steam{appdata / "Microsoft Flight Simulator 2024"};
      Write(steam / "UserCfg.opt", config);

      auto steam_paths{tablet::Fleet::FindPaths()};
      CHECK(steam_paths.community_ == packages / "Community");
      CHECK(steam_paths.projection_ == steam / "VFSProjection");

      Write(steam / "UserCfg.opt", "InstalledPackagesPath \"\"\r\n");

      try {
         tablet::Fleet::FindPaths();
         CHECK(false);
      } catch (std::runtime_error const& error) {
         CHECK(std::string_view{error.what()} == "Cannot locate Community from MSFS UserCfg.opt.");
      }

      return 0;
   }
};

int
IniReferenceTests() {
   tablet::Ini config{"; preamble\r\n[SIM_ATTACHMENT.0] ; original header\r\nvalue = original\r\n"};
   auto&       attachment{config.Get("sim_attachment.0")};
   auto&       general{config.Get("general")};
   general.Set("value", "general");

   for (int index{}; index < 256; ++index) {
      config.Get("extra." + std::to_string(index)).Set("index", std::to_string(index));
   }

   CHECK(&attachment == &config.Get("sim_attachment.0"));
   CHECK(&general == &config.Get("general"));
   auto& version{config.Get("version")};
   CHECK(&attachment == &config.Get("sim_attachment.0"));
   CHECK(&general == &config.Get("general"));
   attachment.Set("value", "updated");
   general.Set("value", "retained");
   version.Set("major", "1");
   CHECK(attachment.Get("value") == "updated");
   CHECK(general.Get("value") == "retained");
   CHECK(config.Text().starts_with(
     "; preamble\r\n[VERSION]\r\nmajor = 1\r\n"
     "[SIM_ATTACHMENT.0] ; original header\r\nvalue = updated\r\n"
     "[GENERAL]\r\nvalue = retained\r\n[EXTRA.0]\r\n"
   ));
   CHECK(&version == &config.Get("version"));
   return 0;
}

int
main(int argc, char** argv) {
#if defined(_MSC_VER) && defined(_DEBUG)
   _CrtSetReportMode(_CRT_ASSERT, _CRTDBG_MODE_FILE | _CRTDBG_MODE_DEBUG);
   _CrtSetReportFile(_CRT_ASSERT, _CRTDBG_FILE_STDERR);
   _CrtSetReportMode(_CRT_ERROR, _CRTDBG_MODE_FILE | _CRTDBG_MODE_DEBUG);
   _CrtSetReportFile(_CRT_ERROR, _CRTDBG_FILE_STDERR);
   _set_abort_behavior(0, _WRITE_ABORT_MSG);
#endif
   try {
      CHECK(IniReferenceTests() == 0);
      if (argc == 2 && std::string_view{argv[1]} == "--ini-only") {
         return 0;
      }
      if (
        argc == 2
        && (std::string_view{argv[1]} == "--scan-deep" || std::string_view{argv[1]} == "--scan-standard")
      ) {
         std::cout << Manage(
           std::string_view{argv[1]} == "--scan-deep" ? "deep" : "standard", "scan"
         ) << '\n';
         return 0;
      }
      if (argc >= 3 && argc <= 5 && std::string_view{argv[1]} == "--sample-generate") {
         auto paths =
           argc == 5
             ? tablet::
                 Paths{.community_ = fs::absolute(argv[3]), .projection_ = fs::absolute(argv[4]), .output_ = {}, .containers_ = {}}
             : tablet::Fleet::FindPaths();
         paths.output_ = fs::absolute(argv[2]);
         if (argc == 4) {
            paths.community_ = fs::absolute(argv[3]);
         }
         paths.containers_ = {
           "Asobo_C208B", "microsoft-aircraft-ec135", "microsoft-aircraft-saab-s340b"
         };
         auto                     scan = Manage(paths, "deep", "scan");
         std::vector<std::string> selected;
         for (auto const& aircraft : scan.aircraft_) {
            if (
              aircraft.status_ == "available" || aircraft.status_ == "outdated"
              || aircraft.status_ == "patched"
            ) {
               selected.push_back(aircraft.id_);
            }
         }
         if (selected.size() != 3) {
            std::cout << js::Stringify(scan) << '\n';
            return 1;
         }
         auto report = Manage(paths, "deep", "apply", selected);
         std::cout << js::Stringify(report) << '\n';
         for (auto const& item : fs::directory_iterator{paths.output_}) {
            if (
              item.is_directory() && item.path().filename().string().starts_with("alexhome-efb-")
            ) {
               auto          files = Snapshot(item.path());
               std::uint64_t size  = 0;
               for (auto const& [name, bytes] : files) {
                  size += bytes.size();
               }
               std::cout << item.path().string() << " files=" << files.size() << " bytes=" << size
                         << '\n';
            }
         }
         return report.patched_ == 3 && report.unsupported_ == 0 && report.foreign_ == 0 ? 0 : 1;
      }
      auto root =
        fs::current_path() / "build" / ("efb-fleet-test-" + std::to_string(GetCurrentProcessId()));
      CHECK(!fs::exists(root));
      fs::create_directories(root);
      struct Cleanup {
         fs::path p_;
         ~Cleanup() {
            std::error_code e;
            fs::remove_all(p_, e);
         }
      } cleanup{root};
      CHECK(SimulatorPathsTest::Run(root / "discovery") == 0);
      CHECK(PlacementTests(root / "placement") == 0);
      CHECK(PresetNamesTests(root / "preset-names") == 0);

      tablet::Paths paths{
        .community_  = root / "Community",
        .projection_ = root / "VFS",
        .output_     = root / "output",
        .containers_ = {}
      };
      fs::create_directories(paths.community_);
      auto              source          = paths.community_ / "fixture-source";
      auto              direct          = source / "SimObjects" / "Airplanes" / "DirectPlane";
      auto              nested          = source / "SimObjects" / "Airplanes" / "NestedPlane";
      auto              protected_plane = source / "SimObjects" / "Airplanes" / "Protected_Plane";
      const std::string version =
        "[VERSION] ; keep version header\r\nmajor = 1\r\nminor = 0\r\n\r\n";
      for (auto const& plane : {direct, nested, protected_plane}) {
         Write(
           plane / "presets" / "Maker" / "Main" / "config" / "aircraft.cfg",
           "[VERSION]\r\nmajor=1\r\n[FLTSIM.0]\r\nisuserselectable=1\r\nui_manufacturer="
           "Example\r\nui_type=Aircraft\r\n"
         );
         Write(
           plane / "common" / "config" / "cameras.cfg",
           "[VIEWS]\r\neyepoint=0,0,0\r\n"
           "[CAMERADEFINITION.0]\r\nTitle=Pilot\r\nInitialXyz=-0.476,1.444,5.618\r\n"
         );
      }
      auto direct_cfg = direct / "presets" / "Maker" / "Main" / "config" / "attached_objects.cfg";
      auto tablet     = "attachment=\"SimAttachments\\Instruments\\Tablet\\model\\tablet.xml\"\r\n";
      Write(
        source / "SimAttachments" / "Instruments" / "Tablet" / "model" / "tablet.xml", "<Model/>"
      );
      Write(source / "SimAttachments" / "Objects" / "Other" / "model" / "model.xml", "<Model/>");
      Write(
        direct_cfg,
        version + "[SIM_ATTACHMENT.0]\r\n" + tablet
          + "attach_to_node = \"TABLET_MOUNT\"\r\nattach_offset = 0.1, 0.2, 0.3\r\n  "
            "[SiM_Attachment.7] ; preserved mixed header\r\nalias = original ; retain "
            "me\r\nattachment=\"SimAttachments\\Objects\\Other\\model\\model.xml\"\r\n"
      );
      Write(direct / "presets" / "Maker" / "Main" / "input" / "action.actiondb", "existing action");
      Write(direct / "inputs" / "keyboard.xml", "existing keyboard");
      Write(
        direct / "presets" / "Maker" / "Hidden" / "config" / "aircraft.cfg",
        "[FLTSIM.0]\r\nisuserselectable=0\r\n"
      );
      auto nested_cfg  = nested / "presets" / "Maker" / "Main" / "config" / "attached_objects.cfg";
      auto nested_text = version
                         + "[SIM_ATTACHMENT.2]\r\nattachment_root="
                           "\"SimObjects\\Airplanes\\NestedPlane\\attachments\\Maker\\Interior\"\r"
                           "\nattachment_file=\"model\\model.xml\"\r\n";
      Write(nested_cfg, nested_text);
      Write(
        nested / "presets" / "Maker" / "Second" / "config" / "aircraft.cfg",
        "[FLTSIM.0]\r\nisuserselectable=1\r\n"
      );
      Write(
        nested / "presets" / "Maker" / "Second" / "config" / "attached_objects.cfg", nested_text
      );
      auto shared = nested / "attachments" / "Maker" / "Interior";
      Write(shared / "model" / "model.xml", "<Model/>");
      Write(
        shared / "config" / "attached_objects.cfg",
        version + "[SIM_ATTACHMENT.9]\r\n" + tablet
          + "attach_to_node = \"TABLET_MOUNT\"\r\nattach_offset = 0.4, 0.5, 0.6\r\n[OTHER] ; "
            "preserved\r\nvalue = 7\r\n"
      );
      Write(
        protected_plane / "presets" / "Maker" / "Main" / "config" / "attached_objects.cfg", version
      );
      auto protected_cfg =
        protected_plane / "presets" / "Maker" / "Main" / "config" / "aircraft.cfg";
      auto   stock  = Snapshot(source);
      HANDLE locked = CreateFileW(
        protected_cfg.c_str(),
        GENERIC_READ,
        0,
        nullptr,
        OPEN_EXISTING,
        FILE_ATTRIBUTE_NORMAL,
        nullptr
      );
      CHECK(locked != INVALID_HANDLE_VALUE);
      auto scan = Manage(paths, "standard", "scan");
      CHECK(scan.available_ == 3 && !scan.restart_required_ && !fs::exists(paths.output_));
      std::vector<std::string> selected;
      std::string              direct_id, nested_id;
      for (auto const& plane : scan.aircraft_) {
         selected.push_back(plane.id_);
         if (plane.container_.ends_with("DirectPlane")) {
            direct_id = plane.id_;
            CHECK(plane.efb_ == "direct" && plane.preset_count_ == 1);
         }
         if (plane.container_.ends_with("NestedPlane")) {
            nested_id = plane.id_;
            CHECK(plane.efb_ == "nested" && plane.preset_count_ == 2);
         }
         if (plane.container_.ends_with("Protected_Plane")) {
            CHECK(plane.name_ == "Protected Plane" && !plane.warnings_.empty());
         }
      }
      CHECK(!fs::exists(paths.community_ / "alexhome-msfs2024-vfrnav"));
      auto applied = Manage(paths, "standard", "apply", selected);
      CloseHandle(locked);
      CHECK(applied.generated_ == 3 && applied.patched_ == 3 && applied.restart_required_);
      auto inventory_paths        = paths;
      inventory_paths.projection_ = root / "missing-projection";
      inventory_paths.community_  = root / "empty-community";
      fs::create_directories(inventory_paths.community_);
      auto inventory = Manage(inventory_paths, "deep", "installed");
      CHECK(
        inventory.patched_ == 3 && inventory.aircraft_.size() == 3 && inventory.entries_.empty()
      );
      auto first_inventory  = std::async(std::launch::async, [&] {
         return Manage(inventory_paths, "standard", "installed");
      });
      auto second_inventory = std::async(std::launch::async, [&] {
         return Manage(inventory_paths, "deep", "installed");
      });
      CHECK(first_inventory.get().patched_ == 3 && second_inventory.get().patched_ == 3);
      for (auto const& aircraft : inventory.aircraft_) {
         CHECK(
           !aircraft.name_.empty() && aircraft.preset_count_ >= 1 && aircraft.status_ == "patched"
         );
      }
      auto nested_inventory = std::ranges::find_if(inventory.aircraft_, [&](auto const& aircraft) {
         return aircraft.id_ == nested_id;
      });
      CHECK(nested_inventory != inventory.aircraft_.end() && nested_inventory->preset_count_ == 2);
      auto selected_removal_paths = inventory_paths;
      selected_removal_paths.output_ = root / "selected-removal";
      fs::create_directories(selected_removal_paths.output_);
      for (auto const& aircraft : inventory.aircraft_) {
         fs::copy(
           paths.output_ / ("alexhome-efb-" + aircraft.id_),
           selected_removal_paths.output_ / ("alexhome-efb-" + aircraft.id_),
           fs::copy_options::recursive
         );
      }
      std::vector<std::string> keep_installed;
      for (auto const& aircraft : inventory.aircraft_) {
         if (aircraft.id_ != inventory.aircraft_.front().id_) {
            keep_installed.push_back(aircraft.id_);
         }
      }
      auto remove_without_scan = Manage(selected_removal_paths, "standard", "apply", keep_installed);
      CHECK(
        remove_without_scan.removed_ == 1 && remove_without_scan.restart_required_
        && Manage(selected_removal_paths, "standard", "installed").patched_ == 2
      );
      CHECK(!fs::exists(selected_removal_paths.output_ / ("alexhome-efb-" + inventory.aircraft_.front().id_)));
      auto keep_without_source = Manage(selected_removal_paths, "standard", "apply", keep_installed);
      CHECK(keep_without_source.generated_ == 0 && keep_without_source.removed_ == 0);
      CHECK(keep_without_source.aircraft_.size() == 2 && !keep_without_source.restart_required_);
      bool unknown_installed = false;
      try {
         Manage(selected_removal_paths, "standard", "apply", {"unknown-aircraft"});
      } catch (std::exception const&) {
         unknown_installed = true;
      }
      CHECK(unknown_installed && Manage(selected_removal_paths, "standard", "installed").patched_ == 2);
      auto protected_package = selected_removal_paths.output_ / ("alexhome-efb-" + keep_installed.front());
      auto protected_manifest = protected_package / "manifest.json";
      auto original_manifest = Read(protected_manifest);
      Write(protected_manifest, original_manifest + "modified");
      auto protected_snapshot = Snapshot(protected_package);
      auto protected_removal = Manage(
        selected_removal_paths, "standard", "apply", {keep_installed.back()}
      );
      CHECK(protected_removal.removed_ == 0 && !protected_removal.entries_.empty());
      CHECK(Snapshot(protected_package) == protected_snapshot);
      Write(protected_manifest, original_manifest);
      CHECK(Manage(selected_removal_paths, "standard", "apply").removed_ == 2);
      CHECK(Manage(selected_removal_paths, "standard", "installed").aircraft_.empty());
      for (auto const& aircraft : applied.aircraft_) {
         for (auto const& warning : aircraft.warnings_) {
            CHECK(warning.find("Ctrl+T") == std::string::npos);
         }
      }
      CHECK(Snapshot(source) == stock);
      auto direct_package = paths.output_ / ("alexhome-efb-" + direct_id),
           nested_package = paths.output_ / ("alexhome-efb-" + nested_id);
      auto direct_output  = direct_package / direct_cfg.lexically_relative(source);
      auto text           = Read(direct_output);
      CHECK(text.starts_with(version) && text.find("[SIM_ATTACHMENT.0]") != std::string::npos);
      CHECK(text.find(std::string{"\x01", 1}) == std::string::npos);
      CHECK(
        text.find(
          "attachment=\"SimAttachments\\Alexhome\\EFB_Tablet_" + direct_id
          + "\\model\\model.xml\""
        )
        != std::string::npos
      );
      CHECK(
        text.find("  [SiM_Attachment.7] ; preserved mixed header\r\nalias = original ; retain me")
        != std::string::npos
      );
      CHECK(
        text.find("Instruments\\Tablet") == std::string::npos
        && text.find("Alexhome_EFB_Tablet_" + direct_id) != std::string::npos
      );
      CHECK(text.find("attach_to_node = \"TABLET_MOUNT\"") != std::string::npos);
      CHECK(text.find("attach_offset = 0.1, -0.15, -0.9") != std::string::npos);
      CHECK(!fs::exists(
        direct_package / "SimObjects" / "Airplanes" / "DirectPlane" / "inputs" / "keyboard.xml"
      ));
      CHECK(!fs::exists(
        direct_package / "SimObjects" / "Airplanes" / "DirectPlane" / "presets" / "Maker" / "Main"
        / "input" / "action.actiondb"
      ));
      auto shared_output =
        nested_package / (shared / "config" / "attached_objects.cfg").lexically_relative(source);
      auto shared_text = Read(shared_output);
      CHECK(
        shared_text.find(
          "attachment=\"SimAttachments\\Alexhome\\EFB_Tablet_" + nested_id
          + "\\model\\model.xml\""
        )
        != std::string::npos
      );
      CHECK(shared_text.find("attach_to_node = \"TABLET_MOUNT\"") != std::string::npos);
      CHECK(shared_text.find("attach_offset = 0.4, 0.15, -0.6") != std::string::npos);
      CHECK(shared_text.find("[OTHER] ; preserved\r\nvalue = 7") != std::string::npos);
      CHECK(!fs::exists(
        nested_package / "SimObjects" / "Airplanes" / "NestedPlane" / "attachments" / "alexhome_efb"
      ));
      CHECK(!fs::exists(paths.output_ / "alexhome-efb-tablet-core"));
      for (auto const& package : fs::directory_iterator{paths.output_}) {
         auto package_id{
           package.path().filename().string().substr(std::string{"alexhome-efb-"}.size())
         };
         auto rig_relative =
           fs::path{"SimAttachments"} / "Alexhome" / ("EFB_Tablet_" + package_id);
         auto rig   = package.path() / rig_relative;
         auto model = Read(rig / "model" / "model.xml");
         CHECK(
           model.find("Compiled=\"True\"") != std::string::npos
           && model.find("CompileBehaviors") == std::string::npos
         );
         CHECK(model.find("model.behavior.xml") != std::string::npos);
         CHECK(
           Read(rig / "model" / "rig.gltf").find("\"VFRNAV_ANIM_NATIVE_TABLET\"")
           != std::string::npos
         );
         CHECK(
           Read(rig / "model" / "model.behavior.xml")
             .find("(L:VFRNAV_EFB_HIDDEN, Number) 0 != (L:VFRNAV_EFB_MODE, Number) 0 != or if{")
           == std::string::npos
         );
         auto assets = Snapshot(rig);
         CHECK(assets.size() == 11);
         CHECK(
           assets.at("config/attached_objects.cfg")
             .find("SimAttachments\\Alexhome\\EFB_Tablet_" + package_id + "\\edit")
           != std::string::npos
         );
         CHECK(
           assets.at("input/action.actiondb")
             .find("SimAttachments\\Alexhome\\EFB_Tablet_" + package_id)
           != std::string::npos
         );
         for (auto const& name :
              {"attachment.cfg",
               "config/attached_objects.cfg",
               "input/action.actiondb",
               "model/model.xml",
               "model/model.behavior.xml",
               "model/model.actiondb",
               "model/rig.gltf",
               "model/rig.bin"}) {
            CHECK(assets.contains(name) && !assets.at(name).empty());
         }
         auto manifest = boost::json::parse(Read(package.path() / "manifest.json")).as_object();
         CHECK(manifest.at("dependencies").as_array().empty());
         auto layout = boost::json::parse(Read(package.path() / "layout.json"))
                         .as_object()
                         .at("content")
                         .as_array();
         std::map<std::string, std::size_t> listed;
         for (auto const& entry : layout) {
            auto const& item = entry.as_object();
            auto        rel  = std::string{item.at("path").as_string()};
            CHECK(++listed[rel] == 1);
            CHECK(
              rel.starts_with("simattachments/alexhome/efb_tablet_" + package_id + "/")
              || rel.ends_with("/config/attached_objects.cfg")
              || rel == "en-us.locpak"
              || rel == "updatefrequencypresets/vfrnav_tablet.xml"
            );
            if (rel.starts_with("simobjects/")) {
               auto overlay = Read(package.path() / rel);
               CHECK(overlay.find('\x01') == std::string::npos);
               if (
                 overlay.find("Alexhome_EFB_Tablet_" + package_id) != std::string::npos
               ) {
                  CHECK(
                    overlay.find(
                      "\"SimAttachments\\Alexhome\\EFB_Tablet_" + package_id
                      + "\\model\\model.xml\""
                    )
                    != std::string::npos
                  );
               }
            }
            CHECK(
              fs::file_size(package.path() / rel) == item.at("size").to_number<std::uint64_t>()
            );
            WIN32_FILE_ATTRIBUTE_DATA data{};
            CHECK(
              GetFileAttributesExW((package.path() / rel).c_str(), GetFileExInfoStandard, &data)
            );
            ULARGE_INTEGER ft{};
            ft.LowPart  = data.ftLastWriteTime.dwLowDateTime;
            ft.HighPart = data.ftLastWriteTime.dwHighDateTime;
            CHECK(ft.QuadPart == item.at("date").to_number<std::uint64_t>());
         }
         auto files = Snapshot(package.path());
         CHECK(files.size() == layout.size() + 3);
         CHECK(files.contains("en-US.locPak"));
         auto owner =
           boost::json::parse(Read(package.path() / "alexhome-efb-owner.json")).as_object();
         CHECK(owner.at("schema").as_int64() == 3 && !owner.at("sourceFiles").as_array().empty());
         CHECK(owner.at("files").as_array().size() == files.size() - 1);
         auto preset_path = "UpdateFrequencyPresets/VFRNAV_Tablet.xml";
         CHECK(listed.contains("updatefrequencypresets/vfrnav_tablet.xml"));
         CHECK(
           Read(package.path() / preset_path)
             .find("<SizeOnScreenForMaxUpdateFrequency>0</SizeOnScreenForMaxUpdateFrequency>")
           != std::string::npos
         );
         assets.emplace(preset_path, Read(package.path() / preset_path));
         assets.emplace("en-US.locPak", Read(package.path() / "en-US.locPak"));
         CHECK(owner.at("generatorFiles").as_array().size() == assets.size());
         for (auto const& [name, bytes] : assets) {
            auto path =
              name == preset_path || name == "en-US.locPak"
                ? name
                : (rig_relative / name).generic_string();
            auto lower = path;
            std::ranges::transform(lower, lower.begin(), [](unsigned char ch) {
               return static_cast<char>(std::tolower(ch));
            });
            CHECK(listed.contains(lower));
            auto generator =
              std::ranges::find_if(owner.at("generatorFiles").as_array(), [&](auto const& entry) {
                 return entry.as_object().at("path").as_string() == path;
              });
            auto owned = std::ranges::find_if(owner.at("files").as_array(), [&](auto const& entry) {
               return entry.as_object().at("path").as_string() == path;
            });
            CHECK(
              generator != owner.at("generatorFiles").as_array().end()
              && owned != owner.at("files").as_array().end()
            );
            CHECK(generator->as_object().at("hash") == owned->as_object().at("hash"));
            CHECK(!generator->as_object().at("hash").as_string().empty());
         }
         for (auto const& entry : owner.at("sourceFiles").as_array()) {
            CHECK(!entry.as_object().at("hash").as_string().empty());
            CHECK(!entry.as_object().at("path").as_string().starts_with(
              "SimAttachments/Alexhome/EFB_Tablet/"
            ));
         }
      }
      // A protected cfg becoming readable is a legitimate source change; refresh once before no-op
      // checks.
      auto refresh = Manage(paths, "standard", "apply", selected);
      CHECK(refresh.generated_ == 1);
      auto no_op = Manage(paths, "standard", "apply", selected);
      CHECK(no_op.generated_ == 0 && !no_op.restart_required_);
      auto old_generator =
        boost::json::parse(Read(direct_package / "alexhome-efb-owner.json")).as_object();
      old_generator.erase("generatorFiles");
      Write(direct_package / "alexhome-efb-owner.json", boost::json::serialize(old_generator));
      CHECK(Manage(paths, "standard", "scan").outdated_ == 1);
      CHECK(Manage(paths, "standard", "apply", selected).generated_ == 1);
      auto changed_generator =
        boost::json::parse(Read(direct_package / "alexhome-efb-owner.json")).as_object();
      changed_generator.at("generatorFiles").as_array().at(0).as_object().at("hash") =
        "obsolete generator hash";
      Write(direct_package / "alexhome-efb-owner.json", boost::json::serialize(changed_generator));
      CHECK(Manage(paths, "standard", "scan").outdated_ == 1);
      CHECK(Manage(paths, "standard", "apply", selected).generated_ == 1);
      // Existing owned packages from the per-aircraft shortcut model must shed their profiles on
      // Apply.
      auto old_marker =
        boost::json::parse(Read(nested_package / "alexhome-efb-owner.json")).as_object();
      auto const& old_file         = old_marker.at("files").as_array().at(0).as_object();
      auto        old_hash         = std::string{old_file.at("hash").as_string()};
      auto        profile_relative = "SimObjects/Airplanes/NestedPlane/inputs/keyboard.xml";
      Write(
        nested_package / profile_relative,
        Read(nested_package / fs::path{std::string{old_file.at("path").as_string()}})
      );
      old_marker.at("files").as_array().emplace_back(
        boost::json::object{{"path", profile_relative}, {"hash", old_hash}}
      );
      Write(nested_package / "alexhome-efb-owner.json", boost::json::serialize(old_marker));
      auto old_scan = Manage(paths, "standard", "scan");
      CHECK(old_scan.outdated_ == 1);
      auto migrated = Manage(paths, "standard", "apply", selected);
      CHECK(migrated.generated_ == 1 && !fs::exists(nested_package / profile_relative));
      fs::create_directories(paths.projection_);
      fs::copy(source, paths.projection_, fs::copy_options::recursive);
      for (auto const& package : fs::directory_iterator{paths.output_}) {
         fs::copy(
           package.path() / "SimObjects",
           paths.projection_ / "SimObjects",
           fs::copy_options::recursive | fs::copy_options::overwrite_existing
         );
      }
      auto deep = Manage(paths, "deep", "scan");
      if (deep.patched_ != 3 || deep.outdated_) {
         std::cerr << js::Stringify(deep) << "\n";
      }
      CHECK(deep.patched_ == 3 && deep.outdated_ == 0);
      auto keyboard_conflict = paths.community_ / "foreign-keyboard";
      Write(
        keyboard_conflict / "SimObjects" / "Airplanes" / "DirectPlane" / "inputs" / "keyboard.xml",
        "conflicting keyboard"
      );
      auto conflict_scan = Manage(paths, "deep", "scan");
      CHECK(conflict_scan.foreign_ == 0 && conflict_scan.patched_ == 3);
      fs::remove_all(keyboard_conflict);
      Write(direct_cfg, Read(direct_cfg) + "; stock simulator update\r\n");
      auto changed = Manage(paths, "standard", "scan");
      CHECK(changed.outdated_ == 1);
      auto update = Manage(paths, "standard", "apply", selected);
      CHECK(
        update.generated_ == 1
        && Read(direct_output).find("stock simulator update") != std::string::npos
      );
      stock                = Snapshot(source);
      auto binary          = direct_package / "SimAttachments" / "Alexhome"
                             / ("EFB_Tablet_" + direct_id) / "model" / "rig.bin";
      auto original_binary = Read(binary);
      Write(binary, original_binary + "modified");
      CHECK(Manage(paths, "standard", "scan").foreign_ == 1);
      bool rig_refused = false;
      try {
         Manage(paths, "standard", "apply", selected);
      } catch (...) {
         rig_refused = true;
      }
      CHECK(rig_refused && Read(binary) == original_binary + "modified");
      auto rig_removal = Manage(paths, "standard", "remove");
      CHECK(rig_removal.removed_ == 2 && fs::exists(binary));
      Write(binary, original_binary);
      CHECK(Manage(paths, "standard", "apply", selected).generated_ == 2);
      auto owned = Read(direct_output);
      Write(direct_output, owned + "modified");
      auto modified = Manage(paths, "standard", "scan");
      CHECK(modified.foreign_ == 1);
      bool refused = false;
      try {
         Manage(paths, "standard", "apply", selected);
      } catch (...) {
         refused = true;
      }
      CHECK(refused && Read(direct_output) == owned + "modified");
      auto removal = Manage(paths, "standard", "remove");
      CHECK(removal.removed_ == 2 && fs::exists(direct_package));
      Write(direct_output, owned);
      auto removed = Manage(paths, "standard", "remove");
      CHECK(removed.removed_ == 1 && !fs::exists(direct_package));
      auto again = Manage(paths, "standard", "apply", selected);
      CHECK(again.generated_ == 3);
      auto unsafe_panel =
        source / "SimAttachments" / "Instruments" / "Tablet" / "panel" / "panel.cfg";
      Write(unsafe_panel, "[EFB]\r\n[VCockpit01]\r\n");
      auto unsafe = Manage(paths, "standard", "scan");
      CHECK(unsafe.unsupported_ == 2);
      fs::remove(unsafe_panel);
      fs::remove(unsafe_panel.parent_path());
      bool unknown = false;
      try {
         Manage(paths, "standard", "apply", {"unknown-aircraft"});
      } catch (...) {
         unknown = true;
      }
      CHECK(unknown);
      auto fewer = selected;
      std::erase(fewer, direct_id);
      auto unchecked = Manage(paths, "standard", "apply", fewer);
      CHECK(unchecked.removed_ == 1 && !fs::exists(direct_package));
      auto long_paths    = paths;
      long_paths.output_ = root / std::string(60, 'a') / std::string(40, 'b');
      auto long_apply    = Manage(long_paths, "standard", "apply", {selected.front()});
      CHECK(long_apply.generated_ == 1);
      CHECK(long_apply.community_ == long_paths.output_.string());
      auto long_scan = Manage(long_paths, "standard", "scan");
      CHECK(
        std::ranges::count_if(
          long_scan.aircraft_, [](auto const& aircraft) { return aircraft.status_ == "patched"; }
        )
        == 1
      );
      CHECK(Manage(long_paths, "standard", "apply", {selected.front()}).generated_ == 0);
      CHECK(Manage(long_paths, "standard", "remove").removed_ == 1);
      auto foreign = paths.community_ / "foreign-patch" / direct_cfg.lexically_relative(source);
      Write(foreign, Read(direct_cfg));
      auto foreign_scan = Manage(paths, "standard", "scan");
      CHECK(foreign_scan.foreign_ >= 1);
      auto legacy = paths.output_ / "alexhome-efb-tablet-core";
      auto marker =
        boost::json::parse(Read(nested_package / "alexhome-efb-owner.json")).as_object();
      auto const& first       = marker.at("files").as_array().at(0).as_object();
      auto        legacy_hash = std::string{first.at("hash").as_string()};
      Write(
        legacy / "test.txt",
        Read(nested_package / fs::path{std::string{first.at("path").as_string()}})
      );
      Write(
        legacy / "alexhome-efb-owner.json",
        boost::json::serialize(
          boost::json::object{
            {"owner", "alexhome.efb-fleet"},
            {"schema", 2},
            {"package", "alexhome-efb-tablet-core"},
            {"files",
             boost::json::array{boost::json::object{{"path", "test.txt"}, {"hash", legacy_hash}}}}
          }
        )
      );
      auto final_remove = Manage(paths, "standard", "remove");
      CHECK(final_remove.removed_ == 3 && !fs::exists(legacy) && fs::exists(foreign));
      CHECK(Snapshot(source) == stock);
      CHECK(!fs::exists(paths.community_ / "alexhome-msfs2024-vfrnav"));
      std::cout << "Package-local compiled rigs, clean attachment paths, generator/stock hashes, "
                   "direct/nested removal, projection snapshots, ownership refusal, layout, and "
                   "stock preservation passed.\n";
      return 0;
   } catch (std::exception const& e) {
      std::cerr << e.what() << '\n';
      return 3;
   }
}
