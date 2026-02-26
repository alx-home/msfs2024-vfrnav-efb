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

#include "CommWasm.h"
#include <fstream>

Context&
WasmHandler::StoreFlightsContext() {
   return MakeContext<&WasmHandler::OnStoreFlightsEvent>();
}

Context&
WasmHandler::GetFlightsContext() {
   return MakeContext<&WasmHandler::OnGetFlightsEvent>();
}

Context&
WasmHandler::GetLastSavedBlobIdContext() {
   return MakeContext<&WasmHandler::OnGetLastSavedBlobIdEvent>();
}

Context&
WasmHandler::StoreLastSavedBlobIdContext() {
   return MakeContext<&WasmHandler::OnStoreLastSavedBlobIdEvent>();
}

Context&
WasmHandler::GetCurrentBlobIdContext() {
   return MakeContext<&WasmHandler::OnGetCurrentBlobIdEvent>();
}

Context&
WasmHandler::StoreCurrentBlobIdContext() {
   return MakeContext<&WasmHandler::OnStoreCurrentBlobIdEvent>();
}

std::optional<std::string>
WasmHandler::OnStoreFlightsEvent(std::string_view request_id, std::string_view buffer) {
   std::ofstream stream(
     std::string{OUTPUT_FOLDER} + "/flights.json", std::ios::binary | std::ios::trunc
   );

   if (!stream.is_open()) {
      return "error:Could not open file for writing";
   }

   stream.write(buffer.data(), buffer.size());
   if (!stream.good()) {
      return "error:Could not write data to file";
   }

   return "data:";
}

std::optional<std::string>
WasmHandler::OnGetFlightsEvent(std::string_view request_id, std::string_view) {
   std::ifstream stream(std::string{OUTPUT_FOLDER} + "/flights.json", std::ios::binary);
   if (!stream.is_open()) {
      return "data:[]";
   }

   std::string content((std::istreambuf_iterator<char>(stream)), std::istreambuf_iterator<char>());
   return "data:" + content;
}

std::optional<std::string>
WasmHandler::OnGetCurrentBlobIdEvent(std::string_view request_id, std::string_view) {
   return "data:" + std::to_string(current_blob_id_);
}

std::optional<std::string>
WasmHandler::OnStoreCurrentBlobIdEvent(std::string_view, std::string_view buffer) {
   current_blob_id_ = std::stoul(std::string{buffer});

   std::ofstream stream(
     std::string{OUTPUT_FOLDER} + "/current_blob_id.txt", std::ios::binary | std::ios::trunc
   );
   if (!stream.is_open()) {
      return "error:Could not open file for writing";
   }

   stream.write(buffer.data(), buffer.size());
   if (!stream.good()) {
      return "error:Could not write data to file";
   }

   return "data:";
}

std::optional<std::string>
WasmHandler::OnGetLastSavedBlobIdEvent(std::string_view request_id, std::string_view) {
   return "data:" + std::to_string(last_saved_blob_id_);
}

std::optional<std::string>
WasmHandler::OnStoreLastSavedBlobIdEvent(std::string_view request_id, std::string_view buffer) {
   last_saved_blob_id_ = std::stoul(std::string{buffer});

   std::ofstream stream(
     std::string{OUTPUT_FOLDER} + "/last_saved_blob_id.txt", std::ios::binary | std::ios::trunc
   );
   if (!stream.is_open()) {
      return "error:Could not open file for writing";
   }

   stream.write(buffer.data(), buffer.size());
   if (!stream.good()) {
      return "error:Could not write data to file";
   }

   return "data:";
}