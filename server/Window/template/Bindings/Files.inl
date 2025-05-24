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

#include "../Window.h"
#include "Base64Utils.h"

#include <window/FileDialog.h>
#include <filesystem>
#include <vector>

template <WIN WINDOW>
Promise<std::string>
Window<WINDOW>::OpenFile(std::string defaultPath, std::vector<dialog::Filter> filters) {
   co_return co_await dialog::OpenFile(defaultPath, std::move(filters));
}

template <WIN WINDOW>
Promise<std::string>
Window<WINDOW>::OpenFolder(std::string defaultPath) {
   co_return co_await dialog::OpenFolder(defaultPath);
}

template <WIN WINDOW>
Promise<std::string>
Window<WINDOW>::GetFile(std::string path) {
   co_return Base64Open(path);
}

template <WIN WINDOW>
Promise<bool>
Window<WINDOW>::ParentExists(std::string path) {
   std::filesystem::path const fs_path = path;
   co_return fs_path.has_parent_path() && std::filesystem::exists(fs_path.parent_path());
}

template <WIN WINDOW>
Promise<bool>
Window<WINDOW>::Exists(std::string path) {
   co_return std::filesystem::exists(path);
}

template <WIN WINDOW>
Promise<bool>
Window<WINDOW>::FileExists(std::string path) {
   co_return std::filesystem::is_regular_file(path);
}