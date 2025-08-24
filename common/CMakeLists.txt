add_library(vfrnav_common
      src/LaunchMode.cpp
      src/FindMSFS.cpp
)

target_include_directories(vfrnav_common PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/include")
target_link_libraries(vfrnav_common PUBLIC alx-home::windows)

add_library(vfrnav::common ALIAS vfrnav_common)

add_custom_target(vfrnav_common_ts)
target_sources(vfrnav_common_ts PRIVATE
      ${CMAKE_CURRENT_SOURCE_DIR}/ts/Popup.tsx
      ${CMAKE_CURRENT_SOURCE_DIR}/ts/env.d.ts

      ${CMAKE_CURRENT_SOURCE_DIR}/../eslint.config.ts
)