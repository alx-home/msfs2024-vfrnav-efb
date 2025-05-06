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

#include "Window/template/Window.h"
#include "promise/promise.h"

#include <functional>
#include <shared_mutex>
#include <utility>
#include <variant>
#include <vector>

class Resolvers
   : public std::vector<std::pair<
       std::reference_wrapper<promise::Resolve<ServerState> const>,
       std::reference_wrapper<promise::Reject const>>> {
public:
   using Vector = std::vector<std::pair<
     std::reference_wrapper<promise::Resolve<ServerState> const>,
     std::reference_wrapper<promise::Reject const>>>;
   using Vector::value_type;

   Resolvers() = default;
   ~Resolvers();

   void RejectAll();
};

struct Server {
   Server();

   using Lock = std::variant<
     std::reference_wrapper<std::unique_lock<std::shared_mutex> const>,
     std::reference_wrapper<std::shared_lock<std::shared_mutex> const>>;

   uint16_t    GetPort() const;
   ServerState GetState(Lock) const;
   void        SetServerPort(uint16_t);
   void        FlushState();
   void        RejectAll();
   void        Notify(ServerState state, Lock);

   bool                        runing_    = false;
   bool                        switching_ = false;
   std::shared_mutex           mutex_{};
   std::condition_variable_any cv_{};
   Resolvers                   resolvers_{};

   // Must stays at the end
   std::jthread thread_{};
};