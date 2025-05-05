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

#include <Windows.h>

#include <WinUser.h>
#include <winnt.h>

#include <cassert>
#include <filesystem>
#include <fstream>
#include <functional>
#include <ios>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated"
#pragma clang diagnostic ignored "-Wdeprecated-copy-with-user-provided-copy"
#include <boost/iostreams/filtering_streambuf.hpp>
#include <boost/iostreams/copy.hpp>
#include <boost/iostreams/filter/zlib.hpp>
#pragma clang diagnostic pop

#ifdef _WIN32
int WINAPI
WinMain(HINSTANCE /*hInst*/, HINSTANCE /*hPrevInst*/, LPSTR lpCmdLine, int /*nCmdShow*/) {
#else
int
main() {
#endif
   std::string_view cmd{lpCmdLine};

   std::unordered_map<std::string, std::pair<std::string, bool>> resources{};
   std::unordered_map<std::string, std::pair<std::string, bool>> app_resources{};
   std::string                                                   name{};

   std::string_view type{};
   std::string_view tag{};
   bool             option{false};
   bool             zip{false};

   auto constexpr split = [](std::string_view cmd) constexpr -> std::string_view {
      auto const pos = cmd.find_first_of(' ');

      if (pos == std::string::npos) {
         return cmd;
      }
      return {cmd.begin(), cmd.begin() + pos};
   };

   auto constexpr next = [](std::string_view cmd) constexpr -> std::string_view {
      auto const pos = cmd.find_first_of(' ');

      if (pos == std::string::npos) {
         return {cmd.end(), cmd.end()};
      }
      return {cmd.begin() + pos + 1, cmd.end()};
   };

   for (std::string_view value = split(cmd); cmd.size(); cmd = next(cmd), value = split(cmd)) {
      if (option) {
         assert(value == "zip");
         zip    = true;
         option = false;
      } else if (name.empty()) {
         name = value;
      } else if (type.empty()) {
         type = value;
         assert(type.starts_with("--"));
      } else if (tag.empty()) {
         tag = value;
      } else {
         if (value == "--option") {
            option = true;
            continue;
         }

         assert(!value.starts_with("--"));

         assert(type.size());
         assert(tag.size());

         if (type == "--app") {
            app_resources.emplace(tag, std::pair{value, zip});
         } else {
            assert(type == "--resource");
            resources.emplace(tag, std::pair{value, zip});
         }

         type = {};
         tag  = {};
         zip  = false;
      }
   }

   std::string const headerpath{name + "/Resources.cpp"};
   std::string const buildpath{name + "/Resources.asm"};

   std::cout << "BuildPath: " << buildpath << std::endl;
   std::cout << "HeaderPath: " << headerpath << std::endl << std::endl;

   std::ofstream asm_out{buildpath};
   std::ofstream header_out{headerpath};

   asm_out << "section .data\n" << std::endl;

   header_out << R"_(#include <Windows.h>
#include <cstddef>
#include <string>
#include <span>
#include <unordered_map>

)_" << std::endl;

   std::size_t resource_index = 0;

   for (auto const& [name, resource_] : app_resources) {
      auto const& [resource, _] = resource_;
      assert(!_);

      std::size_t                                      offset = resource.size();
      std::vector<std::pair<std::string, std::string>> entries{};

      header_out << std::format(
        R"(
// ------------------------------------------------------------------------------------
//                  APP {0}
// ------------------------------------------------------------------------------------

)",
        name
      );

      std::function<void(std::string const&)> const recurse = [&](std::string const& path) {
         std::cout << "Entering " << path << std::endl;
         if (!std::filesystem::is_directory(path)) {
            throw std::runtime_error(std::format("path {} is not a directory", path));
         }

         for (auto const& entry : std::filesystem::directory_iterator(path)) {
            if (entry.is_directory()) {
               recurse(entry.path().string());
            } else {
               std::string file_path_in = entry.path().string();
               std::string file_path;
               std::string var_name = std::format("INCBIN_{}", resource_index);
               ++resource_index;
               std::string relpath;

               for (std::size_t i = 0; i < file_path_in.size(); ++i) {
                  if (i >= offset) {
                     if (file_path_in[i] == '\\') {
                        relpath += "/";
                     } else {
                        relpath += file_path_in[i];
                     }
                  }

                  if (file_path_in[i] == '\\' || file_path_in[i] == '/' || file_path_in[i] == '.'
                      || file_path_in[i] == '-') {
                     if (file_path_in[i] == '\\') {
                        file_path += "/";
                     } else {
                        file_path += file_path_in[i];
                     }
                  } else {
                     file_path += file_path_in[i];
                  }
               }

               std::cout << "Generating " << entry << ": " << var_name << std::endl;
               asm_out << std::format(
                 R"_(global {0}_START, {0}_END
{0}_START:
incbin "{1}"
{0}_END:
    )_",
                 var_name,
                 file_path
               ) << std::endl;

               header_out << std::format(
                 R"_(extern "C" char const    {0}_START[];
extern "C" char const    {0}_END[];
static std::size_t const {0}_SIZE = {0}_END - {0}_START;
)_",
                 var_name
               ) << std::endl;

               entries.emplace_back(relpath, var_name);
            }
         }
      };

      recurse(resource);

      header_out << std::format(
        R"_(
extern std::unordered_map<std::string, std::span<std::byte const>> const {0};
std::unordered_map<std::string, std::span<std::byte const>> const {0} {{)_",
        name
      ) << std::flush;

      for (auto const& [path, label] : entries) {
         header_out << std::format(
           R"_(
   {{ "{0}", {{ reinterpret_cast<std::byte const*>({1}_START), {1}_SIZE }} }},)_",
           path,
           label
         );
      }

      header_out << R"_(
};
)_" << std::endl;
   }

   for (auto const& [name, resource_] : resources) {
      auto const& [resource__, zip] = resource_;

      std::filesystem::path resource = resource__;

      if (zip) {
         std::vector<char> data{};
         {
            std::ifstream file{resource, std::ios::binary};
            file.seekg(0, std::ios::end);
            auto const size = file.tellg();
            file.seekg(0, std::ios::beg);

            data.resize(size);
            file.read(data.data(), data.size());
         }

         auto const        hash = std::hash<std::string_view>{}({data.data(), data.size()});
         std::stringstream ss{};
         ss << std::hex << hash;
         resource = name + "_" + (ss.str() + ".bin");

         if (!std::filesystem::exists(resource)) {
            // Cleanup previous builds
            for (auto const& elem :
                 std::filesystem::directory_iterator("." / resource.root_directory())) {
               if (elem.is_regular_file()) {
                  auto const path_name = elem.path().filename().string();
                  if (path_name.starts_with(name + "_") && path_name.ends_with(".bin")) {
                     std::cout << "Removing \"" << path_name << "\"" << std::endl;
                     std::filesystem::remove(path_name);
                  }
               }
            }

            std::ofstream file{resource, std::ios::binary | std::ios::ate};

            using namespace boost::iostreams;

            filtering_ostreambuf out;
            out.push(zlib_compressor(zlib::best_compression));
            out.push(file);

            array_source in{data.data(), data.size()};

            copy(in, out);
         }
      }

      std::cout << "Generating " << resource << " (" << resource__ << "): " << name << std::endl;

      header_out << std::format(
        R"_(
// ------------------------------------------------------------------------------------
//                  RESOURCES {0}
// ------------------------------------------------------------------------------------

extern "C" char const    {0}_START[];
extern "C" char const    {0}_END[];
static std::size_t const {0}_SIZE = {0}_END - {0}_START;

extern std::span<std::byte const> const {0};
std::span<std::byte const> const {0}{{
   reinterpret_cast<std::byte const*>({0}_START),
   {0}_SIZE
}};
)_",
        name
      ) << std::endl;

      asm_out << std::format(
        R"_(global {0}_START, {0}_END
{0}_START:
incbin "{1}"
{0}_END:
          )_",
        name,
        resource.string()
      ) << std::endl;
   }

   return 0;
}
