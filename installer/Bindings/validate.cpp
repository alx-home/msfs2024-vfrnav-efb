/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If
 * not, see <https://www.gnu.org/licenses/>.
 */

#include "Resources.h"
#include "main.h"
#include "Registry/Install.h"
#include "Registry/Registry.h"
#include "Utils/LaunchMode.h"
#include "promise/promise.h"
#include "windows/Env.h"
#include "windows/Lock.h"
#include "windows/Process.h"
#include "windows/Registry/impl/Registry.h"
#include "windows/Shortcuts.h"
#include "Utils/FindMSFS.h"

#include <chrono>
#include <filesystem>
#include <fstream>
#include <numeric>
#include <string>
#include <system_error>
#include <variant>
#include <vector>
#include <handleapi.h>
#include <json/json.h>
#include <processthreadsapi.h>
#include <synchapi.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated"
#pragma clang diagnostic ignored "-Wdeprecated-copy-with-user-provided-copy"
#include <boost/iostreams/filtering_streambuf.hpp>
#include <boost/iostreams/copy.hpp>
#include <boost/iostreams/filter/zlib.hpp>
#pragma clang diagnostic pop

struct ManifestReleaseNotes {
   struct Neutral {
      std::string last_update_{};
      std::string older_history_{};

      static constexpr js::Proto PROTOTYPE{js::Proto{
        js::_{"LastUpdate", &Neutral::last_update_},
        js::_{"OlderHistory", &Neutral::older_history_}
      }};
   };
   Neutral neutral_{};

   static constexpr js::Proto PROTOTYPE{js::Proto{js::_{"neutral", &ManifestReleaseNotes::neutral_}}
   };
};
struct ResourcesReleaseNote {
   std::string              version_{};
   std::string              date_{};
   std::vector<std::string> notes_{};

   static constexpr js::Proto PROTOTYPE{js::Proto{
     js::_{"version", &ResourcesReleaseNote::version_},
     js::_{"date", &ResourcesReleaseNote::date_},
     js::_{"notes", &ResourcesReleaseNote::notes_}
   }};
};

struct Manifest {
   std::vector<std::string>   dependencies_{};
   std::string                content_type_{};
   std::string                title_{};
   std::string                manufacturer_{};
   std::string                creator_{};
   std::optional<std::string> package_version_{};
   std::string                minimum_game_version_{};
   std::string                minimum_compatibility_version_{};
   std::string                builder_{};
   std::string                package_order_hint_{};
   std::variant<std::vector<ResourcesReleaseNote>, ManifestReleaseNotes> release_notes_{};

   static constexpr js::Proto PROTOTYPE{js::Proto{
     js::_{"dependencies", &Manifest::dependencies_},
     js::_{"content_type", &Manifest::content_type_},
     js::_{"title", &Manifest::title_},
     js::_{"manufacturer", &Manifest::manufacturer_},
     js::_{"creator", &Manifest::creator_},
     js::_{"package_version", &Manifest::package_version_},
     js::_{"minimum_game_version", &Manifest::minimum_game_version_},
     js::_{"minimum_compatibility_version", &Manifest::minimum_compatibility_version_},
     js::_{"builder", &Manifest::builder_},
     js::_{"package_order_hint", &Manifest::package_order_hint_},
     js::_{"release_notes", &Manifest::release_notes_},
   }};
};

struct Layout {
   struct Entry {
      Entry() = default;
      Entry(std::string path, std::size_t size, std::size_t date)
         : path_{std::move(path)}
         , size_{size}
         , date_{date} {}

      std::string path_{};
      std::size_t size_{};
      std::size_t date_{};

      static constexpr js::Proto PROTOTYPE{js::Proto{
        js::_{"path", &Entry::path_},
        js::_{"size", &Entry::size_},
        js::_{"date", &Entry::date_},
      }};
   };

   Layout() = default;
   Layout(std::filesystem::path const& root) { Add(root, root); }

   void Add(std::filesystem::path const& root, std::filesystem::path const& path) {
      if (std::filesystem::is_directory(path)) {
         for (auto const& sub_path : std::filesystem::directory_iterator{path}) {
            Add(root, sub_path);
         }
      } else {
         auto rel_path{std::filesystem::relative(path, root).string()};
         std::ranges::transform(rel_path, rel_path.begin(), [](unsigned char c) {
            return c == '\\' ? '/' : std::tolower(c);
         });

         if (rel_path != "manifest.json") {
            content_.emplace_back(
              rel_path,
              std::filesystem::file_size(path),

              static_cast<std::size_t>(TIMESTAMP.time_since_epoch().count() / 10'000'000)
                * 10'000'000
            );
         }
      }
   }

   std::vector<Entry> content_{};

   static constexpr js::Proto PROTOTYPE{js::Proto{
     js::_{"content", &Layout::content_},
   }};
};

Promise<>
Main::Validate(
  js::Enum<"Startup", "Login", "Never"> startupOption,
  std::string                           addonPath,
  std::string                           installPath
) {
   auto const lock = win32::CreateLock("MSFS_VFR_NAV_SERVER");
   if (!lock) {
      co_return Error(
        "MSFS2024 VFRNav' Server is already running.",
        "Please close the program before retrying the installation process!"
      );
   }

   if (std::filesystem::path const path{installPath};
       !path.has_parent_path() || !std::filesystem::exists(path.parent_path())) {
      co_return Fatal("Parent path not found : ", "\"" + installPath + "\"");
   }

   if (std::filesystem::path const path{addonPath};
       !path.has_parent_path() || !std::filesystem::exists(path.parent_path())) {
      co_return Fatal("Parent path not found : ", "\"" + addonPath + "\"");
   }

   auto& registry = registry::Get();
   auto& settings = registry.alx_home_->settings_;

   if (auto const addon = settings->addon_       ? *settings->addon_
                          : settings->community_ ? *settings->community_
                                                 : "";
       addon.size() && std::filesystem::exists(addon)) {
      if (co_await webview_.Call<bool>("clean_path", addon)) {
         std::error_code ec{};
         if (std::filesystem::remove_all(addon, ec) == static_cast<std::uintmax_t>(-1)) {
            co_return Fatal("Couldn't cleanup previous version : ", ec.message(), addon);
         }
      } else {
         co_return;
      }
   }

   if (std::filesystem::exists(addonPath)) {
      if (co_await webview_.Call<bool>("clean_path", addonPath)) {
         std::error_code ec{};
         if (std::filesystem::remove_all(addonPath, ec) == static_cast<std::uintmax_t>(-1)) {
            co_return Fatal("Couldn't cleanup : ", ec.message(), addonPath);
         }
      } else {
         co_return;
      }
   }

   if (auto const oldInstall = (settings->destination_ ? *settings->destination_ : "");
       oldInstall.size() && (installPath != oldInstall) && std::filesystem::exists(oldInstall)) {
      if (co_await webview_.Call<bool>("clean_path", oldInstall)) {
         std::error_code ec{};
         if (std::filesystem::remove_all(oldInstall, ec) == static_cast<std::uintmax_t>(-1)) {
            co_return Fatal("Couldn't cleanup : ", ec.message(), oldInstall);
         }
      } else {
         co_return;
      }
   }

   if (auto result = launch_mode::Never(); result.size()) {
      Warning(result);
   }

   auto const default_fuel_preset =
     settings->default_fuel_preset_ ? *settings->default_fuel_preset_ : "";
   auto const default_deviation_preset =
     settings->default_deviation_preset_ ? *settings->default_deviation_preset_ : "";
   auto const server_port =
     settings->server_port_ ? static_cast<int32_t>(*settings->server_port_) : -1;

   registry.Clear();

   auto& uninstall = registry.current_version_->uninstall_;

   uninstall->icon_      = installPath + "\\msfs2024-vfrnav_server.exe";
   uninstall->name_      = "MSFS2024 VFRNav' Server";
   uninstall->version_   = "1.0.0";
   uninstall->publisher_ = "alx-home";
   uninstall->uninstall_ = installPath + "\\msfs2024-vfrnav_server.exe --uninstall";

   settings->addon_             = addonPath;
   settings->destination_       = installPath;
   settings->auto_start_server_ = true;
   settings->server_port_ = server_port == -1 ? 48578ui16 : static_cast<uint16_t>(server_port);

   if (default_deviation_preset.size()) {
      settings->default_deviation_preset_ = default_deviation_preset;
   }

   if (default_fuel_preset.size()) {
      settings->default_fuel_preset_ = default_fuel_preset;
   }

   {
      std::error_code ec{};
      std::filesystem::create_directory(installPath, ec);
      if (ec) {
         co_return Fatal("Couldn't create directory : ", ec.message(), "\"" + installPath + "\"");
      }
   }

   {
      std::ofstream file(
        installPath + "\\msfs2024-vfrnav_server.exe", std::ios::ate | std::ios::binary
      );

      if (!file.is_open()) {
         co_return Fatal(
           "Couldn't create file : ", "\"" + installPath + "\\msfs2024-vfrnav_server.exe" + "\""
         );
      }

      file.write(reinterpret_cast<char const*>(SERVER_BIN.data()), SERVER_BIN.size());
   }

   auto const shortcutPath =
     GetAppData() + R"(\Microsoft\Windows\Start Menu\Programs\MSFS2024 VFRNav' Server.lnk)";
   if (auto result = win32::CreateLink(
         installPath + "\\msfs2024-vfrnav_server.exe", shortcutPath, "MSFS2024 VFRNav' Server"
       );
       !SUCCEEDED(result)) {
      Warning("Couldn't create shortcut (" + std::to_string(result) + "):", shortcutPath);
   }

   auto const                  fsPath  = ::FindMSFS();
   std::filesystem::path const exePath = fsPath + "\\exe.xml";

   if (startupOption == "Startup"_sv) {
      if (auto result = launch_mode::Startup(); result.size()) {
         Warning(result);
      }
   } else if (startupOption == "Login"_sv) {
      if (auto result = launch_mode::Login(); result.size()) {
         Warning(result);
      }
   } else {
      if (auto result = launch_mode::Never(); result.size()) {
         Warning(result);
      }
   }

   // Install EFB in community folder
   {
      std::error_code ec{};
      auto const      path = addonPath + "/html_ui/efb_ui/efb_apps/msfs2024-vfrnav/efb";
      std::filesystem::create_directories(path, ec);
      if (ec) {
         co_return Fatal("Couldn't create community package folder:", ec.message(), addonPath);
      }
   }

   {
      std::error_code ec{};
      std::filesystem::create_directories(addonPath + "/ContentInfo/alexhome-msfs2024-vfrnav", ec);
      if (ec) {
         co_return Fatal("Couldn't create community package folder:", ec.message(), addonPath);
      }
   }

#ifndef WATCH_MODE
   for (auto const& [name, data] : EFB_RESOURCES) {
      auto const last_slash = name.find_last_of("/");
      auto const file_name  = name.substr(last_slash == std::string::npos ? 0 : last_slash + 1);
      auto const directory  = addonPath + "/html_ui/efb_ui/efb_apps/msfs2024-vfrnav/"
                             + name.substr(0, last_slash == std::string::npos ? 0 : last_slash);
      std::error_code ec{};
      std::filesystem::create_directories(directory, ec);
      if (ec) {
         co_return Fatal("Couldn't create directory:", ec.message(), directory);
      }

      std::ofstream file{directory + "/" + file_name, std::ios::binary | std::ios::ate};
      if (!file.is_open()) {
         co_return Fatal("Couldn't create file:", directory + "/" + file_name);
      }

      file.write(reinterpret_cast<char const*>(data.data()), data.size());
      if (file.tellp() != data.size()) {
         co_return Fatal("Couldn't create file:", directory + "/" + file_name);
      }
   }

   // Install thumbnail

   auto const    thumbnail = addonPath + "/ContentInfo/alexhome-msfs2024-vfrnav/Thumbnail.jpg";
   std::ofstream file{thumbnail, std::ios::binary | std::ios::ate};

   if (!file.is_open()) {
      co_return Fatal("Couldn't create file:", thumbnail);
   }

   file.write(reinterpret_cast<char const*>(EFB_THUMBNAIL.data()), EFB_THUMBNAIL.size());
   if (file.tellp() != EFB_THUMBNAIL.size()) {
      co_return Fatal("Couldn't create file:", thumbnail);
   }

   // Generate & Install manifest.json

   auto manifest =
     js::Parse<Manifest>(std::string_view{reinterpret_cast<char const*>(EFB_RELEASE_NOTE.data())});
   auto release_notes =
     std::move(std::get<std::vector<ResourcesReleaseNote>>(manifest.release_notes_));

   manifest.package_version_ = release_notes.back().version_;

   auto const transform_note =
     [](
       std::string_view version, std::string_view date, std::vector<std::string> const& input
     ) constexpr {
        return std::format(R"(VERSION {} RELEASED {}\n)", version, date)
               + std::reduce(
                 input.begin(),
                 input.end(),
                 ""_str,
                 [](std::string const& left, std::string const& right) constexpr {
                    return left + "\n" + right;
                 }
               )
               + "\n";
     };

   manifest.release_notes_ = ManifestReleaseNotes{
     .neutral_ =
       {.last_update_ = transform_note(
          *manifest.package_version_, release_notes.back().date_, release_notes.back().notes_
        ),
        .older_history_ = std::reduce(
          release_notes.begin(),
          std::prev(release_notes.end()),
          ""_str,
          [&](std::string const& left, ResourcesReleaseNote const& right) constexpr {
             return left + transform_note(right.version_, right.date_, right.notes_);
          }
        )}
   };

   auto const manifest_str = js::Stringify<2>(manifest, true);
   {
      std::ofstream file{addonPath + "/manifest.json", std::ios::binary | std::ios::ate};
      if (!file.is_open()) {
         co_return Fatal("Couldn't create file:", addonPath + "/manifest.json");
      }

      file.write(manifest_str.data(), manifest_str.size());
      if (file.tellp() != manifest_str.size()) {
         co_return Fatal("Couldn't create file:", addonPath + "/manifest.json");
      }
   }

   // Generate layout

   {
      Layout     layout{addonPath};
      auto const layout_str = js::Stringify<2>(layout, true);

      std::ofstream file{addonPath + "/layout.json", std::ios::binary | std::ios::ate};

      if (!file.is_open()) {
         co_return Fatal("Couldn't create file:", addonPath + "/layout.json");
      }

      file.write(layout_str.data(), layout_str.size());
      if (file.tellp() != layout_str.size()) {
         co_return Fatal("Couldn't create file:", addonPath + "/layout.json");
      }
   }

#endif
   // Open your newly crafted toy ? :)

   if (co_await webview_.Call<bool>("start_program")) {
      webview_.Dispatch([this, installPath]() constexpr {
         win32::NewProcess(installPath + "\\msfs2024-vfrnav_server.exe", "--configure");
         Abort()();
      });
   } else {
      webview_.Dispatch([this]() constexpr { Abort()(); });
   }

   co_return;
}