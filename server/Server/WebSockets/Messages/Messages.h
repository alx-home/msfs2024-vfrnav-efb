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
struct Header {
   js::Enum<"vfrnav"> proto_{"vfrnav"};

   static constexpr auto PROTOTYPE{js::Proto{
     js::_{"proto", &Header::proto_},
   }};
};

struct HelloWorld : Header {
   js::Enum<"EFB", "Web"> type_{"EFB"};

   static constexpr js::Proto PROTOTYPE{
     js::Extend{
       Header::PROTOTYPE,
       js::_{"__HELLO_WORLD__", &HelloWorld::type_},
     },
   };
};

struct Settings;
struct GetSettings;
struct GetRecords;
struct GetFacilities;
struct Facilities;
struct GetMetar;
struct Metar;
struct PlanePos;
struct PlanePoses;
struct Records;
struct RemoveRecord;
struct EditRecord;
struct ActiveRecord;
struct GetRecord;
}  // namespace ws::msg

#include "Facilities.h"
#include "GetMetar.h"
#include "Records.h"
#include "Settings.h"
#include "PlanePos.h"

namespace ws {
using Message = std::variant<
  msg::PlanePoses,
  msg::PlanePos,
  msg::Facilities,
  msg::GetFacilities,
  msg::GetMetar,
  msg::Metar,
  msg::GetRecords,
  msg::Records,
  msg::GetSettings,
  msg::Settings,
  msg::GetRecord,
  msg::EditRecord,
  msg::ActiveRecord,
  msg::RemoveRecord,
  msg::HelloWorld>;
}  // namespace ws