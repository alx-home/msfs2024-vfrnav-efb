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

#include <chrono>
#include <span>
#include <string>
#include <unordered_map>

#ifndef WATCH_MODE
extern std::unordered_map<std::string, std::span<std::byte const>> const EMBEDED_RESOURCES;
#endif
extern std::unordered_map<std::string, std::span<std::byte const>> const EFB_RESOURCES;

extern std::span<std::byte const> const EFB_THUMBNAIL;
extern std::span<std::byte const> const EFB_RELEASE_NOTE;

extern std::span<std::byte const> const SERVER_BIN;

extern const std::chrono::file_clock::time_point TIMESTAMP;