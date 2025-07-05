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

#include "Resources.h"
#include "windows/Process.h"

#include <utils/Scoped.h>
#include <windows/Lock.h>
#include <Windows.h>
#include <synchapi.h>
#include <WinBase.h>
#include <cstdlib>
#include <filesystem>
#include <fstream>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated"
#pragma clang diagnostic ignored "-Wdeprecated-copy-with-user-provided-copy"
#include <boost/iostreams/filtering_streambuf.hpp>
#include <boost/iostreams/copy.hpp>
#include <boost/iostreams/filter/zlib.hpp>
#pragma clang diagnostic pop

#ifdef _WIN32
int WINAPI
WinMain(HINSTANCE /*hInst*/, HINSTANCE /*hPrevInst*/, LPSTR lpCmdLine, int /*nCmdShow*/) {
#else
int
main() {
#endif
#ifndef NDEBUG
   if (AttachConsole(ATTACH_PARENT_PROCESS) || AllocConsole()) {
      FILE* old = nullptr;
      freopen_s(&old, "CONOUT$", "w", stdout);
      freopen_s(&old, "CONOUT$", "w", stderr);
   }
#endif  // DEBUG

   auto const lock = win32::CreateLock("MSFS_VFR_NAV_INSTALLER");
   if (!lock) {
      MessageBox(
        nullptr, "Installer is already runnning !", "MSFS2024 VFRNav' Server", MB_OK | MB_ICONERROR
      );
      return EXIT_FAILURE;
   }

   auto const    temp = std::filesystem::temp_directory_path() / "msfs2024-vfrnav_installer.exe";
   std::ofstream file(temp, std::ios::ate | std::ios::binary);
   ScopeExit     _{[&]() constexpr { std::filesystem::remove(temp); }};

   if (!file.is_open()) {
      MessageBox(
        nullptr, "Installer is already runnning !", "MSFS2024 VFRNav' Server", MB_OK | MB_ICONERROR
      );
      return EXIT_FAILURE;
   }

   using namespace boost::iostreams;

   filtering_istreambuf in;
   in.push(zlib_decompressor());
   in.push(array_source{reinterpret_cast<char const*>(INSTALLER_BIN.data()), INSTALLER_BIN.size()});

   copy(in, file);

   auto [process, _] = win32::NewProcess(temp.string(), lpCmdLine);
   WaitForSingleObject(process, INFINITE);

   return 0;
}