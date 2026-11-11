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

#include "../Tablet/VfsWatcher.h"

#include <windows.h>
#include <chrono>
#include <filesystem>
#include <future>
#include <iostream>

namespace fs = std::filesystem;
using namespace std::chrono_literals;

int
main() {
   auto root =
     fs::temp_directory_path() / ("vfrnav-vfs-watch-" + std::to_string(GetCurrentProcessId()));
   try {
      if (fs::exists(root)) {
         throw std::runtime_error("Test directory already exists.");
      }
      fs::create_directory(root);
      struct Cleanup {
         fs::path root_;
         ~Cleanup() {
            std::error_code error;
            fs::remove_all(root_, error);
         }
      } cleanup{root};
      auto projection = root / "VFSProjection";
      auto initial    = tablet::VfsStatus::Read(projection);
      if (initial.available_ || initial.message_.empty()) {
         throw std::runtime_error("Missing projection must explain why scanning is blocked.");
      }
      tablet::VfsWatcher watcher{projection};
      auto               next = [&watcher](tablet::VfsStatus const& previous) {
         auto result = std::make_shared<std::promise<tablet::VfsStatus>>();
         auto future = result->get_future();
         watcher.Watch(previous, [result](auto const& status) { result->set_value(status); });
         return future;
      };
      auto enabled_future = next(initial);
      auto airplanes      = projection / "SimObjects" / "Airplanes";
      fs::create_directories(airplanes);
      if (tablet::VfsStatus::Read(projection).available_) {
         throw std::runtime_error("Empty projection must not enable scanning.");
      }
      // The empty-tree error is itself a state change; subscribe again after it.
      if (enabled_future.wait_for(4s) != std::future_status::ready) {
         throw std::runtime_error("Watcher missed projection creation.");
      }
      auto empty = enabled_future.get();
      if (empty.available_) {
         throw std::runtime_error("Empty projection enabled scanning.");
      }
      auto populated_future = next(empty);
      fs::create_directory(airplanes / "Aircraft");
      if (
        populated_future.wait_for(4s) != std::future_status::ready
        || !populated_future.get().available_
      ) {
         throw std::runtime_error("Populated projection did not enable scanning.");
      }
      auto disabled_future = next({.available_ = true, .message_ = ""});
      fs::remove_all(projection);
      if (
        disabled_future.wait_for(4s) != std::future_status::ready
        || disabled_future.get().available_
      ) {
         throw std::runtime_error("Removed projection did not disable scanning.");
      }
      auto immediate_future = next({.available_ = true, .message_ = ""});
      if (
        immediate_future.wait_for(0s) != std::future_status::ready
        || immediate_future.get().available_
      ) {
         throw std::runtime_error(
           "Watch must return current state when the caller missed an event."
         );
      }

      auto stopped_result{std::make_shared<std::promise<tablet::VfsStatus>>()};
      auto stopped_future{stopped_result->get_future()};

      {
         tablet::VfsWatcher stopping_watcher{projection};
         stopping_watcher.Watch(
           tablet::VfsStatus::Read(projection),
           [stopped_result](tablet::VfsStatus const& status) { stopped_result->set_value(status); }
         );
      }

      if (stopped_future.wait_for(0s) != std::future_status::ready) {
         throw std::runtime_error("Watcher destruction must complete pending requests.");
      }

      auto const stopped{stopped_future.get()};

      if (stopped.available_ || stopped.message_ != "VFS monitoring stopped.") {
         throw std::runtime_error("Watcher destruction must report a stopped monitor.");
      }

      std::cout
        << "Missing/empty/ready/removed VFS states, native notifications, and shutdown passed.\n";
      return 0;
   } catch (std::exception const& error) {
      std::cerr << error.what() << '\n';
      return 1;
   }
}
