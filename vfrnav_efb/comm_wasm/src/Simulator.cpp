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
#include <cstdio>
#include <sys/stat.h>
#include <MSFS/MSFS_Vars.h>
#include <MSFS/MSFS_WindowsTypes.h>
#include <vector>
#include <SimConnect.h>

using namespace std::chrono;
using namespace std::literals;

WasmHandler::Simulator::Simulator(WasmHandler& handler)
   : handler_{handler} {}

void
WasmHandler::Simulator::Initialize() {
   toggle_request_variable_ = fsVarsRegisterLVar("VFRNAV_EFB_TOGGLE_REQUEST");
   shift_variable_          = fsVarsRegisterLVar("VFRNAV_EFB_SHIFT");
   number_unit_             = fsVarsGetUnitId("number");

   WriteVariable(shift_variable_, 0.0);
   InitializePose();
   LoadJoystick();
   TryOpen();
}

void
WasmHandler::Simulator::Update() {
   if (!connection_) {
      return;
   }

   UpdateJoystick();
   UpdatePose();

   if (pending_ && std::chrono::steady_clock::now() >= pending_->deadline_) {
      // SimConnect reports mapping failures asynchronously; commit only after the acknowledgement
      // window.
      auto pending{std::move(*pending_)};
      pending_.reset();

      if (!SaveShortcut(pending.requested_)) {
         RestoreShortcut(pending.previous_);
         handler_.SendResponse(pending.request_id_, "error:Unable to save the tablet shortcut");
         return;
      }
      handler_.shortcut_ = pending.requested_;
      initial_mapping_send_ids_.clear();
      handler_.SendResponse(pending.request_id_, "data:" + pending.requested_);
   }
}

void
WasmHandler::Simulator::Shutdown() {
   SavePose();

   if (connection_) {
      SimConnect_Close(connection_);
      connection_ = 0;
   }
}

std::optional<std::string>
WasmHandler::Simulator::SetShortcut(std::string_view request_id, std::string_view label) {
   if (!connection_) {
      TryOpen();

      if (!connection_) {
         return "error:SimConnect is not connected";
      }
   }

   if (pending_) {
      return "error:Another tablet shortcut change is still pending";
   }

   auto parsed = ParseShortcut(label);
   if (!parsed) {
      return "error:Use Ctrl, Shift, or Alt plus one letter or digit (for example Ctrl+T)";
   }

   if (parsed->label_ == handler_.shortcut_) {
      return "data:" + parsed->label_;
   }

   auto const         previous{handler_.shortcut_};
   std::string        error{};
   std::vector<DWORD> send_ids{};
   if (!MapShortcut(*parsed, send_ids, error)) {
      RestoreShortcut(previous);
      return "error:" + error;
   }

   pending_ = PendingShortcut{
     .request_id_ = std::string{request_id},
     .requested_  = std::move(parsed->label_),
     .previous_   = previous,
     .send_ids_   = std::move(send_ids),
     .deadline_   = std::chrono::steady_clock::now() + SHORTCUT_ACK_TIMEOUT,
   };

   return std::nullopt;
}

void CALLBACK
WasmHandler::Simulator::Dispatch(SIMCONNECT_RECV* data, DWORD, void* context) {
   auto& self{*static_cast<Simulator*>(context)};

   switch (data->dwID) {
      case SIMCONNECT_RECV_ID_EVENT_FRAME:
         if (static_cast<SIMCONNECT_RECV_EVENT_FRAME const&>(*data).uEventID == FRAME_EVENT) {
            self.Update();
         }
         break;

      case SIMCONNECT_RECV_ID_CONTROLLERS_LIST:
         self.OnControllers(static_cast<SIMCONNECT_RECV_CONTROLLERS_LIST const&>(*data));
         break;

      case SIMCONNECT_RECV_ID_SYSTEM_STATE:
         self.OnAircraftState(static_cast<SIMCONNECT_RECV_SYSTEM_STATE const&>(*data));
         break;

      case SIMCONNECT_RECV_ID_EVENT_FILENAME:
         if (
           static_cast<SIMCONNECT_RECV_EVENT_FILENAME const&>(*data).uEventID
           == AIRCRAFT_LOADED_EVENT
         ) {
            self.ChangeAircraft();
         }
         break;

      case SIMCONNECT_RECV_ID_EVENT: {
         auto const& event{static_cast<SIMCONNECT_RECV_EVENT const&>(*data)};
         switch (event.uEventID) {
            case static_cast<DWORD>(TABLET_TOGGLE_EVENT):
               self.WriteVariable(self.toggle_request_variable_, 1.0);
               break;

            case static_cast<DWORD>(JOYSTICK_TOGGLE_EVENT):
               if (!self.joystick_capture_ && !self.joystick_change_) {
                  self.WriteVariable(self.toggle_request_variable_, 1.0);
               }
               break;

            case static_cast<DWORD>(JOYSTICK_SCAN_EVENT):
               self.OnJoystickButton(event.dwData);
               break;

            case static_cast<DWORD>(LEFT_SHIFT_DOWN_EVENT):
               self.left_shift_held_ = true;
               self.UpdateShift();
               break;

            case static_cast<DWORD>(LEFT_SHIFT_UP_EVENT):
               self.left_shift_held_ = false;
               self.UpdateShift();
               break;

            case static_cast<DWORD>(RIGHT_SHIFT_DOWN_EVENT):
               self.right_shift_held_ = true;
               self.UpdateShift();
               break;

            case static_cast<DWORD>(RIGHT_SHIFT_UP_EVENT):
               self.right_shift_held_ = false;
               self.UpdateShift();
               break;

            default:
               break;
         }
      } break;

      case SIMCONNECT_RECV_ID_EXCEPTION: {
         auto const& exception{static_cast<SIMCONNECT_RECV_EXCEPTION const&>(*data)};
         self.OnException(exception);
      } break;

      case SIMCONNECT_RECV_ID_QUIT:
         self.SavePose();
         self.FailJoystick("SimConnect disconnected");

         if (self.pending_) {
            auto pending = std::move(*self.pending_);
            self.pending_.reset();
            self.handler_.SendResponse(pending.request_id_, "error:SimConnect disconnected");
         }

         SimConnect_Close(self.connection_);
         self.connection_ = 0;
         break;

      default:
         break;
   }
}

void
WasmHandler::Simulator::WriteVariable(FsLVarId id, double value) {
   if (id == FS_VAR_INVALID_ID || number_unit_ == FS_INVALID_UNIT) {
      return;
   }

   if (fsVarsLVarSet(id, number_unit_, value) != FS_VAR_ERROR_NONE) {
      std::cerr << "WASM: Unable to write tablet control local variable" << std::endl;
   }
}

void
WasmHandler::Simulator::UpdateShift() {
   auto const held{left_shift_held_ || right_shift_held_};

   if (held != shift_held_) {
      shift_held_ = held;
      WriteVariable(shift_variable_, held ? 1.0 : 0.0);
   }
}

void
WasmHandler::Simulator::TryOpen() {
   if (SUCCEEDED(SimConnect_Open(&connection_, "VFRNav EFB WASM", nullptr, 0, 0, 0))) {
      if (
        FAILED(SimConnect_SubscribeToSystemEvent(connection_, FRAME_EVENT, "Frame"))
        || FAILED(
          SimConnect_SubscribeToSystemEvent(connection_, AIRCRAFT_LOADED_EVENT, "AircraftLoaded")
        )
        || FAILED(SimConnect_CallDispatch(connection_, Dispatch, this))
      ) {
         std::cerr << "WASM: Unable to register SimConnect frame dispatch" << std::endl;
         SimConnect_Close(connection_);
         connection_ = 0;
         return;
      }

      left_shift_held_        = false;
      right_shift_held_       = false;
      shift_held_             = false;
      joystick_resolved_      = false;
      joystick_group_created_ = false;

      WriteVariable(shift_variable_, 0.0);

      for (auto event :
           {TABLET_TOGGLE_EVENT,
            LEFT_SHIFT_DOWN_EVENT,
            LEFT_SHIFT_UP_EVENT,
            RIGHT_SHIFT_DOWN_EVENT,
            RIGHT_SHIFT_UP_EVENT,
            JOYSTICK_SCAN_EVENT,
            JOYSTICK_TOGGLE_EVENT}) {
         if (
           FAILED(SimConnect_MapClientEventToSimEvent(connection_, event))
           || FAILED(SimConnect_AddClientEventToNotificationGroup(
             connection_, INPUT_NOTIFICATION_GROUP, event, FALSE
           ))
         ) {
            std::cerr << "WASM: Unable to register tablet input client event "
                      << static_cast<DWORD>(event) << std::endl;
            SimConnect_Close(connection_);
            connection_ = 0;
            return;
         }
      }

      if (
        FAILED(SimConnect_SetNotificationGroupPriority(
          connection_, INPUT_NOTIFICATION_GROUP, SIMCONNECT_GROUP_PRIORITY_LOWEST
        ))
      ) {
         std::cerr << "WASM: Unable to set tablet input notification priority" << std::endl;
         SimConnect_Close(connection_);
         connection_ = 0;
         return;
      }

      ConfigureShiftGroup();
      ChangeAircraft();
      ConfigureInitialShortcut();

      if (joystick_ && !EnumerateJoysticks()) {
         std::cerr << "WASM: Unable to enumerate controllers for the saved tablet binding"
                   << std::endl;
      }
   } else {
      connection_ = 0;
      std::cerr << "WASM: Unable to open SimConnect; retrying" << std::endl;
   }
}

void
WasmHandler::Simulator::ConfigureShiftGroup() {
   auto const left_mapped{
     SimConnect_MapInputEventToClientEvent_EX1(
       connection_,
       SHIFT_INPUT_GROUP,
       "VK_LSHIFT",
       LEFT_SHIFT_DOWN_EVENT,
       0,
       LEFT_SHIFT_UP_EVENT,
       0,
       FALSE
     )
     == S_OK
   };

   auto const right_mapped{
     SimConnect_MapInputEventToClientEvent_EX1(
       connection_,
       SHIFT_INPUT_GROUP,
       "VK_RSHIFT",
       RIGHT_SHIFT_DOWN_EVENT,
       0,
       RIGHT_SHIFT_UP_EVENT,
       0,
       FALSE
     )
     == S_OK
   };

   auto const priority_set{
     SimConnect_SetInputGroupPriority(
       connection_, SHIFT_INPUT_GROUP, SIMCONNECT_GROUP_PRIORITY_LOWEST
     )
     == S_OK
   };

   if (!left_mapped || !right_mapped || !priority_set) {
      std::cerr << "WASM: Unable to configure the Shift input group" << std::endl;
      return;
   }

   SimConnect_SetInputGroupState(connection_, SHIFT_INPUT_GROUP, SIMCONNECT_STATE_ON);
}

bool
WasmHandler::Simulator::MapShortcut(
  ParsedShortcut const& shortcut,
  std::vector<DWORD>&   send_ids,
  std::string&          error
) {
   if (SimConnect_ClearInputGroup(connection_, TABLET_INPUT_GROUP) != S_OK) {
      error = "Unable to clear the tablet input group";
      return false;
   }

   for (auto const& definition : shortcut.definitions_) {
      if (
        SimConnect_MapInputEventToClientEvent_EX1(
          connection_,
          TABLET_INPUT_GROUP,
          definition.c_str(),
          TABLET_TOGGLE_EVENT,
          0,
          static_cast<SIMCONNECT_CLIENT_EVENT_ID>(SIMCONNECT_UNUSED),
          0,
          FALSE
        )
        != S_OK
      ) {
         error = "SimConnect rejected the shortcut definition";
         return false;
      }

      DWORD send_id{0};
      if (SimConnect_GetLastSentPacketID(connection_, &send_id) != S_OK) {
         error = "Unable to track the shortcut mapping";
         return false;
      }

      send_ids.push_back(send_id);
   }
   if (
     SimConnect_SetInputGroupPriority(
       connection_, TABLET_INPUT_GROUP, SIMCONNECT_GROUP_PRIORITY_LOWEST
     )
     != S_OK
   ) {
      error = "Unable to set the tablet input group priority";
      return false;
   }

   if (
     SimConnect_SetInputGroupState(connection_, TABLET_INPUT_GROUP, SIMCONNECT_STATE_ON) != S_OK
   ) {
      error = "Unable to enable the tablet input group";
      return false;
   }
   return true;
}

void
WasmHandler::Simulator::ConfigureInitialShortcut() {
   auto parsed{ParseShortcut(handler_.shortcut_)};
   if (!parsed) {
      parsed = ParseShortcut(DEFAULT_TABLET_SHORTCUT);
   }

   std::string error{};
   if (!parsed || !MapShortcut(*parsed, initial_mapping_send_ids_, error)) {
      handler_.shortcut_ = DEFAULT_TABLET_SHORTCUT;
      initial_mapping_send_ids_.clear();

      parsed = ParseShortcut(DEFAULT_TABLET_SHORTCUT);
      if (!parsed || !MapShortcut(*parsed, initial_mapping_send_ids_, error)) {
         std::cerr << "WASM: Unable to map default tablet shortcut: " << error << std::endl;
         return;
      }

      std::cerr << "WASM: Unable to map saved tablet shortcut; using Ctrl+T: " << error
                << std::endl;
   }
}

bool
WasmHandler::Simulator::RestoreShortcut(std::string const& label) {
   auto parsed{ParseShortcut(label)};
   if (!parsed) {
      parsed = ParseShortcut(DEFAULT_TABLET_SHORTCUT);
   }

   std::string        error{};
   std::vector<DWORD> restoration_send_ids{};
   if (parsed && MapShortcut(*parsed, restoration_send_ids, error)) {
      initial_mapping_send_ids_ = std::move(restoration_send_ids);
      return true;
   }

   auto fallback{ParseShortcut(DEFAULT_TABLET_SHORTCUT)};
   if (fallback) {
      error.clear();
      restoration_send_ids.clear();

      MapShortcut(*fallback, restoration_send_ids, error);
      initial_mapping_send_ids_ = std::move(restoration_send_ids);

      handler_.shortcut_ = DEFAULT_TABLET_SHORTCUT;
      SaveShortcut(handler_.shortcut_);
   }

   std::cerr << "WASM: Unable to restore tablet shortcut: " << error << std::endl;
   return false;
}

bool
WasmHandler::Simulator::SaveShortcut(std::string const& label) {
   std::ofstream output{TABLET_SHORTCUT_FILE, std::ios::trunc};
   if (!output.is_open()) {
      return false;
   }

   output << label << '\n';
   return output.good();
}

bool
WasmHandler::Simulator::MissingSettingsFile(std::string_view path, int error) {
   if (error == ENOENT) {
      return true;
   }

   if (error != EIO) {
      return false;
   }

   // MSFS can report EIO when opening absent files; check metadata before risking existing data.
   struct stat status{};
   auto const  missing{stat(std::string{path}.c_str(), &status) != 0 && errno == ENOENT};
   errno = error;
   return missing;
}

bool
WasmHandler::Simulator::SaveSettings(
  char const*      path,
  std::string_view contents,
  std::string&     error
) {
   auto const temporary{std::string{path} + ".tmp"};
   auto const backup{std::string{path} + ".bak"};
   auto const fail{[&](char const* operation) {
      error = "Unable to save tablet settings: " + std::string{operation} + " (errno "
              + std::to_string(errno) + ")";
      std::cerr << "WASM: " << path << ": " << error << std::endl;
      return false;
   }};
   auto const removeTemporary{[&] {
      if (std::remove(temporary.c_str()) != 0 && !MissingSettingsFile(temporary, errno)) {
         std::cerr << "WASM: Unable to remove temporary tablet settings: " << temporary
                   << " (errno " << errno << ")" << std::endl;
      }
   }};

   std::ofstream output{temporary, std::ios::trunc};
   if (!output.is_open()) {
      return fail("open temporary settings");
   }

   output << contents;
   output.close();
   if (!output.good()) {
      fail("write temporary settings");
      removeTemporary();
      return false;
   }

   bool had_previous{false};
   {
      std::ifstream previous{path};
      had_previous = previous.is_open();
   }

   // Windows-backed WASI filesystems do not replace an existing rename destination.
   if (had_previous) {
      if (std::remove(backup.c_str()) != 0 && !MissingSettingsFile(backup, errno)) {
         fail("remove stale backup");
         removeTemporary();
         return false;
      }

      if (std::rename(path, backup.c_str()) != 0) {
         fail("back up previous settings");
         removeTemporary();
         return false;
      }
   }

   if (std::rename(temporary.c_str(), path) != 0) {
      fail("commit new settings");

      if (had_previous && std::rename(backup.c_str(), path) != 0) {
         error += "; unable to restore previous settings (errno " + std::to_string(errno) + ")";
         std::cerr << "WASM: " << path << ": " << error
                   << "; the backup is retained for startup recovery" << std::endl;
      }

      removeTemporary();
      return false;
   }

   if (std::remove(backup.c_str()) != 0 && !MissingSettingsFile(backup, errno)) {
      std::cerr << "WASM: Saved tablet settings, but could not remove backup: " << backup
                << " (errno " << errno << ")" << std::endl;
   }

   return true;
}

void
WasmHandler::Simulator::OnException(SIMCONNECT_RECV_EXCEPTION const& exception) {
   if (OnJoystickException(exception)) {
      return;
   }
   if (
     pending_
     && std::find(pending_->send_ids_.begin(), pending_->send_ids_.end(), exception.dwSendID)
          != pending_->send_ids_.end()
   ) {
      auto pending{std::move(*pending_)};
      pending_.reset();

      RestoreShortcut(pending.previous_);

      handler_.SendResponse(
        pending.request_id_,
        "error:" + SimConnectExceptionMessage(exception) + " (packet "
          + std::to_string(exception.dwSendID) + ", parameter " + std::to_string(exception.dwIndex)
          + ")"
      );

      return;
   }

   // The MSFS WASM SDK's standard library does not implement ranges algorithms.
   if (std::find( // NOLINT(modernize-use-ranges)
            initial_mapping_send_ids_.begin(), initial_mapping_send_ids_.end(), exception.dwSendID
          ) != initial_mapping_send_ids_.end()) {
      initial_mapping_send_ids_.clear();

      if (handler_.shortcut_ != DEFAULT_TABLET_SHORTCUT) {
         handler_.shortcut_ = DEFAULT_TABLET_SHORTCUT;

         if (RestoreShortcut(DEFAULT_TABLET_SHORTCUT) && !SaveShortcut(handler_.shortcut_)) {
            std::cerr << "WASM: Unable to persist the default tablet shortcut" << std::endl;
         }
      }

      std::cerr << "WASM: " << SimConnectExceptionMessage(exception) << std::endl;
   }
}

std::string_view
WasmHandler::Simulator::Trim(std::string_view value) {
   while (!value.empty() && std::isspace(static_cast<unsigned char>(value.front()))) {
      value.remove_prefix(1);
   }
   while (!value.empty() && std::isspace(static_cast<unsigned char>(value.back()))) {
      value.remove_suffix(1);
   }

   return value;
}

std::optional<WasmHandler::Simulator::ParsedShortcut>
WasmHandler::Simulator::ParseShortcut(std::string_view value) {
   bool control{false};
   bool shift{false};
   bool alt{false};

   std::string key;
   std::size_t start = 0;

   while (start <= value.size()) {
      auto const end = value.find('+', start);
      auto const part =
        Trim(value.substr(start, end == std::string_view::npos ? end : end - start));
      if (part.empty()) {
         return std::nullopt;
      }

      std::string token{};
      token.reserve(part.size());
      for (auto c : part) {
         token.push_back(static_cast<char>(std::toupper(static_cast<unsigned char>(c))));
      }

      if (token == "CTRL" || token == "CONTROL") {
         if (control) {
            return std::nullopt;
         }

         control = true;
      } else if (token == "SHIFT") {
         if (shift) {
            return std::nullopt;
         }

         shift = true;
      } else if (token == "ALT") {
         if (alt) {
            return std::nullopt;
         }

         alt = true;
      } else {
         if (
           !key.empty() || token.size() != 1
           || !((token[0] >= 'A' && token[0] <= 'Z') || (token[0] >= '0' && token[0] <= '9'))
         ) {
            return std::nullopt;
         }

         key = token;
      }

      if (end == std::string_view::npos) {
         break;
      }

      start = end + 1;
   }

   auto const modifiers =
     static_cast<unsigned>(control) + static_cast<unsigned>(shift) + static_cast<unsigned>(alt);
   if (modifiers == 0 || modifiers > 2 || key.empty()) {
      return std::nullopt;
   }

   ParsedShortcut parsed{};
   if (control) {
      parsed.label_ = "Ctrl";
   }

   if (shift) {
      parsed.label_ += (parsed.label_.empty() ? "" : "+") + std::string{"Shift"};
   }

   if (alt) {
      parsed.label_ += (parsed.label_.empty() ? "" : "+") + std::string{"Alt"};
   }

   parsed.label_ += (parsed.label_.empty() ? "" : "+") + key;

   std::vector<std::vector<std::string>> modifier_options{};
   if (control) {
      modifier_options.push_back({"VK_LCONTROL", "VK_RCONTROL"});
   }

   if (shift) {
      modifier_options.push_back({"VK_LSHIFT", "VK_RSHIFT"});
   }

   if (alt) {
      modifier_options.push_back({"VK_LMENU", "VK_RMENU"});
   }

   parsed.definitions_.emplace_back();
   for (auto const& options : modifier_options) {
      std::vector<std::string> expanded;
      for (auto const& prefix : parsed.definitions_) {
         for (auto const& modifier : options) {
            expanded.push_back(prefix.empty() ? modifier : prefix + "+" + modifier);
         }
      }

      parsed.definitions_ = std::move(expanded);
   }

   for (auto& definition : parsed.definitions_) {
      definition += (definition.empty() ? "" : "+") + key;
   }

   return parsed;
}

std::string
WasmHandler::Simulator::SimConnectExceptionMessage(SIMCONNECT_RECV_EXCEPTION const& exception) {
   return "SimConnect exception " + std::to_string(exception.dwException)
          + " while configuring tablet input";
}