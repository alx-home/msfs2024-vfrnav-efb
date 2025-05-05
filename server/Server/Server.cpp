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

#include "Server.h"

#include "Resources.h"
#include "main.h"
#include "Registry/Registry.h"
#include "Server/WebSockets/Messages/Messages.h"
#include "Window/template/Window.h"

#include <utils/Scoped.h>
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

#include <memory>
#include <mutex>
#include <shared_mutex>
#include <string_view>
#include <thread>
#include <tuple>
#include <utility>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wlanguage-extension-token"
#pragma clang diagnostic ignored "-Wgnu-anonymous-struct"
#pragma clang diagnostic ignored "-Wnested-anon-types"
#pragma clang diagnostic ignored "-Wunknown-warning-option"
#pragma clang diagnostic ignored "-Wdeprecated-missing-comma-variadic-parameter"
#include <boost/url.hpp>
#pragma clang diagnostic pop

ServerState
Server::GetState(Server::Lock) const {
   if (runing_) {
      return "running";
   } else if (GetPort() == 0) {
      return "invalid_port";
   } else {
      return "stopped";
   }
}

uint16_t
Server::GetPort() const {
   auto& registry = registry::Get();
   return *registry.alx_home_->settings_->server_port_;
}

void
Server::SetServerPort(uint16_t port) {
   registry::Get().alx_home_->settings_->server_port_ = port;

   std::shared_lock lock{mutex_};
   Notify(GetState(lock), lock);
}

void
Server::FlushState() {
   std::shared_lock lock{mutex_};
   Notify(GetState(lock), lock);
}

void
Server::RejectAll() {
   resolvers_.RejectAll();
}

void
Server::Notify(ServerState state, Server::Lock) {
   Resolvers::Vector resolvers{};
   std::swap(resolvers_, resolvers);

   for (auto const& [resolve, _] : resolvers) {
      resolve(std::move(state));
   }
}

void
Server::Switch() {
   std::unique_lock lock{mutex_};
   want_run_ = !want_run_;
   if (tcp_) {
      tcp_->ioc_.stop();
   }
   cv_.notify_all();
}

void
Server::Stop() {
   std::unique_lock lock{mutex_};
   want_run_ = false;
   if (tcp_) {
      tcp_->ioc_.stop();
   }
   cv_.notify_all();
}

void
Server::Start() {
   std::unique_lock lock{mutex_};
   if (!tcp_) {
      want_run_ = true;
      cv_.notify_all();
   }
}

Server::Tcp::Tcp(tcp::endpoint endpoint)
   : acceptor_(ioc_, std::move(endpoint)) {}

Server::Server()
   : MessageQueue("Server Message queue")
   , thread_{[this]() {
      SetThreadDescription(GetCurrentThread(), L"Server");
      ScopeExit _{[this]() constexpr { FlushState(); }};

      std::unique_lock lock{mutex_};

      bool first_run = true;
      while (Main::Running()) {
         if (first_run) {
            first_run = false;
         } else {
            cv_.wait(lock);
         }

         if (!Main::Running()) {
            break;
         }

         if (want_run_) {
            auto const port = GetPort();

            if (port == 0) {
               Notify("invalid_port", lock);
               continue;
            }

            tcp_ = std::make_unique<Tcp>(tcp::endpoint{tcp::v4(), port});

            ScopeExit _{[this]() constexpr { tcp_ = nullptr; }};
            if (!tcp_->acceptor_.is_open()) {
               Notify("invalid_port", lock);
            } else {
               tcp_->acceptor_.async_accept(boost::beast::bind_front_handler(&Server::Accept, this)
               );

               runing_ = true;
               Notify("running", lock);

               lock.unlock();
               tcp_->ioc_.run();
               lock.lock();
            }
            efb_socket_ = nullptr;
         }

         runing_   = false;
         want_run_ = false;
         Notify(GetState(lock), lock);
      }
   }} {}

using namespace boost::beast;
using namespace boost::urls;

void
Server::Accept(const boost_error& error, tcp::socket socket) {
   try {
      if (error) {
         std::cerr << "Accept error: " << error.message() << std::endl;
      } else {
         flat_buffer buffer;

         // Read an HTTP request
         http::request<http::string_body> req;
         http::read(socket, buffer, req);

         if (websocket::is_upgrade(req)) {
            std::make_shared<WebSocket>(*this, std::move(req), std::move(socket))->Start();
         } else {
            // Prepare the response
            http::response<http::string_body> res;

            // For this example, only GET request
            if (req.method() == http::verb::get) {
               url_view   parsed_url(req.target());
               auto const params = parsed_url.params();

               auto const path = parsed_url.path();

               if (path.starts_with('/')) {

                  if (path == "/" && params.contains("alive")) {
                     res.result(http::status::ok);
                     res.set(http::field::access_control_allow_origin, "*");
                     res.prepare_payload();
                  }
#ifndef WATCH_MODE
                  else {
                     auto const& resources = EFB_RESOURCES;

                     auto const resource_name = [&]() -> std::string {
                        if (path == "/") {
                           return "index.html";
                        }

                        return path.substr(1);
                     }();
                     auto const resource = resources.find(resource_name);
                     if (resource != resources.end()) {
                        std::string data{};
                        data.resize(resource->second.size());
                        std::ranges::copy(
                          resource->second, reinterpret_cast<std::byte*>(data.data())
                        );

                        auto const ext = path.substr(path.find_last_of('.') + 1);

                        res.result(http::status::ok);
                        res.set(http::field::access_control_allow_origin, "*");
                        res.set(
                          http::field::content_type, ext == "js" ? "text/javascript" : "text/html"
                        );
                        res.body() = std::move(data);
                        res.prepare_payload();

                     } else {
                        res.result(http::status::not_found);
                        res.set(http::field::content_type, "text/plain");
                        res.body() = "Not Found";
                        res.prepare_payload();
                     }
                  }
#endif
               } else {
                  res.result(http::status::not_found);
                  res.set(http::field::content_type, "text/plain");
                  res.body() = "Not Found";
                  res.prepare_payload();
               }
            } else {
               res.result(http::status::method_not_allowed);
               res.set(http::field::content_type, "text/plain");
               res.body() = "Method Not Allowed";
               res.prepare_payload();
            }

            // Write the response
            http::write(socket, res);
         }
      }
   } catch (const std::exception& e) {
      std::cerr << "Error in session: " << e.what() << '\n';
   }

   if (want_run_) {
      tcp_->acceptor_.async_accept(bind_front_handler(&Server::Accept, this));
   }
}

bool
Server::VDispatchMessage(std::size_t id, ws::Message message) {
   auto const efb_socket = efb_socket_;
   if (efb_socket) {
      return Dispatch([efb_socket, id, message = std::move(message)]() {
         efb_socket->VDispatchMessage(id, std::move(message));
      });
   } else if (std::holds_alternative<ws::msg::GetFacilities>(message)) {
      Dispatch([this, id, message = std::move(message)]() constexpr {
         if (auto const it = subscribers_.find(id); it != subscribers_.end()) {
            // Cache latitude and longitude to send GetFacilities later when the server becomes
            // available
            auto const& facilities = std::get<ws::msg::GetFacilities>(message);
            it->second.lat_        = facilities.lat_;
            it->second.lon_        = facilities.lon_;
         }
      });
   }

   return false;
}

void
Server::Subscribe(std::size_t id, std::function<void(ws::Message)> message_handler) {
   Dispatch([this, id, message_handler = std::move(message_handler)]() constexpr {
      auto const _ = subscribers_.emplace(id, std::move(message_handler));
      assert(_.second);

      auto const efb_socket = efb_socket_;
      if (efb_socket) {
         efb_socket->Subscribe(id);
      }
   });
}

void
Server::Unsubscribe(std::size_t id) {
   Dispatch([this, id]() constexpr {
      auto const _ = subscribers_.erase(id);
      assert(_ == 1);

      auto const efb_socket = efb_socket_;
      if (efb_socket) {
         efb_socket->Unsubscribe(id);
      }
   });
}
