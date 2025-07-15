add_subdirectory(ts)

set(COMPILE_OPTIONS
    "-DWIN32_LEAN_AND_MEAN"
)

if(WATCH_MODE)
    list(APPEND COMPILE_OPTIONS
        "-DWATCH_MODE"
    )
endif()

win32_executable(TARGET_NAME installer
    FILES
        main.cpp main.rc
        Bindings/abort.cpp
        Bindings/defaultInstallPath.cpp
        Bindings/exists.cpp
        Bindings/findCommunity.cpp
        Bindings/log.cpp
        Bindings/openFile.cpp
        Bindings/openFolder.cpp
        Bindings/parentExists.cpp
        Bindings/validate.cpp

    COMPILE_OPTIONS
        "${COMPILE_OPTIONS}"
)

target_link_libraries(installer PRIVATE
        alx-home::webview
        alx-home::json
        alx-home::promise
        installer_resources
        vfrnav::common
        vfrnav::window
        Dwmapi
        Boost::iostreams
)

set(MAJOR_VERSION 1)
set(MINOR_VERSION 0)
set(REVISION 0)

set(VERSION ${MAJOR_VERSION}.${MINOR_VERSION}.${REVISION})

set_target_properties(installer PROPERTIES VERSION ${MAJOR_VERSION})
set_target_properties(installer PROPERTIES SOVERSION ${MAJOR_VERSION}.${MINOR_VERSION})
set_target_properties(installer PROPERTIES OUTPUT_NAME "msfs2024-vfrnav_installer")

target_link_libraries(installer PRIVATE
    alx-home::windows
)

# PACKAGER
if(WATCH_MODE)
    package(TARGET_NAME installer_resources
            Z_RESOURCES
        SERVER_BIN ${CMAKE_BINARY_DIR}/server/msfs2024-vfrnav_server.exe
    )
else()
    package(TARGET_NAME installer_resources
            Z_RESOURCES
        SERVER_BIN ${CMAKE_BINARY_DIR}/server/msfs2024-vfrnav_server.exe
            APP_RESOURCES
        EMBEDED_RESOURCES installer_app
        EFB_RESOURCES vfrnav_efb_msfs
            RESOURCES
        EFB_THUMBNAIL ${CMAKE_SOURCE_DIR}/vfrnav_efb/EFB/PackageDefinitions/alexhome-msfs2024-vfrnav/ContentInfo/Thumbnail.jpg
        EFB_RELEASE_NOTE ${CMAKE_SOURCE_DIR}/vfrnav_efb/EFB/release_notes.json
    )
endif()

# add_subdirectory(Wrapper/)