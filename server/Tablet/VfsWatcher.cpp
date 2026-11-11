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

#include "VfsWatcher.h"

#include <windows.h>
#include <system_error>

namespace tablet {
namespace {

/** @brief Own a Win32 directory-change notification registration. */
class DirectoryNotification {
public:
   /** @brief Register recursive directory-change notifications for an existing directory. */
   explicit DirectoryNotification(std::filesystem::path const& directory)
      : handle_{
          FindFirstChangeNotificationW(directory.c_str(), TRUE, FILE_NOTIFY_CHANGE_DIR_NAME)
        } {
      if (handle_ == INVALID_HANDLE_VALUE) {
         throw std::system_error(
           static_cast<int>(GetLastError()), std::system_category(), "Cannot watch VFS projection"
         );
      }
   }

   /** @brief Release the notification registration. */
   ~DirectoryNotification() { FindCloseChangeNotification(handle_); }

   /** @brief Prevent duplicate ownership of a notification registration. */
   DirectoryNotification(DirectoryNotification const&) = delete;

   /** @brief Prevent replacing ownership of a notification registration. */
   DirectoryNotification& operator=(DirectoryNotification const&) = delete;

   /** @brief Wait briefly for a change and rearm signaled notifications. */
   void Wait() const {
      auto const result{WaitForSingleObject(handle_, 500)};
      if (result == WAIT_FAILED) {
         throw std::system_error(
           static_cast<int>(GetLastError()), std::system_category(), "VFS watcher failed"
         );
      }

      if (result == WAIT_OBJECT_0 && !FindNextChangeNotification(handle_)) {
         throw std::system_error(
           static_cast<int>(GetLastError()), std::system_category(), "Cannot rearm VFS watcher"
         );
      }
   }

private:
   HANDLE handle_{INVALID_HANDLE_VALUE};
};

}  // namespace

VfsStatus
VfsStatus::Read(std::filesystem::path const& projection) {
   std::error_code error{};
   auto const      airplanes{projection / "SimObjects" / "Airplanes"};
   bool const      exists{std::filesystem::is_directory(airplanes, error)};
   if (error && error != std::errc::no_such_file_or_directory) {
      return {.available_ = false, .message_ = "Cannot access VFS projection: " + error.message()};
   }

   if (!exists) {
      return {
        .available_ = false,
        .message_ = "VFS projection is not enabled. Start MSFS, enable Developer Mode, then start "
                    "the VFS Projector."
      };
   }

   std::filesystem::directory_iterator entries{airplanes, error};
   if (error) {
      return {.available_ = false, .message_ = "Cannot read VFS projection: " + error.message()};
   }

   if (entries == std::filesystem::directory_iterator{}) {
      return {
        .available_ = false,
        .message_   = "VFS projection contains no aircraft. Start or refresh the VFS Projector."
      };
   }

   return {.available_ = true, .message_ = ""};
}

VfsWatcher::VfsWatcher(std::filesystem::path projection)
   : projection_{std::move(projection)}
   , status_{VfsStatus::Read(projection_)}
   , thread_{[this](std::stop_token stop) { Run(stop); }} {}

void
VfsWatcher::Run(std::stop_token stop) {
   try {
      auto parent{projection_.parent_path()};

      while (!std::filesystem::is_directory(parent)) {
         auto const next{parent.parent_path()};
         if (next == parent || next.empty()) {
            throw std::runtime_error("Cannot locate a directory to watch for VFS projection.");
         }

         parent = next;
      }

      DirectoryNotification notification{parent};

      while (!stop.stop_requested()) {
         // Projected filesystems may not report every mount/unmount notification.
         notification.Wait();
         Publish(VfsStatus::Read(projection_));
      }
   } catch (std::exception const& error) {
      Publish({.available_ = false, .message_ = error.what()});
   }
}

VfsWatcher::~VfsWatcher() {
   thread_.request_stop();
   thread_.join();
   Publish({.available_ = false, .message_ = "VFS monitoring stopped."});
}

void
VfsWatcher::Watch(VfsStatus const& previous, Callback callback) {
   VfsStatus current{};

   {
      std::scoped_lock lock{mutex_};

      if (previous == status_) {
         callbacks_.push_back(std::move(callback));
         return;
      }

      current = status_;
   }

   callback(current);
}

void
VfsWatcher::Publish(VfsStatus status) {
   std::vector<Callback> callbacks{};

   {
      std::scoped_lock lock{mutex_};

      if (status_ == status) {
         return;
      }

      status_ = status;
      callbacks.swap(callbacks_);
   }

   for (auto const& callback : callbacks) {
      callback(status);
   }
}
}  // namespace tablet
