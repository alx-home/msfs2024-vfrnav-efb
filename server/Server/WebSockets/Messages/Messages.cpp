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

#include <json/json.inl>

namespace js {

#ifdef __clang__
#   pragma clang diagnostic push
#   pragma clang diagnostic ignored "-Wunused-function"
#endif

template <>
void JsonImpl<ws::msg::HelloWorld>();
template <>
void JsonImpl<ws::msg::ByeBye>();

template <>
void JsonImpl<ws::msg::Settings>();
template <>
void JsonImpl<ws::msg::GetSettings>();
template <>
void JsonImpl<ws::msg::GetRecords>();
template <>
void JsonImpl<ws::msg::GetFacilities>();
template <>
void JsonImpl<ws::msg::Facilities>();
template <>
void JsonImpl<ws::msg::GetMetar>();
template <>
void JsonImpl<ws::msg::Metar>();
template <>
void JsonImpl<ws::msg::PlanePos>();
template <>
void JsonImpl<ws::msg::PlaneBlob>();
template <>
void JsonImpl<ws::msg::Records>();
template <>
void JsonImpl<ws::msg::RemoveRecord>();
template <>
void JsonImpl<ws::msg::EditRecord>();
template <>
void JsonImpl<ws::msg::GetPlaneBlob>();
template <>
void JsonImpl<ws::msg::FileExists>();
template <>
void JsonImpl<ws::msg::FileExistsResponse>();
template <>
void JsonImpl<ws::msg::OpenFile>();
template <>
void JsonImpl<ws::msg::OpenFileResponse>();

#ifdef __clang__
#   pragma clang diagnostic pop
#endif
}  // namespace js