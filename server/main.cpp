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
#include "Utils/LaunchMode.h"
#include "utils/Scoped.h"
#include "windows/Process.h"

#include <fcntl.h>
#include <fileapi.h>
#include <stdio.h>
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
#include <exception>
#include <filesystem>
#include <format>
#include <iostream>
#include <memory>
#include <string_view>
#include <tuple>
#include <io.h>

enum class Uninstall {
   NONE,
   STEP1,
   STEP2,
};

auto
ParseArgs(std::string_view cmd) {
   bool      minimized{false};
   Uninstall uninstall{Uninstall::NONE};
   bool      configure{false};
   bool      open_web{false};
   bool      open_efb{false};

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
         uninstall = Uninstall::STEP1;
      } else if (value == "--uninstall2") {
         uninstall = Uninstall::STEP2;
      } else if (value == "--configure") {
         configure = true;
      } else if (value == "--open-efb") {
         open_efb = true;
      } else if (value == "--open-web") {
         open_web = true;
      }
   }

   if (!minimized && !configure && !open_web) {
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

   auto const [minimized, uninstall, configure, open_web, open_efb] = ParseArgs(lpCmdLine);

   if (uninstall == Uninstall::STEP1) {

      if (auto const result = MessageBox(
            nullptr,
            "MSFS2024 VFRNav' Server is about to be uninstalled.\nDo you wish to proceed?",
            "MSFS2024 VFRNav' Server uninstaller",
            MB_ICONERROR | MB_OKCANCEL
          );
          result != IDOK) {
         return EXIT_FAILURE;
      }

      auto const uninstaller =
        std::filesystem::temp_directory_path() / "msfs2024-vfrnav_uninstaller.exe";
      auto const path = win32::GetExecutablePath();

      if (!((!std::filesystem::exists(uninstaller) || std::filesystem::remove(uninstaller))
            && std::filesystem::copy_file(path, uninstaller))) {
         MessageBox(
           nullptr,
           ("Couldn't create \"" + uninstaller.string() + "\" file").c_str(),
           "MSFS2024 VFRNav' Server uninstaller",
           MB_OK | MB_ICONERROR
         );
      }

      try {
         win32::NewProcess(uninstaller.string(), "--uninstall2");
      } catch (std::exception const& e) {
         MessageBox(nullptr, e.what(), "MSFS2024 VFRNav' Server uninstaller", MB_OK | MB_ICONERROR);
         return EXIT_FAILURE;
      }
      return EXIT_SUCCESS;
   } else if (uninstall == Uninstall::STEP2) {
      ScopeExit _{[&]() constexpr {
         win32::NewProcess(
           R"(C:\Windows\System32\cmd.exe)",
           std::format("/c ping localhost -n 3 > nul & del {} & pause", win32::GetExecutablePath()),
           {},
           false,
           true
         );
      }};

      auto lock = win32::CreateLock("MSFS_VFR_NAV_SERVER");
      while (!lock) {
         auto const result = MessageBox(
           nullptr,
           "Please close all MSFS2024 VFRNav' Server instances",
           "MSFS2024 VFRNav' Server uninstaller",
           MB_ICONERROR | MB_OKCANCEL
         );

         if (result != IDOK) {
            return EXIT_FAILURE;
         }

         lock = win32::CreateLock("MSFS_VFR_NAV_SERVER");
      }

      auto& registry = registry::Get();
      auto& settings = registry.alx_home_->settings_;

      auto const destination = *settings->destination_;
      auto const addon       = *settings->addon_;

      if (auto const error = launch_mode::Never(); error.size()) {
         std::string error_str{};
         for (auto const& value : error) {
            error_str += value + " ";
         }
         MessageBox(
           nullptr, error_str.c_str(), "MSFS2024 VFRNav' Server uninstaller", MB_OK | MB_ICONWARNING
         );
      }
      registry.Clear();

      auto const shortcutPath =
        GetAppData() + R"(\Microsoft\Windows\Start Menu\Programs\MSFS2024 VFRNav' Server.lnk)";
      if (std::filesystem::exists(shortcutPath) && !std::filesystem::remove(shortcutPath)) {
         MessageBox(
           nullptr,
           ("Couldn't remove shortcut " + shortcutPath).c_str(),
           "MSFS2024 VFRNav' Server uninstaller",
           MB_OK | MB_ICONWARNING
         );
      }

      if (std::filesystem::exists(destination) && !std::filesystem::remove_all(destination)) {
         MessageBox(
           nullptr,
           ("Couldn't clean " + destination).c_str(),
           "MSFS2024 VFRNav' Server uninstaller",
           MB_OK | MB_ICONWARNING
         );
      }

      if (std::filesystem::exists(addon) && !std::filesystem::remove_all(addon)) {
         MessageBox(
           nullptr,
           ("Couldn't clean " + addon).c_str(),
           "MSFS2024 VFRNav' Server uninstaller",
           MB_OK | MB_ICONWARNING
         );
      }

      MessageBox(
        nullptr,
        "MSFS2024 VFRNav' Server is uninstalled !",
        "MSFS2024 VFRNav' Server uninstaller",
        MB_OK | MB_ICONINFORMATION
      );

      return EXIT_SUCCESS;
   }

   auto const lock = win32::CreateLock("MSFS_VFR_NAV_SERVER");
   if (!lock) {
      if (auto window = FindWindow("system_tray", "MSFS2024 VFRNav' Server"); window) {
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
         MessageBox(nullptr, "Fatal error !", "MSFS2024 VFRNav' Server", MB_OK | MB_ICONERROR);
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