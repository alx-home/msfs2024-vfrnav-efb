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

#include "Inventory.h"
#include "FileSystem.h"
#include "Package.h"
#include "Planner.h"
#include <boost/json.hpp>
#include <algorithm>
#include <stdexcept>

namespace tablet {
namespace fs = std::filesystem;

void
Inventory::MarkInstalled(Plan& plan, fs::path const& output, bool deep) {
   auto target{output / Package::PackageName(plan)};
   if (!fs::exists(target)) {
      return;
   }

   try {
      auto owner{Package::ReadOwner(target)};

      Package::VerifyOwned(target, owner);
      if (
        owner.schema_ != 3
        || FileSystem::Lower(owner.container_) != FileSystem::Lower(plan.info_.container_)
      ) {
         throw std::runtime_error("Managed package belongs to a different aircraft/model.");
      }

      if (plan.info_.status_ != "unsupported") {
         plan.info_.status_ = Planner::StockChanged(plan, owner, deep) ? "outdated" : "patched";
      }

      if (plan.info_.efb_ == "none") {
         plan.info_.efb_ = owner.efb_;
      }

      if (deep) {
         plan.info_.warnings_.emplace_back(
           "VFS projection may mask stock updates beneath mounted overlays; use Standard mode for "
           "unpacked source packages, or rescan with patches unmounted."
         );
      }
   } catch (std::exception const& error) {
      plan.info_.status_ = "foreign";
      plan.info_.reason_ = error.what();
   }
}

void
Inventory::MarkForeign(Plan& plan, Paths const& paths) {
   if (plan.info_.status_ == "foreign") {
      return;
   }

   for (auto const& package : fs::directory_iterator{paths.community_}) {
      if (
        !package.is_directory() || package.path() == plan.root_
        || package.path().filename() == Package::MAIN_PACKAGE
      ) {
         continue;
      }

      if (
        package.path().filename() == Package::PackageName(plan)
        && (paths.output_.empty() || paths.output_ == paths.community_)
      ) {
         continue;
      }

      auto container{package.path() / FileSystem::VirtualPath(plan.info_.container_)};
      if (!fs::is_directory(container)) {
         continue;
      }

      // An unpacked complete aircraft is a source, not a competing overlay in a projected scan.
      if (plan.root_ == paths.projection_ && fs::is_directory(container / "common")) {
         try {
            if (
              FileSystem::Read(package.path() / "manifest.json").find("CUSTOM_SIMOBJECTS_PATCH")
              == std::string::npos
            ) {
               continue;
            }
         } catch (std::exception const& error) {
            plan.info_.warnings_.push_back(
              "Cannot inspect source package manifest " + package.path().string() + ": "
              + error.what()
            );
            continue;
         }
      }

      bool overlap{false};

      for (auto const& [relative, bytes] : plan.files_) {
         if (fs::is_regular_file(package.path() / fs::path{relative})) {
            overlap = true;
            break;
         }
      }

      if (!overlap) {
         for (auto const& [key, source] : plan.stock_) {
            if (fs::is_regular_file(package.path() / fs::path{source.path_})) {
               overlap = true;
               break;
            }
         }
      }

      if (!overlap) {
         continue;
      }

      try {
         auto owner{Package::ReadOwner(package.path())};

         Package::VerifyOwned(package.path(), owner);
         if (
           owner.schema_ == 3
           && FileSystem::Lower(owner.container_) == FileSystem::Lower(plan.info_.container_)
         ) {
            continue;
         }
      } catch (std::exception const& error) {
         plan.info_.warnings_.push_back(
           "Cannot verify overlay ownership for " + package.path().string() + ": " + error.what()
         );
      }

      plan.info_.status_ = "foreign";
      plan.info_.reason_ =
        "Non-owned package overlays this aircraft: " + package.path().filename().string();
      return;
   }
}

void
Inventory::FillCounts(Report& report) {
   report.available_ = report.patched_ = report.outdated_ = report.unsupported_ = report.foreign_ =
     0;
   for (auto const& aircraft : report.aircraft_) {
      if (aircraft.status_ == "available") {
         ++report.available_;
      } else if (aircraft.status_ == "patched") {
         ++report.patched_;
      } else if (aircraft.status_ == "outdated") {
         ++report.outdated_;
      } else if (aircraft.status_ == "foreign") {
         ++report.foreign_;
      } else {
         ++report.unsupported_;
      }
   }
}

void
Inventory::ReadInstalled(Report& report, fs::path const& output) {
   if (!fs::is_directory(output)) {
      return;
   }

   for (auto const& package : fs::directory_iterator{output}) {
      auto name{package.path().filename().string()};
      if (!package.is_directory() || !name.starts_with("alexhome-efb-")) {
         continue;
      }

      try {
         auto owner{Package::ReadOwner(package.path())};

         Package::VerifyOwned(package.path(), owner);
         if (owner.schema_ != 3) {
            report.entries_.push_back(
              {.source_  = name,
               .state_   = "legacy",
               .message_ = "Legacy managed package; aircraft details are unavailable."}
            );
            continue;
         }

         Aircraft aircraft{
           .id_ = name.substr(std::string_view{"alexhome-efb-"}.size()),
           .name_ =
             FileSystem::Pretty(FileSystem::VirtualPath(owner.container_).filename().string()),
           .container_    = owner.container_,
           .status_       = "patched",
           .efb_          = owner.efb_,
           .reason_       = {},
           .preset_count_ = 0,
           .warnings_     = {
             "Installed package verified locally. Scan aircraft to check source updates."
           }
         };

         auto manifest{
           boost::json::parse(FileSystem::Read(package.path() / "manifest.json")).as_object()
         };
         auto                       title{std::string{manifest.at("title").as_string()}};
         constexpr std::string_view TITLE_PREFIX{"Alexhome EFB patch - "};
         if (title.starts_with(TITLE_PREFIX)) {
            aircraft.name_ = title.substr(TITLE_PREFIX.size());
         }

         auto prefix{FileSystem::Lower(owner.container_) + "/presets/"};

         for (auto const& file : owner.files_) {
            auto path{FileSystem::Lower(FileSystem::VirtualPath(file.path_).generic_string())};
            if (path.starts_with(prefix) && path.ends_with("/config/attached_objects.cfg")) {
               ++aircraft.preset_count_;

               auto preset{
                 FileSystem::VirtualPath(file.path_).parent_path().parent_path().filename()
               };
               aircraft.preset_names_.push_back(preset.string());
            }
         }

         std::ranges::sort(aircraft.preset_names_);
         auto presets{std::ranges::unique(aircraft.preset_names_)};
         aircraft.preset_names_.erase(presets.begin(), presets.end());

         report.aircraft_.push_back(std::move(aircraft));
      } catch (std::exception const& error) {
         report.entries_.push_back(
           {.source_ = name, .state_ = "foreign", .message_ = error.what()}
         );
      }
   }

   Inventory::FillCounts(report);
}
}  // namespace tablet
