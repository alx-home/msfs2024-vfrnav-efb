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

#include <json/json.h>

#include <vector>

namespace ws::msg {

struct Pdf {
   using SELF = Pdf;

   bool header_{true};

   std::string name_{};
   std::string id_{};
   std::string data_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"name", &SELF::name_},
     js::_{"id", &SELF::id_},
     js::_{"data", &SELF::data_},
   };
};

struct ExportPdfs {
   using SELF = ExportPdfs;

   bool header_{true};

   std::vector<Pdf> pdfs_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__EXPORT_PDFS__", &SELF::header_},

     js::_{"pdfs", &SELF::pdfs_},
   };
};

}  // namespace ws::msg
