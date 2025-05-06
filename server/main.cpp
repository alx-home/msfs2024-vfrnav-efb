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
#include <winerror.h>
#include <winnt.h>
#include <winreg.h>
#include <winuser.h>

#include <cstdlib>
#include <iostream>
#include <memory>
#include <string_view>
#include <tuple>

auto
ParseArgs(std::string_view cmd) {
   bool minimized{false};
   bool uninstall{false};
   bool configure{false};
   bool open_web{false};
   bool open_efb{false};

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
      } else if (value == "--open-efb") {
         open_efb = true;
      } else if (value == "--open-web") {
         open_web = true;
      }
   }

   if (!minimized && !uninstall && !configure && !open_web) {
      open_efb = true;
   }
   return std::make_tuple(minimized, uninstall, configure, open_web, open_efb);
}

#ifdef _WIN32
int WINAPI
WinMain(HINSTANCE /*hInst*/, HINSTANCE /*hPrevInst*/, LPSTR lpCmdLine, int /*nCmdShow*/) {
#else
int
main() {
#endif
   if (auto const hr = CoInitializeEx(NULL, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE);
       !SUCCEEDED(hr)) {
      std::cerr << "Coinitialized failed (" << hr << ")" << std::endl;
   }

   auto const [minimized, _, configure, open_web, open_efb] = ParseArgs(lpCmdLine);

   auto const lock = win32::CreateLock("MSFS_VFR_NAV_SERVER");
   if (lock.result_ == ERROR_ALREADY_EXISTS) {
      if (auto window = FindWindow("system_tray", "MSFS VFRNav server"); window) {
         if (configure) {
            SendMessageA(window, WM_OPEN_SETTINGS, 0ul, 0ul);
         }
         if (open_web) {
            SendMessageA(window, WM_OPEN_WEB, 0ul, 0ul);
         }
         if (open_efb) {
            SendMessageA(window, WM_OPEN_EFB, 0ul, 0ul);
         }
         return EXIT_SUCCESS;
      } else {
         MessageBox(nullptr, "VFRNav Server is already runnning !", "Error", MB_OK | MB_ICONERROR);
         return EXIT_FAILURE;
      }
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
      main->Run(minimized, configure, open_efb, open_web);
   } catch (const webview::Exception& e) {
      std::cerr << e.what() << '\n';
      return 1;
   }

   return 0;
}