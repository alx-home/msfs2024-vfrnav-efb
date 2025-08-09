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
#include "Messages/Records.h"
#include "Server/WebSockets/Messages/Facilities.h"
#include "boost/beast/websocket/rfc6455.hpp"

#include <window/FileDialog.h>
#include <boost/beast/websocket/error.hpp>
#include <json/json.h>

#include <processthreadsapi.h>
#include <exception>
#include <filesystem>
#include <mutex>
#include <ranges>
#include <variant>

using namespace boost::beast;

Server::EFBWebSocket::EFBWebSocket(WebSocket&& socket, bool web_browser)
   : web_browser_(web_browser)
   , server_(socket.server_)
   , ws_(std::move(socket.ws_))
   , buffer_(std::move(socket.buffer_))
   , peer_(std::move(socket.peer_)) {
   socket.moved_ = true;
}

Server::EFBWebSocket::~EFBWebSocket() {
   std::cout << "Session " << peer_ << " closed" << std::endl;

   if (web_browser_) {
      server_.Dispatch([&server = server_, id = my_id_]() { server.UnsetMessageHandler(id); });
   } else {
      // EFB MSFS App Closed - Notify server state

      server_.Dispatch([&server = server_, my_id = my_id_]() {
         server.efb_connected_ = false;
         server.UnsetMessageHandler(0);

         for (auto const& [id, handler] : server.message_handlers_) {
            handler(my_id, ws::msg::EFBState{.state_ = false});
         }
      });

      // Wait promises to be done
      std::unique_lock lock{mutex_};
      cv_.wait(lock, [this]() constexpr { return promises_ == 0; });
   }
}

void
Server::EFBWebSocket::VDispatchMessage(std::size_t id, ws::Message&& message) {
   server_.Dispatch([self = shared_from_this(), id, message = std::move(message)]() mutable {
      self->VSendMessage(id, std::move(message));
   });
}

void
Server::EFBWebSocket::VSendMessage(std::size_t id, ws::Message&& message) {
   if (ws_.is_open()) {
      if (std::holds_alternative<ws::msg::GetSettings>(message)
          || std::holds_alternative<ws::msg::Settings>(message)) {
         // @todo
      } else if (std::holds_alternative<ws::msg::GetEFBState>(message)) {
         server_.Dispatch([self = shared_from_this(), id = id]() {
            if (auto const message_handler = self->server_.message_handlers_.find(id);
                message_handler != self->server_.message_handlers_.end()) {
               message_handler->second(
                 1, ws::msg::EFBState{.state_ = self->server_.efb_connected_}
               );
            }
         });
      } else if (std::holds_alternative<ws::msg::GetServerState>(message)) {
         server_.Dispatch([self = shared_from_this(), id = id]() {
            if (auto const message_handler = self->server_.message_handlers_.find(id);
                message_handler != self->server_.message_handlers_.end()) {
               message_handler->second(1, ws::msg::ServerState{.state_ = self->server_.runing_});
            }
         });
      } else {
         auto const message_str =
           js::Stringify(ws::Proxy{.id_ = id, .content_ = std::move(message)});

         ws_.text(true);
         ws_.write(net::buffer(message_str));
      }
   }
}

void
Server::EFBWebSocket::Stop() {
   std::mutex       mutex{};
   std::unique_lock lock{mutex};

   std::condition_variable cv{};
   bool                    closed = false;

   server_.Dispatch([self = shared_from_this(), &cv, &mutex, &closed]() {
      self->ws_.next_layer().cancel();
      self->ws_.close({});

      std::lock_guard lock{mutex};
      closed = true;
      cv.notify_all();
   });

   cv.wait(lock, [&closed]() { return closed; });
}

void
Server::EFBWebSocket::Start() {
   if (!server_.want_run_) {
      return;
   }

   my_id_ = web_browser_ ? std::bit_cast<std::size_t>(this) : 0;

   server_.Dispatch([self = shared_from_this()]() constexpr {
      self->VSendMessage(1, ws::msg::HelloWorld{.type_ = "Server"});

      self->server_.SetMessageHandler(
        self->my_id_,
        {[self = self->weak_from_this()](std::size_t id, ws::Message message) constexpr {
           auto const ptr = self.lock();
           if (ptr) {
              ptr->VDispatchMessage(id, std::move(message));
           }
        }}
      );

      if (self->web_browser_) {
         self->VSendMessage(1, ws::msg::SetId{.id_ = self->my_id_});
      } else {
         // EFB MSFS App
         self->server_.efb_connected_ = true;

         self->VSendMessage(1, ws::msg::GetRecords{});

         for (auto const& [id, handler] : self->server_.message_handlers_) {
            handler(1, ws::msg::EFBState{.state_ = true});

            if (handler.lat_ > -500) {
               self->VSendMessage(
                 id, ws::msg::GetFacilities{.lat_ = handler.lat_, .lon_ = handler.lon_}
               );
            }
         }
      }
   });

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
   if (!server_.want_run_) {
      return;
   }

   if (ec) {
      if (ec != websocket::error::closed) {
         std::cerr << "Read error: " << ec.message() << std::endl;
      }

      server_.Dispatch([self = shared_from_this()]() {
         if (self->web_browser_) {
            for (auto it = self->server_.web_sockets_.begin();
                 it != self->server_.web_sockets_.end();
                 ++it) {
               if (*it == self) {
                  self->server_.web_sockets_.erase(it);
                  return;
               }
            }

            assert(false);
         } else {
            self->server_.efb_socket_ = nullptr;
         }
      });
      return;
   }

   auto        it = buffers_begin(buffer_.data());
   std::string data{it, it + n};
   buffer_.consume(n);

   try {
      auto message = js::Parse<ws::Proxy>(data);

      if (std::holds_alternative<ws::msg::GetEFBState>(message.content_)) {
         assert(message.id_ != 2);
         assert(message.id_ != 1);

         server_.Dispatch([self = shared_from_this(), id = my_id_]() {
            self->VSendMessage(id, ws::msg::EFBState{.state_ = self->server_.efb_connected_});
         });
      } else if (std::holds_alternative<ws::msg::GetServerState>(message.content_)) {
         assert(false);
      } else if (std::holds_alternative<ws::msg::FileExists>(message.content_)) {
         assert(message.id_ == 1);
         auto const& msg = std::get<ws::msg::FileExists>(message.content_);

         VDispatchMessage(
           message.id_,
           ws::msg::FileExistsResponse{
             .id_ = msg.id_, .result_ = std::filesystem::is_regular_file(msg.path_)
           }
         );
      } else if (std::holds_alternative<ws::msg::OpenFile>(message.content_)) {
         assert(message.id_ == 1);
         auto const& msg = std::get<ws::msg::OpenFile>(message.content_);

         ++promises_;
         dialog::OpenFile(msg.path_, {{.name_ = "Pdf File", .value_ = {"*.pdf"}}})
           .Then(
             [self = shared_from_this(), id = message.id_, req_id = msg.id_](std::string const& path
             ) -> Promise<void> {
                self->server_.Dispatch([self = std::move(self), id, req_id, path]() {
                   self->VSendMessage(id, ws::msg::OpenFileResponse{.id_ = req_id, .path_ = path});
                   std::shared_lock lock{self->mutex_};
                   --self->promises_;
                   self->cv_.notify_all();
                });
                co_return;
             }
           )
           .Catch([self = shared_from_this()](std::exception_ptr const& exc) -> Promise<void> {
              std::shared_lock lock{self->mutex_};
              --self->promises_;
              self->cv_.notify_all();
              std::rethrow_exception(exc);
              co_return;
           })
           .Detach();
      } else if (std::holds_alternative<ws::msg::GetFile>(message.content_)) {
         assert(message.id_ == 1);
         auto const& msg = std::get<ws::msg::GetFile>(message.content_);

         if (auto const data = Base64Open(msg.path_); data.empty()) {
            VDispatchMessage(message.id_, ws::msg::GetFileResponse{.id_ = msg.id_, .data_ = ""});
         } else {
            VDispatchMessage(message.id_, ws::msg::GetFileResponse{.id_ = msg.id_, .data_ = data});
         }
      } else {
         assert(message.id_ != 2);

         if (message.id_ == 1) {
            // Broadcast
            server_.Dispatch([&server = server_, my_id = my_id_, message = std::move(message)]() {
               for (auto const message_handler : server.message_handlers_) {
                  if (message_handler.first != my_id) {
                     message_handler.second(my_id, std::move(message.content_));
                  }
               }
            });
         } else {
            server_.Dispatch([&server = server_, my_id = my_id_, message = std::move(message)]() {
               if (auto const message_handler = server.message_handlers_.find(message.id_);
                   message_handler != server.message_handlers_.end()) {
                  message_handler->second(my_id, std::move(message.content_));
               }
            });
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
