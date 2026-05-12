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

#include "SimConnect.h"

#include "SimConnect.inl"

#include "main.h"

#include "Data/Flaps.h"
#include "Data/SimRate.h"
#include "Data/GearDown.h"
#include "Data/GroundInfo.h"
#include "Data/ServerPort.h"
#include "Data/TrafficInfo.h"
#include "Data/Break.h"
#include "Data/ManualControl.h"
#include "FacilityData/AirportFacility.h"

#include <chrono>
#include <condition_variable>
#include <cstdint>
#include <functional>
#include <iostream>
#include <memory>
#include <mutex>
#include <SimConnect.h>
#include <stdexcept>
#include <string>
#include <string_view>
#include <synchapi.h>
#include <thread>
#include <utils/MessageQueue.h>
#include <utils/Scoped.h>
#include <winbase.h>
#include <Windows.h>
#include <winspool.h>
#include <winuser.h>

using namespace std::chrono_literals;
using namespace std::chrono;

namespace smc {

namespace {

std::string
MakeSimConnectExceptionMessage(
  SIMCONNECT_RECV_EXCEPTION const&          exception,
  std::optional<SIMCONNECT_DATA_REQUEST_ID> request_id = std::nullopt
) {
   auto const request = request_id ? std::to_string(*request_id) : std::string{"unknown"};
   return "SimConnect exception (" + std::to_string(exception.dwException) + ") for request ID "
          + request + " via send packet " + std::to_string(exception.dwSendID) + " at index "
          + std::to_string(exception.dwIndex);
}

template <class PENDING>
bool
RejectPendingOnException(
  PENDING&                         pending,
  SIMCONNECT_DATA_REQUEST_ID       request_id,
  SIMCONNECT_RECV_EXCEPTION const& exception
) {
   auto request = pending.find(request_id);
   if (request == pending.end()) {
      return false;
   }

   auto const reject = request->second.second;
   reject->template Apply<UnknownError>(MakeSimConnectExceptionMessage(exception, request_id));
   return true;
}

}  // namespace

SimConnect::SimConnect(Main& main)
   : MessageQueue{"SimConnect"}
   , main_(main)
   , thread_{[this](std::stop_token stoken) {
      if (!event_) {
         throw std::runtime_error("Couldn't create event");
      }

      ScopeExit _{[this]() {
         std::cout << "SimConnect: Main loop ended" << std::endl;
         auto const _ = MessageQueue::Dispatch([this]() { connection_promise_.Done(); });
      }};

      while (!stoken.stop_requested()) {
         HANDLE handle;
         if (SUCCEEDED(SimConnect_Open(&handle, "MSFS VFRNav'", nullptr, 0, event_, 0))) {
            std::shared_ptr<HANDLE> handle_ptr{
              new HANDLE(handle),
              [this](HANDLE* ptr) {
                 std::cout << "SimConnect: Disconnected from simulator" << std::endl;
                 SimConnect_Close(*ptr);
                 delete ptr;

                 sent_port_ = -1;
              },
            };
            handle_ = handle_ptr;
            std::cout << "SimConnect: Connected to simulator" << std::endl;
            Run(stoken);
         }

         // Wait 1 second before retrying
         std::mutex       mutex{};
         std::unique_lock lock{mutex};
         std::condition_variable_any{}.wait_for(lock, stoken, 1s, []() { return false; });
      }
   }} {}

SimConnect::~SimConnect() {
   assert(thread_.joinable());
   thread_.request_stop();

   auto const _ = MessageQueue::Dispatch([this]() {
      connection_promise_.Done();

      if (event_) {
         SetEvent(event_);
      }
   });
}

bool
SimConnect::TrackRequestSendId(
  std::shared_ptr<void*> const& handle,
  SIMCONNECT_DATA_REQUEST_ID    request_id
) {
   assert(std::this_thread::get_id() == MessageQueue::ThreadId());

   DWORD send_id = 0;
   if (SimConnect_GetLastSentPacketID(*handle, &send_id) != S_OK) {
      return false;
   }

   if (
     auto const existing = request_id_to_send_id_.find(request_id);
     existing != request_id_to_send_id_.end()
   ) {
      assert(false);
      send_id_to_request_id_.erase(existing->second);
   }

   request_id_to_send_id_[request_id] = send_id;
   send_id_to_request_id_[send_id]    = request_id;
   return true;
}

std::optional<DWORD>
SimConnect::TrackPendingSendId(
  std::shared_ptr<void*> const& handle,
  std::shared_ptr<Reject const> reject
) {
   assert(std::this_thread::get_id() == MessageQueue::ThreadId());

   DWORD send_id = 0;
   if (SimConnect_GetLastSentPacketID(*handle, &send_id) != S_OK) {
      return std::nullopt;
   }

   send_id_to_reject_[send_id] = std::move(reject);
   return send_id;
}

void
SimConnect::ClearTrackedSendId(SIMCONNECT_DATA_REQUEST_ID request_id) {
   assert(std::this_thread::get_id() == MessageQueue::ThreadId());

   auto send_id = request_id_to_send_id_.find(request_id);
   if (send_id == request_id_to_send_id_.end()) {
      return;
   }

   send_id_to_request_id_.erase(send_id->second);
   request_id_to_send_id_.erase(send_id);
}

std::optional<SIMCONNECT_DATA_REQUEST_ID>
SimConnect::FindRequestIdForSendId(DWORD send_id) const {
   assert(std::this_thread::get_id() == MessageQueue::ThreadId());

   auto request_id = send_id_to_request_id_.find(send_id);
   if (request_id == send_id_to_request_id_.end()) {
      return std::nullopt;
   }

   return request_id->second;
}

std::shared_ptr<Reject const>
SimConnect::FindRejectForSendId(DWORD send_id) const {
   assert(std::this_thread::get_id() == MessageQueue::ThreadId());

   auto reject = send_id_to_reject_.find(send_id);
   if (reject == send_id_to_reject_.end()) {
      return {};
   }

   return reject->second;
}

WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>
SimConnect::AICreateSimulatedObject(
  std::string_view             title,
  SIMCONNECT_DATA_INITPOSITION pos,
  std::shared_ptr<void*>       handle
) {
   assert(std::this_thread::get_id() == MessageQueue::ThreadId());

   auto const request_id = ++request_id_;

   return MakePromise(
            [this, handle, title = std::string{title}, pos, request_id](
              Resolve<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID> const& resolve, Reject const& reject
            ) mutable -> Promise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID, true> {
               assert(std::this_thread::get_id() == MessageQueue::ThreadId());

               if (!handle) {
                  handle = handle_.lock();
                  if (!handle) {
                     reject.Apply<Disconnected>();
                     co_return;
                  }
               }

               pending_assigned_.try_emplace(
                 request_id,
                 std::function<void(SIMCONNECT_RECV_ASSIGNED_OBJECT_ID const&)>(
                   [this, resolve = resolve.shared_from_this()](
                     SIMCONNECT_RECV_ASSIGNED_OBJECT_ID const& assigned
                   ) {
                      (void)this;
                      assert(std::this_thread::get_id() == MessageQueue::ThreadId());
                      (*resolve)(assigned);
                   }
                 ),
                 reject.shared_from_this()
               );

               if (
                 SimConnect_AICreateSimulatedObject(*handle, title.data(), pos, request_id) != S_OK
               ) {
                  reject.Apply<UnknownError>("App is stopping");
                  co_return;
               }

               if (!TrackRequestSendId(handle, request_id)) {
                  reject.Apply<UnknownError>("Failed to track simulated object request");
                  co_return;
               }
            }
   ).Finally([this, request_id] {
      assert(std::this_thread::get_id() == MessageQueue::ThreadId());
      ClearTrackedSendId(request_id);
      pending_assigned_.erase(request_id);
   });
}

WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>
SimConnect::AICreateNonATCAircraft(
  std::string_view             title,
  std::string_view             livery,
  std::string_view             tail_number,
  SIMCONNECT_DATA_INITPOSITION pos,
  std::shared_ptr<void*>       handle
) {
   assert(std::this_thread::get_id() == MessageQueue::ThreadId());

   auto const request_id = ++request_id_;
   return MakePromise(
            [this,
             handle,
             title       = std::string{title},
             livery      = std::string{livery},
             tail_number = std::string{tail_number},
             pos,
             request_id](
              Resolve<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID> const& resolve, Reject const& reject
            ) mutable -> Promise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID, true> {
               assert(std::this_thread::get_id() == MessageQueue::ThreadId());

               if (!handle) {
                  handle = handle_.lock();
                  if (!handle) {
                     reject.Apply<Disconnected>();
                     co_return;
                  }
               }

               pending_assigned_.try_emplace(
                 request_id,
                 [this, resolve = resolve.shared_from_this()](
                   SIMCONNECT_RECV_ASSIGNED_OBJECT_ID const& assigned
                 ) {
                    (void)this;
                    assert(std::this_thread::get_id() == MessageQueue::ThreadId());
                    (*resolve)(assigned);
                 },
                 reject.shared_from_this()
               );

               if (
                 SimConnect_AICreateNonATCAircraft_EX1(
                   *handle, title.data(), livery.data(), tail_number.data(), pos, request_id
                 )
                 != S_OK
               ) {
                  reject.Apply<UnknownError>("Failed to create non-ATC aircraft");
                  co_return;
               }

               if (!TrackRequestSendId(handle, request_id)) {
                  reject.Apply<UnknownError>("Failed to track non-ATC aircraft request");
                  co_return;
               }
            }
   ).Finally([this, request_id] {
      assert(std::this_thread::get_id() == MessageQueue::ThreadId());
      ClearTrackedSendId(request_id);
      pending_assigned_.erase(request_id);
   });
}

void
SimConnect::Run(std::stop_token const& stoken) {
   using enum DataId;

   {
      auto const _ = MessageQueue::Dispatch([this]() { connection_promise_.Reset(); });
   }

   ScopeExit cleanup_pending{[this] {
      std::condition_variable  cv{};
      std::mutex               mutex{};
      std::atomic<std::size_t> pending_count = 0;

      auto const _ = MessageQueue::Dispatch([this]() { connection_promise_.Done(); });

      auto const clearPending =
        [this, &cv, &mutex, &pending_count](std::function<void()>&& invoke) {
           try {
              ++pending_count;
              MessageQueue::Dispatch([&cv, &mutex, &pending_count, invoke] {
                 ScopeExit _{[&cv, &pending_count, &mutex] {
                    std::unique_lock lock{mutex};
                    --pending_count;
                    cv.notify_all();
                 }};
                 invoke();
              }).Detach();
           } catch (QueueStopped const&) {
              --pending_count;
              assert(false && "Failed to dispatch clear on SimConnect message queue");
              invoke();
           }
        };

      auto const makeCleaner = [this]<class M>(M SimConnect::* elem) {
         return [this, elem] {
            auto pending = std::move(this->*elem);
            assert((this->*elem).empty());
            for (auto& pending_entry : pending) {
               pending_entry.second.second->template Apply<Disconnected>();
            }
         };
      };
      std::apply(
        [&clearPending, &makeCleaner](auto&&... pending_member) {
           (clearPending(makeCleaner(pending_member)), ...);
        },
        PENDING_MEMBERS
      );

      // Wait until all pending requests have been cleared.
      std::unique_lock lock{mutex};
      cv.wait(lock, [&pending_count]() { return pending_count == 0; });
   }};

   auto handle = handle_.lock();

   if (!AddToDataDefinition<SET_PORT, ServerPort>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for server port" << std::endl;
      Sleep(5000);
      return;
   }

   // Define traffic info data structure
   if (!AddToDataDefinition<TRAFFIC_INFO, TrafficInfo>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for traffic info" << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<HELI_TRAFFIC_INFO, TrafficInfo>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for helicopter traffic info"
                << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<GROUND_INFO, GroundInfo>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for ground info" << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<SET_WAYPOINTS>(
         handle, "AI WAYPOINT LIST", SIMCONNECT_DATATYPE_WAYPOINT, "number"
       )) {
      std::cerr << "SimConnect: Failed to add data definition for waypoints" << std::endl;
      Sleep(5000);
      return;
   }

   if (!AddToDataDefinition<SET_GEAR, GearDown>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for gear" << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<SET_BREAK, Break>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for break" << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<SET_FLAPS, Flaps>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for flaps" << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<SET_CONTROL_SURFACES, ControlSurfaces>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for control surfaces" << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<SET_ALTITUDE_CONTROL, AltitudeControl>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for altitude control" << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<SET_GROUND_ALTITUDE_CONTROL, GroundAltitudeControl>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for ground altitude control"
                << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<SET_GROUND_ALTITUDE, GroundAltitude>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for ground altitude control"
                << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<SET_HEADING_CONTROL, HeadingControl>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for heading control" << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<SET_PITCH_CONTROL, PitchControl>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for pitch control" << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<SET_ON_GROUND, SetOnGround>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for on ground" << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<SET_BANK_CONTROL, BankControl>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for bank control" << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<SET_AIRSPEED_CONTROL, AirspeedControl>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for airspeed control" << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<SET_VSPEED_CONTROL, VSpeedControl>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for vertical speed control"
                << std::endl;
      Sleep(5000);
      return;
   }
   if (!AddToDataDefinition<GET_SIMRATE, SimRate>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for sim rate" << std::endl;
      Sleep(5000);
      return;
   }

   if (!AddToFacilityDefinition<GET_AIRPORT_FACILITY, facility::Airport>(handle)) {
      std::cerr << "SimConnect: Failed to add data definition for airport info" << std::endl;
      Sleep(5000);
      return;
   }

   if (
     SimConnect_MapClientEventToSimEvent(
       *handle, static_cast<uint32_t>(EventId::AP_MASTER), "AP_MASTER"
     )
     != S_OK
   ) {
      std::cerr << "SimConnect: Failed to map AP_MASTER event" << std::endl;
      Sleep(5000);
      return;
   }
   if (
     SimConnect_MapClientEventToSimEvent(
       *handle, static_cast<uint32_t>(EventId::AP_ALT_HOLD), "AP_ALT_HOLD"
     )
     != S_OK
   ) {
      std::cerr << "SimConnect: Failed to map AP_ALT_HOLD event" << std::endl;
      Sleep(5000);
      return;
   }
   if (
     SimConnect_MapClientEventToSimEvent(
       *handle, static_cast<uint32_t>(EventId::AP_ATT_HOLD), "AP_ATT_HOLD"
     )
     != S_OK
   ) {
      std::cerr << "SimConnect: Failed to map AP_ATT_HOLD event" << std::endl;
      Sleep(5000);
      return;
   }
   if (
     SimConnect_MapClientEventToSimEvent(
       *handle, static_cast<uint32_t>(EventId::FREEZE_LATLON_SET), "FREEZE_LATITUDE_LONGITUDE_SET"
     )
     != S_OK
   ) {
      std::cerr << "SimConnect: Failed to map FREEZE_LATITUDE_LONGITUDE_SET event" << std::endl;
      Sleep(5000);
      return;
   }
   if (
     SimConnect_MapClientEventToSimEvent(
       *handle, static_cast<uint32_t>(EventId::FREEZE_ALTITUDE_SET), "FREEZE_ALTITUDE_SET"
     )
     != S_OK
   ) {
      std::cerr << "SimConnect: Failed to map FREEZE_ALTITUDE_SET event" << std::endl;
      Sleep(5000);
      return;
   }
   if (
     SimConnect_MapClientEventToSimEvent(
       *handle, static_cast<uint32_t>(EventId::FREEZE_ATTITUDE_SET), "FREEZE_ATTITUDE_SET"
     )
     != S_OK
   ) {
      std::cerr << "SimConnect: Failed to map FREEZE_ATTITUDE_SET event" << std::endl;
      Sleep(5000);
      return;
   }
   if (
     SimConnect_MapClientEventToSimEvent(
       *handle, static_cast<uint32_t>(EventId::FREEZE_SLEW), "SLEW_FREEZE"
     )
     != S_OK
   ) {
      std::cerr << "SimConnect: Failed to map FREEZE_SLEW event" << std::endl;
      Sleep(5000);
      return;
   }
   if (
     SimConnect_MapClientEventToSimEvent(
       *handle, static_cast<uint32_t>(EventId::AXIS_SLEW_BANK_SET), "AXIS_SLEW_BANK_SET"
     )
     != S_OK
   ) {
      std::cerr << "SimConnect: Failed to map AXIS_SLEW_BANK_SET event" << std::endl;
      Sleep(5000);
      return;
   }

   if (
     SimConnect_MapClientEventToSimEvent(
       *handle, static_cast<uint32_t>(EventId::AXIS_ELEVATOR_SET), "AXIS_ELEVATOR_SET"
     )
     != S_OK
   ) {
      std::cerr << "SimConnect: Failed to map AXIS_ELEVATOR_SET event" << std::endl;
      Sleep(5000);
      return;
   }
   if (
     SimConnect_MapClientEventToSimEvent(
       *handle, static_cast<uint32_t>(EventId::AXIS_AILERONS_SET), "AXIS_AILERONS_SET"
     )
     != S_OK
   ) {
      std::cerr << "SimConnect: Failed to map AXIS_AILERONS_SET event" << std::endl;
      Sleep(5000);
      return;
   }
   if (
     SimConnect_MapClientEventToSimEvent(
       *handle, static_cast<uint32_t>(EventId::AXIS_RUDDER_SET), "AXIS_RUDDER_SET"
     )
     != S_OK
   ) {
      std::cerr << "SimConnect: Failed to map AXIS_RUDDER_SET event" << std::endl;
      Sleep(5000);
      return;
   }
   if (
     SimConnect_MapClientEventToSimEvent(
       *handle, static_cast<uint32_t>(EventId::THROTTLE_SET), "THROTTLE_SET"
     )
     != S_OK
   ) {
      std::cerr << "SimConnect: Failed to map THROTTLE_SET event" << std::endl;
      Sleep(5000);
      return;
   }

   // Request data for all aircraft in range (radius 0 = unlimited)
   // RequestDataOnSimObjectType<TRAFFIC_INFO>(SIMCONNECT_SIMOBJECT_TYPE_AIRCRAFT, 0, handle);
   // RequestDataOnSimObjectType<HELI_TRAFFIC_INFO>(SIMCONNECT_SIMOBJECT_TYPE_HELICOPTER, 0,
   // handle);

   auto const server_port_to_set = static_cast<uint32_t>(std::clamp<int64_t>(
     server_port_, 0, static_cast<int64_t>(std::numeric_limits<uint32_t>::max())
   ));
   SetServerPort(server_port_to_set).Detach();

   ScopeExit connection_done{[this] { connection_promise_.Done(); }};

   uint32_t result;
   while ((result = ::WaitForSingleObject(event_, INFINITE)),
          (result == WAIT_OBJECT_0) && !ShouldStop(stoken)) {
      MessageQueue::Dispatch([this, handle]() {
         SimConnect_CallDispatch(
           *handle,
           [](SIMCONNECT_RECV* data, DWORD, void* self) {
              reinterpret_cast<SimConnect*>(self)->Dispatch(*data);
           },
           this
         );
      }).Detach();
   }
   std::cout << "SimConnect: Stopping SimConnect thread, result " << result << std::endl;
}

WPromise<void>
SimConnect::Wait(std::chrono::milliseconds timeout) const {
   return promise::Race(
     MessageQueue::Dispatch(timeout), connection_promise_.WaitDone(), main_.WaitTerminate()
   );
}

WPromise<void>
SimConnect::Connected() const {
   return promise::Race(connection_promise_.Wait(), main_.WaitTerminate());
}

bool
SimConnect::ShouldStop(std::stop_token const& stoken) const noexcept {
   return stoken.stop_requested() || !handle_.lock();
}

void
SimConnect::Dispatch(SIMCONNECT_RECV const& data) {
   assert(std::this_thread::get_id() == MessageQueue::ThreadId());

   using enum DataId;

   auto const handle = handle_.lock();
   if (!handle) {
      return;
   }

   switch (data.dwID) {
      case SIMCONNECT_RECV_ID_OPEN: {
         std::cout << "SimConnect: Connection opened" << std::endl;

         // Leave some time for the simulator to initialize after opening the connection before
         // setting the port and requesting data, otherwise we might get errors from
         // the simulator
         MessageQueue::Dispatch(
           [this] {
              assert(std::this_thread::get_id() == MessageQueue::ThreadId());
              connection_promise_.Ready();
           },
           1s
         )
           .Detach();
      } break;

      case SIMCONNECT_RECV_ID_EXCEPTION: {
         auto const& exception = static_cast<SIMCONNECT_RECV_EXCEPTION const&>(data);

         if (auto const request_id = FindRequestIdForSendId(exception.dwSendID)) {
            if (
              std::apply(
                [this, request_id, exception](auto&... pending) {
                   return (RejectPendingOnException(this->*pending, *request_id, exception) || ...);
                },
                PENDING_MEMBERS
              )
            ) {
               break;
            }
         } else if (auto reject = FindRejectForSendId(exception.dwSendID)) {
            reject->template Apply<UnknownError>(MakeSimConnectExceptionMessage(exception));
            break;
         }

         std::cerr << "SimConnect: Exception (" << exception.dwException
                   << ") send_id=" << exception.dwSendID << " index=" << exception.dwIndex
                   << " id=" << exception.dwID << std::endl;
      } break;

      case SIMCONNECT_RECV_ID_ASSIGNED_OBJECT_ID: {
         // This is the only traffic-related message guaranteed in all SimConnect SDKs
         auto const& assigned = static_cast<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID const&>(data);
         auto        request  = pending_assigned_.find(assigned.dwRequestID);

         if (request != pending_assigned_.end()) {
            request->second.first(assigned);
         } else {
            std::cerr << "SimConnect: Received ASSIGNED_OBJECT_ID for unknown request ID "
                      << assigned.dwRequestID << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_ENUMERATE_SIMOBJECT_AND_LIVERY_LIST: {
         auto const& enumerated =
           static_cast<SIMCONNECT_RECV_ENUMERATE_SIMOBJECT_AND_LIVERY_LIST const&>(data);
         auto request = pending_enumerated_simobjects_.find(enumerated.dwRequestID);

         if (request != pending_enumerated_simobjects_.end()) {
            request->second.first(enumerated);
         } else {
            std::cerr << "SimConnect: Received ENUMERATE_SIMOBJECT_AND_LIVERY_LIST for unknown "
                         "request ID "
                      << enumerated.dwRequestID << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_AIRPORT_LIST: {
         auto const& facility = static_cast<SIMCONNECT_RECV_AIRPORT_LIST const&>(data);
         auto        request  = pending_facilities_list_.find(facility.dwRequestID);

         if (request != pending_facilities_list_.end()) {
            request->second.first(facility);
         } else {
            std::cerr << "SimConnect: Received AIRPORT_LIST for unknown request ID "
                      << facility.dwRequestID << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_VOR_LIST: {
         auto const& facility = static_cast<SIMCONNECT_RECV_VOR_LIST const&>(data);
         auto        request  = pending_facilities_list_.find(facility.dwRequestID);

         if (request != pending_facilities_list_.end()) {
            request->second.first(facility);
         } else {
            std::cerr << "SimConnect: Received VOR_LIST for unknown request ID "
                      << facility.dwRequestID << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_NDB_LIST: {
         auto const& facility = static_cast<SIMCONNECT_RECV_NDB_LIST const&>(data);
         auto        request  = pending_facilities_list_.find(facility.dwRequestID);

         if (request != pending_facilities_list_.end()) {
            request->second.first(facility);
         } else {
            std::cerr << "SimConnect: Received NDB_LIST for unknown request ID "
                      << facility.dwRequestID << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_WAYPOINT_LIST: {
         auto const& facility = static_cast<SIMCONNECT_RECV_WAYPOINT_LIST const&>(data);
         auto        request  = pending_facilities_list_.find(facility.dwRequestID);

         if (request != pending_facilities_list_.end()) {
            request->second.first(facility);
         } else {
            std::cerr << "SimConnect: Received WAYPOINT_LIST for unknown request ID "
                      << facility.dwRequestID << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_SIMOBJECT_DATA: {
         auto const now = std::chrono::steady_clock::now();

         auto const& simobj  = static_cast<SIMCONNECT_RECV_SIMOBJECT_DATA const&>(data);
         auto        request = pending_simobject_.find(simobj.dwRequestID);
         if (request != pending_simobject_.end()) {
            request->second.first(simobj, now);
         } else {
            std::cerr << "SimConnect: Received SIMOBJECT_DATA for unknown request ID "
                      << simobj.dwRequestID << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_FACILITY_DATA: {
         auto const& facility = static_cast<SIMCONNECT_RECV_FACILITY_DATA const&>(data);
         auto        request  = pending_facility_.find(facility.UserRequestId);
         if (request != pending_facility_.end()) {
            request->second.first(facility);
         } else {
            std::cerr << "SimConnect: Received FACILITY_DATA for unknown request ID "
                      << facility.UserRequestId << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_FACILITY_DATA_END: {
         auto const& facility = static_cast<SIMCONNECT_RECV_FACILITY_DATA_END const&>(data);
         auto        request  = pending_facility_.find(facility.RequestId);
         if (request != pending_facility_.end()) {
            request->second.first(facility);
         } else {
            std::cerr << "SimConnect: Received FACILITY_DATA_END for unknown request ID "
                      << facility.RequestId << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_SIMOBJECT_DATA_BYTYPE: {
         auto const& simobj  = static_cast<SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE const&>(data);
         auto        request = pending_simobject_type_.find(simobj.dwRequestID);
         if (request != pending_simobject_type_.end()) {
            request->second.first(simobj);
         } else {
            std::cerr << "SimConnect: Received SIMOBJECT_DATA_BYTYPE for unknown request ID "
                      << simobj.dwRequestID << std::endl;
         }
      } break;

      case SIMCONNECT_RECV_ID_QUIT: {
         std::cout << "SimConnect: Simulator quit" << std::endl;
         handle_.reset();
         SetEvent(event_);
      } break;
   }
}

}  // namespace smc