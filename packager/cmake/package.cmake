find_program(NASM_EXECUTABLE nasm REQUIRED)

# Single shared definition of TIMESTAMP: generated once at configure time so
# every resources library linked into any binary sees the exact same value.
function(_package_timestamp)
    if(TARGET packager_timestamp)
        return()
    endif()

    string(TIMESTAMP PACKAGE_UNIX_TIMESTAMP "%s" UTC)
    # std::chrono::file_clock ticks: 100ns intervals since 1601-01-01 (FILETIME epoch).
    math(EXPR PACKAGE_FILETIME_TICKS "(${PACKAGE_UNIX_TIMESTAMP} + 11644473600) * 10000000")

    set(TIMESTAMP_CPP ${CMAKE_BINARY_DIR}/packager_timestamp/Timestamp.cpp)
    file(WRITE ${TIMESTAMP_CPP}
"#include <chrono>
#include <cstdint>
#include <ratio>

extern const std::chrono::file_clock::time_point TIMESTAMP;
const std::chrono::file_clock::time_point        TIMESTAMP{
  std::chrono::duration<int64_t, std::ratio<1, 10'000'000>>{${PACKAGE_FILETIME_TICKS}}
};
")

    add_library(packager_timestamp STATIC ${TIMESTAMP_CPP})
    set_target_properties(packager_timestamp PROPERTIES
        LINKER_LANGUAGE CXX
        CXX_STANDARD 26
        CMAKE_CXX_STANDARD_REQUIRED ON
        CMAKE_CXX_EXTENSIONS ON
    )
endfunction(_package_timestamp)

function(package)
    set(options)
    set(oneValueArgs TARGET_NAME)
    set(multiValueArgs DEPENDS Z_RESOURCES RESOURCES APP_RESOURCES)
    cmake_parse_arguments(PARSE_ARGV 0 arg
        "${options}" "${oneValueArgs}" "${multiValueArgs}"
    )

    set(ASM_FILE ${CMAKE_CURRENT_BINARY_DIR}/Resources.asm)
    set(ASM_OBJ ${CMAKE_CURRENT_BINARY_DIR}/Resources.obj)
    set(ASM_CPP ${CMAKE_CURRENT_BINARY_DIR}/Resources.cpp)

    set(ARGS "")
    unset(RESOURCE_NAME)
    unset(EXCLUDE)
    set(CURRENT_ARGS "")

    foreach(ELEM IN LISTS arg_APP_RESOURCES)
        if(${ELEM} STREQUAL EXCLUDE)
            set(EXCLUDE TRUE)
        elseif(DEFINED EXCLUDE)
            unset(EXCLUDE)
            set(CURRENT_ARGS --exclude ${ELEM} ${CURRENT_ARGS})
        elseif(DEFINED RESOURCE_NAME)
            get_target_property(OUTPUT_DIRECTORY ${ELEM} OUTPUT_DIRECTORY)
            get_target_property(SOURCES ${ELEM} SOURCES)
            set(CURRENT_ARGS ${CURRENT_ARGS} --app ${RESOURCE_NAME} ${OUTPUT_DIRECTORY})
            unset(RESOURCE_NAME)
            list(APPEND arg_DEPENDS ${SOURCES})
        else()
            if(DEFINED CURRENT_ARGS)
                set(ARGS ${ARGS} ${CURRENT_ARGS})
                unset(CURRENT_ARGS)
            endif()

            set(RESOURCE_NAME "${ELEM}")
        endif()
    endforeach()

    if(DEFINED CURRENT_ARGS)
        set(ARGS ${ARGS} ${CURRENT_ARGS})
        unset(CURRENT_ARGS)
    endif()

    if(DEFINED RESOURCE_NAME)
        message(FATAL_ERROR "Invalid package args")
    endif()

    foreach(ELEM IN LISTS arg_RESOURCES)
        if(DEFINED RESOURCE_NAME)
            set(ARGS ${ARGS} --resource ${RESOURCE_NAME} ${ELEM})
            unset(RESOURCE_NAME)
            list(APPEND arg_DEPENDS ${ELEM})
        else()
            set(RESOURCE_NAME "${ELEM}")
        endif()
    endforeach()

    if(DEFINED RESOURCE_NAME)
        message(FATAL_ERROR "Invalid package args")
    endif()

    foreach(ELEM IN LISTS arg_Z_RESOURCES)
        if(DEFINED RESOURCE_NAME)
            set(ARGS ${ARGS} --resource ${RESOURCE_NAME} ${ELEM}) # --option zip ${ELEM})
            unset(RESOURCE_NAME)
            list(APPEND arg_DEPENDS ${ELEM})
        else()
            set(RESOURCE_NAME "${ELEM}")
        endif()
    endforeach()

    if(DEFINED RESOURCE_NAME)
        message(FATAL_ERROR "Invalid package args")
    endif()

    add_custom_command(
        OUTPUT ${ASM_FILE} ${ASM_CPP}
        COMMAND $<TARGET_FILE:packager> ${CMAKE_CURRENT_BINARY_DIR} ${ARGS}
        DEPENDS
            packager
            ${arg_DEPENDS}
        COMMENT "Generating ${arg_TARGET_NAME}"
        VERBATIM
    )

    add_custom_command(
        DEPENDS ${ASM_FILE}
        OUTPUT ${ASM_OBJ}
        COMMAND ${NASM_EXECUTABLE} -f win64 ${ASM_FILE} -o ${ASM_OBJ}
        COMMENT "Assembling ${ASM_FILE}"
        VERBATIM
    )

    add_library(${arg_TARGET_NAME} ${ASM_CPP} ${ASM_OBJ})
    _package_timestamp()
    target_link_libraries(${arg_TARGET_NAME} PUBLIC packager_timestamp)
    set_target_properties(${arg_TARGET_NAME} PROPERTIES
        LINKER_LANGUAGE CXX
        CXX_STANDARD 26
        CMAKE_CXX_STANDARD_REQUIRED ON
        CMAKE_CXX_EXTENSIONS ON
    )
endfunction(package)