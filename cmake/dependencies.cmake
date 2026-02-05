# IMPORTANT: If you use vcpkg for package management, always configure CMake with:
# -DCMAKE_TOOLCHAIN_FILE=PATH_TO_VCPKG/scripts/buildsystems/vcpkg.cmake
# This enables CMake to find vcpkg-installed packages like OpenSSL, Boost, etc.
include(FetchContent)

list(APPEND CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/cmake/modules")

find_package(MSFS_SDK MODULE REQUIRED)

message(STATUS "Fetching alx-home::ts-utils")
FetchContent_Declare(
    ts_utils
    GIT_REPOSITORY https://github.com/alx-home/ts-utils
    GIT_TAG 1.0.0
    GIT_PROGRESS TRUE
)

message(STATUS "Fetching alx-home::build_tools")
FetchContent_Declare(
    build_tools
    GIT_REPOSITORY https://github.com/alx-home/build_tools
    GIT_TAG 1.0.0
    GIT_PROGRESS TRUE
)

message(STATUS "Fetching alx-home::cpp_utils")
FetchContent_Declare(
    cpp_utils
    GIT_REPOSITORY https://github.com/alx-home/cpp_utils
    GIT_TAG 1.0.0
    GIT_PROGRESS TRUE
)

message(STATUS "Fetching alx-home::webview")
FetchContent_Declare(
    webview
    GIT_REPOSITORY https://github.com/alx-home/webview
    GIT_TAG 1.0.0
    GIT_PROGRESS TRUE
)

message(STATUS "Fetching alx-home::json")
FetchContent_Declare(
    json
    GIT_REPOSITORY https://github.com/alx-home/json
    GIT_TAG 1.0.0
    GIT_PROGRESS TRUE
)

message(STATUS "Fetching alx-home::promise")
FetchContent_Declare(
    promise
    GIT_REPOSITORY https://github.com/alx-home/promise
    GIT_TAG 1.0.0
    GIT_PROGRESS TRUE
)

message(STATUS "Fetching alx-home::windows")
FetchContent_Declare(
    windows
    GIT_REPOSITORY https://github.com/alx-home/windows
    GIT_TAG 1.0.0
    GIT_PROGRESS TRUE
)

message(STATUS "Fetching upx...")
FetchContent_Declare(
    upx
    GIT_REPOSITORY https://github.com/upx/upx.git
    GIT_TAG v5.0.2
    GIT_SHALLOW TRUE
    GIT_PROGRESS TRUE
)

message(STATUS "Fetching zlib...")
FetchContent_Declare(
    zlib
    GIT_REPOSITORY https://github.com/madler/zlib.git
    GIT_TAG v1.3.1
    GIT_SHALLOW TRUE
    GIT_PROGRESS TRUE
)

message(STATUS "Fetching boost library sources. This will take some time...")
FetchContent_Declare(
    Boost
    PATCH_COMMAND git -C libs/context checkout -- ./CMakeLists.txt
    COMMAND git -C libs/context apply ${CMAKE_CURRENT_LIST_DIR}/patches/boost.patch
    GIT_REPOSITORY https://github.com/boostorg/boost
    GIT_TAG boost-1.88.0
    GIT_SHALLOW TRUE
    GIT_PROGRESS TRUE
)

# Configure Boost and OpenSSL
find_program(MASM_EXECUTABLE ml64 REQUIRED)

FetchContent_MakeAvailable(zlib)

get_target_property(ZLIB_INCLUDE_DIR zlibstatic INCLUDE_DIRECTORIES)
get_target_property(ZLIB_LIBRARY zlibstatic BINARY_DIR)

if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(ZLIB_LIBRARY "${ZLIB_LIBRARY}/zlibstaticd.lib")
else()
    set(ZLIB_LIBRARY "${ZLIB_LIBRARY}/zlibstatic.lib")
endif()

set(BOOST_IOSTREAMS_ENABLE_ZLIB TRUE)
set(BOOST_ENABLE_CMAKE ON)
set(BOOST_LIBRARIES iostreams asio beast)

# Find or fetch OpenSSL for Boost::asio SSL
find_package(OpenSSL REQUIRED)

# vcpkg toolchain is already active
find_package(Iconv REQUIRED)
find_package(libjpeg-turbo CONFIG REQUIRED)
find_package(PNG REQUIRED)
find_package(PkgConfig)
pkg_check_modules(POPPLER_CPP REQUIRED IMPORTED_TARGET poppler-cpp)
find_package(lcms2 CONFIG REQUIRED)
find_package(Freetype CONFIG REQUIRED)
find_package(JPEG REQUIRED)
find_package(OpenJPEG CONFIG REQUIRED)

# @TODO first configure failed...
FetchContent_MakeAvailable(Boost upx build_tools cpp_utils windows promise json webview ts_utils)
