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

#include "window/FileDialog.h"
#include <json/json.h>

namespace ws::msg {

struct FileExists {
   using SELF = FileExists;

   bool header_{true};

   std::size_t id_{};
   std::string path_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__FILE_EXISTS__", &SELF::header_},

     js::_{"id", &SELF::id_},
     js::_{"path", &SELF::path_},
   };
};

struct FileExistsResponse {
   using SELF = FileExistsResponse;

   bool header_{true};

   std::size_t id_{};
   bool        result_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__FILE_EXISTS_RESPONSE__", &SELF::header_},

     js::_{"id", &SELF::id_},
     js::_{"result", &SELF::result_},
   };
};

struct OpenFile {
   using SELF = OpenFile;

   bool header_{true};

   std::size_t                 id_{};
   std::string                 path_{};
   std::vector<dialog::Filter> filters_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__OPEN_FILE__", &SELF::header_},

     js::_{"id", &SELF::id_},
     js::_{"path", &SELF::path_},
     js::_{"filters", &SELF::filters_},
   };
};

struct OpenFileResponse {
   using SELF = OpenFileResponse;

   bool header_{true};

   std::size_t id_{};
   std::string path_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__OPEN_FILE_RESPONSE__", &SELF::header_},

     js::_{"id", &SELF::id_},
     js::_{"path", &SELF::path_},
   };
};

struct GetFile {
   using SELF = GetFile;

   bool header_{true};

   std::size_t id_{};
   std::string path_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_FILE__", &SELF::header_},

     js::_{"id", &SELF::id_},
     js::_{"path", &SELF::path_},
   };
};

struct GetFileResponse {
   using SELF = GetFileResponse;

   bool header_{true};

   std::size_t id_{};
   std::string data_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_FILE_RESPONSE__", &SELF::header_},

     js::_{"id", &SELF::id_},
     js::_{"data", &SELF::data_},
   };
};

}  // namespace ws::msg
