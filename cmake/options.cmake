# Watch Mode

option(WATCH_MODE "Enable watch mode in debug mode" ON)

if (NOT CMAKE_BUILD_TYPE STREQUAL "Debug")
    set(WATCH_MODE false)
endif()

# Promise

option(PROMISE_MEMCHECK_RELEASE "Enable promise leak detection in release mode" OFF)
option(PROMISE_MEMCHECK_DEBUG "Enable promise leak detection in debug mode" ON)

# Webview

if(CMAKE_SYSTEM_NAME STREQUAL "Windows")
   option(WEBVIEW_USE_BUILTIN_MSWEBVIEW2 "Use built-in MS WebView2" ON)
endif()