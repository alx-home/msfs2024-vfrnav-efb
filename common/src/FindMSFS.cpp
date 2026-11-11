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

#include "Utils/FindMSFS.h"

#include <windows/Env.h>
#include <filesystem>

std::string
FindMSFS() {
   auto const appdata{GetAppData()};
   auto const local_appdata{GetLocalAppData()};

   if (
     std::filesystem::path const steam{
       std::filesystem::path{appdata} / "Microsoft Flight Simulator 2024"
     };
     !appdata.empty() && std::filesystem::is_directory(steam)
   ) {
      return steam.string();
   }

   if (
     std::filesystem::path const msStore{
       std::filesystem::path{local_appdata} / "Packages" / "Microsoft.Limitless_8wekyb3d8bbwe"
     };
     !local_appdata.empty() && std::filesystem::is_directory(msStore)
   ) {
      return msStore.string();
   }

   return "";
}