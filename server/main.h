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

#include <utils/MessageQueue.h>
#include <memory>
#include <promise/promise.h>
#include <unordered_map>
#include <utility>
#include <webview/webview.h>
#include <windows/Env.h>
#include <windows/SystemTray.h>
#include <wrl/client.h>

namespace beast = boost::beast;
namespace http  = beast::http;
namespace asio  = boost::asio;
using tcp       = asio::ip::tcp;

class Main
   : public win32::SystemTray
   , public MessageQueue {
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

   template <class FUN>
   auto PoolDispatch(FUN&& func) {
      if constexpr (promise::IS_FUNCTION<FUN>) {
         if constexpr (std::is_same_v<void, promise::return_t<FUN>>) {
            return PoolDispatchImp(std::forward<FUN>(func));
         } else {
            return PoolDispatchImp(std::forward<FUN>(func));
         }
      } else {
         return PoolDispatch(std::function{std::forward<FUN>(func)});
      }
   }

   auto Pool(std::optional<Poll::time_point> until = std::nullopt) const {
      return poll_.dispatch_(until);
   }
   auto Pool(Poll::duration delay) const { return poll_.dispatch_(delay); }

   WPromise<std::string> PostHttpRequest(
     std::string const&                                                    host,
     std::string const&                                                    port,
     std::string const&                                                    target,
     std::optional<std::function<void(http::request<http::string_body>&)>> build_request =
       std::nullopt,
     http::verb verb = http::verb::get
   );

   template <class T>
      requires(!std::is_void_v<T> && !promise::IS_WPROMISE<T>)
   [[nodiscard]] constexpr WPromise<T> SimConnect(std::function<T(smc::api::SimConnect&)>&& callback
   ) {
      return sim_connect_(std::move(callback));
   }
   template <class T>
      requires(promise::IS_WPROMISE<T>)
   [[nodiscard]] constexpr T SimConnect(std::function<T(smc::api::SimConnect&)>&& callback) {
      using Return                    = promise::return_t<T>;
      auto [promise, resolve, reject] = promise::Create<Return>();
      if (!sim_connect_([resolve, reject, callback = std::move(callback)](
                          smc::api::SimConnect& simConnect
                        ) constexpr {
             if constexpr (std::is_void_v<Return>) {
                callback(simConnect)
                  .Then([resolve = std::move(resolve)]() constexpr { (*resolve)(); })
                  .Catch([reject = std::move(reject)](std::exception const& e) constexpr {
                     (*reject)(e);
                  })
                  .Detach();
             } else {
                callback(simConnect)
                  .Then([resolve = std::move(resolve)](Return const& assigned) constexpr {
                     (*resolve)(assigned);
                  })
                  .Catch([reject = std::move(reject)](std::exception const& e) constexpr {
                     (*reject)(e);
                  })
                  .Detach();
             }
          })) {
         MakeReject<std::runtime_error>(*reject, "SimConnect is stopped");
      }

      return promise;
   }

   template <class T>
      requires(std::is_void_v<T>)
   [[nodiscard]] constexpr bool SimConnect(std::function<T(smc::api::SimConnect&)>&& callback) {
      return sim_connect_(std::move(callback));
   }

   template <class FUN>
   [[nodiscard]] constexpr auto SimConnect(FUN&& callback) {
      return SimConnect(std::function{std::forward<FUN>(callback)});
   }

   [[nodiscard]] constexpr auto& SimConnect() { return sim_connect_; }

   [[nodiscard]] bool ATC(std::function<void(atc::Handler&)>&& callback) {
      return atc_handler_(std::move(callback));
   }

   bool Terminated() const noexcept { return terminated_; }

private:
   Poll<50>     poll_{"Poll"};
   std::jthread mouse_watcher_;
   LRESULT      OnTrayNotification(WPARAM wParam, LPARAM lParam) override;
   LRESULT      OnMessageImpl(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) override;

   std::atomic<bool> terminated_{false};

   bool PoolDispatchImp(std::function<void()>);

   template <class RETURN>
   auto PoolDispatchImp(std::function<void(Resolve<RETURN> const&, Reject const&)>&& func) {
      return MakePromise(
        [this, func = std::move(func)](
          Resolve<std::string> const& resolve, Reject const& reject
        ) -> Promise<std::string, true> {
           if (!poll_.Dispatch([resolve = resolve.shared_from_this(),
                                reject  = reject.shared_from_this(),
                                func    = std::move(func)]() {
                  try {
                     (func)(*resolve, *reject);
                  } catch (...) {
                     (*reject)(std::current_exception());
                  }
               })) {
              MakeReject<std::runtime_error>(reject, "App is stopping");
           }

           co_return;
        }
      );
   }

   // Must be before windows to resolve every promises
   ::SimConnect    sim_connect_{*this};
   Server          server_{*this};
   ia::Handler     ia_handler_{*this};
   atc::ATCHandler atc_handler_{*this};

   Window<WIN::TASKBAR>         taskbar_{*this, [this]() { taskbar_.OnTerminate(); }};
   Window<WIN::TASKBAR_TOOLTIP> taskbar_tooltip_{*this, [this]() {
                                                    taskbar_tooltip_.OnTerminate();
                                                 }};
   Window<WIN::MAIN>            settings_{*this, [this]() { settings_.OnTerminate(); }};

   std::unordered_map<std::size_t, std::unique_ptr<Window<WIN::EFB>>> efbs_{};
};