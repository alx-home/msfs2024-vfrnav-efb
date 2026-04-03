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

#include "Request.h"
#include "Data/TrafficInfo.h"

#include <promise/promise.h>
#include <utils/MessageQueue.h>
#include <chrono>
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
#include <unordered_map>

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
        ) {}
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
   HELI_TRAFFIC_INFO,
   TAXIWAY_PATH,
   USER_INFO,
   GROUND_INFO,

   GET_SIMRATE,

   SET_WAYPOINTS,
   SET_BREAK,
   SET_GEAR,
   SET_FLAPS,

   MAX_VALUE,
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

namespace api {

using Livery   = std::pair<std::string, std::string>;
using Liveries = std::vector<Livery>;

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

class SimConnect {
public:
   using ObjectId = SIMCONNECT_RECV_ASSIGNED_OBJECT_ID;

protected:
   SimConnect()          = default;
   virtual ~SimConnect() = default;

public:
   [[nodiscard]] virtual WPromise<bool> SetServerPort(uint32_t port) = 0;
   //  [[nodiscard]] virtual WPromise<void>        SetFlapsHandleIndex(ObjectId id, uint32_t index)
   //  = 0;
   [[nodiscard]] virtual WPromise<double>      GetGroundInfo(double lat, double lon)       = 0;
   [[nodiscard]] virtual WPromise<TrafficInfo> GetUserAircraftInfo() noexcept(true)        = 0;
   [[nodiscard]] virtual WPromise<TrafficInfo> GetAircraftInfo(ObjectId id) noexcept(true) = 0;
   [[nodiscard]] virtual WPromise<Liveries>    GetTrafficTitles() const                    = 0;
   [[nodiscard]] virtual WPromise<float> WatchSimRate(std::optional<float> current = std::nullopt)
     const = 0;

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

   [[nodiscard]] virtual WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>
   AICreateSimulatedObject(std::string_view title, SIMCONNECT_DATA_INITPOSITION pos) = 0;

   [[nodiscard]] virtual WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID> AICreateNonATCAircraft(
     std::string_view             title,
     std::string_view             tail_number,
     SIMCONNECT_DATA_INITPOSITION pos
   ) = 0;

   [[nodiscard]] virtual WPromise<Liveries> EnumerateSimObjectsAndLiveries(
     SIMCONNECT_SIMOBJECT_TYPE objectType
   ) = 0;

private:
   virtual bool SetDataOnSimObjectImpl(
     DataId               id,
     SIMCONNECT_OBJECT_ID objectId,
     DWORD                flags,
     DWORD                unitSize,
     size_t               count,
     void*                data
   ) = 0;
};
}  // namespace api

namespace priv {
class SimConnect
   : public api::SimConnect
   , private MessageQueue {
private:
   SimConnect(Main& main);

public:
   ~SimConnect() override;

private:
   [[nodiscard]] WPromise<bool> SetServerPort(uint32_t port) override;
   //  [[nodiscard]] WPromise<void>        SetFlapsHandleIndex(ObjectId id, uint32_t index)
   //  override;
   [[nodiscard]] WPromise<double>      GetGroundInfo(double lat, double lon) override;
   [[nodiscard]] WPromise<TrafficInfo> GetUserAircraftInfo() noexcept(true) override;
   [[nodiscard]] WPromise<TrafficInfo> GetAircraftInfo(ObjectId id) noexcept(true) override;

   bool ShouldStop(std::stop_token const& stoken) const noexcept;
   void Run(std::stop_token const& stoken);

   template <DataId ID>
   [[nodiscard]] bool AddToDataDefinition(
     std::string_view                datumName,
     SIMCONNECT_DATATYPE             datumType,
     std::optional<std::string_view> unitsName = std::nullopt
   );
   template <DataId ID>
   [[nodiscard]] bool AddToDataDefinition(
     std::shared_ptr<void*> const&   handle,
     std::string_view                datumName,
     SIMCONNECT_DATATYPE             datumType,
     std::optional<std::string_view> unitsName = std::nullopt
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
   [[nodiscard]] WPromise<SimobjectData<DATA_TYPE>>
   RequestDataOnSimObject(uint32_t objectId, std::shared_ptr<void*> handle);

   [[nodiscard]] WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID> AICreateSimulatedObject(
     std::string_view             title,
     SIMCONNECT_DATA_INITPOSITION pos,
     std::shared_ptr<void*>       handle
   );

   [[nodiscard]] WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID> AICreateNonATCAircraft(
     std::string_view             title,
     std::string_view             tail_number,
     SIMCONNECT_DATA_INITPOSITION pos,
     std::shared_ptr<void*>       handle
   );

   [[nodiscard]] WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>
   AICreateSimulatedObject(std::string_view title, SIMCONNECT_DATA_INITPOSITION pos) override;

   [[nodiscard]] WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID> AICreateNonATCAircraft(
     std::string_view             title,
     std::string_view             tail_number,
     SIMCONNECT_DATA_INITPOSITION pos
   ) override;

   [[nodiscard]] WPromise<api::Liveries> EnumerateSimObjectsAndLiveries(
     SIMCONNECT_SIMOBJECT_TYPE objectType
   ) override;

   void SetTrafficTitles();

   [[nodiscard]] WPromise<api::Liveries> GetTrafficTitles() const override;
   [[nodiscard]] WPromise<float>         WatchSimRate(std::optional<float> current) const override;

   bool SetDataOnSimObjectImpl(
     DataId               id,
     SIMCONNECT_OBJECT_ID objectId,
     DWORD                flags,
     DWORD                unitSize,
     size_t               count,
     void*                data
   ) override;

   template <class T>
   static T StaticCast(DWORD const& data);

   template <class T>
   static std::size_t Size();

   void Dispatch(SIMCONNECT_RECV const& data);

   SIMCONNECT_DATA_REQUEST_ID request_id_{0};

   using WaitingSimObject = std::map<
     SIMCONNECT_DATA_REQUEST_ID,
     std::function<
       void(SIMCONNECT_RECV_SIMOBJECT_DATA const&, std::chrono::steady_clock::time_point const&)>>;
   WaitingSimObject pending_simobject_{};

   using WaitingSimObjectType = std::map<
     SIMCONNECT_DATA_REQUEST_ID,
     std::function<void(SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE const&)>>;
   WaitingSimObjectType pending_simobject_type_{};

   using WaitingEnumeratedSimObjects = std::map<
     SIMCONNECT_DATA_REQUEST_ID,
     std::function<void(SIMCONNECT_RECV_ENUMERATE_SIMOBJECT_AND_LIVERY_LIST const&)>>;
   WaitingEnumeratedSimObjects pending_enumerated_simobjects_{};

   using WaitingAssignedObject = std::map<
     SIMCONNECT_DATA_REQUEST_ID,
     std::function<void(SIMCONNECT_RECV_ASSIGNED_OBJECT_ID const&)>>;
   WaitingAssignedObject pending_assigned_{};

   using SimRateResolver = std::pair<std::shared_ptr<Resolve<float>>, std::shared_ptr<Reject>>;
   mutable std::vector<SimRateResolver> pending_sim_rate_{};
   float                                last_sim_rate_{1.0f};

   std::unordered_map<DWORD, std::string> packet_debug_{};

   using time_point = std::chrono::steady_clock::time_point;

   using TrafficTitles = std::shared_ptr<WPromise<api::Liveries>>;
   TrafficTitles traffic_titles_{
     std::make_shared<WPromise<api::Liveries>>(Promise<api::Liveries>::Reject<Disconnected>())
   };
   Main&        main_;
   win32::Event event_{win32::CreateEvent()};
   int64_t      server_port_{48578};
   int64_t      sent_port_{-1};
   bool         connected_{false};

   std::weak_ptr<HANDLE> handle_{};

   std::jthread thread_{};

   friend class utils::queue::Proxy<SimConnect, api::SimConnect>;
};
}  // namespace priv

}  // namespace smc

using SimConnect = utils::queue::Proxy<smc::priv::SimConnect, smc::api::SimConnect>;