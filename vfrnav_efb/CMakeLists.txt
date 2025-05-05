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

file(GLOB_RECURSE SHARED_DEPENDS LIST_DIRECTORIES false CONFIGURE_DEPENDS 
  ${CMAKE_CURRENT_SOURCE_DIR}/src/shared/*
)

file(GLOB_RECURSE APP_CONTENT_DEPENDS LIST_DIRECTORIES false CONFIGURE_DEPENDS 
   ${CMAKE_CURRENT_SOURCE_DIR}/app/*
)

file(GLOB_RECURSE EFB_CONTENT_DEPENDS LIST_DIRECTORIES false CONFIGURE_DEPENDS 
   ${CMAKE_CURRENT_SOURCE_DIR}/EFB/src/*
)
list(APPEND EFB_CONTENT_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/EFB/tsconfig.json)

set(BUILD_DEPENDS
      ${CMAKE_CURRENT_SOURCE_DIR}/build.ts
      ${CMAKE_CURRENT_SOURCE_DIR}/package.json
      ${CMAKE_CURRENT_SOURCE_DIR}/eslint.config.mjs
      ${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.json
      ${CMAKE_CURRENT_SOURCE_DIR}/.env.development
      ${CMAKE_CURRENT_SOURCE_DIR}/.env.production
      ${CMAKE_CURRENT_SOURCE_DIR}/tailwind.config.ts
)

ts_app(TARGET_NAME vfrnav_efb
      BUILD_TARGET 
         "build$<$<CONFIG:DEBUG>:\:dev>" app
      APP_DIR 
         app
      OUTPUT_DIR 
         ${CMAKE_CURRENT_BINARY_DIR}/dist/efb
      OUTPUT
         ${CMAKE_CURRENT_BINARY_DIR}/dist/efb/index.html
   
      DEPENDS 
         ${BUILD_DEPENDS}
         ${APP_CONTENT_DEPENDS}
         ${SHARED_DEPENDS}
)

ts_app(TARGET_NAME vfrnav_efb_msfs
      BUILD_TARGET 
         "build$<$<CONFIG:DEBUG>:\:dev>" efb
      APP_DIR 
         EFB
       OUTPUT_DIR 
         ${CMAKE_CURRENT_BINARY_DIR}/dist
       OUTPUT
          ${CMAKE_CURRENT_BINARY_DIR}/dist/App.js

       DEPENDS 
         vfrnav_efb
         ${BUILD_DEPENDS}
         ${EFB_CONTENT_DEPENDS}
         ${SHARED_DEPENDS}
)
