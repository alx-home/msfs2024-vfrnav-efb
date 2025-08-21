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

namespace ws::msg {
struct HelloWorld {
   js::Enum<"EFB", "Web", "Server"> type_{"Server"};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__HELLO_WORLD__", &HelloWorld::type_},
   };
};

struct ByeBye {
   bool header_{true};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__BYE_BYE__", &ByeBye::header_},
   };
};

struct SetId {
   std::size_t id_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__SET_ID__", &SetId::id_},
   };
};

struct ServerState {
   bool header_{true};

   bool state_{false};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__SERVER_STATE__", &ServerState::header_},
     js::_{"state", &ServerState::state_},
   };
};

struct GetServerState {
   bool header_{true};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_SERVER_STATE__", &GetServerState::header_},
   };
};

struct EFBState {
   bool header_{true};

   bool state_{false};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__EFB_STATE__", &EFBState::header_},
     js::_{"state", &EFBState::state_},
   };
};

struct GetEFBState {
   bool header_{true};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_EFB_STATE__", &GetEFBState::header_},
   };
};

}  // namespace ws::msg

#include "Facilities.h"
#include "Files.h"
#include "Fuel.h"
#include "Deviation.h"
#include "GetMetar.h"
#include "NavData.h"
#include "Pdfs.h"
#include "PlanePos.h"
#include "Records.h"
#include "Settings.h"

namespace ws {

using Message = std::variant<
  msg::ByeBye,
  msg::EditRecord,
  msg::EFBState,
  msg::ExportNav,
  msg::ExportPdfs,
  msg::Facilities,
  msg::FileExists,
  msg::FileExistsResponse,
  msg::Fuel,
  msg::fuel::Curves,
  msg::fuel::DefaultPreset,
  msg::fuel::DeletePreset,
  msg::fuel::GetCurve,
  msg::fuel::GetPresets,
  msg::fuel::Presets,
  msg::dev::Curve,
  msg::dev::DefaultPreset,
  msg::dev::DeletePreset,
  msg::dev::GetCurve,
  msg::dev::GetPresets,
  msg::dev::Presets,
  msg::GetEFBState,
  msg::GetFacilities,
  msg::GetFile,
  msg::GetFileResponse,
  msg::GetFuel,
  msg::GetIcaos,
  msg::GetLatLon,
  msg::GetMetar,
  msg::GetRecord,
  msg::GetRecords,
  msg::GetServerState,
  msg::GetSettings,
  msg::HelloWorld,
  msg::Icaos,
  msg::ImportNav,
  msg::LatLon,
  msg::Metar,
  msg::OpenFile,
  msg::OpenFileResponse,
  msg::PlanePos,
  msg::PlanePoses,
  msg::Records,
  msg::RemoveRecord,
  msg::ServerState,
  msg::SetId,
  msg::Settings>;

struct Proxy {
   std::size_t id_{};
   Message     content_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"id", &Proxy::id_},
     js::_{"content", &Proxy::content_},
   };
};
}  // namespace ws