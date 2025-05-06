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

using namespace boost::beast;

Server::WebWebSocket::WebWebSocket(WebSocket&& socket)
   : server_(socket.server_)
   , ws_(std::move(socket.ws_))
   , buffer_(std::move(socket.buffer_))
   , peer_(std::move(socket.peer_)) {
   socket.moved_ = true;
}

Server::WebWebSocket::~WebWebSocket() {
   std::cout << "Session " << peer_ << " closed" << std::endl;
}

void
Server::WebWebSocket::Start() {
   net::dispatch(ws_.get_executor(), bind_front_handler(&WebWebSocket::Run, shared_from_this()));
}

void
Server::WebWebSocket::Run() {
   if (!server_.want_run_) {
      return;
   }

   Read();
}

void
Server::WebWebSocket::Read() {
   if (server_.want_run_) {
      ws_.async_read(buffer_, bind_front_handler(&WebWebSocket::OnRead, shared_from_this()));
   }
}

void
Server::WebWebSocket::OnRead(error_code ec, size_t n) {
   if (ec) {
      if (ec == websocket::error::closed) {
         return;
      }

      std::cerr << "Read error: " << ec.message() << std::endl;
      return;
   }

   auto        it = buffers_begin(buffer_.data());
   std::string data{it, it + n};
   buffer_.consume(n);

   auto message = js::Parse<ws::Message>(data);
   // if (std::holds_alternative<ws::msg::HelloWorld>(message)) {
   //    auto const& hello_world = std::get<ws::msg::HelloWorld>(message);

   //    std::cout << std::string_view(hello_world.proto_) << " " << std::boolalpha
   //              << hello_world.header_ << std::endl;
   // } else {
   //    return;
   // }

   // response_ = js::Stringify(ws::msg::Coucou{.value_ = "coucou"});

   ws_.text(true);
   ws_.async_write(
     net::buffer(response_), bind_front_handler(&WebWebSocket::OnWrite, shared_from_this())
   );
}

void
Server::WebWebSocket::OnWrite(error_code ec, size_t) {
   if (!ec) {
      Read();
   }
}
