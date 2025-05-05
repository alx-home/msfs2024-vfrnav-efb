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

#include "AlxHome.h"
#include "Install.h"
#include "Run.h"

namespace registry {

template <Store STORE, class PARENT>
class CurrentVersion
   : public Key<STORE, "Software\\Microsoft\\Windows\\CurrentVersion", PARENT, false> {
public:
   CurrentVersion() = default;

   KeyPtr<Uninstall<STORE, CurrentVersion>> uninstall_;
   KeyPtr<Run<STORE, CurrentVersion>>       run_;

   static constexpr Values  VALUES{};
   static constexpr KeysPtr KEYS{&CurrentVersion::uninstall_, &CurrentVersion::run_};
};

namespace details {

template <Store STORE>
class Registry : public registry::Key<STORE, "", void> {
public:
   KeyPtr<CurrentVersion<STORE, Registry>> current_version_;
   KeyPtr<AlxHome<STORE, Registry>>        alx_home_;

protected:
   Registry() = default;

public:
   static constexpr KeysPtr KEYS{&Registry::current_version_, &Registry::alx_home_};
};

}  // namespace details

template <Store STORE = Store::EHKEY_CURRENT_USER>
static constexpr auto&
Get() {
   return Registry<STORE, details::Registry<STORE>>::Get();
}

}  // namespace registry

template <Store STORE>
using Registry = registry::Registry<STORE, registry::details::Registry<STORE>>;