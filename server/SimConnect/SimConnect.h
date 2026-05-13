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

#pragma once

#include "Data/TrafficInfo.h"
#include "Data/TrafficStaticInfo.h"
#include "FacilityData/AirportFacility.h"
#include "promise/StatePromise.h"

#include <promise/promise.h>
#include <promise/MessageQueue.h>
#include <chrono>
#include <functional>
#include <type_traits>
#include <utils/MessageQueueProxy.inl>
#include <windows/Event.h>
#include <windows/Window.h>

#include <Windows.h>
#include <SimConnect.h>
#include <handleapi.h>
#include <intsafe.h>
#include <minwindef.h>
#include <synchapi.h>
#include <windef.h>
#include <winnt.h>
#include <winuser.h>
#include <cstdint>
#include <memory>
#include <string>
#include <stdexcept>
#include <thread>

class Main;

namespace smc {

struct Disconnected : std::runtime_error {
   Disconnected()
      : std::runtime_error("MSFS not connected!") {}
};

struct Timeout : std::runtime_error {
   using std::runtime_error::runtime_error;
};

struct UnknownError : std::runtime_error {
   UnknownError(std::string_view message)
      : std::runtime_error(
          "MSFS error " + (message.size() ? (": " + std::string{message}) : ""_str) + "!"
        ) {
      assert(false);
   }
};

enum class Message : UINT {
   SIMCONNECT_SET_SERVER_PORT = WM_APP,
};

template <Message MESSAGE>
struct Parameter;

template <>
struct Parameter<Message::SIMCONNECT_SET_SERVER_PORT> {
   uint32_t port_;
};

using ServerPortParam = Parameter<Message::SIMCONNECT_SET_SERVER_PORT>;

enum class DataId : uint32_t {
   SET_PORT,
   EVENT_FRAME,
   TRAFFIC,
   TRAFFIC_INFO,
   TRAFFIC_STATIC_INFO,
   HELI_TRAFFIC_INFO,
   TAXIWAY_PATH,
   USER_INFO,
   GROUND_INFO,

   SET_WAYPOINTS,
   WAYPOINT_INDEX,
   SET_AI_HEADING,
   SET_AI_SPEED,

   GET_SIMRATE,

   GET_AIRPORT_FACILITY,

   SET_AIRSPEED_CONTROL,
   SET_ALTITUDE_CONTROL,
   SET_BANK_CONTROL,
   SET_BREAK,
   SET_CONTROL_SURFACES,
   SET_FLAPS,
   SET_GEAR,
   SET_GROUND_ALTITUDE_CONTROL,
   SET_GROUND_ALTITUDE,
   SET_HEADING_CONTROL,
   SET_ON_GROUND,
   SET_PITCH_CONTROL,
   SET_ROTATION_CONTROL,
   SET_SPEED_CONTROL,
   SET_VSPEED_CONTROL,
   SET_THROTTLE,

   SET_INIT_POSISION,

   MAX_VALUE,
};

enum class EventId : uint32_t {
   AP_MASTER,
   AP_ALT_HOLD,
   AP_ATT_HOLD,
   FREEZE_LATLON_SET,
   FREEZE_ALTITUDE_SET,
   FREEZE_ATTITUDE_SET,
   FREEZE_SLEW,
   SET_SLEW,
   AXIS_SLEW_BANK_SET,
   AXIS_ELEVATOR_SET,
   AXIS_AILERONS_SET,
   AXIS_RUDDER_SET,
   THROTTLE_SET
};

enum class ClientEventId : uint32_t {
   FLAPS_SET = 0x10000,
   PARKING_BRAKES_SET,
};

template <class DATA_TYPE>
struct SimobjectData {
   DWORD dw_version_;  // interface version
   DWORD dw_id_;       // see SIMCONNECT_RECV_ID

   DWORD dw_request_id_;
   DWORD dw_object_id_;
   DWORD dw_define_id_;
   DWORD dw_flags_;         // SIMCONNECT_DATA_REQUEST_FLAG
   DWORD dw_entry_number_;  // if multiple objects returned, this is number <entrynumber> out of
                            // <outof>.
   DWORD dw_out_of_;        // note: starts with 1, not 0.
   DWORD dw_define_count_;  // data count (number of datums, *not* byte count)
                            //
                            //
   std::chrono::steady_clock::time_point
     last_update_time_;  // not part of SimConnect data, but useful
                         // for tracking when the data was received
   DATA_TYPE dw_data_;   // data begins here, dw_define_count_ data items
};

using Liveries = std::multimap<std::string, std::string>;

struct AirportInfo {
   std::string indent_;
   std::string region_;
   double      lat_;
   double      lon_;
   double      altitude_;
};
using Airports = std::vector<AirportInfo>;

template <class T>
struct IsStdArray : std::false_type {};

template <class T, std::size_t N>
struct IsStdArray<std::array<T, N>> : std::true_type {};

template <class T>
inline constexpr bool IS_STD_ARRAY = IsStdArray<std::remove_cvref_t<T>>::value;
template <class T>
inline constexpr bool IS_VECTOR = requires(T t) {
   std::is_same_v<std::remove_cvref_t<T>, std::vector<typename std::remove_cvref_t<T>::value_type>>;
};

class SimConnect : private promise::MessageQueue {
public:
   using ObjectId = SIMCONNECT_RECV_ASSIGNED_OBJECT_ID;

   SimConnect(Main& main);
   ~SimConnect() override;

   void Stop();

   template <class TYPE, size_t N>
   [[nodiscard]] WPromise<void> SetDataOnSimObject(
     DataId                id,
     SIMCONNECT_OBJECT_ID  objectId,
     DWORD                 flags,
     std::array<TYPE, N>&& data
   );

   template <class TYPE>
   [[nodiscard]] WPromise<void> SetDataOnSimObject(
     DataId               id,
     SIMCONNECT_OBJECT_ID objectId,
     DWORD                flags,
     std::vector<TYPE>&&  data
   );

   template <class TYPE>

      requires(!IS_STD_ARRAY<TYPE> && !IS_VECTOR<TYPE>)
   [[nodiscard]] WPromise<void>
   SetDataOnSimObject(DataId id, SIMCONNECT_OBJECT_ID objectId, DWORD flags, TYPE&& data);

   [[nodiscard]] WPromise<double>            GetGroundInfo(double lat, double lon);
   [[nodiscard]] WPromise<TrafficInfo>       GetUserAircraftInfo() noexcept(true);
   [[nodiscard]] WPromise<TrafficInfo>       GetAircraftInfo(ObjectId id) noexcept(true);
   [[nodiscard]] WPromise<TrafficStaticInfo> GetAircraftStaticInfo(ObjectId id) noexcept(true);
   [[nodiscard]] WPromise<facility::AirportData>
   GetAirportFacility(std::string_view icao, std::string_view region = {}) noexcept(true);

   [[nodiscard]] WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>
   AICreateSimulatedObject(std::string_view title, SIMCONNECT_DATA_INITPOSITION pos);

   [[nodiscard]] WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID> AICreateNonATCAircraft(
     std::string_view             title,
     std::string_view             livery,
     std::string_view             tail_number,
     SIMCONNECT_DATA_INITPOSITION pos
   );

   [[nodiscard]] WPromise<Liveries> EnumerateSimObjectsAndLiveries(
     SIMCONNECT_SIMOBJECT_TYPE objectType
   );

   [[nodiscard]] WPromise<void>
   TransmitClientEvent(SIMCONNECT_OBJECT_ID objectId, smc::EventId eventId, DWORD eventData);
   [[nodiscard]] WPromise<void> AIReleaseControl(SIMCONNECT_OBJECT_ID objectId);
   [[nodiscard]] WPromise<bool> SetServerPort(uint32_t port);

   WPromise<void> SetDataOnSimObjectImpl(
     DataId                   id,
     SIMCONNECT_OBJECT_ID     objectId,
     DWORD                    flags,
     DWORD                    unitSize,
     size_t                   count,
     std::vector<std::byte>&& data
   );

   WPromise<void> Connected() const;

private:
   bool           ShouldStop(std::stop_token const& stoken) const noexcept;
   void           Run(std::stop_token const& stoken);
   WPromise<void> Wait(std::chrono::milliseconds timeout) const;

   template <class T>
   [[nodiscard]] WPromise<T> Proxy(std::function<WPromise<T>()>&& func) const;

   template <DataId ID>
   [[nodiscard]] bool AddToDataDefinition(
     std::string_view                datumName,
     SIMCONNECT_DATATYPE             datumType,
     std::optional<std::string_view> unitsName = std::nullopt,
     DWORD                           groupId   = 0
   );
   template <DataId ID>
   [[nodiscard]] bool AddToDataDefinition(
     std::shared_ptr<void*> const&   handle,
     std::string_view                datumName,
     SIMCONNECT_DATATYPE             datumType,
     std::optional<std::string_view> unitsName = std::nullopt,
     std::optional<DWORD>            groupId   = std::nullopt
   );
   template <DataId ID, class T>
   [[nodiscard]] bool AddToDataDefinition(std::shared_ptr<void*> const& handle);
   template <DataId ID, class T>
   [[nodiscard]] bool AddToDataDefinition();

   template <DataId ID>
   [[nodiscard]] bool AddToFacilityDefinition(std::string_view datumName);
   template <DataId ID>
   [[nodiscard]] bool
   AddToFacilityDefinition(std::shared_ptr<void*> const& handle, std::string_view datumName);
   template <DataId ID, class T>
   [[nodiscard]] bool AddToFacilityDefinition(std::shared_ptr<void*> const& handle);
   template <DataId ID, class T>
   [[nodiscard]] bool AddToFacilityDefinition();

   template <DataId ID, class T>
   [[nodiscard]] WPromise<std::vector<T>> RequestDataOnSimObjectType(
     SIMCONNECT_SIMOBJECT_TYPE objectType,
     uint32_t                  radius = 0,
     std::shared_ptr<void*>    handle = nullptr
   );

   template <DataId ID, class DATA_TYPE>
   [[nodiscard]] WPromise<DATA_TYPE>
   RequestFacilityData(std::string_view icao, std::string_view region = {});

   template <class TYPE>
   using FacilityType = std::remove_cvref_t<decltype(std::declval<TYPE>().rgData[0])>;
   template <class TYPE>
   [[nodiscard]] WPromise<std::vector<FacilityType<TYPE>>> RequestFacilitiesList(
     SIMCONNECT_FACILITY_LIST_TYPE type
   );

   template <DataId ID, class DATA_TYPE>
   [[nodiscard]] WPromise<SimobjectData<DATA_TYPE>>
   RequestDataOnSimObject(uint32_t objectId, std::shared_ptr<void*> handle);

   [[nodiscard]] WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID> AICreateSimulatedObject(
     std::string_view             title,
     SIMCONNECT_DATA_INITPOSITION pos,
     std::shared_ptr<void*>       handle
   );

   [[nodiscard]] WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID> AICreateNonATCAircraft(
     std::string_view             title,
     std::string_view             livery,
     std::string_view             tail_number,
     SIMCONNECT_DATA_INITPOSITION pos,
     std::shared_ptr<void*>       handle
   );

   template <class T>
   static T StaticCast(DWORD const& data);

   template <class T>
   static std::size_t Size();

   [[nodiscard]] bool
   TrackRequestSendId(std::shared_ptr<void*> const& handle, SIMCONNECT_DATA_REQUEST_ID requestId);
   [[nodiscard]] std::optional<DWORD>
   TrackPendingSendId(std::shared_ptr<void*> const& handle, std::shared_ptr<Reject const> reject);
   void ClearTrackedSendId(SIMCONNECT_DATA_REQUEST_ID requestId);
   [[nodiscard]] std::optional<SIMCONNECT_DATA_REQUEST_ID> FindRequestIdForSendId(
     DWORD sendId
   ) const;
   [[nodiscard]] std::shared_ptr<Reject const> FindRejectForSendId(DWORD sendId) const;

   void Dispatch(SIMCONNECT_RECV const& data);

   SIMCONNECT_DATA_REQUEST_ID request_id_{0};

   StatePromise connection_promise_{};

   using WaitingSimObject = std::map<
     SIMCONNECT_DATA_REQUEST_ID,
     std::pair<
       std::function<
         void(SIMCONNECT_RECV_SIMOBJECT_DATA const&, std::chrono::steady_clock::time_point const&)>,
       std::shared_ptr<Reject const>>>;
   WaitingSimObject pending_simobject_{};

   using WaitingFacility = std::map<
     SIMCONNECT_DATA_REQUEST_ID,
     std::pair<
       std::function<void(std::variant<
                          std::reference_wrapper<SIMCONNECT_RECV_FACILITY_DATA const>,
                          std::reference_wrapper<SIMCONNECT_RECV_FACILITY_DATA_END const>> const&)>,
       std::shared_ptr<Reject const>>>;
   WaitingFacility pending_facility_{};

   using WaitingSimObjectType = std::map<
     SIMCONNECT_DATA_REQUEST_ID,
     std::pair<
       std::function<void(SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE const&)>,
       std::shared_ptr<Reject const>>>;
   WaitingSimObjectType pending_simobject_type_{};

   using WaitingEnumeratedSimObjects = std::map<
     SIMCONNECT_DATA_REQUEST_ID,
     std::pair<
       std::function<void(SIMCONNECT_RECV_ENUMERATE_SIMOBJECT_AND_LIVERY_LIST const&)>,
       std::shared_ptr<Reject const>>>;
   WaitingEnumeratedSimObjects pending_enumerated_simobjects_{};
   using WaitingFacilitiesList = std::map<
     SIMCONNECT_DATA_REQUEST_ID,
     std::pair<
       std::function<void(SIMCONNECT_RECV_FACILITIES_LIST const&)>,
       std::shared_ptr<Reject const>>>;
   WaitingFacilitiesList pending_facilities_list_{};

   using WaitingAssignedObject = std::map<
     SIMCONNECT_DATA_REQUEST_ID,
     std::pair<
       std::function<void(SIMCONNECT_RECV_ASSIGNED_OBJECT_ID const&)>,
       std::shared_ptr<Reject const>>>;
   WaitingAssignedObject pending_assigned_{};

   static constexpr auto PENDING_MEMBERS = std::make_tuple(
     &SimConnect::pending_simobject_,
     &SimConnect::pending_facility_,
     &SimConnect::pending_simobject_type_,
     &SimConnect::pending_enumerated_simobjects_,
     &SimConnect::pending_facilities_list_,
     &SimConnect::pending_assigned_
   );

   std::map<DWORD, SIMCONNECT_DATA_REQUEST_ID>    send_id_to_request_id_{};
   std::map<SIMCONNECT_DATA_REQUEST_ID, DWORD>    request_id_to_send_id_{};
   std::map<DWORD, std::shared_ptr<Reject const>> send_id_to_reject_{};

   using time_point = std::chrono::steady_clock::time_point;

   mutable std::shared_mutex mutex_{};

   Main&        main_;
   win32::Event event_{win32::CreateEvent()};
   int64_t      server_port_{48578};
   int64_t      sent_port_{-1};

   std::weak_ptr<HANDLE> handle_{};

   std::jthread thread_{};
};

}  // namespace smc

using SimConnect = smc::SimConnect;