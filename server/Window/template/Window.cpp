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

#include "Window.inl"

#include "Bindings/abort.inl"
#include "Bindings/exists.inl"
#include "Bindings/log.inl"
#include "Bindings/openFile.inl"
#include "Bindings/openFolder.inl"
#include "Bindings/parentExists.inl"
#include "Bindings/Taskbar.inl"
#include "Bindings/Settings.inl"

template class Window<WIN::MAIN>;
template class Window<WIN::TASKBAR>;
template class Window<WIN::TASKBAR_TOOLTIP>;
template class Window<WIN::EFB>;