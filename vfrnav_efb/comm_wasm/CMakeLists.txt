cmake_minimum_required(VERSION 3.20)

if(NOT DEFINED MSFS_SDK_LOCATION)
   message(WARNING "vfrnav_comm_wasm: MSFS_SDK_LOCATION is not defined")
   return()
endif()

set(MSFS_WASM_ROOT "${MSFS_SDK_LOCATION}/WASM")
set(MSFS_WASM_INCLUDE_DIR "${MSFS_WASM_ROOT}/include")
set(MSFS_WASM_SYSROOT "${MSFS_WASM_ROOT}/wasi-sysroot")
set(MSFS_WASM_LIB_DIR "${MSFS_WASM_ROOT}/lib")
set(MSFS_WASM_LLVM_BIN "${MSFS_WASM_ROOT}/llvm/bin")
set(MSFS_WASM_CLANG "${MSFS_WASM_LLVM_BIN}/clang-cl.exe")
set(MSFS_WASM_LD "${MSFS_WASM_LLVM_BIN}/wasm-ld.exe")

# Use generator expressions to select debug/release libraries
set(MSFS_WASM_SIMUTILS "$<IF:$<CONFIG:Debug>,${MSFS_WASM_LIB_DIR}/SimUtils_debug.a,${MSFS_WASM_LIB_DIR}/SimUtils.a>")
set(MSFS_WASM_VERSIONS "${MSFS_WASM_ROOT}/WasmVersions/MSFS_WasmVersions.a")

if(NOT EXISTS "${MSFS_WASM_CLANG}" OR NOT EXISTS "${MSFS_WASM_LD}")
   message(WARNING "vfrnav_comm_wasm: MSFS WASM compiler toolchain not found under ${MSFS_WASM_ROOT}")
   return()
endif()

set(COMM_WASM_SRC
   "${CMAKE_CURRENT_SOURCE_DIR}/src/CommWasm.cpp"
   "${CMAKE_CURRENT_SOURCE_DIR}/src/Blob.cpp"
   "${CMAKE_CURRENT_SOURCE_DIR}/src/Records.cpp"
)

set(COMM_WASM_COMMON_DEFINES
   "_MSFS_WASM"
   "_STRING_H_CPLUSPLUS_98_CONFORMANCE_"
   "_WCHAR_H_CPLUSPLUS_98_CONFORMANCE_"
   "_LIBCPP_NO_EXCEPTIONS"
   "_LIBCPP_HAS_NO_THREADS"
)

if(CMAKE_BUILD_TYPE STREQUAL "Debug")
   set(COMM_WASM_CONFIG_DEFINE "_DEBUG")
else()
   set(COMM_WASM_CONFIG_DEFINE "NDEBUG")
endif()

# Force use of MSFS_WASM_CLANG for this target
set_source_files_properties(${COMM_WASM_SRC} PROPERTIES LANGUAGE CXX)
set(CMAKE_CXX_COMPILER "${MSFS_WASM_CLANG}")
add_library(vfrnav_comm_wasm_obj OBJECT
   ${COMM_WASM_SRC}
)

target_compile_definitions(vfrnav_comm_wasm_obj PRIVATE
   ${COMM_WASM_COMMON_DEFINES}
   ${COMM_WASM_CONFIG_DEFINE}
)

target_include_directories(vfrnav_comm_wasm_obj PRIVATE
   "${MSFS_WASM_INCLUDE_DIR}"
   "${MSFS_SDK_LOCATION}/SimConnect SDK/include"
)

target_compile_options(vfrnav_comm_wasm_obj PRIVATE

   # Common options (appear in both Debug and Release)
   -m32
   -Werror=return-type
   /clang:--sysroot=${MSFS_WASM_SYSROOT}
   /clang:--target=wasm32-wasi
   /clang:-fdata-sections
   /clang:-ffunction-sections
   /clang:-fms-extensions
   /clang:-fno-exceptions
   /clang:-fno-stack-protector
   /clang:-fstack-size-section
   /clang:-fvisibility=hidden
   /clang:-fwritable-strings
   /clang:-mbulk-memory
   /clang:-Qunused-arguments
   /clang:-std=c++20
   /clang:-Wno-ignored-attributes
   /diagnostics:column
   /EHs-c-
   /fp:precise
   /Gd
   /GR-
   /GS-
   /nologo
   /permissive-
   /showFilenames
   /W3
   /WX-
   /Zc:__cplusplus

   # Debug-specific options
   $<$<CONFIG:Debug>:/Od /MDd /clang:-O0 /clang:-g /D_MBCS /clang:-fstandalone-debug /clang:-mllvm /clang:-wasm-disable-redzone>

   # Release-specific options
   $<$<CONFIG:Release>:/O2 /MD /Oi /Gy /clang:-fno-stack-protector /clang:-O2>
)
set(VFRNAV_COMM_WASM_OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/vfrnav_comm_wasm.wasm")
set(VFRNAV_COMM_WASM_STAGING_DIR "${CMAKE_BINARY_DIR}/vfrnav_efb/wasm")
set(VFRNAV_COMM_WASM_STAGING_FILE "${VFRNAV_COMM_WASM_STAGING_DIR}/vfrnav_comm_wasm.wasm" CACHE STRING "Path to wasm staging file")

if(CMAKE_BUILD_TYPE STREQUAL "Release")
   set(LINKER_FLAGS
      --gc-sections
      -O3
      --lto-O3
      --strip-debug
   )
else()
   set(LINKER_FLAGS
      --merge-rodata-bss
      --reserved-imports-margin=256
      --data-expand-factor=10
      --data-size=268435456
      --no-demangle
      --no-merge-data-segments
      -O0
      --gc-sections
      -O3
      --lto-O3
   )
endif()

add_custom_command(
   OUTPUT "${VFRNAV_COMM_WASM_OUTPUT}"
   COMMAND "${MSFS_WASM_LD}"

   # Common options (appear in both Debug and Release)
   --no-entry
   --allow-undefined
   --stack-guard-page
   --export-dynamic
   --export=malloc
   --export=free
   --export=__wasm_call_ctors
   --export-table
   --export=mallinfo
   --export=mchunkit_begin
   --export=mchunkit_next
   --export=get_pages_state
   --export=mark_decommit_pages
   --export=GetSimConnectVersion

   ${LINKER_FLAGS}

   # Input files
   -o "${VFRNAV_COMM_WASM_OUTPUT}"
      ${CMAKE_CURRENT_BINARY_DIR}/CMakeFiles/vfrnav_comm_wasm_obj.dir/src/CommWasm.cpp.obj
      ${CMAKE_CURRENT_BINARY_DIR}/CMakeFiles/vfrnav_comm_wasm_obj.dir/src/Blob.cpp.obj
      ${CMAKE_CURRENT_BINARY_DIR}/CMakeFiles/vfrnav_comm_wasm_obj.dir/src/Records.cpp.obj
   "${MSFS_WASM_SIMUTILS}"
   "${MSFS_WASM_VERSIONS}"
   "${MSFS_WASM_SYSROOT}/lib/wasm32-wasi/libc++.a"
   "${MSFS_WASM_SYSROOT}/lib/wasm32-wasi/libc++abi.a"
   "${MSFS_WASM_SYSROOT}/lib/wasm32-wasi/libc.a"
   "${MSFS_WASM_SYSROOT}/lib/wasm32-wasi/libclang_rt.builtins-wasm32.a"
   DEPENDS
      vfrnav_comm_wasm_obj
      $<TARGET_OBJECTS:vfrnav_comm_wasm_obj>
      "${MSFS_WASM_SIMUTILS}"
      "${MSFS_WASM_VERSIONS}"
      "${MSFS_WASM_SYSROOT}/lib/wasm32-wasi/libc++.a"
      "${MSFS_WASM_SYSROOT}/lib/wasm32-wasi/libc++abi.a"
      "${MSFS_WASM_SYSROOT}/lib/wasm32-wasi/libc.a"
      "${MSFS_WASM_SYSROOT}/lib/wasm32-wasi/libclang_rt.builtins-wasm32.a"
   COMMENT "Linking vfrnav_comm_wasm.wasm"
   VERBATIM
)

add_custom_command(
   OUTPUT "${VFRNAV_COMM_WASM_STAGING_FILE}"
   COMMAND ${CMAKE_COMMAND} -E make_directory "${VFRNAV_COMM_WASM_STAGING_DIR}"
   COMMAND ${CMAKE_COMMAND} -E copy_if_different
      "${VFRNAV_COMM_WASM_OUTPUT}"
      "${VFRNAV_COMM_WASM_STAGING_FILE}"
   DEPENDS "${VFRNAV_COMM_WASM_OUTPUT}"
   COMMENT "Staging vfrnav_comm_wasm.wasm"
   VERBATIM
)

# Add a custom target for the staged WASM file so other targets can depend on it
add_custom_target(vfrnav_comm_wasm ALL
   DEPENDS "${VFRNAV_COMM_WASM_STAGING_FILE}"
)
