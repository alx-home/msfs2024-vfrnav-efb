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

#include "Registry/Registry.h"
#include "Utils/LaunchMode.h"
#include "Utils/FindMSFS.h"

#include <filesystem>
#include <fstream>
#include <regex>

namespace launch_mode {
namespace {

std::string
RemoveFromExeXml(std::string_view data) {
   // error_stack....
   // std::regex reg{R"(( |\t|\r?\n)*<Launch\.Addon>((.|\r?\n)(?!<Name>))*.?<Name>MSFS2024 VFRNav'
   // Server Server((.|\r?\n)(?!</Launch\.Addon>))*.?</Launch\.Addon>([ \t]*(\r?\n)?))"};

   auto it = data.begin();

   auto const skip_space = [&]() constexpr {
      while (it != data.end() && (*it == ' ' || *it == '\t' || *it == '\n' || *it == '\r')) {
         ++it;
      }
   };

   auto const find = [&](std::string_view name) constexpr {
      skip_space();

      auto it2 = name.begin();

      for (; it != data.end(); ++it, ++it2) {
         if (it2 == name.end()) {
            skip_space();

            if (it != data.end() && *it == '>') {
               ++it;
               return true;
            }

            return false;
         }

         if (*it != *it2) {
            return false;
         }
      }

      return false;
   };

   auto const find_end = [&](std::string_view name) constexpr {
      for (; it != data.end(); ++it) {

         auto end = it;

         if (*it == '<') {
            ++it;
            if (it == data.end()) {
               return name.end();
            }

            skip_space();

            if (*it == '/') {
               ++it;
               skip_space();

               if (find(name)) {
                  return end;
               }
            }
         }
      }

      return name.end();
   };

   while (it != data.end()) {
      auto const beg = it;

      if (*it == ' ' || *it == '\t' || *it == '\r' || *it == '\n') {
         skip_space();
         if (it == data.end()) {
            return data.data();
         }
      }

      if (*it == '<') {
         ++it;
         if (find("Launch.Addon")) {
            auto const launch_beg = it;

            if (auto const launch_end = find_end("Launch.Addon"); launch_end != data.end()) {
               auto end = it;
               it       = launch_beg;

               while (it != end) {
                  if (*it == '<') {
                     ++it;

                     if (find("Name")) {
                        auto name_beg = it;

                        if (auto const name_end = find_end("Name"); name_end != data.end()) {
                           if (std::distance(it, launch_end) > 0) {
                              if (std::string_view{name_beg, name_end}
                                  == "MSFS2024 VFRNav' Server") {
                                 // FOUND :)
                                 it = end;
                                 skip_space();
                                 end = it;

                                 if (end != data.end()) {
                                    return std::string{data.begin(), beg}
                                           + std::string{end, data.end()};
                                 } else {
                                    return std::string{data.begin(), beg};
                                 }
                              }
                           }
                        }
                     }
                  } else {
                     ++it;
                  }
               }
            }
         }
      } else {
         ++it;
      }
   }

   return data.data();
}

std::string
AddToExeXml(std::string_view data, std::string_view path) {
   std::regex  reg{"(\r?\n)?</SimBase.Document>"};
   std::string replace_string{std::string_view{
     R"_(
       <Launch.Addon>
           <Disabled>False</Disabled>
           <ManualLoad>False</ManualLoad>
           <Name>MSFS2024 VFRNav' Server</Name>
           <Path>)_"
     + std::string{path} + R"_(\msfs2024-vfrnav_server.exe</Path>
           <CommandLine></CommandLine>
           <NewConsole>False</NewConsole>
       </Launch.Addon>
   </SimBase.Document>)_"
   }};

   std::regex formated{"^[ \t].*"};

   if (!std::regex_search(std::string{data}, formated)) {
      std::regex remove_trailing{R"((\r?\n *))"};
      replace_string = std::regex_replace(replace_string, remove_trailing, "");
   }

   return std::regex_replace(std::string{data}, reg, replace_string);
}

}  // namespace

std::vector<std::string>
StartupImpl(bool clean) {
   auto& registry = registry::Get();
   auto& settings = registry.alx_home_->settings_;

   auto const                  fsPath  = ::FindMSFS();
   std::filesystem::path const exePath = fsPath + "\\exe.xml";

   if (auto const Exists = std::filesystem::exists(exePath); !Exists && clean) {
      return {"Path not found : ", "\"" + exePath.string() + "\"", "Couldn't clean it !"};
   } else if (Exists) {
      std::string content;

      {
         std::ifstream file{exePath};

         file.seekg(0, std::ios::end);
         content.resize(file.tellg());
         file.seekg(0, std::ios::beg);

         file.read(content.data(), content.size());
         content = content.data();

         content = RemoveFromExeXml(content);

         if (!clean) {
            content = AddToExeXml(content, *settings->destination_);
         }
      }

      std::ofstream file{exePath, std::ios::ate};
      file.write(content.data(), content.size());

      settings->launch_mode_ = "Startup";
   } else {
      return {"Path not found : ", "\"" + exePath.string() + "'\""};
   }

   return {};
}

std::vector<std::string>
LoginImpl(bool clean) {
   auto& registry = registry::Get();
   auto& settings = registry.alx_home_->settings_;

   auto& run = registry.current_version_->run_;

   if (clean) {
      if (auto const result = run->value_.DeleteValue(); result != S_OK) {
         return {std::format(
           "couldn't clean registry {}:{} ({})",
           run->FullPath(),
           std::string{run->value_.VALUE_NAME.value_.data()},
           result
         )};
      }
   } else {
      run->value_ = "\"" + *settings->destination_ + R"(\msfs2024-vfrnav_server.exe" --minimized)";
      settings->launch_mode_ = "Login";
   }

   return {};
}

std::vector<std::string>
Never() {
   auto& registry = registry::Get();
   auto& settings = registry.alx_home_->settings_;

   std::vector<std::string> error{};

   if (settings->launch_mode_) {
      if (*settings->launch_mode_ == "Startup") {
         error = StartupImpl(true);
      } else if (*settings->launch_mode_ == "Login") {
         error = LoginImpl(true);
      }
   }

   settings->launch_mode_ = "Never";
   return error;
}

std::vector<std::string>
Startup(bool clean) {
   auto error = Never();

   if (error.size()) {
      return error;
   } else {
      return StartupImpl(clean);
   }
}

std::vector<std::string>
Login(bool clean) {
   auto error = Never();

   if (error.size()) {
      return error;
   } else {
      return LoginImpl(clean);
   }
}

}  // namespace launch_mode