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
#include "WebSockets/Messages/Fuel.h"
#include "Window/template/Window.h"

#include <utils/MessageQueue.h>
#include <utils/Pool.h>
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
#pragma clang diagnostic ignored "-Weverything"
#include <boost/beast.hpp>
#include <boost/asio.hpp>
#include <boost/beast/core/error.hpp>
#include <boost/beast/http/string_body_fwd.hpp>
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
struct Server : public MessageQueue<true> {
   Server(Main& main);
   ~Server() override;

   using Lock = std::variant<
     std::reference_wrapper<std::unique_lock<std::shared_mutex> const>,
     std::reference_wrapper<std::shared_lock<std::shared_mutex> const>>;

   class MessageHandler : public std::function<void(std::size_t id, ws::Message)> {
   public:
      using std::function<void(std::size_t id, ws::Message)>::function;

      double lat_{-1000};
      double lon_{-1000};
   };

   uint16_t    GetPort() const;
   ServerState GetState(Lock) const;
   void        SetServerPort(uint16_t);

   void FlushState();
   void RejectAll();
   void Notify(ServerState state, Lock);

   void CloseSockets();

   void Switch();
   void Stop();
   void Start();

   void SaveFuelPresets() const;
   void LoadFuelPresets();

   void SaveDeviationPresets() const;
   void LoadDeviationPresets();

   void HandleFuelPresets(std::size_t id, ws::Message&& message);
   void HandleFuelCurve(std::size_t id, ws::Message&& message);
   void HandleDefaultFuelPreset(std::size_t id, ws::Message&& message);
   void HandleGetFuelPresets(std::size_t id);

   void HandleDeviationPresets(std::size_t id, ws::Message&& message);
   void HandleDeviationCurve(std::size_t id, ws::Message&& message);
   void HandleDefaultDeviationPreset(std::size_t id, ws::Message&& message);
   void HandleGetDeviationPresets(std::size_t id);

   using tcp         = boost::asio::ip::tcp;
   using io_context  = boost::asio::io_context;
   using boost_error = boost::system::error_code;

   void Accept(const boost_error& error, tcp::socket socket);

   bool VDispatchMessage(std::size_t id, ws::Message&& message);
   void SetMessageHandler(std::size_t id, MessageHandler&&);
   void UnsetMessageHandler(std::size_t id);

   void WatchServerState(Resolve<ServerState> const& resolve, Reject const& reject);

   Main&                       main_;
   bool                        running_ = false;
   mutable std::shared_mutex   mutex_{};
   std::condition_variable_any cv_{};
   Resolvers<ServerState>      resolvers_{};
   bool                        efb_connected_{false};
   bool                        want_run_{[]() {
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

   std::unordered_map<std::size_t, MessageHandler> message_handlers_{};
   std::shared_ptr<EFBWebSocket>                   efb_socket_{nullptr};
   std::vector<std::shared_ptr<EFBWebSocket>>      web_sockets_{};

   std::unordered_map<std::string, ws::msg::fuel::Curves> fuel_presets_{};
   ws::msg::fuel::DefaultPreset                           default_fuel_preset_{};
   std::unordered_map<std::string, ws::msg::dev::Curve>   deviation_presets_{};
   ws::msg::dev::DefaultPreset                            default_deviation_preset_{};

   static std::vector<ws::msg::fuel::Curve> h125_curve_s;

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
};

class Server::EFBWebSocket : public std::enable_shared_from_this<EFBWebSocket> {
public:
   EFBWebSocket(Server::WebSocket&& socket, bool web_browser);
   ~EFBWebSocket();

   void Start() noexcept(false);
   void Stop() noexcept(false);

   void VDispatchMessage(std::size_t id, ws::Message&& message);
   void VSendMessage(std::size_t id, ws::Message&& message);

private:
   void Read();
   void OnRead(boost::beast::error_code ec, size_t n);
   void OnWrite(boost::beast::error_code ec, size_t n);

   Server&     server_;
   bool        web_browser_{};
   std::size_t my_id_{1};

   boost::beast::flat_buffer                    buffer_;
   tcp::endpoint                                peer_;
   boost::beast::websocket::stream<tcp::socket> ws_;

   Pool<true, 10> poll_{"ServPoll"};

   std::shared_mutex           mutex_{};
   std::condition_variable_any cv_{};
   std::atomic<std::size_t>    promises_{};

   std::jthread thread_;
};
