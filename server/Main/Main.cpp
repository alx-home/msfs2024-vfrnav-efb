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
#include "SimConnect/SimConnect.h"
#include "Window/template/Window.h"
#include "webview/detail/backends/win32_edge.h"
#include "windows/Process.h"

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
#include <string_view>
#include <thread>
#include <atltypes.h>

std::weak_ptr<Main> Main::s__instance{};
bool                Main::s__expired{false};

AppStopping::AppStopping()
   : std::runtime_error("App is stopping !") {}

static uint32_t const MF_MOUSE_EVENT = ::RegisterWindowMessage("MainFrameMouseEvent");
Main::Main()
   : win32::SystemTray("MSFS VFRNav server", "MSFS VFRNav server")
   , mouse_watcher_([this]() constexpr {
      bool was_l_down{false};
      bool was_r_down{false};

      while (s__running) {
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

         std::this_thread::sleep_for(std::chrono::milliseconds(50));
      }
   }) {
   SetStandardIcon(IDI_ICON1);
   ShowIcon();
}

Main::~Main() {
   s__running = false;
   server_->cv_.notify_all();
}

LRESULT
Main::OnTrayNotification(WPARAM wParam, LPARAM lParam) {
   // Return quickly if its not for this tray icon
   if (wParam != GetUid()) {
      return 0L;
   }

   if (taskbar_) {
      if (LOWORD(lParam) == WM_RBUTTONUP) {
         CPoint pos;
         GetCursorPos(&pos);

         taskbar_->SetPos(pos.x, pos.y - taskbar_->Height());
         taskbar_->Show();
      } else if (LOWORD(lParam) == WM_LBUTTONUP) {
         OpenEFB();
      }
   }

   return 1;
}

LRESULT
Main::OnMessageImpl(HWND handle, UINT msg, WPARAM wParam, LPARAM lParam) {
   if (taskbar_) {
      CPoint cpos;
      GetCursorPos(&cpos);
      if (msg == MF_MOUSE_EVENT && (wParam == WM_LBUTTONUP || wParam == WM_RBUTTONUP)) {
         webview::Pos const pos{.x_ = cpos.x, .y_ = cpos.y};

         if (auto const bounds = taskbar_->GetBounds(); !bounds.Contains(pos)) {
            CloseTaskbar();
         }
      }
   }

   if (msg == WM_OPEN_SETTINGS) {
      OpenSettings();
   } else if (msg == WM_OPEN_EFB) {
      OpenEFB();
   }

   return win32::SystemTray::OnMessageImpl(handle, msg, wParam, lParam);
}

template <WIN WINDOW>
void
Main::OnTerminate() {
   Window<WINDOW>::DecRefcount();

   if (Running()) {
      FlushServerState();
   }
}

void
Main::OpenSettings() {
   Dispatch([this]() {
      if (!settings_) {
         settings_ = std::make_unique<Window<WIN::MAIN>>([this]() constexpr {
            this->OnTerminate<WIN::MAIN>();
            this->Dispatch([this]() { settings_ = nullptr; });
         });
      } else {
         settings_->Show();
         settings_->Restore();
      }
   });
}

void
Main::GetFacilities(
  Resolve<FacilityList> const& resolve,
  Reject const&                reject,
  double                       lat,
  double                       lon
) {
   sim_connect_->Post<sim_connect::Message::SIMCONNECT_GET_FACILITIES_LIST>(
     {.lat_ = lat, .lon_ = lon, .resolve_ = resolve, .reject_ = reject}
   );
}

void
Main::OpenTaskbar() const {
   assert(taskbar_);
   taskbar_->Show();
}

void
Main::CloseTaskbar() const {
   assert(taskbar_);
   taskbar_->Hide();
}

void
Main::OpenToolTip() const {
   assert(taskbar_tooltip_);
   taskbar_tooltip_->Show();
}

void
Main::CloseToolTip() const {
   assert(taskbar_tooltip_);
   taskbar_tooltip_->Hide();
   // Keeps ToolTip from beeing shown again
   ++WinRefCount::s__refcount;
}

void
Main::OpenEFB() {
   static std::atomic<std::size_t> s__uid = 0;
   std::size_t                     uid    = ++s__uid;

   Dispatch([this, uid]() {
      auto erased = std::make_shared<bool>(false);

      auto window = std::make_unique<Window<WIN::EFB>>([this, uid, erased]() {
         this->OnTerminate<WIN::EFB>();

         this->Dispatch([this, uid, erased = std::move(erased)]() {
            if (auto elem = efbs_.find(uid); elem != efbs_.end()) {
               efbs_.erase(elem);
            }
            *erased = true;
         });
      });

      if (!*erased) {
         efbs_.emplace(uid, std::move(window));
      }
   });
}

void
Main::Run(bool minimized, bool configure, bool open_efb, bool open_web) {
   {
      std::string exe_path = win32::GetExecutablePath();

      win32::JumpList jump_list{};
      jump_list.AddTask("Open In App", exe_path, "vfrnav-server.exe --open-efb");
      // jump_list.AddTask("Open In WebBrowser", exe_path, "vfrnav-server.exe --open-web"); @todo
      jump_list.AddTask("Open Settings", exe_path, "vfrnav-server.exe --configure");
   }

   server_      = std::make_unique<Server>();
   sim_connect_ = std::make_unique<SimConnect>();

   taskbar_ =
     std::make_unique<Window<WIN::TASKBAR>>([this]() { this->OnTerminate<WIN::TASKBAR>(); });
   taskbar_tooltip_ = std::make_unique<Window<WIN::TASKBAR_TOOLTIP>>([this]() {
      this->OnTerminate<WIN::TASKBAR_TOOLTIP>();
   });

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
      // todo
   }

   if (!minimized && !open_efb && !open_web && !configure) {
      OpenToolTip();
   }

   MSG msg;
   while (GetMessageW(&msg, nullptr, 0, 0) > 0) {
      TranslateMessage(&msg);
      DispatchMessageW(&msg);
   }
}

void
Main::SetServerPort(uint16_t port) {
   return server_->SetServerPort(port);
}

bool
Main::Running() {
   return s__running;
}

void
Main::Terminate() {
   if (!s__running.exchange(false)) {
      throw AppStopping();
   }

   auto main = Get();
   assert(main);

   main->server_->RejectAll();
   main->Dispatch([]() { PostQuitMessage(0); });
}

std::atomic<bool> Main::s__running{false};

std::shared_ptr<Main>
Main::Get() {
   if (s__instance.expired()) {
      if (s__expired) {
         throw std::runtime_error("Use main after free");
      }
      s__expired = true;
      s__running = true;

      struct MainPublic : Main {};
      auto result = std::make_shared<MainPublic>();

      s__instance = result;
      return result;
   }

   return s__instance.lock();
}

void
Main::WatchServerState(
  promise::Resolve<ServerState> const& resolve,
  promise::Reject const&               reject
) {
   if (Running()) {
      assert(server_);
      std::shared_lock lock{server_->mutex_};
      server_->resolvers_.emplace_back(std::cref(resolve), std::cref(reject));
   } else {
      MakeReject<AppStopping>(reject);
   }
}

void
Main::FlushServerState() {
   server_->FlushState();
}

ServerState
Main::GetServerState() const {
   assert(server_);
   std::shared_lock lock{server_->mutex_};
   return server_->GetState(lock);
}

void
Main::SwitchServer() {
   assert(server_);
   server_->cv_.notify_all();
}
