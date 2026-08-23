option(VCPKG_AUTO_INSTALL "Bootstrap and install vcpkg dependencies on configure" ON)

if(VCPKG_AUTO_INSTALL)
    # VCPKG_ROOT is already set by vcpkg_setup.cmake (standalone git-based vcpkg,
    # never the VS-bundled manifest-only instance).  The exe also exists because
    # vcpkg_setup.cmake handles cloning/bootstrapping before project().
    if(WIN32)
        set(_vcpkg_exe "${VCPKG_ROOT}/vcpkg.exe")
    else()
        set(_vcpkg_exe "${VCPKG_ROOT}/vcpkg")
    endif()

    if(NOT EXISTS "${_vcpkg_exe}")
        message(FATAL_ERROR "vcpkg executable not found at ${_vcpkg_exe}. Check VCPKG_ROOT=${VCPKG_ROOT}.")
    endif()

    set(_vcpkg_overlay_args "")

    if(DEFINED VCPKG_OVERLAY_TRIPLETS AND EXISTS "${VCPKG_OVERLAY_TRIPLETS}")
        set(_vcpkg_overlay_args "--overlay-triplets=${VCPKG_OVERLAY_TRIPLETS}")
    endif()

    if(EXISTS "${CMAKE_SOURCE_DIR}/vcpkg.json")
        # Manifest mode — install from the source directory.
        set(_vcpkg_installed_dir "${CMAKE_BINARY_DIR}/vcpkg_installed")

        execute_process(
            COMMAND "${_vcpkg_exe}" install
                --triplet "${VCPKG_TARGET_TRIPLET}"
                --x-install-root "${_vcpkg_installed_dir}"
                ${_vcpkg_overlay_args}
            WORKING_DIRECTORY "${CMAKE_SOURCE_DIR}"
            OUTPUT_VARIABLE _vcpkg_install_stdout
            ERROR_VARIABLE _vcpkg_install_stderr
            RESULT_VARIABLE _vcpkg_install_result
        )

        if(NOT _vcpkg_install_result EQUAL 0)
            message(FATAL_ERROR
                "vcpkg manifest install failed with code ${_vcpkg_install_result}\n"
                "stdout:\n${_vcpkg_install_stdout}\n"
                "stderr:\n${_vcpkg_install_stderr}"
            )
        endif()

        # Ensure find_package() locates the vcpkg-installed packages.
        list(PREPEND CMAKE_PREFIX_PATH "${_vcpkg_installed_dir}/${VCPKG_TARGET_TRIPLET}")
        list(PREPEND CMAKE_PREFIX_PATH "${_vcpkg_installed_dir}/${VCPKG_TARGET_TRIPLET}/share")
        set(CMAKE_PREFIX_PATH "${CMAKE_PREFIX_PATH}" CACHE STRING "CMake prefix path" FORCE)
    else()
        # Classic mode — packages listed explicitly.
        if(DEFINED VCPKG_PACKAGES)
            set(_vcpkg_packages ${VCPKG_PACKAGES})
        else()
            set(_vcpkg_packages
                openssl
                libiconv
                libjpeg-turbo
                libpng
                pkgconf
                poppler
                lcms2
                freetype
                openjpeg
            )
        endif()

        execute_process(
            COMMAND "${_vcpkg_exe}" install ${_vcpkg_packages}
                --triplet "${VCPKG_TARGET_TRIPLET}"
                ${_vcpkg_overlay_args}
            WORKING_DIRECTORY "${VCPKG_ROOT}"
            OUTPUT_VARIABLE _vcpkg_install_stdout
            ERROR_VARIABLE _vcpkg_install_stderr
            RESULT_VARIABLE _vcpkg_install_result
        )

        if(NOT _vcpkg_install_result EQUAL 0)
            message(FATAL_ERROR
                "vcpkg install failed with code ${_vcpkg_install_result}\n"
                "stdout:\n${_vcpkg_install_stdout}\n"
                "stderr:\n${_vcpkg_install_stderr}"
            )
        endif()
    endif()
endif()
