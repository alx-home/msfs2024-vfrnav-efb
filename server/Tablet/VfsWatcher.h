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
#include <functional>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

namespace tablet {
struct VfsStatus {
   bool        available_{};
   std::string message_{};

   /**
    * @brief Inspect whether a VFS projection exposes at least one aircraft.
    *
    * @param projection Root of the simulator's projected filesystem.
    *
    * @return Availability and an actionable diagnostic when projection cannot be read.
    */
   static VfsStatus Read(std::filesystem::path const& projection);

   /** @brief Compare both availability and the diagnostic message. */
   bool operator==(VfsStatus const&) const = default;
};

/** @brief Publish projection changes to pending long-poll requests. */
class VfsWatcher {
public:
   using Callback = std::function<void(VfsStatus const&)>;

   /** @brief Read the initial projection state and start native change monitoring.
    *
    * @param projection Root of the simulator's projected filesystem. */
   explicit VfsWatcher(std::filesystem::path projection);

   /** @brief Stop monitoring, join the worker, and complete pending requests. */
   ~VfsWatcher();

   /**
    * @brief Deliver a changed state immediately or queue a request until the next change.
    *
    * @param previous Last state observed by this caller.
    * @param callback Receiver invoked outside the watcher lock.
    */
   void Watch(VfsStatus const& previous, Callback callback);

private:
   /** @brief Watch ancestor-directory notifications and periodically recheck virtual mounts.
    *
    * @param stop Token requesting the monitoring thread to stop. */
   void Run(std::stop_token stop);

   /** @brief Update the cached state and notify pending callers outside the lock.
    *
    * @param status Newly observed projection state. */
   void Publish(VfsStatus status);

   std::filesystem::path projection_{};
   std::mutex            mutex_{};
   VfsStatus             status_{};
   std::vector<Callback> callbacks_{};
   std::jthread          thread_{};
};
}  // namespace tablet
