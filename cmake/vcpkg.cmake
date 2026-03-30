option(VCPKG_AUTO_INSTALL "Bootstrap and install vcpkg dependencies on configure" ON)

if(VCPKG_AUTO_INSTALL)
    set(_vcpkg_root_from_toolchain "")

    if(DEFINED CMAKE_TOOLCHAIN_FILE)
        get_filename_component(_vcpkg_toolchain_dir "${CMAKE_TOOLCHAIN_FILE}" DIRECTORY)
        get_filename_component(_vcpkg_root_candidate "${_vcpkg_toolchain_dir}/../.." ABSOLUTE)

        if(EXISTS "${_vcpkg_root_candidate}")
            if(WIN32)
                set(_vcpkg_bootstrap_probe "${_vcpkg_root_candidate}/bootstrap-vcpkg.bat")
                set(_vcpkg_exe_probe "${_vcpkg_root_candidate}/vcpkg.exe")
            else()
                set(_vcpkg_bootstrap_probe "${_vcpkg_root_candidate}/bootstrap-vcpkg.sh")
                set(_vcpkg_exe_probe "${_vcpkg_root_candidate}/vcpkg")
            endif()

            if(EXISTS "${_vcpkg_bootstrap_probe}" OR EXISTS "${_vcpkg_exe_probe}")
                set(_vcpkg_root_from_toolchain "${_vcpkg_root_candidate}")
            endif()
        endif()
    endif()

    if(_vcpkg_root_from_toolchain)
        set(VCPKG_ROOT "${_vcpkg_root_from_toolchain}" CACHE PATH "vcpkg root" FORCE)
    elseif(NOT VCPKG_ROOT)
        if(DEFINED ENV{VCPKG_ROOT})
            set(VCPKG_ROOT "$ENV{VCPKG_ROOT}" CACHE PATH "vcpkg root")
        else()
            set(VCPKG_ROOT "${CMAKE_BINARY_DIR}/vcpkg" CACHE PATH "vcpkg root")
        endif()
    endif()

    if(NOT VCPKG_ROOT)
        message(FATAL_ERROR "VCPKG_ROOT is not set. Set it or export VCPKG_ROOT before configuring.")
    endif()

    if(NOT EXISTS "${VCPKG_ROOT}")
        file(MAKE_DIRECTORY "${VCPKG_ROOT}")
        execute_process(
            COMMAND git clone --depth 1 https://github.com/microsoft/vcpkg.git "${VCPKG_ROOT}"
            RESULT_VARIABLE _vcpkg_clone_result
        )

        if(NOT _vcpkg_clone_result EQUAL 0)
            message(FATAL_ERROR "vcpkg clone failed with code ${_vcpkg_clone_result}")
        endif()
    endif()

    set(_vcpkg_exe "${VCPKG_ROOT}/vcpkg.exe")

    if(NOT EXISTS "${_vcpkg_exe}")
        if(WIN32)
            set(_vcpkg_bootstrap "${VCPKG_ROOT}/bootstrap-vcpkg.bat")
        else()
            set(_vcpkg_bootstrap "${VCPKG_ROOT}/bootstrap-vcpkg.sh")
        endif()

        if(NOT EXISTS "${_vcpkg_bootstrap}" AND DEFINED CMAKE_TOOLCHAIN_FILE)
            get_filename_component(_vcpkg_toolchain_dir "${CMAKE_TOOLCHAIN_FILE}" DIRECTORY)
            get_filename_component(_vcpkg_root_guess "${_vcpkg_toolchain_dir}/../.." ABSOLUTE)

            if(EXISTS "${_vcpkg_root_guess}")
                set(VCPKG_ROOT "${_vcpkg_root_guess}" CACHE PATH "vcpkg root" FORCE)
                set(_vcpkg_exe "${VCPKG_ROOT}/vcpkg.exe")

                if(WIN32)
                    set(_vcpkg_bootstrap "${VCPKG_ROOT}/bootstrap-vcpkg.bat")
                else()
                    set(_vcpkg_bootstrap "${VCPKG_ROOT}/bootstrap-vcpkg.sh")
                endif()
            endif()
        endif()

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
            lcms
            freetype
            openjpeg
        )
    endif()

    execute_process(
        COMMAND "${_vcpkg_exe}" install ${_vcpkg_packages} --triplet "${VCPKG_TARGET_TRIPLET}"
        WORKING_DIRECTORY "${VCPKG_ROOT}"
        RESULT_VARIABLE _vcpkg_install_result
    )

    if(NOT _vcpkg_install_result EQUAL 0)
        message(FATAL_ERROR "vcpkg install failed with code ${_vcpkg_install_result}")
    endif()
endif()
