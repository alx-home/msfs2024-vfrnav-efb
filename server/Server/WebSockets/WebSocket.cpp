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

#include <memory>

using namespace boost::beast;

Server::WebSocket::WebSocket(
  Server&                          server,
  http::request<http::string_body> request,
  tcp::socket                      socket
)
   : server_(server)
   , request_(std::move(request))
   , ws_(std::move(socket)) {}

void
Server::WebSocket::Start() {
   net::dispatch(ws_.get_executor(), bind_front_handler(&WebSocket::Run, shared_from_this()));
}

void
Server::WebSocket::Run() {
   if (!server_.want_run_) {
      return;
   }

   ws_.set_option(websocket::stream_base::timeout::suggested(role_type::server));
   ws_.set_option(websocket::stream_base::decorator([](websocket::response_type& res) {
      res.set(
        http::field::server, std::string(BOOST_BEAST_VERSION_STRING) + " websocket-server-async"
      );
   }));

   ws_.async_accept(
     std::move(request_), bind_front_handler(&WebSocket::OnAccept, shared_from_this())
   );
}

Server::WebSocket::~WebSocket() {
   if (!moved_) {
      std::cout << "Session " << peer_ << " closed" << std::endl;
   }
}

void
Server::WebSocket::OnAccept(error_code ec) {
   std::cout << "Accept: " << ec.message() << " for " << peer_ << std::endl;
   if (!ec) {
      Read();
   }
}

void
Server::WebSocket::Read() {
   if (server_.want_run_) {
      ws_.async_read(buffer_, bind_front_handler(&WebSocket::OnRead, shared_from_this()));
   }
}

void
Server::WebSocket::OnRead(error_code ec, size_t n) {
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

   try {
      auto message = js::Parse<ws::Message>(data);

      if (std::holds_alternative<ws::msg::HelloWorld>(message)) {
         server_.Dispatch([self    = shared_from_this(),
                           message = std::move(message)]() mutable constexpr {
            auto const& hello_world = std::get<ws::msg::HelloWorld>(message);

            if (*hello_world.type_ == "EFB") {
               if (!self->server_.efb_socket_) {
                  auto& server = self->server_;
                  server.efb_socket_ =
                    std::make_shared<EFBWebSocket>(std::move(*self.get()), false);
                  self = nullptr;
                  server.efb_socket_->Start();
               }
            } else {
               assert(*hello_world.type_ == "Web");
               auto const socket = self->server_.web_sockets_.emplace_back(
                 std::make_shared<EFBWebSocket>(std::move(*self.get()), true)
               );

               self = nullptr;
               socket->Start();
            }
         });
      } else {
         std::cerr << "Unexpected message for peer " << peer_ << std::endl;
      }
   } catch (std::exception const& e) {
      std::cerr << "Exception occurred for peer " << peer_ << " " << e.what() << std::endl;
   }
}

void
Server::WebSocket::OnWrite(error_code ec, size_t) {
   if (!ec) {
      Read();
   }
}
