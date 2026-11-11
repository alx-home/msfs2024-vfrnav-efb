/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
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

#include "Registry/Registry.h"
#include "Utils/LaunchMode.h"
#include "Window/template/Window.h"

#include "main.h"
#include "Tablet/Fleet.h"
#include <boost/json.hpp>

/** @brief Long-poll VFS availability from the companion settings window.
 *
 * @tparam WINDOW Window type providing the binding.
 *
 * @param resolve Callback receiving the serialized updated state.
 * @param previous JSON-encoded state last observed by the caller.
 *
 * @return Promise for the serialized updated state. */
template <WIN WINDOW>
Promise<std::string, true>
Window<WINDOW>::WatchVfsProjection(
  promise::Resolve<std::string> const& resolve,
  promise::Reject const&,
  std::string previous
) {
   if constexpr (WINDOW != WIN::MAIN) {
      assert(false);
      throw std::runtime_error("VFS monitoring is available only in the companion settings.");
   }

   if (vfs_watcher_stopping_) {
      throw std::runtime_error("VFS monitoring is stopping.");
   }

   if (!vfs_watcher_) {
      vfs_watcher_ = std::make_unique<tablet::VfsWatcher>(tablet::Fleet::FindPaths().projection_);
   }

   tablet::VfsStatus last;
   if (!previous.empty()) {
      auto value = boost::json::parse(previous).as_object();
      last       = {
        .available_ = value.at("available").as_bool(),
        .message_   = std::string{value.at("message").as_string()}
      };
   }

   vfs_watcher_->Watch(
     last, [callback = resolve.shared_from_this()](tablet::VfsStatus const& status) {
        (*callback)(boost::json::serialize(
          boost::json::object{{"available", status.available_}, {"message", status.message_}}
        ));
     }
   );

   co_return;
}

/** @brief Dispatch a fleet operation using the requested mode, action, and JSON selection.
 *
 * @tparam WINDOW Window type providing the binding.
 *
 * @param mode Discovery mode.
 * @param action Fleet operation to perform.
 * @param selectionJson JSON array of selected aircraft IDs.
 *
 * @return Promise for the serialized report. */
template <WIN WINDOW>
Promise<std::string>
Window<WINDOW>::ManageEfbAircraft(std::string mode, std::string action, std::string selectionJson) {
   if constexpr (WINDOW != WIN::MAIN) {
      assert(false);
      throw std::runtime_error("Aircraft management is available only in the companion settings.");
   }

   // Each aircraft's processing is dispatched on the pool workers by the fleet manager.
   co_return co_await tablet::Fleet::Manage(
     static_cast<MainPool const&>(main_), mode, action, selectionJson
   );
}

template <WIN WINDOW>
Promise<>
Window<WINDOW>::ShowSettings() {
   co_return main_.OpenSettings();
}

template <WIN WINDOW>
Promise<bool>
Window<WINDOW>::AutostartServer(std::optional<bool> value) {
   auto& registry = registry::Get();
   if (value) {
      registry.alx_home_->settings_->auto_start_server_ = *value;
      co_return *value;
   }

   co_return *registry.alx_home_->settings_->auto_start_server_;
}

template <WIN WINDOW>
Promise<uint16_t>
Window<WINDOW>::ServerPort(std::optional<uint16_t> port) {
   auto& registry = registry::Get();
   if (port) {
      main_.SetServerPort(*port);
      co_return *port;
   }

   co_return *registry.alx_home_->settings_->server_port_;
}

template <WIN WINDOW>
Promise<js::Enum<"Startup", "Login", "Never">>
Window<WINDOW>::StartupOption(std::optional<js::Enum<"Startup", "Login", "Never">> value) {
   auto& registry = registry::Get();

   if (value) {
      if (*value == "Startup"_sv) {
         if (auto result = launch_mode::Startup(); result.size()) {
            Warning(result);
         }
      } else if (*value == "Login"_sv) {
         if (auto result = launch_mode::Login(); result.size()) {
            Warning(result);
         }
      } else if (*value == "Never"_sv) {
         if (auto result = launch_mode::Never(); result.size()) {
            Warning(result);
         }
      }

      co_return *value;
   }

   co_return js::Enum<"Startup", "Login", "Never">{*registry.alx_home_->settings_->launch_mode_};
}

template <WIN WINDOW>
Promise<ServerState, true>
Window<WINDOW>::WatchServerState(
  promise::Resolve<ServerState> const& resolve,
  promise::Reject const&               reject
) {
   co_return main_.WatchServerState(resolve, reject);
}

template <WIN WINDOW>
Promise<ServerState>
Window<WINDOW>::GetServerState() {
   co_return main_.GetServerState();
}

template <WIN WINDOW>
Promise<>
Window<WINDOW>::SwitchServer() {
   co_return main_.SwitchServer();
}