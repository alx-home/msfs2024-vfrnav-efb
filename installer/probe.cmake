set(PROBE_SOURCE_DIR ${CMAKE_SOURCE_DIR}/PackageSources/SimObjects/Misc/Probe)
set(PROBE_OUTPUT_DIR ${CMAKE_CURRENT_BINARY_DIR}/Probe)
set(PROBE_SOURCES
   sim.cfg
   model/model.cfg
   model/Probe.bin
   model/Probe.gltf
   model/Probe.xml
)

set(PROBE_ALL_SOURCES ${PROBE_SOURCES})
list(TRANSFORM PROBE_ALL_SOURCES PREPEND ${PROBE_SOURCE_DIR}/)

set(PROBE_ALL_OUTPUTS ${PROBE_SOURCES})
list(TRANSFORM PROBE_ALL_OUTPUTS PREPEND ${PROBE_OUTPUT_DIR}/)

foreach(source IN LISTS PROBE_SOURCES)
   set(output ${PROBE_OUTPUT_DIR}/${source})
   get_filename_component(output_dir ${output} DIRECTORY)
   add_custom_command(
      OUTPUT ${output}
      DEPENDS ${PROBE_SOURCE_DIR}/${source}
      COMMAND ${CMAKE_COMMAND} -E make_directory ${output_dir}
      COMMAND ${CMAKE_COMMAND} -E copy_if_different ${PROBE_SOURCE_DIR}/${source} ${output_dir}/
      COMMENT "Copying Probe ${source}"
      VERBATIM
   )
endforeach()

add_custom_target(probe_object
   DEPENDS
   ${PROBE_ALL_OUTPUTS}
)

set_target_properties(probe_object PROPERTIES
   OUTPUT_DIRECTORY ${PROBE_OUTPUT_DIR}
)
target_sources(probe_object PRIVATE
   ${PROBE_ALL_SOURCES})