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

#include <MSFS/MSFS.h>
#include <MSFS/MSFS_CommBus.h>

#include <deque>
#include <fstream>
#include <iostream>
#include <string>
#include <optional>
#include <string_view>

constexpr char const* STORE_FLIGHTS_EVENT = "VFRNAV_STORE_FLIGHTS";
constexpr char const* GET_FLIGHTS_EVENT   = "VFRNAV_GET_FLIGHTS";

constexpr char const* GET_LAST_SAVED_BLOB_ID_EVENT   = "VFRNAV_GET_LAST_SAVED_BLOB_ID";
constexpr char const* STORE_LAST_SAVED_BLOB_ID_EVENT = "VFRNAV_STORE_LAST_SAVED_BLOB_ID";
constexpr char const* GET_CURRENT_BLOB_ID_EVENT      = "VFRNAV_GET_CURRENT_BLOB_ID";
constexpr char const* STORE_CURRENT_BLOB_ID_EVENT    = "VFRNAV_STORE_CURRENT_BLOB_ID";

constexpr char const* STORE_BLOB_EVENT  = "VFRNAV_STORE_BLOB";
constexpr char const* DELETE_BLOB_EVENT = "VFRNAV_DELETE_BLOB";
constexpr char const* GET_BLOB_EVENT    = "VFRNAV_GET_BLOB";
constexpr char const* RESPONSE_EVENT    = "VFRNAV_WASM_RESPONSE";
constexpr char const* WASM_INIT         = "VFRNAV_WASM_INIT";
constexpr char const* OUTPUT_FOLDER     = "/work";

void OnEvent(char const* buffer, unsigned int size, void* ctx);
void OnWasmInit(char const* buffer, unsigned int size, void* ctx);

struct Payload {
   std::string_view key_;
   std::string_view data_;
};

class WasmHandler;
using Context = std::pair<
  WasmHandler*,
  std::optional<std::string> (WasmHandler::*)(std::string_view, std::string_view)>;
class WasmHandler {
public:
   WasmHandler();
   virtual ~WasmHandler();

   Context& StoreBlobContext();
   Context& DeleteBlobContext();
   Context& GetBlobContext();

   Context& StoreFlightsContext();
   Context& GetFlightsContext();

   Context& GetLastSavedBlobIdContext();
   Context& StoreLastSavedBlobIdContext();
   Context& GetCurrentBlobIdContext();
   Context& StoreCurrentBlobIdContext();

   Context& WasmInitContext();

   std::optional<Payload> ParsePayload(std::string_view payload);
   std::string            BuildPayload(std::string_view key, std::string_view data);

   friend void OnEvent(char const* buffer, unsigned int size, void* ctx);
   friend void OnWasmInit(char const* buffer, unsigned int size, void* ctx);

private:
   std::deque<Context> contexts_{};
   std::size_t         request_id_counter_ = 0;
   std::size_t         last_saved_blob_id_ = [] {
      std::ifstream stream(std::string{OUTPUT_FOLDER} + "/last_saved_blob_id.txt");
      if (stream.is_open()) {
         std::size_t id;
         stream >> id;
         return id;
      } else {
         std::cerr
           << "Warning: Could not open last_saved_blob_id.txt for reading, starting with id 0"
           << std::endl;
         return 0ul;
      }
   }();
   std::size_t current_blob_id_ = [this]() {
      std::ifstream stream(std::string{OUTPUT_FOLDER} + "/current_blob_id.txt");
      if (stream.is_open()) {
         std::size_t id;
         stream >> id;
         return id;
      } else {
         std::cerr << "Warning: Could not open current_blob_id.txt for reading, starting with id 0"
                   << std::endl;
         return last_saved_blob_id_ + 1;
      }
   }();

   template <
     std::optional<std::string> (WasmHandler::*MEMBER_POINTER)(std::string_view, std::string_view)>
   Context& MakeContext() {
      if (auto it = std::find_if(
            contexts_.begin(),
            contexts_.end(),
            [](Context const& ctx) { return ctx.second == MEMBER_POINTER; }
          );
          it != contexts_.end()) {
         return *it;
      }

      return contexts_.emplace_back(this, MEMBER_POINTER);
   }

   std::string SaveBlobEntry(Payload const& payload);
   std::string DeleteBlobEntry(std::string_view key);
   std::string LoadBlobEntry(std::string_view key);

   std::optional<std::string>
   OnStoreBlobEvent(std::string_view request_id, std::string_view buffer);
   std::optional<std::string>
   OnDeleteBlobEvent(std::string_view request_id, std::string_view buffer);
   std::optional<std::string> OnGetBlobEvent(std::string_view request_id, std::string_view buffer);

   std::optional<std::string> OnWasmInitEvent(std::string_view request_id, std::string_view buffer);

   std::optional<std::string>
   OnStoreFlightsEvent(std::string_view request_id, std::string_view buffer);
   std::optional<std::string>
   OnGetFlightsEvent(std::string_view request_id, std::string_view buffer);

   std::optional<std::string>
   OnGetLastSavedBlobIdEvent(std::string_view request_id, std::string_view buffer);
   std::optional<std::string>
   OnGetCurrentBlobIdEvent(std::string_view request_id, std::string_view buffer);
   std::optional<std::string>
   OnStoreCurrentBlobIdEvent(std::string_view request_id, std::string_view buffer);
   std::optional<std::string>
   OnStoreLastSavedBlobIdEvent(std::string_view request_id, std::string_view buffer);
};
