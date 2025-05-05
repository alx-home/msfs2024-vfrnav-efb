if(EXISTS "${MSFS_SDK_LOCATION}/SimConnect SDK/include/SimConnect.h"
   AND EXISTS "${MSFS_SDK_LOCATION}/SimConnect SDK/lib/static/SimConnect.lib")
   set(MSFS_SDK_INCLUDE_DIR "${MSFS_SDK_LOCATION}/SimConnect SDK/include")

   add_library(msfs_sdk STATIC IMPORTED)

   target_include_directories(msfs_sdk INTERFACE
      "${MSFS_SDK_INCLUDE_DIR}"
   )

   if(CMAKE_BUILD_TYPE STREQUAL "Debug")
      set_target_properties(msfs_sdk PROPERTIES
         IMPORTED_LOCATION
            "${MSFS_SDK_LOCATION}/SimConnect SDK/lib/static/SimConnect_debug.lib"
         IMPORTED_LINK_INTERFACE_LIBRARIES
            shlwapi
            user32
            Ws2_32
      )
   else()
      set_target_properties(msfs_sdk PROPERTIES
         IMPORTED_LOCATION
            "${MSFS_SDK_LOCATION}/SimConnect SDK/lib/static/SimConnect.lib"
         IMPORTED_LINK_INTERFACE_LIBRARIES
            shlwapi
            user32
            Ws2_32
      )
   endif()
endif()

include(FindPackageHandleStandardArgs)

FIND_PACKAGE_HANDLE_STANDARD_ARGS(MSFS_SDK REQUIRED_VARS MSFS_SDK_INCLUDE_DIR)