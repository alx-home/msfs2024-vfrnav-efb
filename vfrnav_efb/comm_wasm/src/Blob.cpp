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
#include <iostream>
#include <optional>

Context&
WasmHandler::StoreBlobContext() {
   return MakeContext<&WasmHandler::OnStoreBlobEvent>();
}
Context&
WasmHandler::DeleteBlobContext() {
   return MakeContext<&WasmHandler::OnDeleteBlobEvent>();
}
Context&
WasmHandler::GetBlobContext() {
   return MakeContext<&WasmHandler::OnGetBlobEvent>();
}

std::string
WasmHandler::SaveBlobEntry(Payload const& payload) {
   if (payload.data_.size() % 4 != 0) {
      return "error:Data size must be a multiple of 4 bytes, received "
             + std::to_string(payload.data_.size()) + " bytes";
   }

   if (payload.key_.size() < 6 || payload.key_.substr(0, 5) != "blob-"
       || !std::all_of(payload.key_.substr(5).begin(), payload.key_.end(), ::isdigit)) {
      return R"(error:Key must be of the form "blob-[0-9]+", received ")"
             + std::string{payload.key_} + "\"";
   }

   std::ofstream stream(
     std::string{OUTPUT_FOLDER} + "/" + std::string(payload.key_) + ".bin",
     std::ios::binary | std::ios::trunc
   );
   if (!stream.is_open()) {
      return "error:Could not open file for writing";
   }

   stream.write(payload.data_.data(), payload.data_.size());
   if (!stream.good()) {
      return "error:Could not write data to file";
   }

   return "data:";
}

std::string
WasmHandler::DeleteBlobEntry(std::string_view key) {
   auto const path = std::string{OUTPUT_FOLDER} + "/" + std::string{key} + ".bin";
   if (std::remove(path.c_str()) != 0) {
      return "error:Could not delete file";
   }

   return "data:";
}

std::string
WasmHandler::LoadBlobEntry(std::string_view key) {
   auto const    path = std::string{OUTPUT_FOLDER} + "/" + std::string{key} + ".bin";
   std::ifstream stream(path, std::ios::binary);
   if (!stream.is_open()) {
      return "error:Could not open file for reading";
   }

   stream.seekg(0, std::ios::end);
   auto const size = stream.tellg();
   stream.seekg(0, std::ios::beg);

   if (size <= 0) {
      return "error:File is empty";
   }

   std::string content;
   content.resize(static_cast<std::size_t>(size));
   stream.read(content.data(), size);
   if (!stream.good() && !stream.eof()) {
      return "error:Could not read data from file";
   }

   return "data:" + content;
}

std::optional<std::string>
WasmHandler::OnStoreBlobEvent(std::string_view request_id, std::string_view buffer) {
   auto payload_opt = ParsePayload(buffer);
   if (!payload_opt.has_value()) {
      return "error:Invalid payload format";
   }

   return SaveBlobEntry(*payload_opt);
}

std::optional<std::string>
WasmHandler::OnDeleteBlobEvent(std::string_view request_id, std::string_view buffer) {
   auto payload_opt = ParsePayload(buffer);
   if (!payload_opt.has_value()) {
      return "error:Invalid payload format";
   }

   return DeleteBlobEntry(payload_opt->key_);
}

std::optional<std::string>
WasmHandler::OnGetBlobEvent(std::string_view request_id, std::string_view buffer) {
   auto payload_opt = ParsePayload(buffer);
   if (!payload_opt.has_value()) {
      return "error:Invalid payload format";
   }

   auto content_opt = LoadBlobEntry(payload_opt->key_);
   if (content_opt.starts_with("error:")) {
      return content_opt;  // Propagate error message
   }

   if (!content_opt.starts_with("data:")) {
      return "error:Unexpected response format from LoadBlobEntry";
   }

   auto response_payload =
     BuildPayload(payload_opt->key_, content_opt.substr(5));  // Remove "data:" prefix
   return "data:" + response_payload;
}