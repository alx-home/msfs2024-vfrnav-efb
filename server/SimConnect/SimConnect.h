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

#include <promise/promise.h>
#include <utils/MessageQueue.h>
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
#include <chrono>
#include <cstdint>
#include <exception>
#include <map>
#include <memory>
#include <stdexcept>
#include <thread>

namespace sim_connect {

struct Disconnected : std::runtime_error {
   Disconnected()
      : std::runtime_error("MSFS not connected!") {}
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

}  // namespace sim_connect

using ServerPortParam = sim_connect::Parameter<sim_connect::Message::SIMCONNECT_SET_SERVER_PORT>;

enum class DataId : uint32_t {
   SET_PORT,

   MAX_VALUE
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
   DATA_TYPE dw_data_;      // data begins here, dw_define_count_ data items
};

class SimConnectPublic {
protected:
   SimConnectPublic()          = default;
   virtual ~SimConnectPublic() = default;

public:
   [[nodiscard]] virtual WPromise<bool> SetServerPort(uint32_t port) = 0;
};

class SimConnect
   : public SimConnectPublic
   , private MessageQueue {
private:
   SimConnect();

public:
   ~SimConnect() override;

private:
   [[nodiscard]] WPromise<bool> SetServerPort(uint32_t port) override;

   bool ShouldStop(std::stop_token const& stoken) const noexcept;
   void Run(std::stop_token const& stoken);

   template <DataId ID>
   void AddToDataDefinition(
     std::string_view                datumName,
     SIMCONNECT_DATATYPE             datumType,
     std::optional<std::string_view> unitsName = std::nullopt
   );
   template <DataId ID>
   void AddToDataDefinition(
     std::shared_ptr<void*> const&   handle,
     std::string_view                datumName,
     SIMCONNECT_DATATYPE             datumType,
     std::optional<std::string_view> unitsName = std::nullopt
   );
   template <DataId ID, class T>
   void AddToDataDefinition(std::shared_ptr<void*> const& handle);
   template <DataId ID, class T>
   void AddToDataDefinition();

   template <DataId ID>
   void AddToFacilityDefinition(std::string_view datumName);
   template <DataId ID>
   void AddToFacilityDefinition(std::shared_ptr<void*> const& handle, std::string_view datumName);
   template <DataId ID, class T>
   void AddToFacilityDefinition(std::shared_ptr<void*> const& handle);
   template <DataId ID, class T>
   void AddToFacilityDefinition();

   template <DataId ID>
   bool RequestDataOnSimObjectType(
     SIMCONNECT_SIMOBJECT_TYPE objectType,
     uint32_t                  radius = 0,
     std::shared_ptr<void*>    handle = nullptr
   );

   template <DataId ID, class DATA_TYPE>
   WPromise<SimobjectData<DATA_TYPE>> RequestDataOnSimObject(
     SIMCONNECT_PERIOD      period,
     uint32_t               objectId,
     std::shared_ptr<void*> handle
   );

   WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID> AICreateSimulatedObject(
     std::string_view             title,
     SIMCONNECT_DATA_INITPOSITION pos,
     std::shared_ptr<void*>       handle
   );

   template <class T>
   static T StaticCast(DWORD const& data);

   void Dispatch(SIMCONNECT_RECV const& data);

   SIMCONNECT_DATA_REQUEST_ID request_id_{0};

   using WaitingSimObject = std::
     map<SIMCONNECT_DATA_REQUEST_ID, std::function<void(SIMCONNECT_RECV_SIMOBJECT_DATA const&)>>;
   WaitingSimObject pending_simobject_{};

   using WaitingAssignedObject = std::map<
     SIMCONNECT_DATA_REQUEST_ID,
     std::function<void(SIMCONNECT_RECV_ASSIGNED_OBJECT_ID const&)>>;
   WaitingAssignedObject pending_assigned_{};

   using time_point = std::chrono::steady_clock::time_point;

   win32::Event event_{win32::CreateEvent()};
   int64_t      server_port_{48578};
   int64_t      sent_port_{-1};

   std::weak_ptr<HANDLE> handle_{};

   std::jthread thread_{};

   friend class SimConnectProxy;
};

class SimConnectProxy {
public:
   SimConnectProxy()  = default;
   ~SimConnectProxy() = default;

   bool operator()(std::function<void(SimConnectPublic&)>&& callback) {
      return details_.MessageQueue::Dispatch(
        [this, callback = std::move(callback)] constexpr mutable { callback(details_); }
      );
   }

   template <class T>
      requires(!std::is_void_v<T>)
   WPromise<T> operator()(std::function<T(SimConnectPublic&)>&& callback) {
      return MakePromise(
        [this, callback = std::move(callback)](
          Resolve<T> const& resolve, Reject const& reject
        ) mutable -> Promise<T, true> {
           if (details_.MessageQueue::Dispatch(
                 [this, callback = std::move(callback), &resolve, &reject] constexpr mutable {
                    try {
                       resolve(callback(details_));
                    } catch (...) {
                       reject(std::current_exception());
                    }
                 }
               )) {

           } else {
              MakeReject<std::runtime_error>(reject, "SimConnect thread is not running");
           }
        }
      );
   }

private:
   SimConnect details_{};
};