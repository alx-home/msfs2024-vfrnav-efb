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

#include <string>

namespace registry {

template <Store STORE, class PARENT>
class Uninstall : public Key<STORE, "Uninstall\\MSFS VFRNav Server", PARENT, true> {
public:
   Uninstall() = default;

   Value<std::string, Uninstall, "DisplayIcon">     icon_{};
   Value<std::string, Uninstall, "DisplayName">     name_{};
   Value<std::string, Uninstall, "Publisher">       publisher_{};
   Value<std::string, Uninstall, "DisplayVersion">  version_{};
   Value<std::string, Uninstall, "UninstallString"> uninstall_{};

   static constexpr Values VALUES{
     &Uninstall::icon_,
     &Uninstall::name_,
     &Uninstall::publisher_,
     &Uninstall::version_,
     &Uninstall::uninstall_,
   };

   static constexpr KeysPtr<> KEYS{};
};

}  // namespace registry