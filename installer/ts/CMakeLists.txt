include_directories(app)

ts_app(TARGET_NAME installer_app
      APP_DIR app/

      DEPENDS
      ${CMAKE_CURRENT_SOURCE_DIR}/build.ts
      ${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.json
      ${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.build.json
      ${CMAKE_CURRENT_SOURCE_DIR}/tsconfig.base.json
      ${CMAKE_CURRENT_SOURCE_DIR}/tailwind.config.ts
      ${CMAKE_CURRENT_SOURCE_DIR}/index.html
      ${CMAKE_CURRENT_SOURCE_DIR}/.env.development
      ${CMAKE_CURRENT_SOURCE_DIR}/.env.production

      ${CMAKE_CURRENT_SOURCE_DIR}/app/env.d.ts
      ${CMAKE_CURRENT_SOURCE_DIR}/app/index.d.ts
      ${CMAKE_CURRENT_SOURCE_DIR}/app/main.tsx
      ${CMAKE_CURRENT_SOURCE_DIR}/app/tsconfig.json

      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/I18nContext.tsx
      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/langs/en.json
      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/langs/fr.json
      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/langs/de.json
      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/langs/it.json
      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/langs/es.json
      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/langs/ja.json
      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/langs/nl.json
      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/langs/pl.json
      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/langs/pt.json
      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/langs/pt-BR.json
      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/langs/ru.json
      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/langs/sv.json
      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/langs/tr.json
      ${CMAKE_CURRENT_SOURCE_DIR}/app/i18n/langs/zh-CN.json

      ${CMAKE_CURRENT_SOURCE_DIR}/app/App/App.tsx
      ${CMAKE_CURRENT_SOURCE_DIR}/app/App/Body.tsx

      ${CMAKE_CURRENT_SOURCE_DIR}/package.json
)