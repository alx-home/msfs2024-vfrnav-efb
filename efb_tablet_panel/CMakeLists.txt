set(TABLET_PANEL_OUTPUT "${CMAKE_BINARY_DIR}/efb_tablet_panel")
set(TABLET_PANEL_SDK_PROJECT "${TABLET_PANEL_OUTPUT}/sdk-project")
set(TABLET_PANEL_SDK_SPB
   "${TABLET_PANEL_SDK_PROJECT}/output/Packages/sdk-package/InGamePanels/cockpit_tablet.spb")
set(TABLET_PANEL_SPB "${TABLET_PANEL_OUTPUT}/compiled/cockpit_tablet.spb")

file(MAKE_DIRECTORY "${TABLET_PANEL_SDK_PROJECT}")
configure_file(sdk-project.xml "${TABLET_PANEL_SDK_PROJECT}/sdk-project.xml" COPYONLY)
configure_file(sdk-package.xml "${TABLET_PANEL_SDK_PROJECT}/sdk-package.xml" COPYONLY)

add_custom_command(
   OUTPUT "${TABLET_PANEL_SPB}"
   COMMAND ${CMAKE_COMMAND} -E make_directory
      "${TABLET_PANEL_SDK_PROJECT}/input" "${TABLET_PANEL_OUTPUT}/compiled"
   COMMAND ${CMAKE_COMMAND} -E copy_if_different
      "${CMAKE_CURRENT_SOURCE_DIR}/cockpit_tablet.xml"
      "${TABLET_PANEL_SDK_PROJECT}/input/cockpit_tablet.xml"
   COMMAND ${CMAKE_COMMAND} -E rm -f "${TABLET_PANEL_SDK_SPB}" "${TABLET_PANEL_SPB}"
   COMMAND "${MSFS_SDK_LOCATION}/Tools/bin/fspackagetool.exe"
      "${TABLET_PANEL_SDK_PROJECT}/sdk-project.xml"
      -outputdir "${TABLET_PANEL_SDK_PROJECT}/output"
      -tempdir "${TABLET_PANEL_SDK_PROJECT}/temp"
      -rebuild -nopause
   COMMAND ${CMAKE_COMMAND} -E copy "${TABLET_PANEL_SDK_SPB}" "${TABLET_PANEL_SPB}"
   DEPENDS
      "${CMAKE_CURRENT_SOURCE_DIR}/cockpit_tablet.xml"
      "${TABLET_PANEL_SDK_PROJECT}/sdk-project.xml"
      "${TABLET_PANEL_SDK_PROJECT}/sdk-package.xml"
      "${MSFS_SDK_LOCATION}/Tools/bin/fspackagetool.exe"
   WORKING_DIRECTORY "${TABLET_PANEL_SDK_PROJECT}"
   COMMENT "Compiling the EFB tablet panel SPB with the MSFS SDK"
   VERBATIM
)
add_custom_target(efb_tablet_panel_spb DEPENDS "${TABLET_PANEL_SPB}")
set(TABLET_PANEL_SPB "${TABLET_PANEL_SPB}" PARENT_SCOPE)

add_custom_target(efb_tablet_panel
   COMMAND npx tsc --project "${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.json"
      --outDir "${TABLET_PANEL_OUTPUT}/html_ui/InGamePanels/EfbTablet"
   COMMAND ${CMAKE_COMMAND} -E copy_if_different
      "${CMAKE_CURRENT_SOURCE_DIR}/Panel.html"
      "${TABLET_PANEL_OUTPUT}/html_ui/InGamePanels/EfbTablet/Panel.html"
   COMMAND ${CMAKE_COMMAND} -E make_directory
      "${TABLET_PANEL_OUTPUT}/html_ui/icons/toolbar"
      "${TABLET_PANEL_OUTPUT}/html_ui/Textures/Menu/toolbar"
      "${TABLET_PANEL_OUTPUT}/InGamePanels"
   COMMAND ${CMAKE_COMMAND} -E rm -f
      "${TABLET_PANEL_OUTPUT}/html_ui/icons/toolbar/COCKPIT_TABLET.svg"
      "${TABLET_PANEL_OUTPUT}/html_ui/Textures/Menu/toolbar/COCKPIT_TABLET.svg"
   COMMAND ${CMAKE_COMMAND} -E copy_if_different
      "${CMAKE_CURRENT_SOURCE_DIR}/../images/COCKPIT_TABLET_OUTLINE.svg"
      "${TABLET_PANEL_OUTPUT}/html_ui/icons/toolbar/COCKPIT_TABLET_OUTLINE.svg"
   COMMAND ${CMAKE_COMMAND} -E copy_if_different
      "${CMAKE_CURRENT_SOURCE_DIR}/../images/COCKPIT_TABLET_OUTLINE.svg"
      "${TABLET_PANEL_OUTPUT}/html_ui/Textures/Menu/toolbar/COCKPIT_TABLET_OUTLINE.svg"
   COMMAND ${CMAKE_COMMAND} -E copy_if_different
      "${CMAKE_CURRENT_SOURCE_DIR}/cockpit_tablet.xml"
      "${TABLET_PANEL_OUTPUT}/InGamePanels/cockpit_tablet.xml"
   WORKING_DIRECTORY "${CMAKE_SOURCE_DIR}"
   VERBATIM
)

# Expose the staged html_ui tree so the installer can embed the toolbar panel.
set_target_properties(efb_tablet_panel PROPERTIES
   OUTPUT_DIRECTORY "${TABLET_PANEL_OUTPUT}/html_ui/"
)
target_sources(efb_tablet_panel PRIVATE
   "${CMAKE_CURRENT_SOURCE_DIR}/Panel.ts"
   "${CMAKE_CURRENT_SOURCE_DIR}/Panel.html"
   "${CMAKE_CURRENT_SOURCE_DIR}/cockpit_tablet.xml"
   "${CMAKE_CURRENT_SOURCE_DIR}/../images/COCKPIT_TABLET_OUTLINE.svg"
)
