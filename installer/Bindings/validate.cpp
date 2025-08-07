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

#include <chrono>
#include <filesystem>
#include <fstream>
#include <numeric>
#include <string>
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
  std::string                           communityPath,
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

   if (!std::filesystem::exists(std::filesystem::path{communityPath}.parent_path())) {
      co_return Fatal("Path not found : ", "\"" + communityPath + "\"");
   }

   if (!std::filesystem::create_directory(installPath)) {
      if (!std::filesystem::exists(installPath) || !std::filesystem::is_directory(installPath)) {
         co_return Fatal("Couldn't create directory : ", "\"" + installPath + "\"");
      }
   }

   {
      std::ofstream file(
        installPath + "\\msfs2024-vfrnav_server.exe", std::ios::ate | std::ios::binary
      );

      // using namespace boost::iostreams;

      // filtering_istreambuf in;
      // in.push(zlib_decompressor());
      // in.push(array_source{reinterpret_cast<char const*>(SERVER_BIN.data()), SERVER_BIN.size()});

      // copy(in, file);

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

   auto const fsPath =
     std::filesystem::path(communityPath).parent_path().parent_path().parent_path();
   std::filesystem::path const exePath = fsPath.string() + "\\exe.xml";

   auto& registry = registry::Get();
   auto& settings = registry.alx_home_->settings_;

   if (settings->launch_mode_) {
      if (auto result = launch_mode::Never(); result.size()) {
         Warning(result);
      }
   }

   registry.Clear();

   auto& uninstall = registry.current_version_->uninstall_;

   uninstall->icon_      = installPath + "\\msfs2024-vfrnav_server.exe";
   uninstall->name_      = "MSFS2024 VFRNav' Server";
   uninstall->version_   = "1.0.0";
   uninstall->publisher_ = "alx-home";
   uninstall->uninstall_ = installPath + "\\msfs2024-vfrnav_server.exe --uninstall";

   settings->community_         = communityPath;
   settings->destination_       = installPath;
   settings->auto_start_server_ = true;
   settings->server_port_       = 48578ui16;

   if (startupOption == "Startup"_sv) {
      if (auto result = launch_mode::Startup(); result.size()) {
         Warning(result);
      }
   } else if (startupOption == "Login"_sv) {
      if (auto result = launch_mode::Login(); result.size()) {
         Warning(result);
      }
   }

   // Install EFB in community folder

   if (std::filesystem::exists(communityPath) && !std::filesystem::remove_all(communityPath)) {
      co_return Fatal("Couldn't cleanup previous version:", communityPath);
   }

   if (auto const path = communityPath + "/html_ui/efb_ui/efb_apps/msfs2024-vfrnav/efb";
       !std::filesystem::create_directories(path)) {
      co_return Fatal("Couldn't create community package folder:", communityPath);
   }

   if (!std::filesystem::create_directories(
         communityPath + "/ContentInfo/alexhome-msfs2024-vfrnav"
       )) {
      co_return Fatal("Couldn't create community package folder:", communityPath);
   }

#ifndef WATCH_MODE
   for (auto const& [name, data] : EFB_RESOURCES) {
      auto const last_slash = name.find_last_of("/");
      auto const file_name  = name.substr(last_slash == std::string::npos ? 0 : last_slash + 1);
      auto const directory  = communityPath + "/html_ui/efb_ui/efb_apps/msfs2024-vfrnav/"
                             + name.substr(0, last_slash == std::string::npos ? 0 : last_slash);
      if (!std::filesystem::exists(directory) && !std::filesystem::create_directories(directory)) {
         co_return Fatal("Couldn't create directory:", directory);
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

   auto const    thumbnail = communityPath + "/ContentInfo/alexhome-msfs2024-vfrnav/Thumbnail.jpg";
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
      std::ofstream file{communityPath + "/manifest.json", std::ios::binary | std::ios::ate};
      if (!file.is_open()) {
         co_return Fatal("Couldn't create file:", communityPath + "/manifest.json");
      }

      file.write(manifest_str.data(), manifest_str.size());
      if (file.tellp() != manifest_str.size()) {
         co_return Fatal("Couldn't create file:", communityPath + "/manifest.json");
      }
   }

   // Generate layout

   {
      Layout     layout{communityPath};
      auto const layout_str = js::Stringify<2>(layout, true);

      std::ofstream file{communityPath + "/layout.json", std::ios::binary | std::ios::ate};

      if (!file.is_open()) {
         co_return Fatal("Couldn't create file:", communityPath + "/layout.json");
      }

      file.write(layout_str.data(), layout_str.size());
      if (file.tellp() != layout_str.size()) {
         co_return Fatal("Couldn't create file:", communityPath + "/layout.json");
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