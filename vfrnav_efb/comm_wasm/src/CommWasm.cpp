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

#include <algorithm>

WasmHandler::WasmHandler() {
   for (std::size_t id = last_saved_blob_id_ + 1; id < current_blob_id_; ++id) {
      std::cout << "Deleting leftover blob file with id " << id << std::endl;
      auto const result = DeleteBlobEntry("blob-" + std::to_string(id));

      if (result.substr(0, 6) == "error:") {
         std::cerr << "Warning: Failed to delete leftover blob file with id " << id << ": "
                   << result.substr(6) << std::endl;
      }
   }

   OnStoreCurrentBlobIdEvent("", std::to_string(last_saved_blob_id_ + 1));

   fsCommBusRegister(WASM_INIT, OnWasmInit, &this->WasmInitContext());
   fsCommBusRegister(STORE_BLOB_EVENT, OnEvent, &this->StoreBlobContext());
   fsCommBusRegister(DELETE_BLOB_EVENT, OnEvent, &this->DeleteBlobContext());
   fsCommBusRegister(GET_BLOB_EVENT, OnEvent, &this->GetBlobContext());

   fsCommBusRegister(STORE_FLIGHTS_EVENT, OnEvent, &this->StoreFlightsContext());
   fsCommBusRegister(GET_FLIGHTS_EVENT, OnEvent, &this->GetFlightsContext());

   fsCommBusRegister(GET_LAST_SAVED_BLOB_ID_EVENT, OnEvent, &this->GetLastSavedBlobIdContext());
   fsCommBusRegister(STORE_LAST_SAVED_BLOB_ID_EVENT, OnEvent, &this->StoreLastSavedBlobIdContext());
   fsCommBusRegister(GET_CURRENT_BLOB_ID_EVENT, OnEvent, &this->GetCurrentBlobIdContext());
   fsCommBusRegister(STORE_CURRENT_BLOB_ID_EVENT, OnEvent, &this->StoreCurrentBlobIdContext());
}

WasmHandler::~WasmHandler() { fsCommBusUnregisterAll(); }

Context&
WasmHandler::WasmInitContext() {
   return MakeContext<&WasmHandler::OnWasmInitEvent>();
}

std::optional<std::string>
WasmHandler::OnWasmInitEvent(std::string_view, std::string_view) {
   return "data:" + std::to_string(request_id_counter_);
}

std::string
WasmHandler::BuildPayload(std::string_view key, std::string_view data) {
   std::string payload;
   payload.reserve(key.size() + 1 + data.size());
   payload.append(key.data(), key.size());
   payload.push_back(':');
   payload.append(data.data(), data.size());

   return payload;
}

std::optional<Payload>
WasmHandler::ParsePayload(std::string_view payload) {
   if (payload.empty()) {
      return std::nullopt;
   }

   if (auto const pos = payload.find_first_of(':'); pos == std::string_view::npos) {
      // Invalid payload format
      return std::nullopt;
   } else {
      return Payload{
        .key_  = payload.substr(0, pos),
        .data_ = payload.size() > pos + 1 ? payload.substr(pos + 1) : std::string_view{},
      };
   }
}

void
OnEvent(char const* buffer, unsigned int size, void* ctx) {
   std::string_view data{buffer, size - 1};  // Exclude null terminator
   auto [handler, pointer] = *static_cast<Context*>(ctx);

   if (auto const payload = handler->ParsePayload(data); payload.has_value()) {
      handler->request_id_counter_ =
        std::max<std::size_t>(handler->request_id_counter_, std::stoull(payload->key_.data()));

      auto const response = (handler->*pointer)(payload->key_, payload->data_);

      if (response.has_value()) {
         auto const response_payload = handler->BuildPayload(payload->key_, *response);
         fsCommBusCall(
           RESPONSE_EVENT, response_payload.data(), response_payload.size(), FsCommBusBroadcast_JS
         );
      }
   }
}

void
OnWasmInit(char const* buffer, unsigned int size, void* ctx) {
   std::string_view data{buffer, size - 1};  // Exclude null terminator
   auto [handler, pointer] = *static_cast<Context*>(ctx);

   if (auto const payload = handler->ParsePayload(data); payload.has_value()) {
      handler->request_id_counter_ =
        std::max<std::size_t>(handler->request_id_counter_, std::stoull(payload->key_.data()));

      auto const response = (handler->*pointer)(payload->key_, payload->data_);

      if (response.has_value()) {
         fsCommBusCall(WASM_INIT, response->data(), response->size(), FsCommBusBroadcast_JS);
      }
   }
}

static std::unique_ptr<WasmHandler> handler{};

extern "C" MSFS_CALLBACK void
module_init(void) {
   handler = std::make_unique<WasmHandler>();
}

extern "C" MSFS_CALLBACK void
module_update(void) {}

extern "C" MSFS_CALLBACK void
module_deinit(void) {
   handler.reset();
}