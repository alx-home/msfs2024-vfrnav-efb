win32_executable(TARGET_NAME installer 
    FILES 
        main.cpp main.rc 
)

target_link_libraries(installer PRIVATE 
    installer_wrapper_resources 
    Boost::iostreams
    alx-home::windows
)

set(MAJOR_VERSION 1)
set(MINOR_VERSION 0)
set(REVISION 0)

set(VERSION ${MAJOR_VERSION}.${MINOR_VERSION}.${REVISION})

set_target_properties(installer PROPERTIES VERSION ${MAJOR_VERSION})
set_target_properties(installer PROPERTIES SOVERSION ${MAJOR_VERSION}.${MINOR_VERSION})
set_target_properties(installer PROPERTIES OUTPUT_NAME "vfrnav-installer")

# PACKAGER

package(TARGET_NAME installer_wrapper_resources 
        Z_RESOURCES 
            INSTALLER_BIN ${CMAKE_BINARY_DIR}/installer/vfrnav-installer-int.exe
)
