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

#include "Base64Utils.h"
#include "Messages/Messages.h"
#include "../Server.h"

#include <window/FileDialog.h>
#include <boost/beast/websocket/error.hpp>
#include <json/json.h>

#include <processthreadsapi.h>
#include <filesystem>
#include <ranges>
#include <variant>

using namespace boost::beast;

Server::EFBWebSocket::EFBWebSocket(WebSocket&& socket)
   : server_(socket.server_)
   , ws_(std::move(socket.ws_))
   , buffer_(std::move(socket.buffer_))
   , peer_(std::move(socket.peer_)) {
   socket.moved_ = true;
}

Server::EFBWebSocket::~EFBWebSocket() {
   std::cout << "Session " << peer_ << " closed" << std::endl;
}

void
Server::EFBWebSocket::Subscribe(std::size_t id) {
   auto const response =
     js::Stringify(ws::Proxy{.id_ = id, .content_ = ws::msg::HelloWorld{.type_ = "EFB"}});

   ws_.text(true);
   ws_.write(net::buffer(response));
}

void
Server::EFBWebSocket::Unsubscribe(std::size_t id) {
   auto const response =
     js::Stringify(ws::Proxy{.id_ = id, .content_ = ws::msg::ByeBye{.type_ = "EFB"}});

   ws_.text(true);
   ws_.write(net::buffer(response));
}

void
Server::EFBWebSocket::VDispatchMessage(std::size_t id, ws::Message message) {
   if (std::holds_alternative<ws::msg::GetSettings>(message)
       || std::holds_alternative<ws::msg::Settings>(message)) {
      // todo
   } else {
      auto const message_str = js::Stringify(ws::Proxy{.id_ = id, .content_ = std::move(message)});

      ws_.text(true);
      ws_.write(net::buffer(message_str));
   }
}

void
Server::EFBWebSocket::Start() {
   if (!server_.want_run_) {
      return;
   }

   server_.Dispatch([this]() constexpr {
      auto const response =
        js::Stringify(ws::Proxy{.id_ = 1, .content_ = ws::msg::HelloWorld{.type_ = "EFB"}});

      ws_.text(true);
      ws_.write(net::buffer(response));
   });

   for (auto const& [id, handler] : server_.subscribers_) {
      server_.Dispatch([this, id]() constexpr {
         auto const response =
           js::Stringify(ws::Proxy{.id_ = id, .content_ = ws::msg::HelloWorld{.type_ = "EFB"}});

         ws_.text(true);
         ws_.write(net::buffer(response));
      });

      server_.Dispatch([this, id]() constexpr {
         auto const response =
           js::Stringify(ws::Proxy{.id_ = id, .content_ = ws::msg::GetRecords{}});

         ws_.text(true);
         ws_.write(net::buffer(response));
      });

      if (handler.lat_ > -500) {
         server_.Dispatch([this, id, lat = handler.lat_, lon = handler.lon_]() constexpr {
            auto const response = js::Stringify(
              ws::Proxy{.id_ = id, .content_ = ws::msg::GetFacilities{.lat_ = lat, .lon_ = lon}}
            );

            ws_.text(true);
            ws_.write(net::buffer(response));
         });
      }
   }

   Read();
}

void
Server::EFBWebSocket::Read() {
   if (server_.want_run_) {
      ws_.async_read(buffer_, bind_front_handler(&EFBWebSocket::OnRead, shared_from_this()));
   }
}

void
Server::EFBWebSocket::OnRead(error_code ec, size_t n) {
   if (ec) {
      if (ec == websocket::error::closed) {
         server_.efb_socket_ = nullptr;
         return;
      }

      std::cerr << "Read error: " << ec.message() << std::endl;
      server_.efb_socket_ = nullptr;
      return;
   }

   auto        it = buffers_begin(buffer_.data());
   std::string data{it, it + n};
   buffer_.consume(n);

   try {
      auto message = js::Parse<ws::Proxy>(data);

      if (std::holds_alternative<ws::msg::FileExists>(message.content_)) {
         auto const& msg = std::get<ws::msg::FileExists>(message.content_);
         VDispatchMessage(
           message.id_,
           ws::msg::FileExistsResponse{
             .id_ = msg.id_, .result_ = std::filesystem::is_regular_file(msg.path_)
           }
         );
      } else if (std::holds_alternative<ws::msg::OpenFile>(message.content_)) {
         auto const& msg = std::get<ws::msg::OpenFile>(message.content_);

         dialog::OpenFile(msg.path_, {{.name_ = "Pdf File", .value_ = {"*.pdf"}}})
           .Then(
             [this, id = message.id_, req_id = msg.id_](std::string const& path) -> Promise<void> {
                co_return VDispatchMessage(
                  id, ws::msg::OpenFileResponse{.id_ = req_id, .path_ = path}
                );
             }
           )
           .Detach();  // @todo do not detach
      } else if (std::holds_alternative<ws::msg::GetFile>(message.content_)) {
         auto const& msg = std::get<ws::msg::GetFile>(message.content_);

         if (auto const data = Base64Open(msg.path_); data.empty()) {
            VDispatchMessage(message.id_, ws::msg::GetFileResponse{.id_ = msg.id_, .data_ = ""});
         } else {
            VDispatchMessage(message.id_, ws::msg::GetFileResponse{.id_ = msg.id_, .data_ = data});
         }
      } else {
         if (auto const subscriber = server_.subscribers_.find(message.id_);
             subscriber != server_.subscribers_.end()) {
            subscriber->second(std::move(message.content_));
         }
      }
   } catch (std::runtime_error e) {
      std::cerr << e.what() << std::endl;
   }

   Read();
}

void
Server::EFBWebSocket::OnWrite(error_code ec, size_t) {
   if (!ec) {
      Read();
   }
}
