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

template <WIN WINDOW>
Promise<>
Window<WINDOW>::ShowSettings() {
   co_return Main::Get()->OpenSettings();
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
      Main::Get()->SetServerPort(*port);
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
   auto main = Main::Get();
   co_return main->WatchServerState(resolve, reject);
}

template <WIN WINDOW>
Promise<ServerState>
Window<WINDOW>::GetServerState() {
   auto main = Main::Get();
   co_return main->GetServerState();
}

template <WIN WINDOW>
Promise<>
Window<WINDOW>::SwitchServer() {
   auto main = Main::Get();
   co_return main->SwitchServer();
}