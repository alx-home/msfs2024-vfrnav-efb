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

cmake_minimum_required(VERSION 3.20)

project(vfrnav LANGUAGES CXX)

# CMake Options
include(${CMAKE_CURRENT_SOURCE_DIR}/cmake/options.cmake)

# set(FETCHCONTENT_SOURCE_DIR_MICROSOFT_WEB_WEBVIEW2 ${CMAKE_SOURCE_DIR}/packages/Microsoft.Web.WebView2/)
set(FETCHCONTENT_SOURCE_DIR_TS_UTILS ${CMAKE_SOURCE_DIR}/packages/ts-utils)
set(FETCHCONTENT_SOURCE_DIR_BUILD_TOOLS ${CMAKE_SOURCE_DIR}/packages/build_tools)
set(FETCHCONTENT_SOURCE_DIR_WEBVIEW ${CMAKE_SOURCE_DIR}/packages/webview)
set(FETCHCONTENT_SOURCE_DIR_JSON ${CMAKE_SOURCE_DIR}/packages/json)
set(FETCHCONTENT_SOURCE_DIR_PROMISE ${CMAKE_SOURCE_DIR}/packages/promise)
set(FETCHCONTENT_SOURCE_DIR_WINDOWS ${CMAKE_SOURCE_DIR}/packages/windows)
set(FETCHCONTENT_SOURCE_DIR_CPP_UTILS ${CMAKE_SOURCE_DIR}/packages/cpp_utils)

add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/packages/build_tools)

include(${CMAKE_CURRENT_SOURCE_DIR}/cmake/dependencies.cmake)

add_subdirectory(window)
add_subdirectory(common)
add_subdirectory(packager)
add_subdirectory(vfrnav_efb)
add_subdirectory(server)
add_subdirectory(installer)


add_custom_target(init_submodules
   WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
   COMMAND git submodule update --init --recursive
)

add_custom_target(init_npm 
   WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}/app
   COMMENT "initializing npm modules"
   COMMAND npm install
)

add_custom_target(init 
   COMMENT "initializing git submodules"
   DEPENDS init_submodules init_npm
)