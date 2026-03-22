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

template <WIN WINDOW>
Promise<>
Window<WINDOW>::HideTaskbar() {
   co_return main_.CloseTaskbar();
}

template <WIN WINDOW>
Promise<>
Window<WINDOW>::ShowTaskbar() {
   co_return main_.OpenTaskbar();
}

template <WIN WINDOW>
Promise<>
Window<WINDOW>::HideToolTip() {
   co_return main_.CloseToolTip();
}

template <WIN WINDOW>
Promise<>
Window<WINDOW>::OpenEFB() {
   co_return main_.OpenEFB();
}

template <WIN WINDOW>
Promise<>
Window<WINDOW>::OpenWebEFB() {
   co_return main_.OpenWebEFB();
}

template <WIN WINDOW>
Promise<>
Window<WINDOW>::ShowToolTip() {
   co_return main_.OpenToolTip();
}