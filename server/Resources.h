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

#include <span>
#include <string>
#include <unordered_map>
#include <windows/Resources.h>

using AppResources = std::unordered_map<std::string, std::span<const std::byte>>;

#ifndef WATCH_MODE
extern AppResources const MAIN_WINDOW_RESOURCES;
extern AppResources const TASKBAR_WINDOW_RESOURCES;
extern AppResources const TASKBAR_TOOLTIP_WINDOW_RESOURCES;
extern AppResources const EFB_RESOURCES;
#endif

#define WM_SYSTEM_TRAY   WM_APP + 1
#define WM_OPEN_SETTINGS WM_SYSTEM_TRAY + 1
#define WM_OPEN_EFB      WM_OPEN_SETTINGS + 1
#define WM_OPEN_WEB      WM_OPEN_EFB + 1