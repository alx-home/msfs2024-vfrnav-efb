/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2026 Alexandre GARCIN
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

#include "main.h"
#include "Registry/Registry.h"
#include "windows/Registry/impl/Registry.h"

Promise<>
Main::SetLang(std::string lang) {
   lang_ = std::move(lang);
   co_return;
}

Promise<std::string>
Main::GetLang() {
   if (lang_ == "default") {
      auto& registry = registry::Get();
      auto& settings = registry.alx_home_->settings_;
      try {
         lang_ = *settings->lang_;
      } catch (registry::AccessError const&) {
         co_return lang_;
      }
   }

   co_return lang_;
}