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

#include "Transaction.h"
#include "FileSystem.h"
#include "Package.h"
#include <windows.h>
#include <algorithm>
#include <map>
#include <iostream>
#include <random>
#include <set>
#include <stdexcept>
#include <utility>

namespace tablet {
namespace fs = std::filesystem;

StagingDirectory::StagingDirectory(fs::path path)
   : path_{std::move(path)} {}

StagingDirectory::~StagingDirectory() {
   FileSystem::MakeWritableTree(path_);

   std::error_code ec{};

   fs::remove_all(path_, ec);

   if (ec) {
      std::cerr << "Cannot remove managed staging directory: " << path_ << ": " << ec.message()
                << '\n';
   }
}

void
Transaction::Apply(
  std::map<std::string, Plan>& plans,
  std::set<std::string> const& selected,
  fs::path const&              output,
  Report&                      report
) {
   for (auto const& id : selected) {
      auto found{plans.find(id)};
      if (found == plans.end()) {
         throw std::runtime_error("Unknown aircraft selection; scan again before applying.");
      }

      if (
        found->second.info_.status_ == "foreign" || found->second.info_.status_ == "unsupported"
      ) {
         throw std::runtime_error("Cannot patch selected aircraft: " + found->second.info_.reason_);
      }
   }

   std::vector<std::string> install{};
   std::vector<std::string> remove{};

   for (auto const& [id, plan] : plans) {
      if (selected.contains(id) && plan.info_.status_ != "patched") {
         install.push_back(id);
      } else if (
        !selected.contains(id)
        && (plan.info_.status_ == "patched" || plan.info_.status_ == "outdated")
      ) {
         remove.push_back(id);
      }
   }

   if (!install.empty() || !remove.empty()) {
      if (!install.empty()) {
         Package::CompiledRig();
      }

      fs::create_directories(output);
      FileSystem::SafePath(output);

      std::random_device random{};
      auto               suffix{
        FileSystem::Hash(std::to_string(random()) + std::to_string(GetTickCount64())).substr(0, 12)
      };
      auto stage{output / (".efb-stage-" + suffix)};
      if (!fs::create_directory(stage)) {
         throw std::runtime_error("Unable to allocate staging directory.");
      }

      StagingDirectory cleanup{stage};

      for (auto const& id : install) {
         auto& plan{plans.at(id)};
         auto  package{stage / Package::PackageName(plan)};

         for (auto const& [relative, bytes] : plan.files_) {
            FileSystem::Write(package / FileSystem::VirtualPath(relative), bytes);
         }

         Ownership owner{};

         owner.container_ = plan.info_.container_;
         owner.efb_       = plan.info_.efb_;

         for (auto const& [relative, bytes] : Package::CompiledRig(plan.info_.id_)) {
            FileSystem::Write(package / FileSystem::VirtualPath(relative), bytes);
            owner.generator_.push_back({.path_ = relative, .hash_ = FileSystem::Hash(bytes)});
         }

         for (auto const& [key, source] : plan.stock_) {
            owner.stock_.push_back(source);
         }

         Package::WritePackageFiles(package, owner, "Alexhome EFB patch - " + plan.info_.name_);
      }

      auto changing{install};

      changing.insert(changing.end(), remove.begin(), remove.end());

      // Verify every target before renaming any package; rollback the entire apply on failure.
      for (auto const& id : changing) {
         auto target{output / Package::PackageName(plans.at(id))};
         if (fs::exists(target)) {
            Package::VerifyOwned(target, Package::ReadOwner(target));
         }
      }

      std::map<std::string, fs::path> backups{};
      std::vector<fs::path>           committed{};

      try {
         for (auto const& id : changing) {
            auto target{output / Package::PackageName(plans.at(id))};
            if (fs::exists(target)) {
               auto backup{
                 output / (".efb-backup-" + suffix + "-" + std::to_string(backups.size()))
               };

               fs::rename(target, backup);
               backups.emplace(id, backup);
            }

            if (std::ranges::find(install, id) != install.end()) {
               fs::rename(stage / Package::PackageName(plans.at(id)), target);
               committed.push_back(target);
            }
         }
      } catch (...) {
         for (auto const& target : committed) {
            FileSystem::MakeWritableTree(target);

            std::error_code ec{};

            fs::remove_all(target, ec);

            if (ec) {
               std::cerr << "Cannot remove package during rollback: " << target << ": "
                         << ec.message() << '\n';
            }
         }

         for (auto const& [id, backup] : backups) {
            std::error_code ec{};

            fs::rename(backup, output / Package::PackageName(plans.at(id)), ec);

            if (ec) {
               std::cerr << "Cannot restore package during rollback; backup retained at " << backup
                         << ": " << ec.message() << '\n';
            }
         }

         throw;
      }

      for (auto const& [id, backup] : backups) {
         FileSystem::MakeWritableTree(backup);
         fs::remove_all(backup);
      }

      for (auto const& id : install) {
         plans.at(id).info_.status_ = "patched";
      }

      for (auto const& id : remove) {
         plans.at(id).info_.status_ = "available";
      }

      report.generated_        = install.size();
      report.removed_          = remove.size();
      report.restart_required_ = true;
   }
}

}  // namespace tablet
