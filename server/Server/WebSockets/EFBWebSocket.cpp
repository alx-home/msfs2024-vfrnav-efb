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

#include "Messages/Messages.h"
#include "../Server.h"

#include <boost/beast/websocket/error.hpp>
#include <json/json.h>

#include <processthreadsapi.h>
#include <stdexcept>
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
   if (server_.subscribers_.contains(id)) {
      if (std::holds_alternative<ws::msg::GetSettings>(message)
          || std::holds_alternative<ws::msg::Settings>(message)) {
         // todo
      } else {
         auto const message_str =
           js::Stringify(ws::Proxy{.id_ = id, .content_ = std::move(message)});

         ws_.text(true);
         ws_.write(net::buffer(message_str));
      }
   } else {
      assert(false);
   }
}

void
Server::EFBWebSocket::Start() {
   if (!server_.want_run_) {
      return;
   }

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

      if (auto const subscriber = server_.subscribers_.find(message.id_);
          subscriber != server_.subscribers_.end()) {
         subscriber->second(std::move(message.content_));
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
