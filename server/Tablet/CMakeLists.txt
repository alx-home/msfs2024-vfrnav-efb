# Reuse the project packager: authored templates are linked through NASM incbin,
# not converted into C++ string literals or read from the simulator at runtime.
file(GLOB_RECURSE TABLET_TEMPLATE_FILES CONFIGURE_DEPENDS
    RELATIVE "${CMAKE_CURRENT_SOURCE_DIR}/Templates"
    "${CMAKE_CURRENT_SOURCE_DIR}/Templates/*"
)

set(TABLET_TEMPLATE_RESOURCES "")
set(TABLET_TEMPLATE_DECLARATIONS "")
set(TABLET_TEMPLATE_LOOKUP "")

foreach(TEMPLATE IN LISTS TABLET_TEMPLATE_FILES)
    string(MAKE_C_IDENTIFIER "TABLET_TEMPLATE_${TEMPLATE}" SYMBOL)
    string(TOUPPER "${SYMBOL}" SYMBOL)
    list(APPEND TABLET_TEMPLATE_RESOURCES
        "${SYMBOL}" "${CMAKE_CURRENT_SOURCE_DIR}/Templates/${TEMPLATE}"
    )
    string(APPEND TABLET_TEMPLATE_DECLARATIONS
        "extern std::span<std::byte const> const ${SYMBOL};\n"
    )
    string(APPEND TABLET_TEMPLATE_LOOKUP
        "   if (name == \"${TEMPLATE}\") {\n      return ::${SYMBOL};\n   }\n\n"
    )
endforeach()

package(TARGET_NAME tablet_template_resources RESOURCES ${TABLET_TEMPLATE_RESOURCES})

file(GENERATE OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/TemplateResources.cpp" CONTENT
"#include \"Templates.h\"
#include <stdexcept>

${TABLET_TEMPLATE_DECLARATIONS}
namespace tablet {

/** @brief Resolve an authored template embedded by the project incbin packager. */
std::span<std::byte const>
Templates::Resource(std::string_view name) {
${TABLET_TEMPLATE_LOOKUP}
   throw std::invalid_argument(\"Unknown tablet template: \" + std::string{name});
}

}  // namespace tablet
")

win32_library(TARGET_NAME tablet_templates
    STATIC
    CXX_STANDARD 26
    FILES
        Templates.cpp
        "${CMAKE_CURRENT_BINARY_DIR}/TemplateResources.cpp"
)
target_link_libraries(tablet_templates PRIVATE tablet_template_resources)

win32_library(TARGET_NAME tablet_vfs
    STATIC
    CXX_STANDARD 26
    FILES VfsWatcher.cpp
)
target_compile_definitions(tablet_vfs PRIVATE WIN32_LEAN_AND_MEAN)

win32_library(TARGET_NAME tablet_rig
    STATIC
    CXX_STANDARD 26
    FILES
        TransformRig.cpp
        Rig/RigModel.cpp
        Rig/RigText.cpp
        Rig/RigAssets.cpp
)
target_link_libraries(tablet_rig PRIVATE Boost::json tablet_templates)
target_compile_definitions(tablet_rig PRIVATE WIN32_LEAN_AND_MEAN)

win32_library(TARGET_NAME tablet_fleet
    STATIC
    CXX_STANDARD 26
    FILES
        Fleet.cpp
        Fleet/FileSystem.cpp
        Fleet/Inventory.cpp
        Fleet/Package.cpp
        Fleet/Planner.cpp
        Fleet/Transaction.cpp
)
target_link_libraries(tablet_fleet
    PUBLIC alx-home::json alx-home::jsprocpp
    PRIVATE Bcrypt Boost::json tablet_templates tablet_vfs vfrnav::common
)
target_compile_definitions(tablet_fleet PRIVATE WIN32_LEAN_AND_MEAN)
