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

#include "Aircraft.h"

template <class TYPE, class... ARGS>
void
Aircraft::NotifyException(ARGS&&... args) {
   if (!running_) {
      return;
   }

   auto const [_, _, reject] = [this] constexpr {
      std::shared_lock lock{mutex_};
      return *update_pcv_;
   }();

   reject->template Apply<TYPE>(std::forward<ARGS>(args)...);
}
