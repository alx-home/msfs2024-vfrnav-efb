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

#include "main.h"

#include <promise/promise.h>

template <class T, bool WITH_RESOLVER>
class MPromise : public Promise<T, WITH_RESOLVER> {
public:
   using Promise<T, WITH_RESOLVER>::Promise;

   using Promise<T, WITH_RESOLVER>::Then;
   using Promise<T, WITH_RESOLVER>::Finally;
   using Promise<T, WITH_RESOLVER>::Catch;
   using Promise<T, WITH_RESOLVER>::Notify;
   using Promise<T, WITH_RESOLVER>::Reset;

   auto await_transform() { return promise::Race(*this, Main::Get()->WaitTerminate()); }
};