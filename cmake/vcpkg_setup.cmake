message(WARNING "vcpkg setup may take some time on first run.")

if(DEFINED CMAKE_TOOLCHAIN_FILE)
   if(NOT EXISTS "${CMAKE_TOOLCHAIN_FILE}")
      message(STATUS "CMAKE_TOOLCHAIN_FILE not found at ${CMAKE_TOOLCHAIN_FILE}; falling back to local vcpkg.")
      unset(CMAKE_TOOLCHAIN_FILE CACHE)
      unset(CMAKE_TOOLCHAIN_FILE)
   endif()

   get_filename_component(_vcpkg_toolchain_dir "${CMAKE_TOOLCHAIN_FILE}" DIRECTORY)
   get_filename_component(_vcpkg_root_from_toolchain "${_vcpkg_toolchain_dir}/../.." ABSOLUTE)

   if(EXISTS "${_vcpkg_root_from_toolchain}")
      if(WIN32)
         set(_vcpkg_bootstrap_probe "${_vcpkg_root_from_toolchain}/bootstrap-vcpkg.bat")
         set(_vcpkg_exe_probe "${_vcpkg_root_from_toolchain}/vcpkg.exe")
      else()
         set(_vcpkg_bootstrap_probe "${_vcpkg_root_from_toolchain}/bootstrap-vcpkg.sh")
         set(_vcpkg_exe_probe "${_vcpkg_root_from_toolchain}/vcpkg")
      endif()

      if(EXISTS "${_vcpkg_bootstrap_probe}" OR EXISTS "${_vcpkg_exe_probe}")
         set(VCPKG_ROOT "${_vcpkg_root_from_toolchain}" CACHE PATH "vcpkg root" FORCE)
      endif()
   endif()
endif()

if(NOT DEFINED VCPKG_ROOT)
   if(DEFINED ENV{VCPKG_ROOT})
      set(VCPKG_ROOT "$ENV{VCPKG_ROOT}" CACHE PATH "vcpkg root")
   else()
      set(VCPKG_ROOT "${CMAKE_BINARY_DIR}/vcpkg" CACHE PATH "vcpkg root")
   endif()
endif()

if(NOT EXISTS "${VCPKG_ROOT}")
   file(MAKE_DIRECTORY "${VCPKG_ROOT}")
endif()

set(VCPKG_TARGET_TRIPLET "x64-windows-static-md" CACHE STRING "vcpkg target triplet")

if(NOT DEFINED VCPKG_OVERLAY_TRIPLETS)
   set(VCPKG_OVERLAY_TRIPLETS "${CMAKE_CURRENT_SOURCE_DIR}/cmake/vcpkg/triplets" CACHE PATH "vcpkg overlay triplets")
endif()

if(NOT DEFINED CMAKE_TOOLCHAIN_FILE)
   set(CMAKE_TOOLCHAIN_FILE "${VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake" CACHE FILEPATH "vcpkg toolchain file")
endif()

set(_vcpkg_toolchain_probe "${VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake")

if(NOT EXISTS "${_vcpkg_toolchain_probe}")
   if(NOT EXISTS "${VCPKG_ROOT}/.git")
      execute_process(
         COMMAND git clone --depth 1 https://github.com/microsoft/vcpkg.git "${VCPKG_ROOT}"
         RESULT_VARIABLE _vcpkg_clone_result
      )

      if(NOT _vcpkg_clone_result EQUAL 0)
         message(FATAL_ERROR "vcpkg clone failed with code ${_vcpkg_clone_result}")
      endif()
   endif()

   if(WIN32)
      set(_vcpkg_exe "${VCPKG_ROOT}/vcpkg.exe")
      set(_vcpkg_bootstrap "${VCPKG_ROOT}/bootstrap-vcpkg.bat")
   else()
      set(_vcpkg_exe "${VCPKG_ROOT}/vcpkg")
      set(_vcpkg_bootstrap "${VCPKG_ROOT}/bootstrap-vcpkg.sh")
   endif()

   if(NOT EXISTS "${_vcpkg_exe}")
      if(NOT EXISTS "${_vcpkg_bootstrap}")
         message(FATAL_ERROR "vcpkg bootstrap script not found at ${_vcpkg_bootstrap}. Set VCPKG_ROOT or CMAKE_TOOLCHAIN_FILE to a valid vcpkg install.")
      endif()

      execute_process(
         COMMAND "${_vcpkg_bootstrap}"
         WORKING_DIRECTORY "${VCPKG_ROOT}"
         RESULT_VARIABLE _vcpkg_bootstrap_result
      )

      if(NOT _vcpkg_bootstrap_result EQUAL 0)
         message(FATAL_ERROR "vcpkg bootstrap failed with code ${_vcpkg_bootstrap_result}")
      endif()
   endif()
endif()
