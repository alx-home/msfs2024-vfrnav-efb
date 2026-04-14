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

#include "../Data/Break.h"
#include "../Data/Flaps.h"
#include "../Data/GroundInfo.h"
#include "../Data/ServerPort.h"
#include "../Data/SimRate.h"
#include "../Data/TrafficInfo.h"
#include "../Data/Waypoint.h"

#include "StaticCast.inl"

namespace smc {

template Break       SimConnect::StaticCast<Break>(DWORD const& data);
template Flaps       SimConnect::StaticCast<Flaps>(DWORD const& data);
template GroundInfo  SimConnect::StaticCast<GroundInfo>(DWORD const& data);
template ServerPort  SimConnect::StaticCast<ServerPort>(DWORD const& data);
template SimRate     SimConnect::StaticCast<SimRate>(DWORD const& data);
template TrafficInfo SimConnect::StaticCast<TrafficInfo>(DWORD const& data);
template Waypoint    SimConnect::StaticCast<Waypoint>(DWORD const& data);

template std::size_t SimConnect::Size<Break>();
template std::size_t SimConnect::Size<Flaps>();
template std::size_t SimConnect::Size<GroundInfo>();
template std::size_t SimConnect::Size<ServerPort>();
template std::size_t SimConnect::Size<SimRate>();
template std::size_t SimConnect::Size<TrafficInfo>();
template std::size_t SimConnect::Size<Waypoint>();

}  // namespace smc