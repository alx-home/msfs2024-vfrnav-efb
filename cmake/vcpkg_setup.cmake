message(WARNING "vcpkg setup may take some time on first run.")

# ---------------------------------------------------------------------------
# Determine VCPKG_ROOT for the standalone git-based vcpkg used by this project.
# If CMAKE_TOOLCHAIN_FILE or ENV{VCPKG_ROOT} points to the VS-bundled vcpkg
# (manifest-only, no .git/bootstrap), fall back to a local clone in build/vcpkg.
# ---------------------------------------------------------------------------

# Detect a standalone vcpkg root from a toolchain path (has bootstrap + .git).
macro(_vcpkg_probe_toolchain_root _tcf _out_root)
   set(${_out_root} "")

   if(DEFINED ${_tcf} AND EXISTS "${${_tcf}}")
      get_filename_component(_probe_dir "${${_tcf}}" DIRECTORY)
      get_filename_component(_probe_root "${_probe_dir}/../.." ABSOLUTE)

      if(WIN32)
         set(_probe_bootstrap "${_probe_root}/bootstrap-vcpkg.bat")
      else()
         set(_probe_bootstrap "${_probe_root}/bootstrap-vcpkg.sh")
      endif()

      if(EXISTS "${_probe_bootstrap}" AND EXISTS "${_probe_root}/.git")
         set(${_out_root} "${_probe_root}")
      endif()
   endif()
endmacro()

# Detect a standalone vcpkg root from an arbitrary directory path.
macro(_vcpkg_probe_root_path _path _out_root)
   set(${_out_root} "")

   if(EXISTS "${_path}")
      if(WIN32)
         set(_probe_bootstrap "${_path}/bootstrap-vcpkg.bat")
      else()
         set(_probe_bootstrap "${_path}/bootstrap-vcpkg.sh")
      endif()

      if(EXISTS "${_probe_bootstrap}" AND EXISTS "${_path}/.git")
         set(${_out_root} "${_path}")
      endif()
   endif()
endmacro()

_vcpkg_probe_toolchain_root(CMAKE_TOOLCHAIN_FILE _vcpkg_standalone_from_toolchain)

if(_vcpkg_standalone_from_toolchain)
   # Toolchain came from a real standalone vcpkg git clone — use it directly.
   set(VCPKG_ROOT "${_vcpkg_standalone_from_toolchain}" CACHE PATH "vcpkg root" FORCE)
else()
   # VS-bundled (or unknown) toolchain detected. Prefer standalone ENV{VCPKG_ROOT},
   # then fall back to auto-cloning into the build directory.
   set(_vcpkg_from_env "")
   set(_vcpkg_env_root "")
   set(_vcpkg_env_root_cmake "")

   if(DEFINED ENV{VCPKG_ROOT})
      set(_vcpkg_env_root "$ENV{VCPKG_ROOT}")
      file(TO_CMAKE_PATH "${_vcpkg_env_root}" _vcpkg_env_root_cmake)
      _vcpkg_probe_root_path("${_vcpkg_env_root_cmake}" _vcpkg_from_env)
   endif()

   if(_vcpkg_from_env)
      set(VCPKG_ROOT "${_vcpkg_from_env}" CACHE PATH "vcpkg root" FORCE)
      message(STATUS "vcpkg: using standalone vcpkg from VCPKG_ROOT env: ${VCPKG_ROOT}")
   else()
      if(_vcpkg_env_root_cmake AND EXISTS "${_vcpkg_env_root_cmake}")
         message(WARNING "VCPKG_ROOT env points to a non-standalone vcpkg: ${_vcpkg_env_root_cmake}; using local clone instead.")
      endif()

      set(VCPKG_ROOT "${CMAKE_BINARY_DIR}/vcpkg" CACHE PATH "vcpkg root" FORCE)
      message(STATUS "vcpkg: VS-bundled vcpkg detected; will use/clone standalone at ${VCPKG_ROOT}")
   endif()
endif()

if(NOT EXISTS "${VCPKG_ROOT}")
   file(MAKE_DIRECTORY "${VCPKG_ROOT}")
endif()

set(VCPKG_TARGET_TRIPLET "x64-windows-static-md" CACHE STRING "vcpkg target triplet")

# Keep manifest mode ON to avoid incompatible mode flips in existing build dirs,
# but disable toolchain auto-install; installation is handled later in
# cmake/vcpkg.cmake with an explicit baseline.
set(VCPKG_MANIFEST_MODE ON CACHE BOOL "Enable vcpkg manifest mode" FORCE)
set(VCPKG_MANIFEST_INSTALL OFF CACHE BOOL "Disable vcpkg toolchain auto install" FORCE)

if(NOT DEFINED VCPKG_OVERLAY_TRIPLETS)
   set(VCPKG_OVERLAY_TRIPLETS "${CMAKE_CURRENT_SOURCE_DIR}/cmake/vcpkg/triplets" CACHE PATH "vcpkg overlay triplets")
endif()

# Always point CMAKE_TOOLCHAIN_FILE at our standalone vcpkg so find_package()
# integration picks up packages from the right vcpkg_installed tree.
set(CMAKE_TOOLCHAIN_FILE "${VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake" CACHE FILEPATH "vcpkg toolchain file" FORCE)

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
