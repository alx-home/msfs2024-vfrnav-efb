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

file(GLOB_RECURSE APP_CONTENT_DEPENDS LIST_DIRECTORIES false CONFIGURE_DEPENDS
   ${CMAKE_CURRENT_SOURCE_DIR}/src/*
)

set(BUILD_DEPENDS
      ${CMAKE_CURRENT_SOURCE_DIR}/index.html
      ${CMAKE_CURRENT_SOURCE_DIR}/build.ts
      ${CMAKE_CURRENT_SOURCE_DIR}/package.json
      ${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.json
      ${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.app.json
      ${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.build.json
      ${CMAKE_CURRENT_SOURCE_DIR}/../.env.development
      ${CMAKE_CURRENT_SOURCE_DIR}/../.env.production
      ${CMAKE_CURRENT_SOURCE_DIR}/tailwind.config.ts
)

ts_app(TARGET_NAME vfrnav_efb_embedded
   BUILD_TARGET "build$<$<CONFIG:DEBUG>:\:dev>" -- --embedded
   OUTPUT_DIR
      ${CMAKE_CURRENT_BINARY_DIR}/../dist/efb
   OUTPUT
      ${CMAKE_CURRENT_BINARY_DIR}/../dist/efb/index.html

   DEPENDS
      ${BUILD_DEPENDS}
      ${APP_CONTENT_DEPENDS}
      ${SHARED_DEPENDS}
)

ts_app(TARGET_NAME vfrnav_efb
   OUTPUT_DIR
      ${CMAKE_CURRENT_BINARY_DIR}/../efb
   OUTPUT
      ${CMAKE_CURRENT_BINARY_DIR}/../efb/index.html

   DEPENDS
      ${BUILD_DEPENDS}
      ${APP_CONTENT_DEPENDS}
      ${SHARED_DEPENDS}
)
