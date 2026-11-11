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
#include <cstring>
#include <sstream>

namespace {
bool
SameController(SIMCONNECT_CONTROLLER_ITEM const& left, SIMCONNECT_CONTROLLER_ITEM const& right) {
   return left.ProductId == right.ProductId && left.CompositeID == right.CompositeID
          && std::strncmp(left.DeviceName, right.DeviceName, sizeof(left.DeviceName)) == 0;
}
}  // namespace

std::string
WasmHandler::Simulator::JoystickLabel() const {
   if (!joystick_) {
      return {};
   }

   return std::string{joystick_->controller_.DeviceName} + " - Button "
          + std::to_string(joystick_->button_ + 1);
}

void
WasmHandler::Simulator::LoadJoystick() {
   std::ifstream input{JOYSTICK_FILE};
   if (!input.is_open()) {
      input.clear();
      input.open(std::string{JOYSTICK_FILE} + ".bak");
      if (input.is_open()) {
         std::cerr << "WASM: Recovering tablet joystick settings from the previous save"
                   << std::endl;
      }
   }

   if (!input.is_open() || input.peek() == std::ifstream::traits_type::eof()) {
      return;
   }

   JoystickBinding binding{};
   std::string     name{};

   if (
     input >> binding.controller_.ProductId >> binding.controller_.CompositeID >> binding.button_
     && input.ignore() && std::getline(input, name) && !name.empty()
     && name.size() < sizeof(binding.controller_.DeviceName)
     && binding.button_ < JOYSTICK_BUTTON_COUNT
   ) {
      std::copy(name.begin(), name.end(), binding.controller_.DeviceName);
      joystick_ = binding;
   } else {
      std::cerr << "WASM: Invalid saved tablet joystick binding; capture a button again"
                << std::endl;
   }
}

bool
WasmHandler::Simulator::SaveJoystick(
  std::optional<JoystickBinding> const& binding,
  std::string&                          error
) {
   std::ostringstream output{};
   if (binding) {
      output << binding->controller_.ProductId << ' ' << binding->controller_.CompositeID << ' '
             << binding->button_ << '\n'
             << binding->controller_.DeviceName << '\n';
   }

   return SaveSettings(JOYSTICK_FILE, output.str(), error);
}

bool
WasmHandler::Simulator::TrackJoystickCall(HRESULT result, std::vector<DWORD>& send_ids) {
   if (result != S_OK) {
      return false;
   }

   DWORD send_id{};
   if (SimConnect_GetLastSentPacketID(connection_, &send_id) != S_OK) {
      return false;
   }

   send_ids.push_back(send_id);
   return true;
}

bool
WasmHandler::Simulator::MapJoystick(
  std::optional<JoystickBinding> const& binding,
  std::vector<DWORD>&                   send_ids
) {
   if (joystick_group_created_) {
      auto const cleared{SimConnect_ClearInputGroup(connection_, JOYSTICK_INPUT_GROUP)};
      if (cleared == S_OK) {
         joystick_group_created_ = false;
      }

      if (!TrackJoystickCall(cleared, send_ids)) {
         return false;
      }
   }

   if (!binding) {
      return true;
   }

   auto const definition{
     "joystick:" + std::to_string(binding->controller_.DeviceId)
     + ":button:" + std::to_string(binding->button_)
   };

   auto const mapped{SimConnect_MapInputEventToClientEvent_EX1(
     connection_,
     JOYSTICK_INPUT_GROUP,
     definition.c_str(),
     JOYSTICK_TOGGLE_EVENT,
     0,
     static_cast<SIMCONNECT_CLIENT_EVENT_ID>(SIMCONNECT_UNUSED),
     0,
     FALSE
   )};

   // SimConnect creates an input group when its first mapping is submitted, not when it is cleared.
   if (mapped == S_OK) {
      joystick_group_created_ = true;
   }

   return TrackJoystickCall(mapped, send_ids)
          && TrackJoystickCall(
            SimConnect_SetInputGroupPriority(
              connection_, JOYSTICK_INPUT_GROUP, SIMCONNECT_GROUP_PRIORITY_LOWEST
            ),
            send_ids
          )
          && TrackJoystickCall(
            SimConnect_SetInputGroupState(connection_, JOYSTICK_INPUT_GROUP, SIMCONNECT_STATE_ON),
            send_ids
          );
}

void
WasmHandler::Simulator::RestoreJoystick() {
   joystick_initial_send_ids_.clear();

   if (!MapJoystick(joystick_resolved_ ? joystick_ : std::nullopt, joystick_initial_send_ids_)) {
      std::cerr << "WASM: Unable to restore the previous tablet joystick binding" << std::endl;
   }
}

bool
WasmHandler::Simulator::EnumerateJoysticks() {
   controllers_.clear();
   joystick_initial_send_ids_.clear();
   enumerating_joysticks_         = true;
   joystick_enumeration_deadline_ = std::chrono::steady_clock::now() + std::chrono::seconds{3};

   auto& send_ids{joystick_capture_ ? joystick_capture_->send_ids_ : joystick_initial_send_ids_};
   if (!TrackJoystickCall(SimConnect_EnumerateControllers(connection_), send_ids)) {
      enumerating_joysticks_ = false;
      return false;
   }

   return true;
}

std::optional<std::string>
WasmHandler::Simulator::JoystickRequest(std::string_view request_id, std::string_view action) {
   if (action == "get") {
      return "data:" + JoystickLabel();
   }

   if (action == "cancel") {
      if (joystick_capture_ || joystick_change_) {
         auto const was_enumerating{enumerating_joysticks_};
         FailJoystick("Joystick capture cancelled");
         enumerating_joysticks_ = was_enumerating;
      }

      return "data:" + JoystickLabel();
   }

   if (action != "capture" && action != "clear") {
      return "error:Unknown tablet joystick action";
   }

   if (joystick_capture_ || joystick_change_ || enumerating_joysticks_) {
      return "error:Another joystick operation is still pending; try again";
   }

   if (!connection_) {
      TryOpen();
      if (!connection_) {
         return "error:SimConnect is not connected";
      }
      if (enumerating_joysticks_) {
         return "error:Controllers are initializing; try again";
      }
   }

   if (action == "clear") {
      if (!joystick_) {
         return "data:";
      }

      joystick_change_ = JoystickChange{
        .request_id_ = std::string{request_id},
        .deadline_   = std::chrono::steady_clock::now() + SHORTCUT_ACK_TIMEOUT,
      };

      if (!MapJoystick(std::nullopt, joystick_change_->send_ids_)) {
         FailJoystick("Unable to clear the joystick binding");
      }
   } else {
      joystick_capture_ = JoystickCapture{
        .request_id_ = std::string{request_id},
        .deadline_   = std::chrono::steady_clock::now() + std::chrono::seconds{8},
      };

      if (!EnumerateJoysticks()) {
         FailJoystick("Unable to enumerate joystick controllers");
      }
   }

   return std::nullopt;
}

void
WasmHandler::Simulator::OnControllers(SIMCONNECT_RECV_CONTROLLERS_LIST const& list) {
   if (!enumerating_joysticks_) {
      return;
   }

   for (DWORD index{0}; index < list.dwArraySize; ++index) {
      auto controller{list.rgData[index]};
      controller.DeviceName[sizeof(controller.DeviceName) - 1] = '\0';
      controllers_.push_back(controller);
   }

   if (list.dwEntryNumber + 1 < list.dwOutOf) {
      return;
   }

   enumerating_joysticks_ = false;

   if (joystick_) {
      auto matches{0u};
      for (auto const& controller : controllers_) {
         if (SameController(controller, joystick_->controller_)) {
            joystick_->controller_ = controller;
            ++matches;
         }
      }

      joystick_resolved_ = matches == 1;

      if (matches == 1) {
         if (!joystick_capture_) {
            RestoreJoystick();
         }
      } else {
         std::cerr << "WASM: Saved tablet joystick is disconnected or ambiguous; "
                      "connect the device and capture a button again"
                   << std::endl;
      }
   }

   if (joystick_capture_) {
      if (controllers_.empty()) {
         FailJoystick("No joystick controllers are connected");
      } else if (!StartJoystickScan()) {
         FailJoystick("Unable to start joystick button capture");
      }
   }
}

bool
WasmHandler::Simulator::StartJoystickScan() {
   auto& capture{*joystick_capture_};
   joystick_cleanup_send_ids_.clear();
   for (std::size_t device{0}; device < controllers_.size(); ++device) {
      auto const group{static_cast<SIMCONNECT_INPUT_GROUP_ID>(JOYSTICK_SCAN_GROUP_BASE + device)};
      capture.groups_.push_back(group);

      for (unsigned int button{0}; button < JOYSTICK_BUTTON_COUNT; ++button) {
         auto const index{static_cast<DWORD>(capture.buttons_.size())};
         auto const definition{
           "joystick:" + std::to_string(controllers_[device].DeviceId)
           + ":button:" + std::to_string(button)
         };

         if (!TrackJoystickCall(
               SimConnect_MapInputEventToClientEvent_EX1(
                 connection_,
                 group,
                 definition.c_str(),
                 JOYSTICK_SCAN_EVENT,
                 index * 2,
                 JOYSTICK_SCAN_EVENT,
                 index * 2 + 1,
                 FALSE
               ),
               capture.send_ids_
             )) {
            return false;
         }

         capture.buttons_.push_back(
           JoystickCapture::Button{
             .binding_ = JoystickBinding{controllers_[device], button},
             .packet_  = capture.send_ids_.back(),
             .group_   = group,
           }
         );
      }
   }

   capture.arm_at_ = std::chrono::steady_clock::now() + SHORTCUT_ACK_TIMEOUT;
   return true;
}

bool
WasmHandler::Simulator::HasJoystickScanButtons(SIMCONNECT_INPUT_GROUP_ID group) const {
   return joystick_capture_
          && std::any_of(
            joystick_capture_->buttons_.begin(),
            joystick_capture_->buttons_.end(),
            [group](auto const& button) { return button.group_ == group && !button.rejected_; }
          );
}

bool
WasmHandler::Simulator::ArmJoystickScan() {
   auto&      capture{*joystick_capture_};
   auto const rejected{
     std::count_if(capture.buttons_.begin(), capture.buttons_.end(), [](auto const& button) {
        return button.rejected_;
     })
   };

   std::cout << "WASM: Joystick capture: " << capture.buttons_.size() - rejected
             << " usable button mappings; " << rejected
             << " candidate definitions rejected by SimConnect" << std::endl;
   if (static_cast<std::size_t>(rejected) == capture.buttons_.size()) {
      FailJoystick("SimConnect found no usable joystick buttons. Check the connected controllers.");
      return false;
   }

   for (auto const group : capture.groups_) {
      if (!HasJoystickScanButtons(group)) {
         continue;
      }

      if (
        !TrackJoystickCall(
          SimConnect_SetInputGroupPriority(connection_, group, SIMCONNECT_GROUP_PRIORITY_HIGHEST),
          capture.send_ids_
        )
        || !TrackJoystickCall(
          SimConnect_SetInputGroupState(connection_, group, SIMCONNECT_STATE_ON), capture.send_ids_
        )
      ) {
         FailJoystick("Unable to enable joystick button capture");
         return false;
      }
   }

   capture.armed_ = true;
   return true;
}

bool
WasmHandler::Simulator::StopJoystickScan() {
   if (!joystick_capture_) {
      return true;
   }

   bool                                   success{true};
   std::vector<SIMCONNECT_INPUT_GROUP_ID> remaining{};

   for (auto const group : joystick_capture_->groups_) {
      if (!HasJoystickScanButtons(group)) {
         continue;
      }

      auto const disabled{TrackJoystickCall(
        SimConnect_SetInputGroupState(connection_, group, SIMCONNECT_STATE_OFF),
        joystick_cleanup_send_ids_
      )};

      auto const cleared{TrackJoystickCall(
        SimConnect_ClearInputGroup(connection_, group), joystick_cleanup_send_ids_
      )};

      if (!cleared) {
         remaining.push_back(group);
      }

      if (!disabled || !cleared) {
         success = false;
         std::cerr << "WASM: Unable to stop tablet joystick scan group " << group << std::endl;
      }
   }

   joystick_capture_->groups_ = std::move(remaining);
   return success;
}

void
WasmHandler::Simulator::OnJoystickButton(DWORD value) {
   if (
     !joystick_capture_ || !joystick_capture_->armed_
     || value / 2 >= joystick_capture_->buttons_.size()
     || joystick_capture_->buttons_[value / 2].rejected_
   ) {
      return;
   }

   auto& capture{*joystick_capture_};
   if (value % 2 == 0) {
      capture.pressed_ = value / 2;
      return;
   }

   // Only accept a full press/release, not an already-held switch or a repeated down event.
   if (capture.pressed_ != value / 2) {
      return;
   }

   auto const binding{capture.buttons_[value / 2].binding_};
   if (
     std::count_if(
       controllers_.begin(),
       controllers_.end(),
       [&](auto const& controller) { return SameController(controller, binding.controller_); }
     )
     != 1
   ) {
      FailJoystick(
        "Identical controllers cannot be distinguished safely; disconnect the duplicate"
      );
      return;
   }

   if (!StopJoystickScan()) {
      FailJoystick("Unable to stop joystick button capture");
      return;
   }

   joystick_change_ = JoystickChange{
     .request_id_ = std::move(capture.request_id_),
     .requested_  = binding,
     .send_ids_   = std::move(capture.send_ids_),
     .deadline_   = std::chrono::steady_clock::now() + SHORTCUT_ACK_TIMEOUT,
   };

   joystick_capture_.reset();

   if (!MapJoystick(binding, joystick_change_->send_ids_)) {
      FailJoystick("Unable to map the captured joystick button");
   }
}

void
WasmHandler::Simulator::FailJoystick(std::string const& error) {
   enumerating_joysticks_ = false;

   if (joystick_capture_) {
      StopJoystickScan();
      auto request_id{std::move(joystick_capture_->request_id_)};
      joystick_capture_.reset();
      RestoreJoystick();
      handler_.SendResponse(request_id, "error:" + error);
   }

   if (joystick_change_) {
      auto request_id{std::move(joystick_change_->request_id_)};
      joystick_change_.reset();
      RestoreJoystick();
      handler_.SendResponse(request_id, "error:" + error);
   }

   std::cerr << "WASM: " << error << std::endl;
}

void
WasmHandler::Simulator::UpdateJoystick() {
   auto const now{std::chrono::steady_clock::now()};
   if (enumerating_joysticks_ && now >= joystick_enumeration_deadline_) {
      FailJoystick("Timed out enumerating joystick controllers");
   }

   if (joystick_capture_ && now >= joystick_capture_->deadline_) {
      FailJoystick(
        "No button captured. Press and release a joystick button during a loaded flight."
      );
   }

   if (
     joystick_capture_ && !enumerating_joysticks_ && !joystick_capture_->armed_
     && now >= joystick_capture_->arm_at_
   ) {
      ArmJoystickScan();
   }

   if (joystick_change_ && now >= joystick_change_->deadline_) {
      std::string error{};
      if (!SaveJoystick(joystick_change_->requested_, error)) {
         FailJoystick(error);
         return;
      }

      joystick_          = joystick_change_->requested_;
      joystick_resolved_ = joystick_.has_value();
      auto request_id{std::move(joystick_change_->request_id_)};
      joystick_change_.reset();
      joystick_initial_send_ids_.clear();
      handler_.SendResponse(request_id, "data:" + JoystickLabel());
   }
}

bool
WasmHandler::Simulator::OnJoystickException(SIMCONNECT_RECV_EXCEPTION const& exception) {
   auto const contains{[&](std::vector<DWORD> const& ids) {
      return std::find(ids.begin(), ids.end(), exception.dwSendID) != ids.end();
   }};

   auto const error{
     SimConnectExceptionMessage(exception) + " (joystick packet "
     + std::to_string(exception.dwSendID) + ", parameter " + std::to_string(exception.dwIndex) + ")"
   };

   if (
     joystick_capture_ && exception.dwException == SIMCONNECT_EXCEPTION_ERROR
     && exception.dwIndex == static_cast<DWORD>(-1)
   ) {
      auto&      buttons{joystick_capture_->buttons_};
      auto const button{std::find_if(buttons.begin(), buttons.end(), [&](auto const& candidate) {
         return candidate.packet_ == exception.dwSendID;
      })};

      if (button != buttons.end()) {
         // Enumeration includes keyboard/mouse and provides no per-device button count.
         button->rejected_ = true;
         return true;
      }
   }

   if (
     (joystick_capture_ && contains(joystick_capture_->send_ids_))
     || (joystick_change_ && contains(joystick_change_->send_ids_))
   ) {
      FailJoystick(error);
      return true;
   }

   if (contains(joystick_cleanup_send_ids_)) {
      FailJoystick("Unable to clean up joystick capture: " + error);
      return true;
   }

   if (contains(joystick_initial_send_ids_)) {
      enumerating_joysticks_ = false;
      joystick_initial_send_ids_.clear();

      std::cerr << "WASM: " << error << std::endl;
      return true;
   }
   return false;
}
