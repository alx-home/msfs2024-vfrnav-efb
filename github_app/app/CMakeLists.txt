file(GLOB_RECURSE APP_CONTENT_DEPENDS LIST_DIRECTORIES false CONFIGURE_DEPENDS
   ${CMAKE_CURRENT_SOURCE_DIR}/src/*
   ${CMAKE_CURRENT_SOURCE_DIR}/public/*
)

ts_app(TARGET_NAME github_app_web
   BUILD_TARGET "build$<$<CONFIG:DEBUG>:\:dev>" -- --out-dir "${CMAKE_CURRENT_BINARY_DIR}/../dist"
   OUTPUT_DIR "${CMAKE_CURRENT_BINARY_DIR}/../dist"
   OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/../dist/index.html"
   DEPENDS
      ${APP_CONTENT_DEPENDS}
      ${CMAKE_CURRENT_SOURCE_DIR}/index.html
      ${CMAKE_CURRENT_SOURCE_DIR}/build.ts
      ${CMAKE_CURRENT_SOURCE_DIR}/package.json
      ${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.json
      ${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.app.json
      ${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.build.json
      ${CMAKE_CURRENT_SOURCE_DIR}/../tsconfig.base.json
)
