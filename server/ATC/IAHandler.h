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

#include <utils/MessageQueue.h>
#include <utils/Poll.h>
#include <json/json.h>
#include <promise/promise.h>
#include <memory>
#include <unordered_map>

namespace ia {

struct Frequency {
   struct Name {
      std::string local_{"unknown"};
      std::string english_{"unknown"};

      static constexpr js::Proto PROTOTYPE{
        js::_{"local", &Name::local_},
        js::_{"english", &Name::english_},
      };
   };
   Name        name_{};
   double      value_{0};
   std::string type_{"UNKNOWN"};

   static constexpr js::Proto PROTOTYPE{
     js::_{"name", &Frequency::name_},
     js::_{"frequency", &Frequency::value_},
     js::_{"type", &Frequency::type_},
   };
};

class Handler : private MessageQueue {
public:
   Handler();
   virtual ~Handler();

   using FrequencyPromise = Promise<std::vector<Frequency>, true>;
   FrequencyPromise GetFrequency(std::string_view icao);

private:
   void SaveFrequencies();

   std::unordered_map<std::string, FrequencyPromise> frequencies_{};
   std::size_t                                       pending_requests_{0};

   std::unique_ptr<Poll<50>> poll_{std::make_unique<Poll<50>>("IAH Poll")};
};

}  // namespace ia