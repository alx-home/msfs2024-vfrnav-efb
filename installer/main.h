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

#include <windows/Env.h>

#include <webview/webview.h>
#include <wrl/client.h>
#include <condition_variable>
#include <functional>
#include <string>
#include <string_view>

class Main {
public:
   Main();

private:
#ifndef WATCH_MODE
   void InstallResourceHandler();
#endif
   void InstallBindings();

   Promise<>            Abort();
   Promise<bool>        Exists(std::string path);
   Promise<bool>        ParentExists(std::string path);
   Promise<>            Log(std::string value);
   Promise<std::string> OpenFile(std::string defaultPath);
   Promise<std::string> OpenFolder(std::string defaultPath);
   Promise<std::string> FindCommunity();
   Promise<std::string> DefaultInstallPath();

   Promise<> Validate(
     js::Enum<"Startup", "Login", "Never"> startupOption,
     std::string                           communityPath,
     std::string                           installPath
   );

   void Warning(std::string_view message);
   void Error(std::string_view message);
   void Fatal(std::string_view message);
   void Info(std::string_view message);

private:
   struct InstallSucess {
      using Resolvers = std::
        pair<std::reference_wrapper<Resolve<bool> const>, std::reference_wrapper<Reject const>>;

      Promise<> promise_;
      Resolvers resolvers_;
   };

   std::unique_ptr<InstallSucess> install_success_{};
   std::mutex                     install_success_mutex_;
   std::condition_variable        install_success_cv_;

   std::string const APP_DATA      = GetAppData();
   std::string const USER_DATA_DIR = APP_DATA + "\\MSFS VFRNav Server";

   webview::webview webview_;

   template <class RETURN, class... ARGS>
   void Bind(std::string_view name, RETURN (Main::*member_ptr)(ARGS...));
};