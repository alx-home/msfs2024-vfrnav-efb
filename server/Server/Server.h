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

#include "Registry/Registry.h"
#include "Server/WebSockets/Messages/Messages.h"
#include "Window/template/Window.h"
#include "boost/beast/http/string_body_fwd.hpp"
#include "utils/MessageQueue.h"

#include <promise/promise.h>
#include <minwindef.h>

#include <condition_variable>
#include <functional>
#include <memory>
#include <shared_mutex>
#include <utility>
#include <variant>
#include <vector>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wlanguage-extension-token"
#pragma clang diagnostic ignored "-Wgnu-anonymous-struct"
#pragma clang diagnostic ignored "-Wnested-anon-types"
#pragma clang diagnostic ignored "-Wunknown-warning-option"
#pragma clang diagnostic ignored "-Wdeprecated-missing-comma-variadic-parameter"
#include <boost/beast.hpp>
#include <boost/asio.hpp>
#include <boost/beast/core/error.hpp>
#pragma clang diagnostic pop

template <class TYPE>
class Resolvers
   : public std::vector<std::pair<
       std::shared_ptr<promise::Resolve<TYPE> const>,
       std::shared_ptr<promise::Reject const>>> {
public:
   using Vector = std::vector<std::pair<
     std::shared_ptr<promise::Resolve<TYPE> const>,
     std::shared_ptr<promise::Reject const>>>;
   using typename Vector::value_type;

   Resolvers() = default;
   ~Resolvers();

   void RejectAll();
};

#include "Resolvers.inl"

class Main;
struct Server : public MessageQueue {
   Server(Main& main);
   ~Server() override;

   using Lock = std::variant<
     std::reference_wrapper<std::unique_lock<std::shared_mutex> const>,
     std::reference_wrapper<std::shared_lock<std::shared_mutex> const>>;

   uint16_t    GetPort() const;
   ServerState GetState(Lock) const;
   void        SetServerPort(uint16_t);

   void FlushState();
   void RejectAll();
   void Notify(ServerState state, Lock);

   void Switch();
   void Stop();
   void Start();

   void NotifyEFBState(bool state);

   using tcp         = boost::asio::ip::tcp;
   using io_context  = boost::asio::io_context;
   using boost_error = boost::system::error_code;

   void Accept(const boost_error& error, tcp::socket socket);

   bool VDispatchMessage(std::size_t id, ws::Message message);
   void Subscribe(std::size_t id, std::function<void(ws::Message)>);
   void Unsubscribe(std::size_t id);

   void WatchServerState(Resolve<ServerState> const& resolve, Reject const& reject);
   void WatchEFBState(Resolve<bool> const& resolve, Reject const& reject, bool currentState);

   Main*                       main_   = nullptr;
   bool                        runing_ = false;
   std::shared_mutex           mutex_{};
   std::condition_variable_any cv_{};
   Resolvers<ServerState>      resolvers_{};
   Resolvers<bool>             efb_resolvers_{};
   bool                        efb_connected_{false};
   bool                        want_run_{[]() constexpr {
      auto& registry = registry::Get();
      return *registry.alx_home_->settings_->auto_start_server_;
   }()};

   struct Tcp {
      Tcp(tcp::endpoint endpoint);

      io_context    ioc_{};
      tcp::acceptor acceptor_;
   };
   std::unique_ptr<Tcp> tcp_{};

   class WebSocket;
   class EFBWebSocket;
   class WebWebSocket;

   struct MessageHandler : std::function<void(ws::Message)> {
      double lat_{-1000};
      double lon_{-1000};
   };
   std::unordered_map<std::size_t, MessageHandler> subscribers_{};
   std::shared_ptr<EFBWebSocket>                   efb_socket_{nullptr};

   // Must stays at the end
   std::jthread thread_{};
};

class Server::WebSocket : public std::enable_shared_from_this<WebSocket> {
public:
   WebSocket(
     Server&                                                      server,
     boost::beast::http::request<boost::beast::http::string_body> request,
     tcp::socket                                                  socket
   );
   ~WebSocket();

   void Start();
   void Run();

private:
   void OnAccept(boost::beast::error_code);
   void Read();
   void OnRead(boost::beast::error_code ec, size_t n);
   void OnWrite(boost::beast::error_code ec, size_t n);

   Server&                                                      server_;
   boost::beast::http::request<boost::beast::http::string_body> request_;
   boost::beast::websocket::stream<tcp::socket>                 ws_;
   boost::beast::flat_buffer                                    buffer_;
   tcp::endpoint peer_{ws_.next_layer().remote_endpoint()};
   std::string   response_{};
   bool          moved_{false};

   friend class Server::EFBWebSocket;
   friend class Server::WebWebSocket;
};

class Server::EFBWebSocket : public std::enable_shared_from_this<EFBWebSocket> {
public:
   EFBWebSocket(Server::WebSocket&& socket);
   ~EFBWebSocket();

   void Start();

   void Subscribe(std::size_t id);
   void Unsubscribe(std::size_t id);
   void VDispatchMessage(std::size_t id, ws::Message message);

private:
   void Read();
   void OnRead(boost::beast::error_code ec, size_t n);
   void OnWrite(boost::beast::error_code ec, size_t n);

   Server&                                      server_;
   boost::beast::websocket::stream<tcp::socket> ws_;
   boost::beast::flat_buffer                    buffer_;
   tcp::endpoint                                peer_;

   std::shared_mutex           mutex_{};
   std::condition_variable_any cv_{};
   std::atomic<std::size_t>    promises_{};

   std::jthread thread_;
};

class Server::WebWebSocket : public std::enable_shared_from_this<WebWebSocket> {
public:
   WebWebSocket(Server::WebSocket&& socket);
   ~WebWebSocket();

   void Start();
   void Run();

private:
   void Read();
   void OnRead(boost::beast::error_code ec, size_t n);
   void OnWrite(boost::beast::error_code ec, size_t n);

   Server const&                                server_;
   boost::beast::websocket::stream<tcp::socket> ws_;
   boost::beast::flat_buffer                    buffer_;
   tcp::endpoint                                peer_;
   std::string                                  response_;
};
