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

#include "Server.h"

#include "Resources.h"
#include "main.h"
#include "Registry/Registry.h"
#include "Window/template/Window.h"

#include <windows/Lock.h>
#include <json/json.h>
#include <libloaderapi.h>
#include <promise/promise.h>
#include <shellapi.h>
#include <synchapi.h>
#include <webview/webview.h>

#include <ShObjIdl_core.h>
#include <WinUser.h>
#include <dwmapi.h>
#include <errhandlingapi.h>
#include <intsafe.h>
#include <minwindef.h>
#include <windef.h>
#include <winnt.h>
#include <winreg.h>
#include <winuser.h>

#include <chrono>
#include <mutex>
#include <shared_mutex>
#include <string_view>
#include <thread>
#include <tuple>
#include <utility>

ServerState
Server::GetState(Server::Lock) const {
   if (switching_) {
      return "switching";
   } else if (runing_) {
      return "running";
   } else if (GetPort() == 0) {
      return "invalid_port";
   } else {
      return "stopped";
   }
}

uint16_t
Server::GetPort() const {
   auto& registry = registry::Get();
   return *registry.alx_home_->settings_->server_port_;
}

void
Server::SetServerPort(uint16_t port) {
   registry::Get().alx_home_->settings_->server_port_ = port;

   std::shared_lock lock{mutex_};
   Notify(GetState(lock), lock);
}

void
Server::FlushState() {
   std::shared_lock lock{mutex_};
   Notify(GetState(lock), lock);
}

void
Server::RejectAll() {
   resolvers_.RejectAll();
}

void
Server::Notify(ServerState state, Server::Lock) {
   Resolvers::Vector resolvers{};
   std::swap(resolvers_, resolvers);

   for (auto const& [resolve, _] : resolvers) {
      resolve(std::move(state));
   }
}

Server::Server()
   : thread_{[this]() {
      while (Main::Running()) {
         std::unique_lock lock{mutex_};
         cv_.wait(lock);

         if (!Main::Running()) {
            break;
         }

         auto const port = GetPort();

         if (port == 0 && !runing_) {
            Notify("invalid_port", lock);
            continue;
         }

         switching_ = true;
         Notify("switching", lock);

         lock.unlock();
         std::this_thread::sleep_for(std::chrono::seconds{2});
         lock.lock();

         runing_    = !runing_;
         switching_ = false;

         Notify(GetState(lock), lock);
      }
   }} {}