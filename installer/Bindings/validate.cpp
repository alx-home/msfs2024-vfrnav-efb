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
#include "main.h"
#include "Registry/Install.h"
#include "Registry/Registry.h"
#include "Utils/LaunchMode.h"
#include "promise/impl/Promise.inl"
#include "promise/promise.h"
#include "windows/Env.h"
#include "windows/Process.h"
#include "windows/Registry/impl/Registry.h"
#include "windows/Shortcuts.h"

#include <filesystem>
#include <fstream>
#include <memory>
#include <string>
#include <thread>
#include <json/json.h>
#include <processthreadsapi.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated"
#pragma clang diagnostic ignored "-Wdeprecated-copy-with-user-provided-copy"
#include <boost/iostreams/filtering_streambuf.hpp>
#include <boost/iostreams/copy.hpp>
#include <boost/iostreams/filter/zlib.hpp>
#pragma clang diagnostic pop

Promise<>
Main::Validate(
  js::Enum<"Startup", "Login", "Never"> startupOption,
  std::string                           communityPath,
  std::string                           installPath
) {
   if (std::filesystem::path const path{installPath};
       !path.has_parent_path() || !std::filesystem::exists(path.parent_path())) {
      co_return Fatal("Parent path not found : <br/>\"" + installPath + "\"");
   }

   if (!std::filesystem::exists(communityPath)) {
      co_return Fatal("Path not found : <br/>\"" + communityPath + "\"");
   }

   if (!std::filesystem::create_directory(installPath)) {
      if (!std::filesystem::exists(installPath) || !std::filesystem::is_directory(installPath)) {
         co_return Fatal("Couldn't create directory : <br/>\"" + installPath + "\"");
      }
   }

   {
      std::ofstream file(installPath + "\\vfrnav-server.exe", std::ios::ate | std::ios::binary);

      using namespace boost::iostreams;

      filtering_istreambuf in;
      in.push(zlib_decompressor());
      in.push(array_source{reinterpret_cast<char const*>(SERVER_BIN.data()), SERVER_BIN.size()});

      copy(in, file);
   }

   if (auto result = win32::CreateLink(
         installPath + "\\vfrnav-server.exe",
         GetAppData() + R"(\Microsoft\Windows\Start Menu\Programs\MSFS VFRNav' Server.lnk)",
         "MSFS VFRNav' Server"
       );
       !SUCCEEDED(result)) {
      Warning(
        "Couldn't create shortcut (" + std::to_string(result) + "): <br />"
        + R"(C:\ProgramData\Microsoft\Windows\Start Menu\Programs\)"_str + "MSFS VFRNav' Server"
      );
   }

   auto const fsPath =
     std::filesystem::path(communityPath).parent_path().parent_path().parent_path();
   std::filesystem::path const exePath = fsPath.string() + "\\exe.xml";

   auto& registry = registry::Get();
   auto& settings = registry.alx_home_->settings_;

   if (settings->launch_mode_) {
      if (auto result = launch_mode::Never(); result.size()) {
         Warning(result);
      }
   }

   registry.Clear();

   auto& uninstall = registry.current_version_->uninstall_;

   uninstall->icon_      = installPath + "\\vfrnav-server.exe";
   uninstall->name_      = "MSFS VFRNav' Server";
   uninstall->version_   = "1.0.0";
   uninstall->publisher_ = "alx-home";
   uninstall->uninstall_ = installPath + "\\vfrnav-server.exe --uninstall";

   settings->community_         = communityPath;
   settings->destination_       = installPath;
   settings->auto_start_server_ = true;
   settings->server_port_       = 0ui16;

   if (startupOption == "Startup"_sv) {
      if (auto result = launch_mode::Startup(); result.size()) {
         Warning(result);
      }
   } else if (startupOption == "Login"_sv) {
      if (auto result = launch_mode::Login(); result.size()) {
         Warning(result);
      }
   }

   if (co_await webview_.Call<bool>("start_program")) {
      webview_.Dispatch([this, installPath]() constexpr {
         win32::NewProcess(installPath + "\\vfrnav-server.exe", "--configure");
         Abort()();
      });
   } else {
      webview_.Dispatch([this]() constexpr { Abort()(); });
   }

   co_return;
}