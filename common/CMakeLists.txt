add_library(vfrnav_common 
      src/LaunchMode.cpp
)

target_include_directories(vfrnav_common PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/include")
target_link_libraries(vfrnav_common PUBLIC alx-home::windows)

add_library(vfrnav::common ALIAS vfrnav_common)
