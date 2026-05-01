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

#include "ATC/ATCHandler.h"
#include "ATC/IAHandler.h"
#include "Server/Server.h"
#include "Server/WebSockets/Messages/Messages.h"
#include "SimConnect/SimConnect.h"
#include "Window/template/Window.h"
#include "promise/CVPromise.h"

#include <utils/MessageQueue.h>
#include <memory>
#include <promise/promise.h>
#include <promise/Pool.h>
#include <optional>
#include <unordered_map>
#include <webview/webview.h>
#include <windows/Env.h>
#include <windows/SystemTray.h>
#include <wrl/client.h>

namespace beast = boost::beast;
namespace http  = beast::http;
namespace asio  = boost::asio;
using tcp       = asio::ip::tcp;

using MainPool = promise::Pool<50>;

class Main
   : public win32::SystemTray
   , public MainPool {
public:
   Main(bool minimized, bool configure, bool open_efb, bool open_web);
   ~Main() override;

public:
   ServerState GetServerState() const;
   void        WatchServerState(promise::Resolve<ServerState> const&, promise::Reject const&);
   void        FlushServerState();
   void        SwitchServer();

   void SetMessageHandler(std::size_t id, Server::MessageHandler&&);
   void UnsetMessageHandler(std::size_t id);
   void VDispatchMessage(std::size_t id, ws::Message&&);

   void OpenSettings();
   void CloseSettings();

   void OpenTaskbar() const;
   void CloseTaskbar() const;

   void OpenToolTip() const;
   void CloseToolTip() const;

   void OpenEFB();
   void OpenWebEFB();

   void SetServerPort(uint16_t port);

   void Terminate();

   void SendServerPortToEFB(uint32_t port);

   WPromise<void> Wait(Pool::duration timeout) const;
   WPromise<void> Wait(Pool::time_point until) const;

   WPromise<std::string> PostHttpRequest(
     std::string const&                                                    host,
     std::string const&                                                    port,
     std::string const&                                                    target,
     std::optional<std::function<void(http::request<http::string_body>&)>> build_request =
       std::nullopt,
     http::verb verb = http::verb::get
   );

   [[nodiscard]] constexpr auto& SimConnect() { return sim_connect_; }
   [[nodiscard]] constexpr auto& ATC() { return atc_handler_; }

   bool Terminated() const noexcept { return terminated_; }

   CVPromise const& TerminatePromise() const noexcept { return terminate_promise_; }
   WPromise<>       WaitTerminate() const noexcept { return *terminate_promise_; }

private:
   std::jthread mouse_watcher_;
   LRESULT      OnTrayNotification(WPARAM wParam, LPARAM lParam) override;
   LRESULT      OnMessageImpl(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) override;

   CVPromise         terminate_promise_{};
   std::atomic<bool> terminated_{false};

   // Must be before windows to resolve every promises
   ::SimConnect sim_connect_{*this};
   Server       server_{*this};
   ia::Handler  ia_handler_{*this};
   atc::Handler atc_handler_{*this};

   Window<WIN::TASKBAR>         taskbar_{*this, [this]() { taskbar_.OnTerminate(); }};
   Window<WIN::TASKBAR_TOOLTIP> taskbar_tooltip_{*this, [this]() {
                                                    taskbar_tooltip_.OnTerminate();
                                                 }};
   Window<WIN::MAIN>            settings_{*this, [this]() { settings_.OnTerminate(); }};

   std::unordered_map<std::size_t, std::unique_ptr<Window<WIN::EFB>>> efbs_{};
};