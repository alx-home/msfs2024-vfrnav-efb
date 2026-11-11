add_executable(tablet_fleet_rig_sources EXCLUDE_FROM_ALL ../../tests/BuildFleetRig.cpp)

target_link_libraries(tablet_fleet_rig_sources PRIVATE tablet_rig Bcrypt Boost::json)

target_compile_features(tablet_fleet_rig_sources PRIVATE cxx_std_23)
target_compile_definitions(tablet_fleet_rig_sources PRIVATE NOMINMAX WIN32_LEAN_AND_MEAN)

set(RIG_BUILD_DIR "${CMAKE_BINARY_DIR}/tablet_fleet_rig")
file(MAKE_DIRECTORY "${RIG_BUILD_DIR}")

set(RIG_RESOURCES "${CMAKE_SOURCE_DIR}/PackageSources/efb-tablet-compiled")
set(RIG_ROOT "${RIG_BUILD_DIR}/runtime/SimAttachments/Alexhome/EFB_Tablet")
set(RIG_RESOURCE_NAMES
    EFB_RIG_ATTACHMENT_CFG
    EFB_RIG_CONFIG_ATTACHED_OBJECTS_CFG
    EFB_RIG_INPUT_ACTION_ACTIONDB
    EFB_RIG_MODEL_MODEL_XML
    EFB_RIG_MODEL_MODEL_BEHAVIOR_XML
    EFB_RIG_MODEL_MODEL_ACTIONDB
    EFB_RIG_MODEL_RIG_GLTF
    EFB_RIG_MODEL_RIG_BIN
    EFB_RIG_EDIT_ATTACHMENT_CFG
    EFB_RIG_EDIT_MODEL_MODEL_XML
    EFB_RIG_EDIT_TEXTURE_TEXTURE_CFG
)
set(RIG_RESOURCE_PATHS
    attachment.cfg
    config/attached_objects.cfg
    input/action.actiondb
    model/model.xml
    model/model.behavior.xml
    model/model.actiondb
    model/rig.gltf
    model/rig.bin
    edit/attachment.cfg
    edit/model/model.xml
    edit/texture/texture.cfg
)
set(RIG_OUTPUTS "")
set(RIG_RC_CONTENT "")

foreach(NAME PATH IN ZIP_LISTS RIG_RESOURCE_NAMES RIG_RESOURCE_PATHS)
    list(APPEND RIG_OUTPUTS "${RIG_ROOT}/${PATH}")
    string(APPEND RIG_RC_CONTENT "${NAME} RCDATA \"${RIG_ROOT}/${PATH}\"\n")
endforeach()

set(RIG_LOCPAK_OUTPUT "${RIG_BUILD_DIR}/runtime/en-US.locPak")
list(APPEND RIG_OUTPUTS "${RIG_LOCPAK_OUTPUT}")
string(APPEND RIG_RC_CONTENT "EFB_RIG_EN_US_LOCPAK RCDATA \"${RIG_LOCPAK_OUTPUT}\"\n")

set(TABLET_RIG_RC "${CMAKE_CURRENT_BINARY_DIR}/fleet-rig.rc")

file(GENERATE OUTPUT "${TABLET_RIG_RC}" CONTENT "${RIG_RC_CONTENT}")

set_source_files_properties("${TABLET_RIG_RC}" PROPERTIES OBJECT_DEPENDS "${RIG_OUTPUTS}")
set_source_files_properties("${TABLET_RIG_RC}" TARGET_DIRECTORY server
    PROPERTIES OBJECT_DEPENDS "${RIG_OUTPUTS}")
set(TABLET_RIG_RC "${TABLET_RIG_RC}" PARENT_SCOPE)

file(GLOB_RECURSE RIG_TEMPLATE_INPUTS CONFIGURE_DEPENDS "../Templates/rig/*")
file(GLOB_RECURSE RIG_COMPILED_INPUTS CONFIGURE_DEPENDS "${RIG_RESOURCES}/*")
add_custom_command(
    OUTPUT ${RIG_OUTPUTS}
    COMMAND ${CMAKE_COMMAND} -E make_directory "${RIG_BUILD_DIR}"
    COMMAND $<TARGET_FILE:tablet_fleet_rig_sources> "${RIG_BUILD_DIR}" "${RIG_RESOURCES}"
    DEPENDS tablet_fleet_rig_sources ${RIG_TEMPLATE_INPUTS} ${RIG_COMPILED_INPUTS}
    COMMENT "Verifying and staging the SDK-compiled fleet tablet generator resources"
    WORKING_DIRECTORY "${RIG_BUILD_DIR}"
    VERBATIM
)

add_custom_target(tablet_compiled_rig DEPENDS ${RIG_OUTPUTS})

add_executable(tablet_compiled_rig_test EXCLUDE_FROM_ALL
    ../../tests/CompiledRigTest.cpp "${TABLET_RIG_RC}")

target_compile_features(tablet_compiled_rig_test PRIVATE cxx_std_23)

target_link_libraries(tablet_compiled_rig_test PRIVATE tablet_fleet)

add_dependencies(tablet_compiled_rig_test tablet_compiled_rig)

add_executable(tablet_rig_test EXCLUDE_FROM_ALL ../../tests/TransformRigTest.cpp)
target_compile_features(tablet_rig_test PRIVATE cxx_std_23)
target_link_libraries(tablet_rig_test PRIVATE tablet_rig Boost::json)

add_executable(tablet_fleet_test EXCLUDE_FROM_ALL
    ../../tests/TabletFleetTest.cpp "${TABLET_RIG_RC}")
target_compile_features(tablet_fleet_test PRIVATE cxx_std_23)
target_compile_definitions(tablet_fleet_test PRIVATE NOMINMAX WIN32_LEAN_AND_MEAN)
target_link_libraries(tablet_fleet_test PRIVATE tablet_fleet Boost::json)
add_dependencies(tablet_fleet_test tablet_compiled_rig)
