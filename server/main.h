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

#include "ATC/IAHandler.h"
#include "Server/Server.h"
#include "Server/WebSockets/Messages/Messages.h"
#include "SimConnect/SimConnect.h"
#include "Window/template/Window.h"

#include <memory>
#include <promise/promise.h>
#include <unordered_map>
#include <utility>
#include <webview/webview.h>
#include <windows/Env.h>
#include <windows/SystemTray.h>
#include <wrl/client.h>

class Main : public win32::SystemTray {
private:
   Main();
   ~Main() override;

public:
   static std::shared_ptr<Main> Get();

   ServerState GetServerState() const;
   void        WatchServerState(promise::Resolve<ServerState> const&, promise::Reject const&);
   void        FlushServerState();
   void        SwitchServer();

   void OpenSettings();

   void SetMessageHandler(std::size_t id, Server::MessageHandler&&);
   void UnsetMessageHandler(std::size_t id);
   void VDispatchMessage(std::size_t id, ws::Message&&);

   void OpenTaskbar() const;
   void CloseTaskbar() const;

   void OpenToolTip() const;
   void CloseToolTip() const;

   void OpenEFB();
   void OpenWebEFB();

   void Run(bool minimized, bool configure, bool open_efb, bool open_web);
   void SetServerPort(uint16_t port);

   static void Terminate();
   static bool Running();

   void SendServerPortToEFB(uint32_t port);

   template <class FUN>
   auto Dispatch(FUN&& func) {
      if constexpr (promise::IS_FUNCTION<FUN>) {
         if constexpr (std::is_same_v<void, promise::return_t<FUN>>) {
            return DispatchImp(std::forward<FUN>(func));
         } else {
            return DispatchImp(std::forward<FUN>(func));
         }
      } else {
         return Dispatch(std::function{std::forward<FUN>(func)});
      }
   }

   Promise<std::string, true> PostHttpRequest(
     std::string const&                host,
     std::string const&                port,
     std::string const&                target,
     std::optional<std::string> const& body         = std::nullopt,
     std::optional<std::string> const& content_type = std::nullopt,
     std::optional<std::string> const& api_key      = std::nullopt
   );

private:
   Poll<50>     poll_{"Poll"};
   std::jthread mouse_watcher_;
   LRESULT      OnTrayNotification(WPARAM wParam, LPARAM lParam) override;
   LRESULT      OnMessageImpl(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) override;

   template <WIN WINDOW>
   void OnTerminate();

   bool DispatchImp(std::function<void()>);

   template <class RETURN>
   auto DispatchImp(std::function<void(Resolve<RETURN> const&, Reject const&)>&& func) {
      return MakePromise(
        [this, func = std::move(func)](
          Resolve<std::string> const& resolve, Reject const& reject
        ) -> Promise<std::string, true> {
           poll_.Dispatch([resolve = resolve.shared_from_this(),
                           reject  = reject.shared_from_this(),
                           func    = std::move(func)]() {
              try {
                 (func)(*resolve, *reject);
              } catch (...) {
                 (*reject)(std::current_exception());
              }
           });

           co_return;
        }
      );
   }

   // Delay window creation to ensure Main::Get() is ready
   using TaskbarPtr = std::unique_ptr<Window<WIN::TASKBAR>>;
   TaskbarPtr taskbar_{};
   using TooltipPtr = std::unique_ptr<Window<WIN::TASKBAR_TOOLTIP>>;
   TooltipPtr taskbar_tooltip_{};
   using SettingsPtr = std::unique_ptr<Window<WIN::MAIN>>;
   SettingsPtr settings_{};

   using EFBPtr = std::unique_ptr<Window<WIN::EFB>>;
   std::unordered_map<std::size_t, EFBPtr> efbs_{};

   std::unique_ptr<SimConnect> sim_connect_{};
   // Must be afters windows to resolve every promises
   std::unique_ptr<Server> server_{};
   ia::Handler             ia_handler_{*this};

   static std::atomic<bool>   s__running;
   static std::weak_ptr<Main> s__instance;
   static bool                s__expired;
};