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

#include "Planner.h"
#include "FileSystem.h"
#include "Package.h"
#include <algorithm>
#include <array>
#include <climits>
#include <cmath>
#include <set>
#include <sstream>
#include <stdexcept>

namespace tablet {
namespace fs = std::filesystem;

void
Planner::CompensateRigDefaultPose(Section& sec) {
   auto offset{sec.Get("attach_offset")};

   std::ranges::replace(offset, ',', ' ');

   std::istringstream input{offset};
   double             x{}, y{}, z{};
   if (!input.eof() && !(input >> x >> y >> z)) {
      throw std::runtime_error("Tablet mount has an invalid attach_offset.");
   }

   if (!std::isfinite(x) || !std::isfinite(y) || !std::isfinite(z)) {
      throw std::runtime_error("Tablet mount has a non-finite attach_offset.");
   }

   std::ostringstream corrected{};

   corrected << x << ", " << y - .35 << ", " << z - 1.2;
   sec.Set("attach_offset", corrected.str());
}

void
Planner::ConfigureRigAttachment(
  Section&           sec,
  std::string const& rigRoot,
  std::string const& rigAlias,
  bool               compensateDefaultPose
) {
   if (compensateDefaultPose) {
      Planner::CompensateRigDefaultPose(sec);
   }

   sec.Set("alias", FileSystem::QuoteIni(rigAlias));
   sec.Set("attachment", FileSystem::QuoteIni(rigRoot + "\\model\\model.xml"));
   sec.Remove("attachment_root");
   sec.Remove("attachment_file");
   if (sec.Get("attach_to_model").empty()) {
      sec.Set("attach_to_model", "\"interior\"");
   }

   if (sec.Get("attach_to_model_minsize").empty()) {
      sec.Set("attach_to_model_minsize", "0");
   }

   if (sec.Get("attach_scale").empty()) {
      sec.Set("attach_scale", "1");
   }

   sec.Set("always_execute_model_behavior", "1");
}

void
Planner::AddRigAttachment(
  Ini&               attachments,
  std::string const& rigRoot,
  std::string const& rigAlias,
  double             x,
  double             y,
  double             z
) {
   if (std::ranges::none_of(attachments.sections_, [](auto const& sec) {
          return sec.name_ == "version";
       })) {
      auto& version{attachments.Get("version")};

      version.Set("major", "1");
      version.Set("minor", "0");
   }

   std::set<unsigned>         used{};
   constexpr std::string_view prefix{"sim_attachment."};

   for (auto const& sec : attachments.sections_) {
      if (!sec.name_.starts_with(prefix)) {
         continue;
      }

      auto const tail{sec.name_.substr(prefix.size())};

      try {
         std::size_t parsed{};
         auto const  value{std::stoul(tail, &parsed)};
         if (parsed == tail.size() && value <= UINT_MAX) {
            used.insert(static_cast<unsigned>(value));
         }
      } catch (std::invalid_argument const&) {
         continue;
      } catch (std::out_of_range const&) {
         continue;
      }
   }

   unsigned next{0};

   while (used.contains(next) && next < UINT_MAX) {
      ++next;
   }

   auto& sec{attachments.Get("sim_attachment." + std::to_string(next))};

   Planner::ConfigureRigAttachment(sec, rigRoot, rigAlias);
   sec.Set("attach_to_model", "\"interior\"");
   sec.Set("attach_to_model_minsize", "0");

   std::ostringstream offset{};

   offset << x << ", " << y << ", " << z;
   sec.Set("attach_offset", offset.str());
   sec.Set("attach_pbh", "0, 0, 0");
}

std::string
Planner::Track(Plan& plan, fs::path const& file, std::vector<fs::path> const& roots) {
   auto        origin{file.lexically_normal()};
   std::string relative{};

   for (auto const& root : roots) {
      auto rel{origin.lexically_relative(root)};
      if (!rel.empty() && *rel.begin() != "..") {
         relative = rel.generic_string();
         break;
      }
   }

   if (relative.empty()) {
      throw std::runtime_error("Source file is outside the aircraft content roots.");
   }

   auto bytes{FileSystem::ReadBytes(origin)};
   auto hash{FileSystem::Hash(bytes)};

   if (plan.previous_) {
      auto const& previous{*plan.previous_};
      auto        old{std::ranges::find_if(previous.stock_, [&](auto const& f) {
         return FileSystem::Lower(f.path_) == FileSystem::Lower(relative);
      })};
      bool        overlay{std::ranges::any_of(previous.files_, [&](auto const& f) {
         return FileSystem::Lower(f.path_) == FileSystem::Lower(relative) && f.hash_ == hash;
      })};
      if (overlay && old != previous.stock_.end()) {
         plan.stock_[FileSystem::Lower(relative)]         = *old;
         plan.stock_[FileSystem::Lower(relative)].origin_ = origin.string();
         return old->text_;
      }
   }

   auto text{FileSystem::Read(origin)};

   plan.stock_[FileSystem::Lower(relative)] = {
     .path_ = relative, .origin_ = origin.string(), .hash_ = hash, .text_ = text
   };
   return text;
}

fs::path
Planner::AttachmentModel(Section const& sec, std::vector<fs::path> const& roots) {
   if (!sec.Get("attachment").empty()) {
      return FileSystem::Resolve(roots, FileSystem::VirtualPath(sec.Get("attachment")));
   }

   if (!sec.Get("attachment_root").empty() && !sec.Get("attachment_file").empty()) {
      return FileSystem::Resolve(
        roots,
        FileSystem::VirtualPath(sec.Get("attachment_root"))
          / FileSystem::VirtualPath(sec.Get("attachment_file"))
      );
   }

   return {};
}

bool
Planner::OwnRig(Section const& sec) {
   auto ref{FileSystem::Lower(sec.Get("attachment") + " " + sec.Get("attachment_root"))};

   std::ranges::replace(ref, '/', '\\');
   return FileSystem::Lower(sec.Get("alias")).starts_with("alexhome_efb_tablet")
          || ref.find(FileSystem::Lower(Package::RIG_ROOT)) != std::string::npos;
}

bool
Planner::IsTablet(Section const& sec, std::vector<fs::path> const& roots, Plan& plan) {
   if (Planner::OwnRig(sec)) {
      return false;
   }

   auto reference{FileSystem::Lower(
     sec.Get("attachment") + " " + sec.Get("attachment_root") + " " + sec.Get("attachment_file")
   )};
   bool named{
     reference.find("tablet") != std::string::npos || reference.find("efb") != std::string::npos
   };
   auto model{Planner::AttachmentModel(sec, roots)};
   if (model.empty()) {
      if (named) {
         throw std::runtime_error("Tablet has no readable attachment reference.");
      }

      return false;
   }

   auto panel{model.parent_path().parent_path() / "panel" / "panel.cfg"};
   if (!fs::is_regular_file(panel)) {
      return named;
   }

   auto text{FileSystem::Lower(Planner::Track(plan, panel, roots))};
   bool efb{text.find("[efb]") != std::string::npos};
   if (
     (named || efb)
     && (text.find("vcockpit") != std::string::npos || text.find("[window0") != std::string::npos)
   ) {
      throw std::runtime_error(
        "EFB is part of a multifunction cockpit attachment; removal is unsafe."
      );
   }

   return named || efb;
}

bool
Planner::ReplaceTabletsWithRig(
  Ini&                         cfg,
  std::vector<fs::path> const& roots,
  Plan&                        plan,
  bool&                        rigPlaced
) {
   std::vector<std::string> remove{};
   bool                     changed{false};

   for (auto& sec : cfg.sections_) {
      if (!sec.name_.starts_with("sim_attachment.") || !Planner::IsTablet(sec, roots, plan)) {
         continue;
      }

      changed = true;
      if (!rigPlaced) {
         Planner::ConfigureRigAttachment(
           sec,
           Package::RigRoot(plan.info_.id_),
           Package::RigAlias(plan.info_.id_),
           true
         );
         rigPlaced = true;
      } else {
         remove.push_back(sec.name_);
      }
   }

   std::erase_if(cfg.sections_, [&](auto const& sec) {
      return std::ranges::find(remove, sec.name_) != remove.end();
   });
   return changed;
}

std::array<double, 3>
Planner::PilotOffset(Plan& plan, fs::path const& preset, std::vector<fs::path> const& roots) {
   auto parse{[](std::string text) {
      std::ranges::replace(text, ',', ' ');

      std::istringstream    input{text};
      std::array<double, 3> position{};

      if (
        !(input >> position[0] >> position[1] >> position[2]) || !(input >> std::ws).eof()
        || !std::ranges::all_of(position, [](double value) { return std::isfinite(value); })
      ) {
         throw std::runtime_error("Invalid camera coordinates: " + text);
      }

      return position;
   }};

   auto const common{plan.aircraft_ / "common" / "config" / "cameras.cfg"};
   std::optional<std::array<double, 3>> eye{};
   for (auto const& file : {preset / "config" / "cameras.cfg", common}) {
      if (!fs::is_regular_file(file)) {
         continue;
      }

      try {
         Ini cfg{Planner::Track(plan, file, roots)};

         if (!eye) {
            auto eye_text{cfg.Get("views").Get("eyepoint")};
            if (eye_text.empty() && file != common && fs::is_regular_file(common)) {
               Ini defaults{Planner::Track(plan, common, roots)};
               eye_text = defaults.Get("views").Get("eyepoint");
            }

            if (eye_text.empty()) {
               throw std::runtime_error("Missing camera eyepoint.");
            }

            eye = parse(eye_text);
         }

         for (auto const& sec : cfg.sections_) {
            if (
              sec.name_.starts_with("cameradefinition.")
              && FileSystem::Lower(sec.Get("title")) == "pilot"
            ) {
               auto text{sec.Get("initialxyz")};
               auto offset{text.empty() ? std::array<double, 3>{} : parse(text)};

               // Eyepoint is longitudinal/lateral/vertical in feet; camera and rig use XYZ metres.
               constexpr double      feet_to_metres{.3048};
               std::array<double, 3> position{
                 (*eye)[1] * feet_to_metres + offset[0],
                 (*eye)[2] * feet_to_metres + offset[1] - .64,
                 (*eye)[0] * feet_to_metres + offset[2] - .87
               };

               if (!std::ranges::all_of(position, [](double value) {
                      return std::isfinite(value);
                   })) {
                  throw std::runtime_error("Calculated camera position is non-finite.");
               }

               return position;
            }
         }
      } catch (std::exception const& error) {
         plan.info_.warnings_.push_back(
           "Cannot read pilot camera " + file.string() + ": " + error.what()
         );
      }
   }

   plan.info_.warnings_.emplace_back("position estimated; adjust with the in-cockpit move handle");
   return {0, .8, 0};
}

void
Planner::PatchPreset(Plan& plan, fs::path const& preset, std::vector<fs::path> const& roots) {
   auto attached{preset / "config" / "attached_objects.cfg"};
   if (!fs::is_regular_file(attached)) {
      attached = plan.aircraft_ / "common" / "config" / "attached_objects.cfg";
   }

   if (!fs::is_regular_file(attached)) {
      throw std::runtime_error("Preset has no readable attached_objects.cfg.");
   }

   Ini  cfg{Planner::Track(plan, attached, roots)};
   bool rig_placed{false};
   if (
     Planner::ReplaceTabletsWithRig(cfg, roots, plan, rig_placed) && plan.info_.efb_ != "nested"
   ) {
      plan.info_.efb_ = "direct";
   }

   for (auto const& sec : cfg.sections_) {
      if (!sec.name_.starts_with("sim_attachment.") || Planner::OwnRig(sec)) {
         continue;
      }

      auto model{Planner::AttachmentModel(sec, roots)};
      if (model.empty()) {
         continue;
      }

      auto nested{model.parent_path().parent_path() / "config" / "attached_objects.cfg"};
      if (!fs::is_regular_file(nested)) {
         continue;
      }

      Ini  child{Planner::Track(plan, nested, roots)};
      auto had_tablet{std::ranges::any_of(child.sections_, [&](auto const& part) {
         return part.name_.starts_with("sim_attachment.") && Planner::IsTablet(part, roots, plan);
      })};
      auto child_changed{Planner::ReplaceTabletsWithRig(child, roots, plan, rig_placed)};

      // A third attachment layer is deliberately unsupported, not silently left with a second
      // tablet.
      for (auto const& part : child.sections_) {
         if (part.name_.starts_with("sim_attachment.") && !Planner::OwnRig(part)) {
            auto child_model{Planner::AttachmentModel(part, roots)};
            if (child_model.empty()) {
               continue;
            }

            auto deeper{
              child_model.parent_path().parent_path() / "config" / "attached_objects.cfg"
            };
            if (fs::is_regular_file(deeper)) {
               Ini  grandchild{Planner::Track(plan, deeper, roots)};
               bool deeper_rig_placed{false};
               if (Planner::ReplaceTabletsWithRig(grandchild, roots, plan, deeper_rig_placed)) {
                  throw std::runtime_error("Tablet is nested deeper than one attachment level.");
               }
            }
         }
      }

      if (child_changed && had_tablet) {
         plan.info_.efb_ = "nested";

         auto stock{std::ranges::find_if(plan.stock_, [&](auto const& item) {
            return item.second.origin_ == nested.lexically_normal().string();
         })};
         if (stock == plan.stock_.end()) {
            throw std::runtime_error("Cannot determine nested attachment path.");
         }

         plan.files_[stock->second.path_] = child.Text();
      }
   }

   if (!rig_placed) {
      std::erase_if(cfg.sections_, [](auto const& sec) {
         return sec.name_.starts_with("sim_attachment.") && Planner::OwnRig(sec);
      });

      auto offset{Planner::PilotOffset(plan, preset, roots)};

      Planner::AddRigAttachment(
        cfg,
        Package::RigRoot(plan.info_.id_),
        Package::RigAlias(plan.info_.id_),
        offset[0],
        offset[1],
        offset[2]
      );
   }

   auto preset_relative{preset.lexically_relative(plan.root_)};

   plan.files_[(preset_relative / "config" / "attached_objects.cfg").generic_string()] = cfg.Text();
}

Plan
Planner::Inspect(
  fs::path const&              root,
  fs::path const&              aircraft,
  std::vector<fs::path> const& roots,
  std::string const&           mode,
  fs::path const&              output
) {
   Plan plan{};

   plan.root_            = root;
   plan.aircraft_        = aircraft;
   plan.info_.container_ = aircraft.lexically_relative(root).generic_string();
   plan.info_.id_ =
     FileSystem::Hash("efb-patch-v1|" + FileSystem::Lower(plan.info_.container_)).substr(0, 20);
   plan.info_.name_   = FileSystem::Pretty(aircraft.filename().string());
   plan.info_.status_ = "available";
   plan.info_.efb_    = "none";

   if (mode == "deep") {
      auto const package{output / ("alexhome-efb-" + plan.info_.id_)};
      if (fs::exists(package)) {
         try {
            auto owner{Package::ReadOwner(package)};

            Package::VerifyOwned(package, owner);

            if (
              owner.schema_ == 3
              && FileSystem::Lower(owner.container_) == FileSystem::Lower(plan.info_.container_)
            ) {
               plan.previous_ = std::move(owner);
            }
         } catch (std::exception const& error) {
            plan.info_.warnings_.push_back(
              "Cannot recover previous stock metadata from " + package.string() + ": "
              + error.what()
            );
         }
      }
   }

   try {
      FileSystem::SafePath(aircraft);
      if (!fs::is_directory(aircraft / "presets")) {
         throw std::runtime_error("Legacy/non-modular aircraft has no modular presets.");
      }

      for (auto const& vendor : fs::directory_iterator{aircraft / "presets"}) {
         auto name{FileSystem::Lower(vendor.path().filename().string())};
         if (
           !vendor.is_directory() || name == "alexhome_efb" || name == "vfrnav"
           || name == "alexhome"
         ) {
            continue;
         }

         FileSystem::SafePath(vendor.path());
         for (auto const& preset : fs::directory_iterator{vendor.path()}) {
            if (!preset.is_directory()) {
               continue;
            }

            FileSystem::SafePath(preset.path());

            bool selectable{true};

            try {
               Ini cfg{Planner::Track(plan, preset.path() / "config" / "aircraft.cfg", roots)};
               if (std::ranges::none_of(cfg.sections_, [](auto const& sec) {
                      return sec.name_ == "fltsim.0";
                   })) {
                  plan.info_.warnings_.push_back(
                    preset.path().filename().string()
                    + ": aircraft.cfg has no readable FLTSIM.0; selectable preset assumed."
                  );
               }

               auto& fltsim{cfg.Get("fltsim.0")};

               selectable = fltsim.Get("isuserselectable") != "0";

               auto manufacturer{fltsim.Get("ui_manufacturer")};
               auto type{fltsim.Get("ui_type")};
               auto general{cfg.Get("general")};
               if (manufacturer.empty()) {
                  manufacturer = general.Get("ui_manufacturer");
               }

               if (type.empty()) {
                  type = general.Get("ui_type");
               }

               auto display{FileSystem::Trim(manufacturer + " " + type)};
               if (display.empty()) {
                  display = fltsim.Get("ui_title");
               }

               if (display.empty()) {
                  display = general.Get("ui_title");
               }

               if (
                 !display.empty() && display.find('@') == std::string::npos
                 && display.find("TT:") == std::string::npos
               ) {
                  plan.info_.name_ = display;
               }
            } catch (std::exception const& error) {
               plan.info_.warnings_.push_back(
                 preset.path().filename().string()
                 + ": aircraft.cfg protected/unreadable; selectable preset assumed. " + error.what()
               );
            }

            if (!selectable) {
               continue;
            }

            ++plan.info_.preset_count_;
            plan.info_.preset_names_.push_back(preset.path().filename().string());
            Planner::PatchPreset(plan, preset.path(), roots);
         }
      }

      if (!plan.info_.preset_count_) {
         throw std::runtime_error("No user-selectable modular presets.");
      }

   } catch (std::exception const& error) {
      plan.info_.status_ = "unsupported";
      plan.info_.reason_ = error.what();
      if (
        mode == "standard" && plan.info_.reason_.find("Required dependency") != std::string::npos
      ) {
         plan.info_.reason_ += "; requires Deep scan.";
      }
   }

   std::ranges::sort(plan.info_.preset_names_);
   auto presets{std::ranges::unique(plan.info_.preset_names_)};
   plan.info_.preset_names_.erase(presets.begin(), presets.end());
   std::ranges::sort(plan.info_.warnings_);

   auto unique{std::ranges::unique(plan.info_.warnings_)};

   plan.info_.warnings_.erase(unique.begin(), unique.end());
   return plan;
}

bool
Planner::StockChanged(Plan const& plan, Ownership const& owner, bool deep) {
   if (Package::GeneratorChanged(owner)) {
      return true;
   }

   for (auto const& [path, bytes] : plan.files_) {
      auto file{std::ranges::find_if(owner.files_, [&](auto const& installed) {
         return FileSystem::Lower(installed.path_) == FileSystem::Lower(path);
      })};

      if (file == owner.files_.end() || file->hash_ != FileSystem::Hash(bytes)) {
         return true;
      }
   }

   if (
     std::ranges::any_of(owner.files_, [](auto const& file) {
        auto path{FileSystem::Lower(file.path_)};

        std::ranges::replace(path, '\\', '/');
        return path.starts_with("simobjects/")
               && (path.ends_with("/input/action.actiondb") || path.ends_with("/inputs/keyboard.xml"));
     })
   ) {
      return true;
   }

   if (owner.stock_.size() != plan.stock_.size()) {
      return true;
   }

   for (auto const& old : owner.stock_) {
      auto found{plan.stock_.find(FileSystem::Lower(old.path_))};
      if (found == plan.stock_.end()) {
         return true;
      }

      if (found->second.hash_ == old.hash_) {
         continue;
      }

      // Projection exposes the mounted overlay, not the underlying stock file. Do not flag our own
      // bytes as an update.
      if (deep && std::ranges::any_of(owner.files_, [&](auto const& output) {
             return FileSystem::Lower(output.path_) == FileSystem::Lower(old.path_)
                    && output.hash_ == found->second.hash_;
          })) {
         continue;
      }

      return true;
   }

   return false;
}
}  // namespace tablet
