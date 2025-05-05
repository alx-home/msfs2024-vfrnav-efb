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

#include "Settings.h"

#include <windows/Registry/Registry.h>

namespace registry {

template <Store STORE, class PARENT>
class AlxHome : public Key<STORE, "Software\\Alx Home", PARENT, true> {
public:
   using key_t = Key<STORE, "Software\\Alx Home", PARENT, true>;

   AlxHome() = default;

   KeyPtr<Settings<STORE, AlxHome>> settings_;

   void Delete() {
      this->Apply([](auto&& key) { key.Delete(); });

      if (auto [keys, values] = key_t::Info(); !keys && !values) {
         key_t::Delete();
      }
   }

   static constexpr Values  VALUES{};
   static constexpr KeysPtr KEYS{&AlxHome::settings_};
};

}  // namespace registry