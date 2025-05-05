
win32_executable(TARGET_NAME packager 
    FILES 
        main.cpp 
)

target_link_libraries(packager PRIVATE 
    Boost::iostreams
)

include(cmake/package.cmake)