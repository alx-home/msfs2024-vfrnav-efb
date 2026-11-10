/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright (c) 2024 Alexandre GARCIN
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

#include <cstddef>
#include <string>
#include <string_view>
#include <vector>

namespace ia {

std::string            BuildSiaAuthToken(std::string_view url, std::string_view secret);
std::vector<std::byte> FetchSiaPdf(std::string_view url, std::string_view secret);

}  // namespace ia
