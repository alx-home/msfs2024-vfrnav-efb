#
# SPDX-License-Identifier: (GNU General Public License v3.0 only)
# Copyright © 2024 Alexandre GARCIN
#
# This program is free software: you can redistribute it and/or modify it under the terms of the
# GNU General Public License as published by the Free Software Foundation, version 3.
#
# This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
# even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License along with this program. If
# not, see <https://www.gnu.org/licenses/>.
#

win32_library(TARGET_NAME vfrnav_window 
   FILES 
      window/windows/FileDialog.cpp
)

target_include_directories(vfrnav_window PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)

target_link_libraries(vfrnav_window 
   PUBLIC 
      alx-home::cpp_utils
      alx-home::windows
      alx-home::promise
      alx-home::json
)
add_library(vfrnav::window ALIAS vfrnav_window)
