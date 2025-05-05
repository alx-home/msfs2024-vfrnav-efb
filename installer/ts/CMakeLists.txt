include_directories(app)

ts_app(TARGET_NAME installer_app
      APP_DIR app/
       
      DEPENDS
         ${CMAKE_CURRENT_SOURCE_DIR}/build.ts
         ${CMAKE_CURRENT_SOURCE_DIR}/package.json
         ${CMAKE_CURRENT_SOURCE_DIR}/eslint.config.mjs
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

         ${CMAKE_CURRENT_SOURCE_DIR}/app/App/App.tsx
         ${CMAKE_CURRENT_SOURCE_DIR}/app/App/Body.tsx
         ${CMAKE_CURRENT_SOURCE_DIR}/app/App/Popup.tsx
)