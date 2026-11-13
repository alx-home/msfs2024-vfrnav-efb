add_subdirectory(app)

add_custom_target(github_app ALL DEPENDS github_app_web)
