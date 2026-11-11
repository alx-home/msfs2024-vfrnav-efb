/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2026 Alexandre GARCIN
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

#include "Package.h"
#include "FileSystem.h"
#include "../Templates.h"
#include <boost/json.hpp>
#include <windows.h>
#include <algorithm>
#include <map>
#include <regex>
#include <stdexcept>

namespace tablet {
namespace fs = std::filesystem;

namespace {
void
ReplaceAll(std::string& text, std::string const& from, std::string const& to) {
   if (from.empty()) {
      return;
   }

   std::size_t offset{};
   while ((offset = text.find(from, offset)) != std::string::npos) {
      text.replace(offset, from.size(), to);
      offset += to.size();
   }
}
}  // namespace

Ownership
Package::ReadOwner(fs::path const& directory) {
   auto      value{boost::json::parse(FileSystem::Read(directory / Package::MARKER)).as_object()};
   Ownership result{};

   result.owner_   = std::string{value.at("owner").as_string()};
   result.package_ = std::string{value.at("package").as_string()};
   result.schema_  = value.at("schema").to_number<unsigned>();

   for (auto const& item : value.at("files").as_array()) {
      auto const& file{item.as_object()};

      result.files_.push_back(
        {.path_ = std::string{file.at("path").as_string()},
         .hash_ = std::string{file.at("hash").as_string()}}
      );
   }

   if (result.schema_ == 3) {
      result.container_ = std::string{value.at("container").as_string()};
      result.efb_       = std::string{value.at("efb").as_string()};

      for (auto const& item : value.at("sourceFiles").as_array()) {
         auto const& source{item.as_object()};

         result.stock_.push_back(
           {.path_   = std::string{source.at("path").as_string()},
            .origin_ = std::string{source.at("origin").as_string()},
            .hash_   = std::string{source.at("hash").as_string()},
            .text_   = std::string{source.at("text").as_string()}}
         );
      }

      if (auto sources{value.if_contains("generatorFiles")}) {
         for (auto const& item : sources->as_array()) {
            auto const& file{item.as_object()};

            result.generator_.push_back(
              {.path_ = std::string{file.at("path").as_string()},
               .hash_ = std::string{file.at("hash").as_string()}}
            );
         }
      }
   }

   return result;
}

void
Package::VerifyOwned(fs::path const& directory, Ownership const& owner) {
   static const std::regex PACKAGE_PATTERN{"alexhome-efb-(tablet-core|[0-9a-f]{20})"};
   if (
     owner.owner_ != Package::OWNER || (owner.schema_ != 2 && owner.schema_ != 3)
     || owner.package_ != directory.filename().string()
     || !std::regex_match(owner.package_, PACKAGE_PATTERN)
   ) {
      throw std::runtime_error("Invalid ownership metadata.");
   }

   std::map<std::string, std::string> expected{};

   for (auto const& file : owner.files_) {
      auto path{FileSystem::VirtualPath(file.path_)};
      if (
        path.empty()
        || !expected.emplace(FileSystem::Lower(path.generic_string()), file.hash_).second
      ) {
         throw std::runtime_error("Invalid ownership file list.");
      }
   }

   if (expected.empty()) {
      throw std::runtime_error("Empty ownership file list.");
   }

   for (auto const& file : FileSystem::Files(directory)) {
      if (file.filename() == Package::MARKER) {
         continue;
      }

      auto key{FileSystem::Lower(fs::relative(file, directory).generic_string())};
      auto it{expected.find(key)};
      if (it == expected.end() || FileSystem::Hash(FileSystem::ReadBytes(file)) != it->second) {
         throw std::runtime_error("Package was modified; refusing to alter it: " + file.string());
      }

      expected.erase(it);
   }

   if (!expected.empty()) {
      throw std::runtime_error("Package is incomplete; refusing to alter it.");
   }
}

void
Package::WritePackageFiles(
  fs::path const&    packageDir,
  Ownership const&   owner,
  std::string const& title
) {
   std::string content{};

   for (auto const& file : FileSystem::Files(packageDir)) {
      if (
        file.filename() == MARKER || file.filename() == "layout.json"
        || file.filename() == "manifest.json"
      ) {
         continue;
      }

      WIN32_FILE_ATTRIBUTE_DATA data{};

      GetFileAttributesExW(file.c_str(), GetFileExInfoStandard, &data);

      ULARGE_INTEGER ft{};

      ft.LowPart  = data.ftLastWriteTime.dwLowDateTime;
      ft.HighPart = data.ftLastWriteTime.dwHighDateTime;
      if (!content.empty()) {
         content += ',';
      }

      content += "\n    "
                 + boost::json::serialize(
                   boost::json::object{
                     {"path", FileSystem::Lower(fs::relative(file, packageDir).generic_string())},
                     {"size", fs::file_size(file)},
                     {"date", ft.QuadPart}
                   }
                 );
   }

   FileSystem::Write(
     packageDir / "layout.json", Templates::Render("fleet/layout.json", {{"CONTENT", content}})
   );

   auto manifest_text{[&](std::uint64_t total) {
      auto encodedTitle{boost::json::serialize(boost::json::string{title})};
      auto encodedTotal{boost::json::serialize(boost::json::string{std::to_string(total)})};

      return Templates::Render(
        "fleet/manifest.json", {{"TITLE", encodedTitle}, {"TOTAL_PACKAGE_SIZE", encodedTotal}}
      );
   }};

   FileSystem::Write(packageDir / "manifest.json", manifest_text(0));

   std::uint64_t total{0};

   for (auto const& file : FileSystem::Files(packageDir)) {
      if (file.filename() != Package::MARKER) {
         total += fs::file_size(file);
      }
   }

   FileSystem::Write(packageDir / "manifest.json", manifest_text(total));

   boost::json::array inventory{};
   boost::json::array stock{};
   boost::json::array generator{};

   for (auto const& file : FileSystem::Files(packageDir)) {
      if (file.filename() == Package::MARKER) {
         continue;
      }

      inventory.emplace_back(
        boost::json::object{
          {"path", fs::relative(file, packageDir).generic_string()},
          {"hash", FileSystem::Hash(FileSystem::ReadBytes(file))}
        }
      );
   }

   for (auto const& file : owner.stock_) {
      stock.emplace_back(
        boost::json::object{
          {"path", file.path_}, {"origin", file.origin_}, {"hash", file.hash_}, {"text", file.text_}
        }
      );
   }

   for (auto const& file : owner.generator_) {
      generator.emplace_back(boost::json::object{{"path", file.path_}, {"hash", file.hash_}});
   }

   FileSystem::Write(
     packageDir / Package::MARKER,
     boost::json::serialize(
       boost::json::object{
         {"owner", Package::OWNER},
         {"schema", 3},
         {"package", packageDir.filename().string()},
         {"container", owner.container_},
         {"efb", owner.efb_},
         {"files", std::move(inventory)},
         {"sourceFiles", std::move(stock)},
         {"generatorFiles", std::move(generator)}
       }
     )
   );
}

std::map<std::string, std::string> const&
Package::CompiledRig() {
   static auto const FILES{[] {
      std::map<std::string, std::string> result{};

      for (auto const& [relative, name] :
           {std::pair{"attachment.cfg", L"EFB_RIG_ATTACHMENT_CFG"},
            {"config/attached_objects.cfg", L"EFB_RIG_CONFIG_ATTACHED_OBJECTS_CFG"},
            {"input/action.actiondb", L"EFB_RIG_INPUT_ACTION_ACTIONDB"},
            {"model/model.xml", L"EFB_RIG_MODEL_MODEL_XML"},
            {"model/model.behavior.xml", L"EFB_RIG_MODEL_MODEL_BEHAVIOR_XML"},
            {"model/model.actiondb", L"EFB_RIG_MODEL_MODEL_ACTIONDB"},
            {"model/rig.gltf", L"EFB_RIG_MODEL_RIG_GLTF"},
            {"model/rig.bin", L"EFB_RIG_MODEL_RIG_BIN"},
            {"edit/attachment.cfg", L"EFB_RIG_EDIT_ATTACHMENT_CFG"},
            {"edit/model/model.xml", L"EFB_RIG_EDIT_MODEL_MODEL_XML"},
            {"edit/texture/texture.cfg", L"EFB_RIG_EDIT_TEXTURE_TEXTURE_CFG"}}) {
         auto module{GetModuleHandleW(nullptr)};
         auto resource{FindResourceW(module, name, MAKEINTRESOURCEW(10))};
         auto size{resource ? SizeofResource(module, resource) : 0};
         auto loaded{resource ? LoadResource(module, resource) : nullptr};
         auto data{loaded ? LockResource(loaded) : nullptr};
         if (!data || !size) {
            throw std::runtime_error(
              "Missing SDK-compiled tablet generator resource: " + std::string{relative}
              + ". Rebuild the VFRNav server."
            );
         }

         result.emplace(
           (fs::path{Package::RIG_ROOT} / relative).generic_string(),
           std::string{static_cast<char const*>(data), size}
         );
      }

      auto module{GetModuleHandleW(nullptr)};
      auto resource{FindResourceW(module, L"EFB_RIG_EN_US_LOCPAK", MAKEINTRESOURCEW(10))};
      auto size{resource ? SizeofResource(module, resource) : 0};
      auto loaded{resource ? LoadResource(module, resource) : nullptr};
      auto data{loaded ? LockResource(loaded) : nullptr};
      if (!data || !size) {
         throw std::runtime_error(
           "Missing SDK-compiled tablet generator resource: en-US.locPak. Rebuild the VFRNav "
           "server."
         );
      }

      result.emplace("en-US.locPak", std::string{static_cast<char const*>(data), size});

      auto const& model{
        result.at((fs::path{Package::RIG_ROOT} / "model" / "model.xml").generic_string())
      };
      if (
        model.find("Compiled=\"True\"") == std::string::npos
        || model.find("CompileBehaviors") != std::string::npos
        || model.find("model.behavior.xml") == std::string::npos
      ) {
         throw std::runtime_error("Invalid SDK-compiled tablet generator resource.");
      }

      result.emplace(
        "UpdateFrequencyPresets/VFRNAV_Tablet.xml", Templates::Render("rig/update-frequency.xml")
      );

      return result;
   }()};

   return FILES;
}

std::map<std::string, std::string>
Package::CompiledRig(std::string const& aircraftId) {
   auto const sourceRoot{fs::path{Package::RIG_ROOT}.generic_string()};
   auto const targetRoot{fs::path{Package::RigRoot(aircraftId)}.generic_string()};
   auto const sourceAlias{std::string{"Alexhome_EFB_Tablet"}};
   auto const targetAlias{Package::RigAlias(aircraftId)};
   std::map<std::string, std::string> result{};

   for (auto const& [path, original] : Package::CompiledRig()) {
      auto       relative{fs::path{path}.lexically_relative(sourceRoot)};
      auto const isRigResource{!relative.empty() && *relative.begin() != ".."};
      auto       target{isRigResource ? (fs::path{targetRoot} / relative).generic_string() : path};
      auto       bytes{original};

      if (isRigResource) {
         ReplaceAll(bytes, sourceRoot, targetRoot);
         ReplaceAll(bytes, fs::path{Package::RIG_ROOT}.string(), Package::RigRoot(aircraftId));
         ReplaceAll(bytes, sourceAlias, targetAlias);
      }

      result.emplace(std::move(target), std::move(bytes));
   }

   return result;
}

std::string
Package::RigRoot(std::string const& aircraftId) {
   auto root{fs::path{Package::RIG_ROOT}};
   return (root.parent_path() / (root.filename().string() + "_" + aircraftId)).string();
}

std::string
Package::RigAlias(std::string const& aircraftId) {
   return "Alexhome_EFB_Tablet_" + aircraftId;
}

bool
Package::GeneratorChanged(Ownership const& owner) {
   auto const id{
     FileSystem::Hash("efb-patch-v1|" + FileSystem::Lower(owner.container_)).substr(0, 20)
   };
   auto resources{Package::CompiledRig(id)};

   if (owner.generator_.size() != resources.size()) {
      return true;
   }

   for (auto const& [path, bytes] : resources) {
      auto source{std::ranges::find_if(owner.generator_, [&](auto const& file) {
         return file.path_ == path;
      })};
      auto output{std::ranges::find_if(owner.files_, [&](auto const& file) {
         return file.path_ == path;
      })};
      auto hash{FileSystem::Hash(bytes)};
      if (
        source == owner.generator_.end() || source->hash_ != hash || output == owner.files_.end()
        || output->hash_ != hash
      ) {
         return true;
      }
   }

   return false;
}

std::string
Package::PackageName(Plan const& plan) {
   return "alexhome-efb-" + plan.info_.id_;
}
}  // namespace tablet
