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

#include "Resources.h"

#include "SimConnect/Facilities.h"
#include "promise/promise.h"

#include <json/json.h>
#include <windows/Env.h>

#include <webview/webview.h>
#include <wrl/client.h>
#include <condition_variable>
#include <string>
#include <string_view>

using ServerState = js::Enum<"switching", "running", "stopped", "invalid_port">;

struct WinRefCount {
   static std::atomic<std::size_t> s__refcount;
};

enum class WIN { MAIN, TASKBAR, TASKBAR_TOOLTIP, EFB };
template <WIN WINDOW>
class Window : private WinRefCount {
public:
   Window(std::function<void()> on_terminate = []() constexpr {});
   ~Window();

   static void DecRefcount();
   void        Hide() const;
   void        Show() const;
   void        Restore() const;

   void            SetPos(int x, int y);
   int             Width() const;
   int             Height() const;
   webview::Size   GetSize() const;
   webview::Pos    GetPos() const;
   webview::Bounds GetBounds() const;

   void Dispatch(std::function<void()>) const;

private:
#ifndef WATCH_MODE
   void InstallResourceHandler();
#endif
   void InstallBindings();

   Promise<> Abort();

   Promise<bool> Exists(std::string path);
   Promise<bool> ParentExists(std::string path);

   Promise<> Log(std::string value);

   Promise<std::string> OpenFile(std::string defaultPath);
   Promise<std::string> OpenFolder(std::string defaultPath);

   Promise<> ShowToolTip();
   Promise<> HideToolTip();

   Promise<> OpenEFB();

   Promise<> HideTaskbar();
   Promise<> ShowTaskbar();

   Promise<> ShowSettings();

   Promise<FacilityList, true> GetFacilities(
     Resolve<FacilityList> const& resolve,
     Reject const&                reject,
     double                       lat,
     double                       lon
   );

   Promise<bool>                                  AutostartServer(std::optional<bool> value);
   Promise<uint16_t>                              ServerPort(std::optional<uint16_t> port);
   Promise<js::Enum<"Startup", "Login", "Never">> StartupOption(
     std::optional<js::Enum<"Startup", "Login", "Never">> port
   );

   Promise<ServerState, true>
   WatchServerState(promise::Resolve<ServerState> const&, promise::Reject const&);
   Promise<ServerState> GetServerState();
   Promise<>            SwitchServer();

   void Warning(std::string_view message);
   void Error(std::string_view message);
   void Fatal(std::string_view message);
   void Info(std::string_view message);

   std::string const APP_DATA      = GetAppData();
   std::string const USER_DATA_DIR = APP_DATA + "\\MSFS VFRNav Server";

   std::mutex              mutex_;
   std::condition_variable cv_;

   // Must be before thread to be destroyed by the thread
   std::unique_ptr<webview::webview> webview_{};
   std::jthread                      thread_;

   template <class RETURN, class... ARGS>
   void Bind(std::string_view name, RETURN (Window::*member_ptr)(ARGS...));
};
