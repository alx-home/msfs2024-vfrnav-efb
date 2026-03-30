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
#include "Server/WebSockets/Messages/Fuel.h"

#include <boost/beast/websocket/rfc6455.hpp>

#include <window/FileDialog.h>
#include <boost/beast/websocket/error.hpp>
#include <json/json.h>

#include <processthreadsapi.h>
#include <exception>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <mutex>
#include <ranges>
#include <variant>

using namespace boost::beast;

Server::EFBWebSocket::EFBWebSocket(WebSocket&& socket, bool web_browser)
   : server_(socket.server_)
   , web_browser_(web_browser)
   , buffer_(std::move(socket.buffer_))
   , peer_(std::move(socket.peer_))
   , ws_(std::move(socket.ws_)) {
   socket.moved_ = true;
}

Server::EFBWebSocket::~EFBWebSocket() {
   std::cout << "Session " << peer_ << " closed" << std::endl;

   if (web_browser_) {
      if (!server_.Dispatch([&server = server_, id = my_id_]() { server.UnsetMessageHandler(id); }
          )) {
         assert(false && "Failed to dispatch message handler removal on EFB WebSocket destruction");
      }
   } else {
      // EFB MSFS App Closed - Notify server state

      if (!server_.Dispatch([&server = server_, my_id = my_id_]() {
             server.efb_connected_ = false;
             server.UnsetMessageHandler(0);

             for (auto const& [id, handler] : server.message_handlers_) {
                handler(my_id, ws::msg::EFBState{.state_ = false});
             }
          })) {
         assert(false && "Failed to dispatch server state update on EFB WebSocket destruction");
      }

      // Wait promises to be done
      std::unique_lock lock{mutex_};
      cv_.wait(lock, [this]() constexpr { return promises_ == 0; });
   }

   boost::beast::error_code ec;
   ws_.next_layer().cancel(ec);
   ec = {};
   ws_.close({}, ec);
   if (ec && ec != websocket::error::closed && ec != net::error::operation_aborted
       && ec != net::error::bad_descriptor) {
      std::cerr << "Error closing WebSocket: " << ec.message() << std::endl;
   }
}

void
Server::EFBWebSocket::VDispatchMessage(std::size_t id, ws::Message&& message) {
   (void)server_.Dispatch([self = shared_from_this(), id, message = std::move(message)]() mutable {
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
         (void)server_.Dispatch([self = shared_from_this(), id = id]() {
            if (auto const message_handler = self->server_.message_handlers_.find(id);
                message_handler != self->server_.message_handlers_.end()) {
               message_handler->second(
                 1, ws::msg::EFBState{.state_ = self->server_.efb_connected_}
               );
            }
         });
      } else if (std::holds_alternative<ws::msg::GetServerState>(message)) {
         (void)server_.Dispatch([self = shared_from_this(), id = id]() {
            if (auto const message_handler = self->server_.message_handlers_.find(id);
                message_handler != self->server_.message_handlers_.end()) {
               message_handler->second(1, ws::msg::ServerState{.state_ = self->server_.running_});
            }
         });
      } else {
         try {
            auto const message_str =
              js::Stringify(ws::Proxy{.id_ = id, .content_ = std::move(message)});

            ws_.text(true);
            ws_.write(net::buffer(message_str));
         } catch (std::exception const& e) {
            std::cerr << "Write error: " << e.what() << std::endl;
         }
      }
   }
}

void
Server::EFBWebSocket::Stop() {
   std::mutex mutex{};

   std::condition_variable cv{};
   bool                    closed = false;

   if (!server_.Ensure([self = shared_from_this(), &cv, &mutex, &closed]() {
          boost::beast::error_code ec;
          self->ws_.next_layer().cancel(ec);
          ec = {};
          self->ws_.close({}, ec);

          std::lock_guard lock{mutex};
          closed = true;
          cv.notify_all();
       })) {
      assert(false && "Failed to dispatch stop on EFB WebSocket");
   }

   std::unique_lock lock{mutex};
   cv.wait(lock, [&closed]() { return closed; });
}

void
Server::EFBWebSocket::Start() {
   if (!server_.want_run_) {
      return;
   }

   my_id_ = web_browser_ ? std::bit_cast<std::size_t>(this) : 0;

   if (!server_.Dispatch([self = shared_from_this()]() constexpr {
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
             self->VSendMessage(1, ws::msg::EFBState{.state_ = self->server_.efb_connected_});
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

          self->VSendMessage(1, ws::msg::fuel::GetPresets{});
          self->VSendMessage(1, ws::msg::dev::GetPresets{});
       })) {
      return;
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
   if (!server_.want_run_) {
      return;
   }

   if (ec) {
      if (ec != websocket::error::closed) {
         std::cerr << "Read error: " << ec.message() << std::endl;
      }

      (void)server_.Dispatch([self = shared_from_this()]() {
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
            assert(self->server_.efb_socket_ == self);
            self->server_.efb_socket_ = nullptr;
         }
      });
      return;
   }

   auto        it = buffers_begin(buffer_.data());
   std::string data{it, it + n};
   buffer_.consume(n);

   (void)poll_.Dispatch([this, data = std::move(data)]() mutable {
      try {
         auto message = js::Parse<ws::Proxy>(data);

         if (std::holds_alternative<ws::msg::fuel::Presets>(message.content_)) {
            server_.HandleFuelPresets(my_id_, std::move(message.content_));
         } else if (std::holds_alternative<ws::msg::fuel::Curves>(message.content_)) {
            server_.HandleFuelCurve(my_id_, std::move(message.content_));
         } else if (std::holds_alternative<ws::msg::fuel::DefaultPreset>(message.content_)) {
            server_.HandleDefaultFuelPreset(my_id_, std::move(message.content_));
         } else if (std::holds_alternative<ws::msg::fuel::GetPresets>(message.content_)) {
            server_.HandleGetFuelPresets(my_id_);
         } else if (std::holds_alternative<ws::msg::dev::Presets>(message.content_)) {
            server_.HandleDeviationPresets(my_id_, std::move(message.content_));
         } else if (std::holds_alternative<ws::msg::dev::Curve>(message.content_)) {
            server_.HandleDeviationCurve(my_id_, std::move(message.content_));
         } else if (std::holds_alternative<ws::msg::dev::DefaultPreset>(message.content_)) {
            server_.HandleDefaultDeviationPreset(my_id_, std::move(message.content_));
         } else if (std::holds_alternative<ws::msg::dev::GetPresets>(message.content_)) {
            server_.HandleGetDeviationPresets(my_id_);
         } else if (std::holds_alternative<ws::msg::GetEFBState>(message.content_)) {
            assert(message.id_ != 2);
            assert(message.id_ != 1);

            (void)server_.Dispatch([self = shared_from_this(), id = my_id_]() {
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
              .Then([self   = shared_from_this(),
                     id     = message.id_,
                     req_id = msg.id_](std::string const& path) constexpr {
                 (void)self->server_.Dispatch([self = std::move(self), id, req_id, path]() {
                    self->VSendMessage(id, ws::msg::OpenFileResponse{.id_ = req_id, .path_ = path});
                    std::shared_lock lock{self->mutex_};
                    --self->promises_;
                    self->cv_.notify_all();
                 });
              })
              .Catch([self = shared_from_this()](std::exception_ptr const& exc) constexpr {
                 std::shared_lock lock{self->mutex_};
                 --self->promises_;
                 self->cv_.notify_all();
                 std::rethrow_exception(exc);
              })
              .Detach();
         } else if (std::holds_alternative<ws::msg::GetFile>(message.content_)) {
            assert(message.id_ == 1);
            auto const& msg = std::get<ws::msg::GetFile>(message.content_);

            if (auto const data = Base64Open(msg.path_); data.empty()) {
               VDispatchMessage(
                 message.id_, ws::msg::GetFileResponse{.id_ = msg.id_, .num_blobs_ = 0}
               );
            } else {
               static constexpr std::size_t CHUNK_SIZE = 100 * 1024;  // 100KB
               std::size_t                  num_blobs{(data.size() + CHUNK_SIZE - 1) / CHUNK_SIZE};

               VDispatchMessage(
                 message.id_, ws::msg::GetFileResponse{.id_ = msg.id_, .num_blobs_ = num_blobs}
               );

               for (std::size_t i = 0; i < data.size(); i += CHUNK_SIZE) {
                  auto const chunk =
                    std::string_view{data.data() + i, std::min(data.size() - i, CHUNK_SIZE)};
                  auto const id = i / CHUNK_SIZE;

                  VDispatchMessage(
                    1,
                    ws::msg::FileBlob{.file_id_ = msg.id_, .id_ = id, .data_ = std::string{chunk}}
                  );
               }
            }
         } else {
            assert(message.id_ != 2);

            if (message.id_ == 1) {
               // Broadcast
               (void)server_.Dispatch(
                 [&server = server_, my_id = my_id_, message = std::move(message)]() {
                    for (auto const message_handler : server.message_handlers_) {
                       if (message_handler.first != my_id) {
                          message_handler.second(my_id, std::move(message.content_));
                       }
                    }
                 }
               );
            } else {
               (void)server_.Dispatch(
                 [&server = server_, my_id = my_id_, message = std::move(message)]() {
                    if (auto const message_handler = server.message_handlers_.find(message.id_);
                        message_handler != server.message_handlers_.end()) {
                       message_handler->second(my_id, std::move(message.content_));
                    }
                 }
               );
            }
         }
      } catch (std::exception const& e) {
         std::cerr << "Message parsing error: " << e.what() << std::endl;
      }
   });

   Read();
}

void
Server::EFBWebSocket::OnWrite(error_code ec, size_t) {
   if (!ec) {
      Read();
   }
}
