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

#include "Simulator.h"

#include <algorithm>
#include <cerrno>
#include <cctype>
#include <cmath>
#include <iomanip>
#include <sstream>

namespace {
constexpr std::array<double, 8> DEFAULT_POSE{0, .35, 1.2, 0, 0, 0, 1, 1};
}

void
WasmHandler::Simulator::InitializePose() {
   std::array names{
     "VFRNAV_EFB_X",
     "VFRNAV_EFB_Y",
     "VFRNAV_EFB_Z",
     "VFRNAV_EFB_PITCH",
     "VFRNAV_EFB_BANK",
     "VFRNAV_EFB_HEADING",
     "VFRNAV_EFB_WIDTH",
     "VFRNAV_EFB_HEIGHT"
   };

   for (std::size_t index{0}; index < names.size(); ++index) {
      pose_variables_[index] = fsVarsRegisterLVar(names[index]);
   }

   pose_instance_variable_ = fsVarsRegisterLVar("VFRNAV_EFB_INSTANCE");
   pose_ready_variable_    = fsVarsRegisterLVar("VFRNAV_EFB_READY");
   pose_mode_variable_     = fsVarsRegisterLVar("VFRNAV_EFB_MODE");
   pose_cancel_variable_   = fsVarsRegisterLVar("VFRNAV_EFB_DRAG_CANCEL");

   LoadPoses();
}

bool
WasmHandler::Simulator::ValidPose(TabletPose const& pose) {
   for (std::size_t index{0}; index < pose.size(); ++index) {
      auto minimum{index < 3 ? -20. : index < 6 ? -180. : .25};
      auto maximum{index < 3 ? 20. : index < 6 ? 180. : 3.};

      if (!std::isfinite(pose[index]) || pose[index] < minimum || pose[index] > maximum) {
         return false;
      }
   }

   return pose[6] == pose[7];
}

void
WasmHandler::Simulator::LoadPoses() {
   bool invalid{false};

   for (auto const& path : {std::string{POSES_FILE}, std::string{POSES_FILE} + ".bak"}) {
      errno = 0;

      std::ifstream input{path};
      if (!input.is_open()) {
         auto const error{errno};
         if (!MissingSettingsFile(path, error)) {
            invalid = true;
            std::cerr << "WASM: Unable to read tablet poses: " << path << " (errno " << error << ")"
                      << std::endl;
         }
         continue;
      }

      std::string header{};
      std::getline(input, header);
      std::map<std::string, TabletPose> loaded{};
      bool                              valid{header == "VFRNAV_TABLET_POSES 1"};

      for (std::string line{}; valid && std::getline(input, line);) {
         std::istringstream row{line};
         std::string        aircraft{};
         TabletPose         pose{};

         row >> std::quoted(aircraft);
         for (auto& value : pose) {
            row >> value;
         }

         valid = !row.fail() && !aircraft.empty() && aircraft.size() < MAX_PATH && ValidPose(pose);
         row >> std::ws;
         valid = valid && row.eof() && loaded.emplace(aircraft, pose).second;
      }

      if (valid && input.eof()) {
         poses_ = std::move(loaded);

         if (path.ends_with(".bak")) {
            std::cerr << "WASM: Recovered tablet poses from the previous save" << std::endl;
         }

         return;
      }

      invalid = true;
      std::cerr << "WASM: Invalid saved tablet poses: " << path << std::endl;
   }

   pose_storage_writable_ = !invalid;

   if (invalid) {
      std::cerr << "WASM: Tablet pose saving disabled to preserve unreadable settings" << std::endl;
   }
}

bool
WasmHandler::Simulator::ReadPoseVariable(FsLVarId id, double& value) {
   if (
     id == FS_VAR_INVALID_ID || number_unit_ == FS_INVALID_UNIT
     || fsVarsLVarGet(id, number_unit_, &value) != FS_VAR_ERROR_NONE || !std::isfinite(value)
   ) {
      if (!pose_read_error_) {
         std::cerr << "WASM: Unable to read tablet pose local variables" << std::endl;
         pose_read_error_ = true;
      }

      return false;
   }

   return true;
}

void
WasmHandler::Simulator::ChangeAircraft() {
   SavePose();

   pose_aircraft_.clear();
   pose_instance_         = -1;
   pose_restored_         = false;
   pose_request_pending_  = false;
   pose_request_deadline_ = {};
   ++pose_request_id_;
}

void
WasmHandler::Simulator::OnAircraftState(SIMCONNECT_RECV_SYSTEM_STATE const& state) {
   if (!pose_request_pending_ || state.dwRequestID != pose_request_id_) {
      return;
   }

   pose_request_pending_ = false;
   std::string path{
     state.szString, std::find(std::begin(state.szString), std::end(state.szString), '\0')
   };

   if (path.empty() || path.size() >= MAX_PATH) {
      std::cerr << "WASM: SimConnect returned an invalid aircraft path for tablet placement"
                << std::endl;
      return;
   }

   std::transform(path.begin(), path.end(), path.begin(), [](unsigned char ch) {
      return ch == '/' ? '\\' : static_cast<char>(std::tolower(ch));
   });

   pose_aircraft_ = std::move(path);
}

void
WasmHandler::Simulator::UpdatePose() {
   double instance{}, ready{};
   if (
     !ReadPoseVariable(pose_instance_variable_, instance)
     || !ReadPoseVariable(pose_ready_variable_, ready)
   ) {
      return;
   }

   if (instance != pose_instance_) {
      // Discard pending identity responses from the previous aircraft instance.
      ChangeAircraft();
      pose_instance_ = instance;
   }

   if (instance <= 0 || ready != 1) {
      return;
   }

   auto const now{std::chrono::steady_clock::now()};
   if (pose_request_pending_ && now >= pose_request_deadline_) {
      std::cerr << "WASM: Timed out reading the aircraft identity for tablet placement; retrying"
                << std::endl;
      pose_request_pending_ = false;
   }

   if (pose_aircraft_.empty()) {
      if (!pose_request_pending_ && now >= pose_request_deadline_) {
         ++pose_request_id_;
         pose_request_deadline_ = now + std::chrono::seconds{3};

         if (
           SimConnect_RequestSystemState(connection_, pose_request_id_, "AircraftLoaded") == S_OK
         ) {
            pose_request_pending_ = true;
         } else {
            std::cerr << "WASM: Unable to request aircraft identity for tablet placement; retrying"
                      << std::endl;
         }
      }

      return;
   }

   if (!pose_restored_) {
      auto saved{poses_.find(pose_aircraft_)};
      pose_current_ = saved == poses_.end() ? DEFAULT_POSE : saved->second;

      for (std::size_t index{0}; index < pose_variables_.size(); ++index) {
         if (
           fsVarsLVarSet(pose_variables_[index], number_unit_, pose_current_[index])
           != FS_VAR_ERROR_NONE
         ) {
            std::cerr << "WASM: Unable to restore the saved tablet pose; retrying" << std::endl;
            return;
         }
      }

      WriteVariable(pose_mode_variable_, 0);

      double cancel{};
      if (!ReadPoseVariable(pose_cancel_variable_, cancel)) {
         return;
      }

      WriteVariable(pose_cancel_variable_, cancel + 1);
      pose_restored_ = true;
   }

   TabletPose current{};
   for (std::size_t index{0}; index < pose_variables_.size(); ++index) {
      if (!ReadPoseVariable(pose_variables_[index], current[index])) {
         return;
      }
   }

   if (!ValidPose(current)) {
      if (!pose_read_error_) {
         std::cerr << "WASM: Invalid tablet pose; not saving placement" << std::endl;
         pose_read_error_ = true;
      }

      return;
   }

   pose_read_error_ = false;
   if (current != pose_current_) {
      pose_current_          = current;
      poses_[pose_aircraft_] = current;
      pose_dirty_            = true;
      pose_save_at_          = now + std::chrono::milliseconds{500};
   }

   if (pose_dirty_ && now >= pose_save_at_) {
      SavePose();
      pose_save_at_ = now + std::chrono::seconds{5};
   }
}

void
WasmHandler::Simulator::SavePose() {
   if (!pose_dirty_ || !pose_storage_writable_) {
      return;
   }

   std::ostringstream output{};
   output << "VFRNAV_TABLET_POSES 1\n" << std::setprecision(17);

   for (auto const& [aircraft, pose] : poses_) {
      output << std::quoted(aircraft);

      for (auto value : pose) {
         output << ' ' << value;
      }

      output << '\n';
   }

   std::string error{};
   if (SaveSettings(POSES_FILE, output.str(), error)) {
      pose_dirty_ = false;
   }
}
