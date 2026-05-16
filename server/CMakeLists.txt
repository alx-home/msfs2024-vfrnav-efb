add_subdirectory(ts)

set(COMPILE_OPTIONS
    "-DWIN32_LEAN_AND_MEAN"
)

if(WATCH_MODE)
    list(APPEND COMPILE_OPTIONS
        "-DWATCH_MODE"
    )
endif()

set(SOURCES
    main.cpp
    main.rc

    Main/Main.cpp

    Base64Utils.cpp
    HttpRequest.cpp

    Window/template/Window.cpp

    Server/Server.cpp

    Server/WebSockets/EFBWebSocket.cpp
    Server/WebSockets/WebSocket.cpp

    ATC/ATCHandler.cpp
    ATC/IAHandler.cpp
    ATC/Objects/Aircraft.cpp
    ATC/Objects/TrafficPattern.cpp
    ATC/Utilities/PdfExtract.cpp
    ATC/Utilities/SIAExtractor.cpp
    ATC/Utilities/SiaPdfFetch.cpp

    SimConnect/FacilityData/AirportFacility.cpp
    SimConnect/FacilityData/Waypoint.cpp
    SimConnect/SimConnect.cpp
    SimConnect/SimConnectInterface.cpp
    SimConnect/Utils/StaticCast.cpp

    Window/template/Bindings/Files.cpp
    Window/template/Bindings/log.cpp
)

set(LLM_API_KEY CACHE STRING "API key for the IA service. If not set, IA features will be disabled.")
win32_executable(TARGET_NAME server
    FILES
        ${SOURCES}

    COMPILE_OPTIONS
        "${COMPILE_OPTIONS}"
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
        Boost::asio
        Boost::uuid
        boost_beast
        boost_url
        OpenSSL::SSL
        OpenSSL::Crypto

    # Poppler dependencies
    PkgConfig::POPPLER_CPP
        Iconv::Iconv
        $<IF:$<TARGET_EXISTS:libjpeg-turbo::turbojpeg>,libjpeg-turbo::turbojpeg,libjpeg-turbo::turbojpeg-static>
        PNG::PNG
        Freetype::Freetype
        lcms2::lcms2
        openjp2
        JPEG::JPEG
)

target_compile_definitions(server PRIVATE LLM_API_KEY="${LLM_API_KEY}")

if(DEFINED POPPLER_ROOT AND EXISTS "${POPPLER_ROOT}/include")
    target_include_directories(server PRIVATE
        ${POPPLER_ROOT}/include
    )
endif()

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
set_target_properties(server PROPERTIES OUTPUT_NAME "msfs2024-vfrnav_server")

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