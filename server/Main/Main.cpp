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

#include "Exceptions.h"
#include "Resources.h"
#include "Server/WebSockets/Messages/Messages.h"
#include "Window/template/Window.h"
#include "windows/Process.h"
#include "windows/SystemTray.h"

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
#include <memory>
#include <shared_mutex>
#include <stdexcept>
#include <stop_token>
#include <string_view>
#include <thread>
#include <atltypes.h>

using namespace std::chrono_literals;

AppStopping::AppStopping()
   : std::runtime_error("App is stopping !") {}

static uint32_t const MF_MOUSE_EVENT = ::RegisterWindowMessage("MainFrameMouseEvent");
Main::Main(bool minimized, bool configure, bool open_efb, bool open_web)
   : win32::SystemTray("MSFS2024 VFRNav' Server", "MSFS2024 VFRNav' Server")
   , promise::Pool<50>{"Main Pool"}
   , mouse_watcher_([this](std::stop_token stop_token) {
      bool was_l_down{false};
      bool was_r_down{false};

      while (!stop_token.stop_requested()) {
         auto const l_down = GetAsyncKeyState(VK_LBUTTON) & 0x8000;
         auto const r_down = GetAsyncKeyState(VK_RBUTTON) & 0x8000;

         if (!l_down && was_l_down) {
            PostMessage(GetHandle(), MF_MOUSE_EVENT, WM_LBUTTONUP, 0);
         }

         if (!r_down && was_r_down) {
            PostMessage(GetHandle(), MF_MOUSE_EVENT, WM_RBUTTONUP, 0);
         }

         was_l_down = l_down;
         was_r_down = r_down;

         std::this_thread::sleep_for(50ms);
      }
   }) {
   SetStandardIcon(IDI_ICON1);
   ShowIcon();

   {
      std::string exe_path = win32::GetExecutablePath();

      win32::JumpList jump_list{};
      jump_list.AddTask("Open In App", exe_path, "msfs2024-vfrnav_server.exe --open-efb");
      jump_list.AddTask("Open In WebBrowser", exe_path, "msfs2024-vfrnav_server.exe --open-web");
      jump_list.AddTask("Open Settings", exe_path, "msfs2024-vfrnav_server.exe --configure");
   }

   if (minimized) {
      CloseToolTip();
   }

   if (configure) {
      OpenSettings();
   }

   if (open_efb) {
      OpenEFB();
   }

   if (open_web) {
      OpenWebEFB();
      OpenToolTip();
   }

   MSG msg;
   while (GetMessageW(&msg, nullptr, 0, 0) > 0) {
      TranslateMessage(&msg);
      DispatchMessageW(&msg);
   }
}

Main::~Main() {
   mouse_watcher_.request_stop();
   server_.Stop();
}

WPromise<void>
Main::Wait(Pool::duration timeout) const {
   return promise::Race(*terminate_promise_, Pool::Dispatch(timeout));
}

WPromise<void>
Main::Wait(Pool::time_point until) const {
   return promise::Race(*terminate_promise_, Pool::Dispatch(until));
}

LRESULT
Main::OnTrayNotification(WPARAM wParam, LPARAM lParam) {
   // Return quickly if its not for this tray icon
   if (wParam != GetUid()) {
      return 0L;
   }

   if (LOWORD(lParam) == WM_RBUTTONUP) {
      CPoint pos;
      GetCursorPos(&pos);

      taskbar_.SetPos(pos.x, pos.y - taskbar_.Height());
      taskbar_.Show();
   } else if (LOWORD(lParam) == WM_LBUTTONUP) {
      OpenEFB();
   }

   return 1;
}

LRESULT
Main::OnMessageImpl(HWND handle, UINT msg, WPARAM wParam, LPARAM lParam) {
   CPoint cpos;
   GetCursorPos(&cpos);
   if (msg == MF_MOUSE_EVENT && (wParam == WM_LBUTTONUP || wParam == WM_RBUTTONUP)) {
      webview::Pos const pos{.x_ = cpos.x, .y_ = cpos.y};

      if (auto const bounds = taskbar_.GetBounds(); !bounds.Contains(pos)) {
         CloseTaskbar();
      }
   }

   if (msg == WM_OPEN_SETTINGS) {
      OpenSettings();
   } else if (msg == WM_OPEN_EFB) {
      OpenEFB();
   } else if (msg == WM_OPEN_WEB) {
      OpenWebEFB();
   }

   return win32::SystemTray::OnMessageImpl(handle, msg, wParam, lParam);
}

void
Main::OpenSettings() {
   settings_.Show();
}

void
Main::CloseSettings() {
   settings_.Hide();
}

void
Main::SetMessageHandler(std::size_t id, Server::MessageHandler&& message_handler) {
   server_.SetMessageHandler(id, std::move(message_handler));
}

void
Main::UnsetMessageHandler(std::size_t id) {
   server_.UnsetMessageHandler(id);
}

void
Main::VDispatchMessage(std::size_t id, ws::Message&& message) {
   server_.VDispatchMessage(id, std::move(message));
}

void
Main::OpenTaskbar() const {
   taskbar_.Show();
}

void
Main::CloseTaskbar() const {
   taskbar_.Hide();
}

void
Main::OpenToolTip() const {
   taskbar_tooltip_.Show();
}

void
Main::CloseToolTip() const {
   taskbar_tooltip_.Hide();
   // Keeps ToolTip from beeing shown again
   ++WinRefCount::s__refcount;
}

void
Main::OpenEFB() {
   static std::atomic<std::size_t> s__open_efb_uid = 0;
   std::size_t                     uid             = ++s__open_efb_uid;

   SystemTray::Dispatch([this, uid]() {
      auto erased = std::make_shared<bool>(false);

      auto window = std::make_unique<Window<WIN::EFB>>(*this, [this, uid, erased]() {
         this->SystemTray::Dispatch([this, uid, erased = std::move(erased)]() {
            if (auto elem = efbs_.find(uid); elem != efbs_.end()) {
               elem->second->OnTerminate();
               efbs_.erase(elem);
            } else {
               assert(false);
            }
            *erased = true;
         });
      });

      window->Show();

      if (!*erased) {
         efbs_.emplace(uid, std::move(window));
      }
   });
}

void
Main::OpenWebEFB() {
   server_.Start();
   ShellExecute(
     nullptr,
     nullptr,
     ("http://localhost:"
      + std::to_string(
#ifdef WATCH_MODE
        4003ui16
#else
        server_.GetPort()
#endif
      ))
       .data(),
     nullptr,
     nullptr,
     SW_SHOW
   );
}

void
Main::SetServerPort(uint16_t port) {
   return server_.SetServerPort(port);
}

void
Main::SendServerPortToEFB(uint32_t port) {
   sim_connect_.SetServerPort(port).Detach();
}

void
Main::Terminate() {
   if (terminated_.exchange(true)) {
      return;
   }

   terminate_promise_.Reject<AppStopping>();
   server_.RejectAll();
   SystemTray::Dispatch([]() { PostQuitMessage(0); });
}

void
Main::WatchServerState(
  promise::Resolve<ServerState> const& resolve,
  promise::Reject const&               reject
) {
   server_.WatchServerState(resolve, reject);
}

void
Main::FlushServerState() {
   server_.FlushState();
}

ServerState
Main::GetServerState() const {
   std::shared_lock lock{server_.mutex_};
   return server_.GetState(lock);
}

void
Main::SwitchServer() {
   server_.Switch();
}
