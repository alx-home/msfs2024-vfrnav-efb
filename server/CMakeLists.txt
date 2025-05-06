add_subdirectory(ts)

set(COMPILE_OPTIONS)

if(WATCH_MODE)
    list(APPEND COMPILE_OPTIONS
        "$<$<CONFIG:Debug>:-DWATCH_MODE>"
    )
endif()

set(SOURCES
    main.cpp
    main.rc

    Main/Main.cpp

    Window/template/Window.cpp

    Server/Server.cpp
    Server/Resolvers.cpp

    SimConnect/SimConnect.cpp
    SimConnect/Facilities.cpp
    SimConnect/MSFS.cpp
)

win32_executable(TARGET_NAME server
    FILES
        ${SOURCES}

    COMPILE_OPTIONS
        ${COMPILE_OPTIONS}
)

target_link_libraries(server
    PRIVATE
        alx-home::webview
        alx-home::json
        alx-home::promise
        vfrnav::common
        vfrnav::window
        msfs_sdk
        Dwmapi
)

if(NOT WATCH_MODE)
    target_link_libraries(server
        PRIVATE
            server_resources
    )
endif()

set(MAJOR_VERSION 1)
set(MINOR_VERSION 0)
set(REVISION 0)

set(VERSION ${MAJOR_VERSION}.${MINOR_VERSION}.${REVISION})

set_target_properties(server PROPERTIES VERSION ${MAJOR_VERSION})
set_target_properties(server PROPERTIES SOVERSION ${MAJOR_VERSION}.${MINOR_VERSION})
set_target_properties(server PROPERTIES OUTPUT_NAME "vfrnav-server")

# PACKAGER
if(NOT WATCH_MODE)
    package(TARGET_NAME server_resources
        APP_RESOURCES
            EFB_RESOURCES vfrnav_efb
            MAIN_WINDOW_RESOURCES server_app
            TASKBAR_WINDOW_RESOURCES server_taskbar
            TASKBAR_TOOLTIP_WINDOW_RESOURCES server_taskbar_tooltip
    )
endif()