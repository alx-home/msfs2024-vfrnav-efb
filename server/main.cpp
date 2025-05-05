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

#include "main.h"

#include "Resources.h"

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

#include <iostream>
#include <memory>
#include <string_view>
#include <tuple>

auto
ParseArgs(std::string_view cmd) {
   bool minimized{false};
   bool uninstall{false};
   bool configure{false};

   auto constexpr split = [](std::string_view cmd) constexpr -> std::string_view {
      auto const pos = cmd.find_first_of(' ');

      if (pos == std::string::npos) {
         return cmd;
      }
      return {cmd.begin(), cmd.begin() + pos};
   };

   auto constexpr next = [](std::string_view cmd) constexpr -> std::string_view {
      auto const pos = cmd.find_first_of(' ');

      if (pos == std::string::npos) {
         return {cmd.end(), cmd.end()};
      }
      return {cmd.begin() + pos + 1, cmd.end()};
   };

   for (std::string_view value = split(cmd); cmd.size(); cmd = next(cmd), value = split(cmd)) {
      if (value == "--minimized") {
         minimized = true;
      } else if (value == "--uninstall") {
         uninstall = true;
      } else if (value == "--configure") {
         configure = true;
      }
   }

   return std::make_tuple(minimized, uninstall, configure);
}

#ifdef _WIN32
int WINAPI
WinMain(HINSTANCE /*hInst*/, HINSTANCE /*hPrevInst*/, LPSTR lpCmdLine, int /*nCmdShow*/) {
#else
int
main() {
#endif

   auto const [minimized, _, configure] = ParseArgs(lpCmdLine);

   auto const lock = win32::CreateLock("MSFS_VFR_NAV_SERVER");
   if (lock.result_ == ERROR_ALREADY_EXISTS) {
      MessageBox(nullptr, "VFRNav Server is already runnning !", "Error", MB_OK | MB_ICONERROR);
      return EXIT_FAILURE;
   }

#ifdef PROMISE_MEMCHECK
   auto const _{promise::Memcheck()};
#endif

   try {
#ifndef NDEBUG
      if (AttachConsole(ATTACH_PARENT_PROCESS) || AllocConsole()) {
         FILE* old = nullptr;
         freopen_s(&old, "CONOUT$", "w", stdout);
         freopen_s(&old, "CONOUT$", "w", stderr);
      }
#endif  // DEBUG

      auto const main = Main::Get();
      main->Run(minimized, configure);
   } catch (const webview::Exception& e) {
      std::cerr << e.what() << '\n';
      return 1;
   }

   return 0;
}