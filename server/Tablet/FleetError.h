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

#pragma once

#include "VfsWatcher.h"

#include <boost/json.hpp>

#include <filesystem>
#include <stdexcept>
#include <string>
#include <string_view>

namespace tablet {

class FleetError : public std::runtime_error {
public:
   enum class Code {
      // Fleet
      MSFS_NOT_FOUND,
      COMMUNITY_FROM_CFG_NOT_FOUND,
      INVALID_OPERATION,
      OPERATION_RUNNING,
      COMMUNITY_MISSING,
      SELECTION_NOT_ARRAY,
      SELECTION_IDS_NOT_STRINGS,
      MANAGED_PACKAGE_WRONG_AIRCRAFT,

      // FileSystem
      SHA256_INIT_FAILED,
      REPARSE_PATH_UNSUPPORTED,
      CANNOT_READ_FILE,
      READ_FAILED,
      INVALID_UTF16_FILE,
      INVALID_UTF16_CONFIG,
      SHA256_FAILED,
      EMPTY_VIRTUAL_PATH,
      ABSOLUTE_ATTACHMENT_PATH,
      ATTACHMENT_TRAVERSAL,
      DEPENDENCY_NOT_READABLE,
      CANNOT_WRITE_PATCH_FILE,

      // INI
      MALFORMED_INI_SECTION,
      DUPLICATE_INI_SECTION,

      // Template
      INVALID_TEMPLATE_REPLACEMENT,
      MISSING_TEMPLATE_REPLACEMENT,
      UNUSED_TEMPLATE_REPLACEMENT,

      // Rig
      RIG_DESTINATION_EXISTS,

      // VFS
      CANNOT_WATCH_VFS,
      VFS_WATCHER_FAILED,
      CANNOT_REARM_VFS_WATCHER,
      VFS_WATCH_DIR_NOT_FOUND,

      // Package
      INVALID_OWNERSHIP_METADATA,
      INVALID_OWNERSHIP_FILE_LIST,
      EMPTY_OWNERSHIP_FILE_LIST,
      PACKAGE_MODIFIED,
      PACKAGE_INCOMPLETE,
      MISSING_GENERATOR_RESOURCE,
      INVALID_GENERATOR_RESOURCE,

      // Planer
      INVALID_ATTACH_OFFSET,
      NON_FINITE_ATTACH_OFFSET,
      SOURCE_OUTSIDE_ROOTS,
      UNREADABLE_TABLET_ATTACHMENT,
      MULTIFUNCTION_COCKPIT_EFB,
      INVALID_CAMERA_COORDINATES,
      MISSING_CAMERA_EYEPOINT,
      NON_FINITE_CAMERA_POSITION,
      NO_READABLE_ATTACHED_OBJECTS,
      TABLET_NESTED_TOO_DEEP,
      CANNOT_DETERMINE_NESTED_PATH,
      NO_MODULAR_PRESETS,
      NO_SELECTABLE_MODULAR_PRESETS,
      DEPENDENCY_REQUIRES_DEEP_SCAN,

      // Rig path
      RIG_PATH_MUST_BE_RELATIVE,
      RIG_PATH_TRAVERSAL,
      RIG_FRAGMENT_TERMINAL_LF,

      // Transaction
      UNKNOWN_AIRCRAFT_SELECTION,
      CANNOT_PATCH_AIRCRAFT,
      UNABLE_TO_ALLOCATE_STAGING,
   };

   static constexpr std::string_view ToKey(Code code) noexcept {
      switch (code) {
         case Code::MSFS_NOT_FOUND:
            return "msfsNotFound";
         case Code::COMMUNITY_FROM_CFG_NOT_FOUND:
            return "communityFromCfgNotFound";
         case Code::INVALID_OPERATION:
            return "invalidOperation";
         case Code::OPERATION_RUNNING:
            return "operationRunning";
         case Code::COMMUNITY_MISSING:
            return "communityMissing";
         case Code::SELECTION_NOT_ARRAY:
            return "selectionNotArray";
         case Code::SELECTION_IDS_NOT_STRINGS:
            return "selectionIdsNotStrings";
         case Code::MANAGED_PACKAGE_WRONG_AIRCRAFT:
            return "managedPackageWrongAircraft";
         case Code::SHA256_INIT_FAILED:
            return "sha256InitFailed";
         case Code::REPARSE_PATH_UNSUPPORTED:
            return "reparsePathUnsupported";
         case Code::CANNOT_READ_FILE:
            return "cannotReadFile";
         case Code::READ_FAILED:
            return "readFailed";
         case Code::INVALID_UTF16_FILE:
            return "invalidUtf16File";
         case Code::INVALID_UTF16_CONFIG:
            return "invalidUtf16Config";
         case Code::SHA256_FAILED:
            return "sha256Failed";
         case Code::EMPTY_VIRTUAL_PATH:
            return "emptyVirtualPath";
         case Code::ABSOLUTE_ATTACHMENT_PATH:
            return "absoluteAttachmentPath";
         case Code::ATTACHMENT_TRAVERSAL:
            return "attachmentTraversal";
         case Code::DEPENDENCY_NOT_READABLE:
            return "dependencyNotReadable";
         case Code::CANNOT_WRITE_PATCH_FILE:
            return "cannotWritePatchFile";

         case Code::MALFORMED_INI_SECTION:
            return "malformedIniSection";
         case Code::DUPLICATE_INI_SECTION:
            return "duplicateIniSection";

         case Code::INVALID_TEMPLATE_REPLACEMENT:
            return "invalidTemplateReplacement";
         case Code::MISSING_TEMPLATE_REPLACEMENT:
            return "missingTemplateReplacement";
         case Code::UNUSED_TEMPLATE_REPLACEMENT:
            return "unusedTemplateReplacement";

         case Code::RIG_DESTINATION_EXISTS:
            return "rigDestinationExists";

         case Code::CANNOT_WATCH_VFS:
            return "cannotWatchVfs";
         case Code::VFS_WATCHER_FAILED:
            return "vfsWatcherFailed";
         case Code::CANNOT_REARM_VFS_WATCHER:
            return "cannotRearmVfsWatcher";
         case Code::VFS_WATCH_DIR_NOT_FOUND:
            return "vfsWatchDirNotFound";

         case Code::INVALID_OWNERSHIP_METADATA:
            return "invalidOwnershipMetadata";
         case Code::INVALID_OWNERSHIP_FILE_LIST:
            return "invalidOwnershipFileList";
         case Code::EMPTY_OWNERSHIP_FILE_LIST:
            return "emptyOwnershipFileList";
         case Code::PACKAGE_MODIFIED:
            return "packageModified";
         case Code::PACKAGE_INCOMPLETE:
            return "packageIncomplete";
         case Code::MISSING_GENERATOR_RESOURCE:
            return "missingGeneratorResource";
         case Code::INVALID_GENERATOR_RESOURCE:
            return "invalidGeneratorResource";

         case Code::INVALID_ATTACH_OFFSET:
            return "invalidAttachOffset";
         case Code::NON_FINITE_ATTACH_OFFSET:
            return "nonFiniteAttachOffset";
         case Code::SOURCE_OUTSIDE_ROOTS:
            return "sourceOutsideRoots";
         case Code::UNREADABLE_TABLET_ATTACHMENT:
            return "unreadableTabletAttachment";
         case Code::MULTIFUNCTION_COCKPIT_EFB:
            return "multifunctionCockpitEfb";
         case Code::INVALID_CAMERA_COORDINATES:
            return "invalidCameraCoordinates";
         case Code::MISSING_CAMERA_EYEPOINT:
            return "missingCameraEyepoint";
         case Code::NON_FINITE_CAMERA_POSITION:
            return "nonFiniteCameraPosition";
         case Code::NO_READABLE_ATTACHED_OBJECTS:
            return "noReadableAttachedObjects";
         case Code::TABLET_NESTED_TOO_DEEP:
            return "tabletNestedTooDeep";
         case Code::CANNOT_DETERMINE_NESTED_PATH:
            return "cannotDetermineNestedPath";
         case Code::NO_MODULAR_PRESETS:
            return "noModularPresets";
         case Code::NO_SELECTABLE_MODULAR_PRESETS:
            return "noSelectableModularPresets";
         case Code::DEPENDENCY_REQUIRES_DEEP_SCAN:
            return "dependencyRequiresDeepScan";

         case Code::RIG_PATH_MUST_BE_RELATIVE:
            return "rigPathMustBeRelative";
         case Code::RIG_PATH_TRAVERSAL:
            return "rigPathTraversal";
         case Code::RIG_FRAGMENT_TERMINAL_LF:
            return "rigFragmentTerminalLf";

         case Code::UNKNOWN_AIRCRAFT_SELECTION:
            return "unknownAircraftSelection";
         case Code::CANNOT_PATCH_AIRCRAFT:
            return "cannotPatchAircraft";
         case Code::UNABLE_TO_ALLOCATE_STAGING:
            return "unableToAllocateStaging";
      }
      return "unknown";
   }

   explicit FleetError(Code code)
      : std::runtime_error(Format(code, {}))
      , code_{code} {}

   FleetError(Code code, std::filesystem::path const& path)
      : std::runtime_error(Format(code, {{"path", path.string()}}))
      , code_{code}
      , path_{path} {}

   FleetError(Code code, std::filesystem::path const& path, std::string_view detail)
      : std::runtime_error(Format(code, {{"path", path.string()}, {"error", detail}}))
      , code_{code}
      , path_{path} {}

   explicit FleetError(VfsStatus const& status)
      : std::runtime_error(
          "VFS_STATUS:"
          + boost::json::serialize(
            boost::json::object{
              {"available", status.available_},
              {"status", static_cast<int>(status.state_)},
              {"detail", status.detail_}
            }
          )
        ) {}

   static FleetError WithName(Code code, std::string_view name) {
      return FleetError{Format(code, {{"name", name}})};
   }

   static FleetError WithDetail(Code code, std::string_view detail) {
      return FleetError{Format(code, {{"error", detail}})};
   }

   [[nodiscard]] Code                         GetCode() const noexcept { return code_; }
   [[nodiscard]] std::filesystem::path const& GetPath() const noexcept { return path_; }

private:
   Code                  code_{Code::INVALID_OPERATION};
   std::filesystem::path path_{};

   explicit FleetError(std::string const& message)
      : std::runtime_error(message) {}

   static std::string Format(Code code, boost::json::object payload) {
      payload["code"] = ToKey(code);
      return "FLEET_ERR:" + boost::json::serialize(payload);
   }
};

class FleetMessage {
public:
   enum class Code {
      PACKAGE_REMOVED,
      DUPLICATE_CONTAINER,
      VFS_MASK_STOCK_UPDATES,
      CANNOT_INSPECT_MANIFEST,
      CANNOT_VERIFY_OVERLAY,
      NON_OWNED_OVERLAY,
      LEGACY_MANAGED_PACKAGE,
      INSTALLED_VERIFIED_LOCALLY,
      VFS_MONITORING_STOPPED,

      // Planer
      CANNOT_READ_PILOT_CAMERA,
      POSITION_ESTIMATED,
      CANNOT_RECOVER_STOCK_METADATA,
      PRESET_NO_FLTSIM0,
      PRESET_AIRCRAFT_CFG_UNREADABLE,
   };

   static constexpr std::string_view ToKey(Code code) noexcept {
      switch (code) {
         case Code::PACKAGE_REMOVED:
            return "packageRemoved";
         case Code::DUPLICATE_CONTAINER:
            return "duplicateContainer";
         case Code::VFS_MASK_STOCK_UPDATES:
            return "vfsMaskStockUpdates";
         case Code::CANNOT_INSPECT_MANIFEST:
            return "cannotInspectManifest";
         case Code::CANNOT_VERIFY_OVERLAY:
            return "cannotVerifyOverlay";
         case Code::NON_OWNED_OVERLAY:
            return "nonOwnedOverlay";
         case Code::LEGACY_MANAGED_PACKAGE:
            return "legacyManagedPackage";
         case Code::INSTALLED_VERIFIED_LOCALLY:
            return "installedVerifiedLocally";

         case Code::VFS_MONITORING_STOPPED:
            return "vfsMonitoringStopped";

         case Code::CANNOT_READ_PILOT_CAMERA:
            return "cannotReadPilotCamera";
         case Code::POSITION_ESTIMATED:
            return "positionEstimated";
         case Code::CANNOT_RECOVER_STOCK_METADATA:
            return "cannotRecoverStockMetadata";
         case Code::PRESET_NO_FLTSIM0:
            return "presetNoFltsim0";
         case Code::PRESET_AIRCRAFT_CFG_UNREADABLE:
            return "presetAircraftCfgUnreadable";
      }
      return "unknown";
   }

   static std::string Make(Code code) { return Format(code, {}); }

   static std::string Make(Code code, std::filesystem::path const& path) {
      return Format(code, {{"path", path.string()}});
   }

   static std::string Make(Code code, std::filesystem::path const& path, std::string_view detail) {
      return Format(code, {{"path", path.string()}, {"error", detail}});
   }

   static std::string MakeWithName(Code code, std::string_view name, std::string_view detail = {}) {
      boost::json::object payload{{"name", name}};
      if (!detail.empty()) {
         payload["error"] = detail;
      }
      return Format(code, std::move(payload));
   }

private:
   static std::string Format(Code code, boost::json::object payload) {
      payload["code"] = ToKey(code);
      return "FLEET_MSG:" + boost::json::serialize(payload);
   }
};

}  // namespace tablet
