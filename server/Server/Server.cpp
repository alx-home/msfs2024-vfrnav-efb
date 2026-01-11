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
#include "WebSockets/Messages/Fuel.h"
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

#include <exception>
#include <filesystem>
#include <fstream>
#include <memory>
#include <mutex>
#include <shared_mutex>
#include <string_view>
#include <thread>
#include <tuple>
#include <unordered_map>
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
   Resolvers<ServerState>::Vector resolvers{};
   std::swap(resolvers_, resolvers);

   for (auto const& [resolve, _] : resolvers) {
      (*resolve)(std::move(state));
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

Server::Server(Main& main)
   : MessageQueue("Server Message queue")
   , main_{&main}
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
               {
                  main_->SendServerPortToEFB(port);
                  tcp_->ioc_.run();
                  main_->SendServerPortToEFB(0);
               }
               lock.lock();
            }

            efb_socket_ = nullptr;
            for (auto const& socket : web_sockets_) {
               socket->Stop();
            }
            web_sockets_.clear();
         }

         runing_   = false;
         want_run_ = false;
         Notify(GetState(lock), lock);
      }
   }} {
   Dispatch([this]() {
      LoadFuelPresets();

      auto&       registry            = registry::Get();
      auto const& default_fuel_preset = registry.alx_home_->settings_->default_fuel_preset_;

      if (default_fuel_preset) {
         this->default_fuel_preset_.name_ = *default_fuel_preset;
         this->default_fuel_preset_.date_ = 0;
      } else {
         this->default_fuel_preset_.name_ = "";
         this->default_fuel_preset_.date_ = 0;
      }

      LoadDeviationPresets();

      auto const& default_deviation_preset =
        registry.alx_home_->settings_->default_deviation_preset_;

      if (default_deviation_preset) {
         this->default_deviation_preset_.name_ = *default_deviation_preset;
         this->default_deviation_preset_.date_ = 0;
      } else {
         this->default_deviation_preset_.name_ = "";
         this->default_deviation_preset_.date_ = 0;
      }
   });
}

Server::~Server() { assert(resolvers_.empty()); }

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
   } catch (std::exception const& e) {
      std::cerr << "Error in accept handler: " << e.what() << '\n';
   }

   if (want_run_) {
      tcp_->acceptor_.async_accept(bind_front_handler(&Server::Accept, this));
   }
}

void
Server::SaveFuelPresets() const {
   auto&      registry = registry::Get();
   auto const path     = *registry.alx_home_->settings_->destination_ + "/Data";
   std::filesystem::create_directories(path);
   {
      std::ofstream file{path + "/FuelPresets.json.tmp"};

      std::vector<ws::msg::fuel::Curves> curves{};
      for (auto const& preset : fuel_presets_) {
         if (preset.second.curve_.size()) {
            curves.emplace_back(preset.second);
         }
      }

      auto const json = js::Stringify(curves, false);
      file.write(json.c_str(), json.size());
   }

   std::filesystem::rename(path + "/FuelPresets.json.tmp", path + "/FuelPresets.json");
}

void
Server::LoadFuelPresets() {
   auto&      registry = registry::Get();
   auto const path     = *registry.alx_home_->settings_->destination_ + "/Data/FuelPresets.json";
   if (std::filesystem::exists(path)) {
      std::string content{};
      {
         std::ifstream file{path};
         file.seekg(0, std::ios::end);
         auto const size = file.tellg();

         if (size >= 0) {
            content.resize(file.tellg());
            file.seekg(0, std::ios::beg);
            file.read(content.data(), content.size());
         }
      }

      fuel_presets_.clear();

      try {
         auto const curves{js::Parse<std::vector<ws::msg::fuel::Curves>>(content)};
         for (auto const& preset : curves) {
            fuel_presets_.emplace(preset.name_, preset);
         }
      } catch (std::exception const& e) {
         std::cerr << e.what() << std::endl;
      }
   } else {
      fuel_presets_.clear();
      fuel_presets_.emplace(
        "real h125", ws::msg::fuel::Curves{.name_ = "real h125", .date_ = 0, .curve_ = h125_curve_s}
      );
   }
}

void
Server::HandleFuelPresets(std::size_t id, ws::Message&& message) {
   Dispatch([this, id, message = std::move(message)]() constexpr {
      auto const& [_, fuel_presets] = std::get<ws::msg::fuel::Presets>(message);

      bool                            save = false;
      std::unordered_set<std::string> current_presets{};
      for (auto const& preset : fuel_presets) {
         auto const it = fuel_presets_.find(preset.name_);

         if (it == fuel_presets_.end()) {
            if (preset.remove_) {
               fuel_presets_.emplace(
                 preset.name_,
                 ws::msg::fuel::Curves{.name_ = preset.name_, .date_ = preset.date_, .curve_ = {}}
               );

               for (auto const& message_handler : message_handlers_) {
                  message_handler.second(
                    1, ws::msg::fuel::DeletePreset{.name_ = preset.name_, .date_ = preset.date_}
                  );
               }
            } else {
               if (auto const it = message_handlers_.find(id); it != message_handlers_.end()) {
                  it->second(1, ws::msg::fuel::GetCurve{.name_ = preset.name_});
               }
            }
         } else {
            current_presets.emplace(preset.name_);

            if (it->second.date_ < preset.date_) {
               if (preset.remove_) {
                  it->second.date_ = preset.date_;
                  it->second.curve_.clear();
                  save = true;

                  for (auto const& message_handler : message_handlers_) {
                     message_handler.second(
                       1, ws::msg::fuel::DeletePreset{.name_ = preset.name_, .date_ = preset.date_}
                     );
                  }
               } else {
                  if (auto const it = message_handlers_.find(id); it != message_handlers_.end()) {
                     it->second(1, ws::msg::fuel::GetCurve{.name_ = preset.name_});
                  }
               }
            } else if (it->second.date_ > preset.date_) {
               if (auto const it = message_handlers_.find(id); it != message_handlers_.end()) {
                  auto const& data = fuel_presets_.at(preset.name_);

                  if (data.curve_.empty()) {
                     it->second(
                       1, ws::msg::fuel::DeletePreset{.name_ = data.name_, .date_ = data.date_}
                     );
                  } else {
                     it->second(1, data);
                  }
               }
            }
         }
      }

      if (save) {
         SaveFuelPresets();
      }

      for (auto const& preset : fuel_presets_) {
         auto const it = current_presets.find(preset.second.name_);

         if ((it == current_presets.end()) && preset.second.curve_.size()) {
            if (auto const it = message_handlers_.find(id); it != message_handlers_.end()) {
               it->second(1, preset.second);
            }
         }
      }

      if (default_fuel_preset_.name_.size()) {
         if (auto const it = message_handlers_.find(id); it != message_handlers_.end()) {
            it->second(1, default_fuel_preset_);
         }
      }
   });
}

void
Server::HandleFuelCurve(std::size_t, ws::Message&& message) {
   Dispatch([this, message = std::move(message)]() constexpr {
      auto const& fuel_preset = std::get<ws::msg::fuel::Curves>(message);

      bool update = false;
      if (auto it = fuel_presets_.find(fuel_preset.name_); it != fuel_presets_.end()) {
         if (it->second.date_ < fuel_preset.date_) {
            it->second.date_  = fuel_preset.date_;
            it->second.curve_ = fuel_preset.curve_;
            update            = true;
         }
      } else {
         fuel_presets_.emplace(fuel_preset.name_, fuel_preset);
         update = true;
      }

      if (update) {
         SaveFuelPresets();

         for (auto const& message_handler : message_handlers_) {
            if (fuel_preset.curve_.size()) {
               message_handler.second(1, fuel_preset);
            } else {
               message_handler.second(
                 1,
                 ws::msg::fuel::DeletePreset{.name_ = fuel_preset.name_, .date_ = fuel_preset.date_}
               );
            }
         }
      }
   });
}

void
Server::HandleDefaultFuelPreset(std::size_t, ws::Message&& message) {
   Dispatch([this, message = std::move(message)]() constexpr {
      auto const& default_fuel_preset = std::get<ws::msg::fuel::DefaultPreset>(message);
      if (this->default_fuel_preset_.name_.empty()
          || (this->default_fuel_preset_.date_ < default_fuel_preset.date_)) {
         this->default_fuel_preset_ = default_fuel_preset;
         {
            auto& registry                                      = registry::Get();
            registry.alx_home_->settings_->default_fuel_preset_ = this->default_fuel_preset_.name_;
         }
      }
   });
}

void
Server::HandleGetFuelPresets(std::size_t) {
   std::cerr << "shall not happen..." << std::endl;
}

void
Server::SaveDeviationPresets() const {
   auto&      registry = registry::Get();
   auto const path     = *registry.alx_home_->settings_->destination_ + "/Data";
   std::filesystem::create_directories(path);
   {
      std::ofstream file{path + "/DeviationPresets.json.tmp"};

      std::vector<ws::msg::dev::Curve> curves{};
      for (auto const& preset : deviation_presets_) {
         if (preset.second.curve_.size()) {
            curves.emplace_back(preset.second);
         }
      }

      auto const json = js::Stringify(curves, false);
      file.write(json.c_str(), json.size());
   }

   std::filesystem::rename(path + "/DeviationPresets.json.tmp", path + "/DeviationPresets.json");
}

void
Server::LoadDeviationPresets() {
   auto&      registry = registry::Get();
   auto const path = *registry.alx_home_->settings_->destination_ + "/Data/DeviationPresets.json";
   if (std::filesystem::exists(path)) {
      std::string content{};
      {
         std::ifstream file{path};
         file.seekg(0, std::ios::end);
         auto const size = file.tellg();

         if (size >= 0) {
            content.resize(file.tellg());
            file.seekg(0, std::ios::beg);
            file.read(content.data(), content.size());
         }
      }

      deviation_presets_.clear();

      try {
         auto const curves{js::Parse<std::vector<ws::msg::dev::Curve>>(content)};
         for (auto const& preset : curves) {
            deviation_presets_.emplace(preset.name_, preset);
         }
      } catch (std::exception const& e) {
         std::cerr << e.what() << std::endl;
      }
   }
}

void
Server::HandleDeviationPresets(std::size_t id, ws::Message&& message) {
   Dispatch([this, id, message = std::move(message)]() constexpr {
      auto const& [_, dev_presets] = std::get<ws::msg::dev::Presets>(message);

      bool                            save = false;
      std::unordered_set<std::string> current_presets{};
      for (auto const& preset : dev_presets) {
         auto const it = deviation_presets_.find(preset.name_);

         if (it == deviation_presets_.end()) {
            if (preset.remove_) {
               deviation_presets_.emplace(
                 preset.name_,
                 ws::msg::dev::Curve{.name_ = preset.name_, .date_ = preset.date_, .curve_ = {}}
               );

               for (auto const& message_handler : message_handlers_) {
                  message_handler.second(
                    1, ws::msg::dev::DeletePreset{.name_ = preset.name_, .date_ = preset.date_}
                  );
               }
            } else {
               if (auto const it = message_handlers_.find(id); it != message_handlers_.end()) {
                  it->second(1, ws::msg::dev::GetCurve{.name_ = preset.name_});
               }
            }
         } else {
            current_presets.emplace(preset.name_);

            if (it->second.date_ < preset.date_) {
               if (preset.remove_) {
                  it->second.date_ = preset.date_;
                  it->second.curve_.clear();
                  save = true;

                  for (auto const& message_handler : message_handlers_) {
                     message_handler.second(
                       1, ws::msg::dev::DeletePreset{.name_ = preset.name_, .date_ = preset.date_}
                     );
                  }
               } else {
                  if (auto const it = message_handlers_.find(id); it != message_handlers_.end()) {
                     it->second(1, ws::msg::dev::GetCurve{.name_ = preset.name_});
                  }
               }
            } else if (it->second.date_ > preset.date_) {
               if (auto const it = message_handlers_.find(id); it != message_handlers_.end()) {
                  auto const& data = deviation_presets_.at(preset.name_);

                  if (data.curve_.empty()) {
                     it->second(
                       1, ws::msg::dev::DeletePreset{.name_ = data.name_, .date_ = data.date_}
                     );
                  } else {
                     it->second(1, data);
                  }
               }
            }
         }
      }

      if (save) {
         SaveDeviationPresets();
      }

      for (auto const& preset : deviation_presets_) {
         auto const it = current_presets.find(preset.second.name_);

         if ((it == current_presets.end()) && preset.second.curve_.size()) {
            if (auto const it = message_handlers_.find(id); it != message_handlers_.end()) {
               it->second(1, preset.second);
            }
         }
      }

      if (default_deviation_preset_.name_.size()) {
         if (auto const it = message_handlers_.find(id); it != message_handlers_.end()) {
            it->second(1, default_deviation_preset_);
         }
      }
   });
}

void
Server::HandleDeviationCurve(std::size_t, ws::Message&& message) {
   Dispatch([this, message = std::move(message)]() constexpr {
      auto const& dev_preset = std::get<ws::msg::dev::Curve>(message);

      bool update = false;
      if (auto it = deviation_presets_.find(dev_preset.name_); it != deviation_presets_.end()) {
         if (it->second.date_ < dev_preset.date_) {
            it->second.date_  = dev_preset.date_;
            it->second.curve_ = dev_preset.curve_;
            update            = true;
         }
      } else {
         deviation_presets_.emplace(dev_preset.name_, dev_preset);
         update = true;
      }

      if (update) {
         SaveDeviationPresets();

         for (auto const& message_handler : message_handlers_) {
            if (dev_preset.curve_.size()) {
               message_handler.second(1, dev_preset);
            } else {
               message_handler.second(
                 1, ws::msg::dev::DeletePreset{.name_ = dev_preset.name_, .date_ = dev_preset.date_}
               );
            }
         }
      }
   });
}

void
Server::HandleDefaultDeviationPreset(std::size_t, ws::Message&& message) {
   Dispatch([this, message = std::move(message)]() constexpr {
      auto const& default_dev_preset = std::get<ws::msg::dev::DefaultPreset>(message);
      if (this->default_deviation_preset_.name_.empty()
          || (this->default_deviation_preset_.date_ < default_dev_preset.date_)) {
         this->default_deviation_preset_ = default_dev_preset;
         {
            auto& registry = registry::Get();
            registry.alx_home_->settings_->default_deviation_preset_ =
              this->default_deviation_preset_.name_;
         }
      }
   });
}

void
Server::HandleGetDeviationPresets(std::size_t) {
   std::cerr << "shall not happen..." << std::endl;
}

bool
Server::VDispatchMessage(std::size_t id, ws::Message&& message) {
   auto const efb_socket = efb_socket_;

   if (std::holds_alternative<ws::msg::fuel::Presets>(message)) {
      HandleFuelPresets(id, std::move(message));
   } else if (std::holds_alternative<ws::msg::fuel::Curves>(message)) {
      HandleFuelCurve(id, std::move(message));
   } else if (std::holds_alternative<ws::msg::fuel::DefaultPreset>(message)) {
      HandleDefaultFuelPreset(id, std::move(message));
   } else if (std::holds_alternative<ws::msg::fuel::GetPresets>(message)) {
      HandleGetFuelPresets(id);
   } else if (std::holds_alternative<ws::msg::dev::Presets>(message)) {
      HandleDeviationPresets(id, std::move(message));
   } else if (std::holds_alternative<ws::msg::dev::Curve>(message)) {
      HandleDeviationCurve(id, std::move(message));
   } else if (std::holds_alternative<ws::msg::dev::DefaultPreset>(message)) {
      HandleDefaultDeviationPreset(id, std::move(message));
   } else if (std::holds_alternative<ws::msg::dev::GetPresets>(message)) {
      HandleGetDeviationPresets(id);
   } else if (efb_socket) {
      return Dispatch([efb_socket, id, message = std::move(message)]() mutable {
         efb_socket->VDispatchMessage(id, std::move(message));
      });
   } else if (std::holds_alternative<ws::msg::GetFacilities>(message)) {
      Dispatch([this, id, message = std::move(message)]() constexpr {
         if (auto const it = message_handlers_.find(id); it != message_handlers_.end()) {
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
Server::SetMessageHandler(std::size_t id, MessageHandler&& message_handler) {
   Dispatch([this, id, message_handler = std::move(message_handler)]() constexpr {
      auto const [handler, _] = message_handlers_.emplace(id, std::move(message_handler));
      assert(_);

      auto const efb_socket = efb_socket_;
      if (efb_socket) {
         efb_socket->VSendMessage(id, ws::msg::GetRecords{});
         efb_socket->VSendMessage(
           id, ws::msg::GetFacilities{.lat_ = handler->second.lat_, .lon_ = handler->second.lon_}
         );
      }
   });
}

void
Server::UnsetMessageHandler(std::size_t id) {
   Dispatch([this, id]() constexpr {
      auto const _ = message_handlers_.erase(id);
      assert(_ == 1);
   });
}

void
Server::WatchServerState(Resolve<ServerState> const& resolve, Reject const& reject) {
   std::unique_lock lock{mutex_};
   resolvers_.emplace_back(resolve.shared_from_this(), reject.shared_from_this());
}

std::vector<ws::msg::fuel::Curve>
  Server::h125_curve_s =
    {
      ws::msg::fuel::Curve{
        .thrust_ = 100,
        .points_ =
          {
            {
              .alt_ = 0,
              .values_ =
                {
                  {-40, 177},
                  {17, 189},
                  {30, 179},
                  {40, 165},
                  {50, 151},
                },
            },
            {
              .alt_ = 2000,
              .values_ =
                {
                  {-40, 173},
                  {7, 184},
                  {25, 170},
                  {50, 139},
                },
            },
            {
              .alt_ = 4000,
              .values_ =
                {
                  {-40, 173},
                  {-4, 180},
                  {22, 160},
                  {50, 126},
                },
            },
            {
              .alt_ = 6000,
              .values_ =
                {
                  {-40, 173},
                  {-15, 177},
                  {17, 151},
                  {50, 122},
                },
            },
            {
              .alt_ = 8000,

              .values_ =
                {
                  {-40, 173},
                  {-30, 177},
                  {-10, 158},
                  {15, 142},
                  {50, 111},
                },
            },
            {
              .alt_ = 10000,

              .values_ =
                {
                  {-40, 173},
                  {-15, 151},
                  {10, 134},
                  {50, 103},
                },
            },
            {
              .alt_ = 12000,

              .values_ =
                {
                  {-40, 158},
                  {-20, 142},
                  {5, 126},
                  {50, 92},
                },
            },
            {
              .alt_ = 14000,
              .values_ =
                {
                  {-40, 146},
                  {-20, 132},
                  {0, 120},
                  {50, 84},
                },
            },
            {
              .alt_ = 16000,
              .values_ =
                {
                  {-40, 135},
                  {-25, 123},
                  {-10, 116},
                  {2, 110},
                  {50, 75},
                },
            },
            {
              .alt_ = 25000,
              .values_ =
                {
                  {-40, 135},
                  {-25, 123},
                  {-10, 116},
                  {2, 110},
                  {50, 75},
                },
            },
          }
      }
};