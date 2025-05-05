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

#include "Messages.h"

#include <json/json.h>

namespace ws::msg {

struct Record {
   std::string name_{};
   std::size_t id_{};
   bool        active_{};
   double      touchdown_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"name", &Record::name_},
     js::_{"id", &Record::id_},
     js::_{"active", &Record::active_},
     js::_{"touchdown", &Record::touchdown_},
   };
};

struct Records {
   bool header_{true};

   std::vector<Record> records_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__RECORDS__", &Records::header_},
     js::_{"value", &Records::records_},
   };
};

struct EditRecord {
   bool header_{true};

   std::size_t id_{};
   std::string name_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__EDIT_RECORD__", &EditRecord::header_},

     js::_{"id", &EditRecord::id_},
     js::_{"name", &EditRecord::name_},
   };
};

struct RemoveRecord {
   bool header_{true};

   std::size_t id_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__REMOVE_RECORD__", &RemoveRecord::header_},

     js::_{"id", &RemoveRecord::id_},
   };
};

struct GetRecord {
   bool header_{true};

   std::size_t id_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_RECORD__", &GetRecord::header_},

     js::_{"id", &GetRecord::id_},
   };
};

struct GetRecords {
   bool header_{true};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_RECORDS__", &GetRecords::header_},
   };
};

}  // namespace ws::msg
