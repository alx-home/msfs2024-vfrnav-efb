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

#include <optional>
#include <vector>

namespace ws::msg {

struct Pdf {
   using SELF = Pdf;

   bool header_{true};

   std::string name_{};
   std::string id_{};
   std::size_t num_blobs_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"name", &SELF::name_},
     js::_{"id", &SELF::id_},
     js::_{"num_blobs", &SELF::num_blobs_},
   };
};

struct ExportPdfs {
   using SELF = ExportPdfs;

   bool header_{true};

   std::optional<std::size_t> id_{};
   std::vector<Pdf>           pdfs_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__EXPORT_PDFS__", &SELF::header_},

     js::_{"id", &SELF::id_},
     js::_{"pdfs", &SELF::pdfs_},
   };
};

struct PdfProcessed {
   using SELF = PdfProcessed;

   bool header_{true};

   std::size_t id_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__PDF_PROCESSED__", &SELF::header_},
     js::_{"id", &SELF::id_},
   };
};

struct PdfBlob {
   using SELF = PdfBlob;

   bool header_{true};

   std::optional<std::size_t> pdf_id_{};
   std::size_t                document_{};
   std::size_t                id_{};
   std::string                data_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__PDF_BLOB__", &SELF::header_},
     js::_{"pdf_id", &SELF::pdf_id_},
     js::_{"document", &SELF::document_},
     js::_{"id", &SELF::id_},
     js::_{"data", &SELF::data_},
   };
};

}  // namespace ws::msg
