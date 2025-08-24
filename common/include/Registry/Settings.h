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

#include <windows/Registry/Registry.h>

namespace registry {

template <Store STORE, class PARENT>
class Settings : public Key<STORE, "MSFS2024 VFRNav' Server", PARENT, true> {
public:
   Settings() = default;

   Value<std::string, Settings, "LaunchMode">             launch_mode_;
   Value<std::string, Settings, "Community">              community_;
   Value<std::string, Settings, "Addon">                  addon_;
   Value<std::string, Settings, "Install">                destination_;
   Value<std::string, Settings, "DefaultPuelPreset">      default_fuel_preset_;
   Value<std::string, Settings, "DefaultDeviationPreset"> default_deviation_preset_;
   Value<bool, Settings, "AutoStartServer">               auto_start_server_;
   Value<uint16_t, Settings, "ServerPort">                server_port_;

   static constexpr Values VALUES{
     &Settings::launch_mode_,
     &Settings::community_,
     &Settings::addon_,
     &Settings::destination_,
     &Settings::default_fuel_preset_,
     &Settings::default_deviation_preset_,
     &Settings::auto_start_server_,
     &Settings::server_port_,
   };
   static constexpr KeysPtr<> KEYS{};
};

}  // namespace registry