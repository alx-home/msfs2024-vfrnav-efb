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

#include "CommWasm.h"

#include <chrono>
#include <array>
#include <map>
#include <MSFS/MSFS_Vars.h>
#include <MSFS/MSFS_WindowsTypes.h>
#include <vector>
#include <SimConnect.h>

/** @brief Bridge tablet input and per-aircraft placement to SimConnect and simulator variables. */
struct WasmHandler::Simulator {
   static constexpr char const* DEFAULT_TABLET_SHORTCUT{"Ctrl+T"};
   static constexpr char const* TABLET_SHORTCUT_FILE{"/work/tablet-shortcut.txt"};

   static constexpr SIMCONNECT_INPUT_GROUP_ID        TABLET_INPUT_GROUP{0x10000};
   static constexpr SIMCONNECT_INPUT_GROUP_ID        SHIFT_INPUT_GROUP{0x10001};
   static constexpr SIMCONNECT_INPUT_GROUP_ID        JOYSTICK_INPUT_GROUP{0x10002};
   static constexpr SIMCONNECT_INPUT_GROUP_ID        JOYSTICK_SCAN_GROUP_BASE{0x20000};
   static constexpr SIMCONNECT_NOTIFICATION_GROUP_ID INPUT_NOTIFICATION_GROUP{0x10000};

   static constexpr auto SHORTCUT_ACK_TIMEOUT{std::chrono::milliseconds{500}};

   /** @brief Canonical shortcut label and SimConnect input definitions. */
   struct ParsedShortcut {
      std::string              label_;
      std::vector<std::string> definitions_;
   };

   static std::string_view Trim(std::string_view value);

   /** @brief Validate a modifier-plus-letter/digit shortcut and build its input definitions.
    *
    * @param value Shortcut label to parse.
    *
    * @return Parsed shortcut, or an empty optional if invalid. */
   static std::optional<ParsedShortcut> ParseShortcut(std::string_view value);

   static std::string SimConnectExceptionMessage(SIMCONNECT_RECV_EXCEPTION const& exception);

   static constexpr SIMCONNECT_CLIENT_EVENT_ID TABLET_TOGGLE_EVENT{
     static_cast<SIMCONNECT_CLIENT_EVENT_ID>(0x10000)
   };
   static constexpr SIMCONNECT_CLIENT_EVENT_ID LEFT_SHIFT_DOWN_EVENT{
     static_cast<SIMCONNECT_CLIENT_EVENT_ID>(0x10001)
   };
   static constexpr SIMCONNECT_CLIENT_EVENT_ID LEFT_SHIFT_UP_EVENT{
     static_cast<SIMCONNECT_CLIENT_EVENT_ID>(0x10002)
   };
   static constexpr SIMCONNECT_CLIENT_EVENT_ID RIGHT_SHIFT_DOWN_EVENT{
     static_cast<SIMCONNECT_CLIENT_EVENT_ID>(0x10003)
   };
   static constexpr SIMCONNECT_CLIENT_EVENT_ID RIGHT_SHIFT_UP_EVENT{
     static_cast<SIMCONNECT_CLIENT_EVENT_ID>(0x10004)
   };
   static constexpr SIMCONNECT_CLIENT_EVENT_ID FRAME_EVENT{
     static_cast<SIMCONNECT_CLIENT_EVENT_ID>(0x10005)
   };
   static constexpr SIMCONNECT_CLIENT_EVENT_ID JOYSTICK_SCAN_EVENT{
     static_cast<SIMCONNECT_CLIENT_EVENT_ID>(0x10006)
   };
   static constexpr SIMCONNECT_CLIENT_EVENT_ID JOYSTICK_TOGGLE_EVENT{
     static_cast<SIMCONNECT_CLIENT_EVENT_ID>(0x10007)
   };

   explicit Simulator(WasmHandler& handler);

   /** @brief Track a remapping until SimConnect acknowledges it or reports an exception. */
   struct PendingShortcut {
      std::string                           request_id_;
      std::string                           requested_;
      std::string                           previous_;
      std::vector<DWORD>                    send_ids_;
      std::chrono::steady_clock::time_point deadline_{};
   };

   /** @brief Register simulator variables, restore settings, and open SimConnect. */
   void Initialize();

   /** @brief Advance pending input changes and aircraft pose synchronization. */
   void Update();

   /** @brief Persist the current pose and close the simulator connection. */
   void Shutdown();

   /** @brief Request a shortcut change; return an immediate result or defer the response.
    *
    * @param request_id Correlation ID for a deferred response.
    * @param label Requested shortcut.
    *
    * @return Immediate response, or an empty optional if the response is deferred. */
   std::optional<std::string> SetShortcut(std::string_view request_id, std::string_view label);
   /** @brief Get, capture, cancel, or clear a joystick binding.
    *
    * @param request_id Correlation ID for a deferred response.
    * @param action Requested joystick operation.
    *
    * @return Immediate response, or an empty optional if the response is deferred. */
   std::optional<std::string> JoystickRequest(std::string_view request_id, std::string_view action);

private:
   static constexpr char const*                POSES_FILE{"/work/tablet-poses.txt"};
   static constexpr SIMCONNECT_CLIENT_EVENT_ID AIRCRAFT_LOADED_EVENT{
     static_cast<SIMCONNECT_CLIENT_EVENT_ID>(0x10008)
   };

   /** @brief Serialized tablet placement values associated with an aircraft identity. */
   using TabletPose = std::array<double, 8>;

   static bool SaveSettings(char const* path, std::string_view contents, std::string& error);
   static bool MissingSettingsFile(std::string_view path, int error);
   static bool ValidPose(TabletPose const& pose);

   /** @brief Register placement variables and load previously saved aircraft poses. */
   void InitializePose();
   void LoadPoses();
   /** @brief Resolve the active aircraft, restore its pose, and track placement edits. */
   void UpdatePose();
   void SavePose();
   /** @brief Flush the old pose and invalidate pending identity requests on aircraft change. */
   void ChangeAircraft();
   void OnAircraftState(SIMCONNECT_RECV_SYSTEM_STATE const& state);
   bool ReadPoseVariable(FsLVarId id, double& value);

   std::array<FsLVarId, 8>               pose_variables_{};
   FsLVarId                              pose_instance_variable_{FS_VAR_INVALID_ID};
   FsLVarId                              pose_ready_variable_{FS_VAR_INVALID_ID};
   FsLVarId                              pose_mode_variable_{FS_VAR_INVALID_ID};
   FsLVarId                              pose_cancel_variable_{FS_VAR_INVALID_ID};
   std::map<std::string, TabletPose>     poses_{};
   std::string                           pose_aircraft_{};
   TabletPose                            pose_current_{};
   double                                pose_instance_{-1};
   bool                                  pose_restored_{false};
   bool                                  pose_dirty_{false};
   bool                                  pose_storage_writable_{true};
   bool                                  pose_read_error_{false};
   DWORD                                 pose_request_id_{0x30000};
   bool                                  pose_request_pending_{false};
   std::chrono::steady_clock::time_point pose_request_deadline_{};
   std::chrono::steady_clock::time_point pose_save_at_{};

   static constexpr char const*  JOYSTICK_FILE{"/work/tablet-joystick.txt"};
   static constexpr unsigned int JOYSTICK_BUTTON_COUNT{128};

   struct JoystickBinding {
      SIMCONNECT_CONTROLLER_ITEM controller_{};
      unsigned int               button_{};
   };

   struct JoystickChange {
      std::string                           request_id_;
      std::optional<JoystickBinding>        requested_{};
      std::vector<DWORD>                    send_ids_{};
      std::chrono::steady_clock::time_point deadline_{};
   };

   /** @brief Track controller enumeration and temporary input groups during button capture. */
   struct JoystickCapture {
      struct Button {
         JoystickBinding           binding_{};
         DWORD                     packet_{};
         SIMCONNECT_INPUT_GROUP_ID group_{};
         bool                      rejected_{false};
      };
      std::string                            request_id_;
      std::vector<Button>                    buttons_{};
      std::vector<SIMCONNECT_INPUT_GROUP_ID> groups_{};
      std::vector<DWORD>                     send_ids_{};
      std::optional<DWORD>                   pressed_{};
      bool                                   armed_{false};
      std::chrono::steady_clock::time_point  arm_at_{};
      std::chrono::steady_clock::time_point  deadline_{};
   };

   std::string JoystickLabel() const;
   void        LoadJoystick();
   bool        SaveJoystick(std::optional<JoystickBinding> const& binding, std::string& error);
   bool MapJoystick(std::optional<JoystickBinding> const& binding, std::vector<DWORD>& send_ids);
   bool TrackJoystickCall(HRESULT result, std::vector<DWORD>& send_ids);
   /** @brief Remove temporary controller input mappings and report cleanup failure.
    *
    * @return Whether cleanup succeeded. */
   bool StopJoystickScan();
   void FailJoystick(std::string const& error);
   void UpdateJoystick();
   void OnControllers(SIMCONNECT_RECV_CONTROLLERS_LIST const& controllers);
   /** @brief Accept a captured button only after the scan is armed and the button is released.
    *
    * @param value Encoded button event identifying the button and transition. */
   void OnJoystickButton(DWORD value);
   bool OnJoystickException(SIMCONNECT_RECV_EXCEPTION const& exception);
   void RestoreJoystick();
   bool EnumerateJoysticks();
   bool StartJoystickScan();
   bool ArmJoystickScan();
   bool HasJoystickScanButtons(SIMCONNECT_INPUT_GROUP_ID group) const;

   /** @brief Route SimConnect events and exceptions to the owning simulator instance.
    *
    * @param data SimConnect event data.
    * @param context Owning simulator instance. */
   static void CALLBACK Dispatch(SIMCONNECT_RECV* data, DWORD, void* context);

   void WriteVariable(FsLVarId id, double value);

   void UpdateShift();

   void TryOpen();

   void ConfigureShiftGroup();

   bool
   MapShortcut(ParsedShortcut const& shortcut, std::vector<DWORD>& send_ids, std::string& error);

   void ConfigureInitialShortcut();

   bool RestoreShortcut(std::string const& label);

   bool SaveShortcut(std::string const& label);

   void OnException(SIMCONNECT_RECV_EXCEPTION const& exception);

   WasmHandler&                            handler_;
   HANDLE                                  connection_{0};
   FsLVarId                                toggle_request_variable_{FS_VAR_INVALID_ID};
   FsLVarId                                shift_variable_{FS_VAR_INVALID_ID};
   FsUnitId                                number_unit_{FS_INVALID_UNIT};
   bool                                    left_shift_held_{false};
   bool                                    right_shift_held_{false};
   bool                                    shift_held_{false};
   std::vector<DWORD>                      initial_mapping_send_ids_{};
   std::optional<PendingShortcut>          pending_{};
   std::optional<JoystickBinding>          joystick_{};
   bool                                    joystick_resolved_{false};
   bool                                    joystick_group_created_{false};
   std::optional<JoystickChange>           joystick_change_{};
   std::optional<JoystickCapture>          joystick_capture_{};
   std::vector<SIMCONNECT_CONTROLLER_ITEM> controllers_{};
   std::vector<DWORD>                      joystick_initial_send_ids_{};
   std::vector<DWORD>                      joystick_cleanup_send_ids_{};
   bool                                    enumerating_joysticks_{false};
   std::chrono::steady_clock::time_point   joystick_enumeration_deadline_{};
};