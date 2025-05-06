file(GLOB_RECURSE COMMON_DEPENDS LIST_DIRECTORIES false CONFIGURE_DEPENDS
  ${CMAKE_CURRENT_SOURCE_DIR}/common/*
)
file(GLOB_RECURSE APP_DEPENDS LIST_DIRECTORIES false CONFIGURE_DEPENDS
  ${CMAKE_CURRENT_SOURCE_DIR}/app/*
)
file(GLOB_RECURSE TASKBAR_DEPENDS LIST_DIRECTORIES false CONFIGURE_DEPENDS
  ${CMAKE_CURRENT_SOURCE_DIR}/taskbar/*
)
file(GLOB_RECURSE TASKBAR_TOOLTIP_DEPENDS LIST_DIRECTORIES false CONFIGURE_DEPENDS
  ${CMAKE_CURRENT_SOURCE_DIR}/taskbar_tooltip/*
)

set(BUILD_DEPENDS
  ${CMAKE_CURRENT_SOURCE_DIR}/build.ts
  ${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.json
  ${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.build.json
  ${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.base.json
  ${CMAKE_CURRENT_SOURCE_DIR}/tailwind.config.ts
  ${CMAKE_CURRENT_SOURCE_DIR}/.env.development
  ${CMAKE_CURRENT_SOURCE_DIR}/.env.production
  ${CMAKE_CURRENT_SOURCE_DIR}/package.json
)

ts_app(TARGET_NAME server_app
  BUILD_TARGET "build$<$<CONFIG:DEBUG>:\:dev>" app
  APP_DIR app
  DEPENDS
    vfrnav_common_ts
    ${COMMON_DEPENDS}
    ${APP_DEPENDS}
    ${BUILD_DEPENDS}
)

ts_app(TARGET_NAME server_taskbar
  BUILD_TARGET "build$<$<CONFIG:DEBUG>:\:dev>" taskbar
  APP_DIR taskbar
  DEPENDS
    vfrnav_common_ts
    ${COMMON_DEPENDS}
    ${TASKBAR_DEPENDS}
    ${BUILD_DEPENDS}
)

ts_app(TARGET_NAME server_taskbar_tooltip
  BUILD_TARGET "build$<$<CONFIG:DEBUG>:\:dev>" taskbar-tooltip
  APP_DIR taskbar_tooltip
  DEPENDS
    vfrnav_common_ts
    ${COMMON_DEPENDS}
    ${TASKBAR_TOOLTIP_DEPENDS}
    ${BUILD_DEPENDS}
)