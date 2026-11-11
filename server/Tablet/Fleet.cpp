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

#include "Fleet.h"
#include "VfsWatcher.h"
#include "Fleet/FileSystem.h"
#include "Fleet/Package.h"
#include "Fleet/Planner.h"
#include "Fleet/Inventory.h"
#include "Fleet/Transaction.h"
#include <Utils/FindMSFS.h>
#include <json/json.inl>
#include <boost/json.hpp>
#include <algorithm>
#include <exception>
#include <map>
#include <regex>
#include <set>
#include <stdexcept>
#include <utility>

namespace tablet {
namespace fs = std::filesystem;

promise::Mutex Fleet::management_mutex_{};

Paths
Fleet::FindPaths() {
   auto simulator{::FindMSFS()};
   if (simulator.empty()) {
      throw std::runtime_error("Cannot locate the MSFS installation.");
   }

   fs::path root{simulator};

   for (auto const& config : {root / "UserCfg.opt", root / "LocalCache" / "UserCfg.opt"}) {
      if (!fs::is_regular_file(config)) {
         continue;
      }

      auto        ini{FileSystem::Read(config)};
      std::smatch match{};
      if (std::regex_search(ini, match, std::regex{"InstalledPackagesPath\\s+\"([^\"]+)\""})) {
         auto utf8{match[1].str()};

         if (utf8.empty()) {
            continue;
         }

         auto encoded{std::u8string{utf8.begin(), utf8.end()}};

         return {
           .community_  = fs::path{encoded} / "Community",
           .projection_ = config.parent_path() / "VFSProjection",
           .output_     = {},
           .containers_ = {}
         };
      }
   }

   throw std::runtime_error("Cannot locate Community from MSFS UserCfg.opt.");
}

WPromise<Report>
Fleet::Manage(
  Dispatch                        dispatch,
  Paths const&                    paths,
  std::string const&              mode,
  std::string const&              action,
  std::vector<std::string> const& selection
) {
   return MakePromise(ManageTask, std::move(dispatch), paths, mode, action, selection);
}

Promise<Report>
Fleet::ManageTask(
  Dispatch                 dispatch,
  Paths                    paths,
  std::string              mode,
  std::string              action,
  std::vector<std::string> selection
) {
   if (
     (mode != "standard" && mode != "deep")
     || (action != "scan" && action != "apply" && action != "remove" && action != "installed")
   ) {
      throw std::runtime_error("Invalid EFB aircraft operation.");
   }

   // Inventories wait for the running operation; mutating operations fail fast instead.
   if (action != "installed" && management_mutex_.OwnsLock()) {
      throw std::runtime_error("Another EFB aircraft operation is running.");
   }

   promise::LockGuard lock{management_mutex_};
   co_await lock.Lock();

   // Keep the caller responsive: process the operation on the pool workers.
   co_await dispatch();

   FileSystem::SafePath(paths.community_);

   if (!fs::is_directory(paths.community_)) {
      throw std::runtime_error("Community directory is missing.");
   }

   auto output{FileSystem::ExtendedPath(paths.output_.empty() ? paths.community_ : paths.output_)};

   FileSystem::SafePath(output);

   Report report{};

   report.mode_      = mode;
   report.action_    = action;
   report.community_ = (paths.output_.empty() ? paths.community_ : paths.output_).string();

   if (action == "installed") {
      Inventory::ReadInstalled(report, output);
      co_return report;
   }

   if (action == "remove") {
      if (!fs::is_directory(output)) {
         co_return report;
      }

      std::vector<fs::path> packages{};

      for (auto const& package : fs::directory_iterator{output}) {
         if (
           package.is_directory()
           && FileSystem::Lower(package.path().filename().string()).starts_with("alexhome-efb-")
         ) {
            packages.push_back(package.path());
         }
      }

      // Verify and remove every managed package in parallel on the pool workers.
      std::vector<Entry>          entries(packages.size());
      std::vector<char>           removed(packages.size(), 0);
      std::vector<WPromise<void>> tasks{};

      tasks.reserve(packages.size());

      for (std::size_t index = 0; index < packages.size(); ++index) {
         tasks.emplace_back(WPromise<void>{[&, index]() -> Promise<void> {
            co_await dispatch();

            auto const& package{packages[index]};

            try {
               auto owner{Package::ReadOwner(package)};

               Package::VerifyOwned(package, owner);
               FileSystem::MakeWritableTree(package);
               fs::remove_all(package);

               removed[index] = 1;
               entries[index] = {
                 .source_  = package.filename().string(),
                 .state_   = "removed",
                 .message_ = "Verified managed package removed."
               };
            } catch (std::exception const& error) {
               entries[index] = {
                 .source_  = package.filename().string(),
                 .state_   = "foreign",
                 .message_ = error.what()
               };
            }
         }});
      }

      co_await promise::All(std::move(tasks));

      for (std::size_t index = 0; index < packages.size(); ++index) {
         if (removed[index]) {
            ++report.removed_;
            report.restart_required_ = true;
         }

         report.entries_.push_back(std::move(entries[index]));
      }

      co_return report;
   }

   std::vector<fs::path> roots{};

   for (auto const& package : fs::directory_iterator{paths.community_}) {
      if (
        package.is_directory()
        && !FileSystem::Lower(package.path().filename().string()).starts_with("alexhome-efb-")
      ) {
         roots.push_back(package.path());
      }
   }

   auto scan_roots{roots};

   if (mode == "deep") {
      FileSystem::SafePath(paths.projection_);

      auto status{VfsStatus::Read(paths.projection_)};
      if (!status.available_) {
         throw std::runtime_error(status.message_);
      }

      scan_roots = {paths.projection_};
      roots.insert(roots.begin(), paths.projection_);
   }

   struct Source {
      fs::path root_{};
      fs::path aircraft_{};
   };

   std::vector<Source> sources{};

   for (auto const& root : scan_roots) {
      auto airplanes{root / "SimObjects" / "Airplanes"};
      if (!fs::is_directory(airplanes)) {
         continue;
      }

      for (auto const& aircraft : fs::directory_iterator{airplanes}) {
         if (!aircraft.is_directory()) {
            continue;
         }

         auto container{FileSystem::Lower(aircraft.path().filename().string())};
         if (container == "efbtabletcarrier") {
            continue;
         }

         if (
           !paths.containers_.empty()
           && std::ranges::none_of(paths.containers_, [&](auto const& c) {
                 return FileSystem::Lower(c) == container;
              })
         ) {
            continue;
         }

         sources.push_back({.root_ = root, .aircraft_ = aircraft.path()});
      }
   }

   // Inspect every aircraft's files in parallel on the pool workers.
   bool const deep{mode == "deep"};

   std::vector<Plan>               results(sources.size());
   std::vector<std::exception_ptr> errors(sources.size());
   std::vector<WPromise<void>>     tasks{};

   tasks.reserve(sources.size());

   for (std::size_t index = 0; index < sources.size(); ++index) {
      tasks.emplace_back(WPromise<void>{[&, index]() -> Promise<void> {
         co_await dispatch();

         try {
            auto plan{
              Planner::Inspect(sources[index].root_, sources[index].aircraft_, roots, mode, output)
            };

            Inventory::MarkInstalled(plan, output, deep);
            Inventory::MarkForeign(plan, paths);

            results[index] = std::move(plan);
         } catch (...) {
            errors[index] = std::current_exception();
         }
      }});
   }

   co_await promise::All(std::move(tasks));

   // Every task has completed; surface the first inspection failure deterministically.
   for (auto const& error : errors) {
      if (error) {
         std::rethrow_exception(error);
      }
   }

   std::map<std::string, Plan> plans{};

   for (auto& plan : results) {
      auto id{plan.info_.id_};
      if (plans.contains(id)) {
         plans.at(id).info_.status_ = "foreign";
         plans.at(id).info_.reason_ =
           "Multiple unpacked packages provide the same aircraft container.";
      } else {
         plans.emplace(id, std::move(plan));
      }
   }

   std::set<std::string> selected{selection.begin(), selection.end()};

   if (action == "apply") {
      // Installed patches remain keep/remove candidates even when their source is unavailable.
      Report installed{};
      Inventory::ReadInstalled(installed, output);
      report.entries_.insert(report.entries_.end(), installed.entries_.begin(), installed.entries_.end());

      std::set<std::string> installed_only{};
      for (auto& aircraft : installed.aircraft_) {
         if (!plans.contains(aircraft.id_)) {
            auto id{aircraft.id_};
            Plan plan{};
            plan.info_ = std::move(aircraft);
            plans.emplace(id, std::move(plan));
            installed_only.insert(id);
         }
      }

      Transaction::Apply(plans, selected, output, report);

      for (auto const& id : installed_only) {
         if (!selected.contains(id)) {
            plans.erase(id);
         }
      }
   }

   for (auto& [id, plan] : plans) {
      report.aircraft_.push_back(std::move(plan.info_));
   }

   Inventory::FillCounts(report);
   co_return report;
}

WPromise<std::string>
Fleet::Manage(
  Dispatch           dispatch,
  std::string const& mode,
  std::string const& action,
  std::string const& selectionJson
) {
   return MakePromise(ManageJsonTask, std::move(dispatch), mode, action, selectionJson);
}

Promise<std::string>
Fleet::ManageJsonTask(
  Dispatch    dispatch,
  std::string mode,
  std::string action,
  std::string selectionJson
) {
   auto value{boost::json::parse(selectionJson)};

   if (!value.is_array()) {
      throw std::runtime_error("Aircraft selection must be a JSON array.");
   }

   std::vector<std::string> selection{};

   for (auto const& item : value.as_array()) {
      if (!item.is_string()) {
         throw std::runtime_error("Aircraft ids must be strings.");
      }

      selection.emplace_back(item.as_string());
   }

   co_return js::Stringify(co_await MakePromise(
     ManageTask, std::move(dispatch), Fleet::FindPaths(), mode, action, selection
   ));
}
}  // namespace tablet
