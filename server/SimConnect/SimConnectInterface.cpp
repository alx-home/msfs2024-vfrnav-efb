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

#include "Data/GroundInfo.h"
#include "Data/ServerPort.h"
#include "Data/TrafficInfo.h"

#include <chrono>
#include <cstdint>
#include <functional>
#include <iostream>
#include <memory>
#include <SimConnect.h>
#include <string_view>
#include <synchapi.h>
#include <thread>
#include <utils/MessageQueue.h>
#include <utils/Scoped.h>
#include <winbase.h>
#include <Windows.h>
#include <winspool.h>
#include <winuser.h>

namespace smc {

WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>
SimConnect::AICreateSimulatedObject(std::string_view title, SIMCONNECT_DATA_INITPOSITION pos) {
   return Proxy<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>(
     [this,
      title = std::string{title},
      pos] constexpr -> WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID> {
        auto handle = handle_.lock();

        if (!handle) {
           throw AppStopping();
        }

        return AICreateSimulatedObject(title, pos, handle);
     }
   );
}

[[nodiscard]] WPromise<void>
SimConnect::TransmitClientEvent(
  SIMCONNECT_OBJECT_ID objectId,
  smc::EventId         eventId,
  DWORD                eventData
) {
   return Proxy<void>([this,
                       object_id  = std::move(objectId),
                       event_id   = std::move(eventId),
                       event_data = std::move(eventData)] constexpr {
      return MakePromise(
        [this,
         object_id  = std::move(object_id),
         event_id   = std::move(event_id),
         event_data = std::move(event_data)]() mutable -> Promise<void> {
           co_await Connected();

           assert(std::this_thread::get_id() == MessageQueue::ThreadId());

           auto handle = handle_.lock();

           if (!handle) {
              throw Disconnected();
           }

           if (SimConnect_TransmitClientEvent(
                 *handle,
                 object_id,
                 static_cast<SIMCONNECT_CLIENT_EVENT_ID>(event_id),
                 event_data,
                 SIMCONNECT_GROUP_PRIORITY_HIGHEST,
                 SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY
               )
               != S_OK) {
              throw UnknownError("Failed to transmit client event");
           }
        }
      );
   });
}

[[nodiscard]] WPromise<void>
SimConnect::AIReleaseControl(SIMCONNECT_OBJECT_ID objectId) {
   return Proxy<void>([this, object_id = std::move(objectId)] constexpr {
      return MakePromise([this, object_id = std::move(object_id)]() mutable -> Promise<void> {
         co_await Connected();

         assert(std::this_thread::get_id() == MessageQueue::ThreadId());

         auto handle = handle_.lock();

         if (!handle) {
            throw Disconnected();
         }

         auto const request_id = ++request_id_;
         if (SimConnect_AIReleaseControl(*handle, object_id, request_id) != S_OK) {
            throw UnknownError("Failed to release AI control");
         }
      });
   });
}

WPromise<bool>
SimConnect::SetServerPort(uint32_t port) {
   return Proxy<bool>([this, port] constexpr {
      return MakePromise(
        [this,
         port](Resolve<bool> const& resolve, Reject const& reject) mutable -> Promise<bool, true> {
           while (true) {
              co_await Connected();

              try {
                 assert(std::this_thread::get_id() == MessageQueue::ThreadId());

                 server_port_ = port;
                 if (sent_port_ == server_port_) {
                    resolve(true);
                    co_return;
                 }

                 auto handle = handle_.lock();

                 if (!handle) {
                    std::cout
                      << "SimConnect: Not connected to simulator, server port will be set on "
                         "next connection"
                      << std::endl;
                    resolve(true);
                    co_return;
                 }

                 auto server_port = static_cast<double>(server_port_);

                 std::cout << "SimConnect: Setting server port to " << server_port_ << std::endl;
                 if (S_OK
                     != SimConnect_SetDataOnSimObject(
                       *handle,
                       static_cast<uint32_t>(DataId::SET_PORT),
                       SIMCONNECT_OBJECT_ID_USER,
                       0,
                       0,
                       sizeof(server_port),
                       &server_port
                     )) {
                    throw UnknownError(
                      "SimConnect: Failed to set server port to " + std::to_string(server_port_)
                    );
                 } else {
                    auto const& data =
                      co_await RequestDataOnSimObject<DataId::SET_PORT, ServerPort>(
                        SIMCONNECT_OBJECT_ID_USER, handle
                      );
                    assert(std::this_thread::get_id() == MessageQueue::ThreadId());

                    auto const port = data.dw_data_.value_;
                    sent_port_      = port;

                    if (port == server_port_) {
                       std::cout << "SimConnect: Server port " << port
                                 << " set successfully in simulator" << std::endl;
                       resolve(true);
                       co_return;
                    } else {
                       reject.Apply<UnknownError>(
                         "Failed to set server port in simulator, got " + std::to_string(port)
                         + " expected " + std::to_string(server_port_)
                       );
                       co_return;
                    }
                 }

                 assert(false);
                 co_return;
              } catch (std::exception const& e) {
                 std::cerr << "SimConnect: Failed to set server port: "
                           // << e.what() #TODO: https://github.com/llvm/llvm-project/issues/182584
                           << std::endl;
              }

              // Retry setting the port after some delay, in case the failure is due to a
              // temporary issue with the connection to the simulator
              co_await Wait(5s);
              assert(std::this_thread::get_id() == MessageQueue::ThreadId());
           }

           throw Disconnected();
        }
      );
   });
}

WPromise<double>
SimConnect::GetGroundInfo(double lat, double lon) {
   using enum DataId;

   return Proxy<double>([this, lat, lon] constexpr {
      return MakePromise([this, lat, lon]() -> Promise<double> {
         assert(std::this_thread::get_id() == MessageQueue::ThreadId());

         auto handle = handle_.lock();
         if (!handle) {
            throw Disconnected();
         }

         // Create a temporary AI object on the ground at the specified location, then request
         // its ground altitude. This is a workaround to get the ground altitude at a specific
         // location,
         auto const& ai_object = co_await AICreateSimulatedObject(
           "TerrainProbe",
           {
             .Latitude  = lat,
             .Longitude = lon,
             .Altitude  = 1,
             // The next fields doesn't matter, as the object will be teleported to
             // ground immediately after creation
             .Pitch = 0,

             .Bank    = 0,
             .Heading = 0,
             // Force the object to be on the ground so that we can get the
             // ground altitude immediately
             .OnGround = 1,
             .Airspeed = INITPOSITION_AIRSPEED_KEEP,
           },
           handle
         );
         assert(std::this_thread::get_id() == MessageQueue::ThreadId());

         ScopeExit _{[this, &handle, &ai_object]() constexpr {
            (void)this;
            assert(std::this_thread::get_id() == MessageQueue::ThreadId());
            // Remove the probe object
            SimConnect_AIRemoveObject(*handle, ai_object.dwObjectID, ai_object.dwRequestID);
         }};

         // Request ground altitude once the probe exists
         auto const& ground_object =
           co_await RequestDataOnSimObject<GROUND_INFO, GroundInfo>(ai_object.dwObjectID, handle);
         assert(std::this_thread::get_id() == MessageQueue::ThreadId());

         auto const& ground_info = ground_object.dw_data_;
         co_return ground_info.altitude_;
      });
   });
}

WPromise<TrafficInfo>
SimConnect::GetUserAircraftInfo() noexcept(true) {
   using enum DataId;

   return Proxy<TrafficInfo>([this] constexpr {
      return MakePromise([this]() -> Promise<TrafficInfo> {
         assert(std::this_thread::get_id() == MessageQueue::ThreadId());

         auto handle = handle_.lock();
         if (!handle) {
            throw Disconnected();
         }

         co_return std::move((co_await RequestDataOnSimObject<TRAFFIC_INFO, TrafficInfo>(
                                SIMCONNECT_OBJECT_ID_USER, handle
                              ))
                               .dw_data_);
      });
   });
}

WPromise<TrafficInfo>
SimConnect::GetAircraftInfo(ObjectId id) noexcept(true) {
   using enum DataId;

   return Proxy<TrafficInfo>([this, id = std::move(id)] constexpr {
      return MakePromise([this, id = std::move(id)]() -> Promise<TrafficInfo> {
         assert(std::this_thread::get_id() == MessageQueue::ThreadId());

         auto handle = handle_.lock();
         if (!handle) {
            throw Disconnected();
         }

         co_return std::move(
           (co_await RequestDataOnSimObject<TRAFFIC_INFO, TrafficInfo>(id.dwObjectID, handle))
             .dw_data_
         );
      });
   });
}

WPromise<facility::AirportData>
SimConnect::GetAirportFacility(std::string_view icao, std::string_view region) noexcept(true) {
   using enum DataId;

   return Proxy<facility::AirportData>(
     [this, icao = std::string{icao}, region = std::string{region}] constexpr {
        assert(std::this_thread::get_id() == MessageQueue::ThreadId());

        auto handle = handle_.lock();
        if (!handle) {
           throw Disconnected();
        }

        return RequestFacilityData<GET_AIRPORT_FACILITY, facility::AirportData>(
          std::move(icao), std::move(region)
        );
     }
   );
}

WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>
SimConnect::AICreateNonATCAircraft(
  std::string_view             title,
  std::string_view             livery,
  std::string_view             tail_number,
  SIMCONNECT_DATA_INITPOSITION pos
) {
   return Proxy<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID>(
     [this,
      title       = std::string{title},
      livery      = std::string{livery},
      tail_number = std::string{tail_number},
      pos] constexpr -> WPromise<SIMCONNECT_RECV_ASSIGNED_OBJECT_ID> {
        assert(std::this_thread::get_id() == MessageQueue::ThreadId());

        auto handle = handle_.lock();
        if (!handle) {
           throw Disconnected();
        }

        return AICreateNonATCAircraft(title, livery, tail_number, pos, handle);
     }
   );
}

WPromise<Liveries>
SimConnect::EnumerateSimObjectsAndLiveries(SIMCONNECT_SIMOBJECT_TYPE objectType) {
   return Proxy<Liveries>([this, objectType] constexpr {
      assert(std::this_thread::get_id() == MessageQueue::ThreadId());
      auto const request_id = ++request_id_;

      return MakePromise(
               [this, objectType, request_id](
                 Resolve<Liveries> const& resolve, Reject const& reject
               ) -> Promise<Liveries, true> {
                  assert(std::this_thread::get_id() == MessageQueue::ThreadId());

                  auto const handle = handle_.lock();
                  if (!handle) {
                     throw Disconnected();
                  }

                  auto const remaining =
                    std::make_shared<std::size_t>(std::numeric_limits<std::size_t>::max());

                  auto handler = MakePromise(
                    [this, reject = reject.shared_from_this(), remaining]() -> Promise<void> {
                       assert(std::this_thread::get_id() == MessageQueue::ThreadId());

                       std::size_t last_remaining = *remaining;
                       while (last_remaining && *reject) {
                          co_await Wait(5s);
                          assert(std::this_thread::get_id() == MessageQueue::ThreadId());

                          if (*remaining == last_remaining) {
                             reject->Apply<Timeout>("Timed out while requesting data on sim object"
                             );
                             break;
                          }

                          last_remaining = *remaining;
                       }
                       co_return;
                    }
                  );

                  pending_enumerated_simobjects_.try_emplace(
                    request_id,
                    [result  = Liveries{},
                     resolve = resolve.shared_from_this(),
                     reject  = reject.shared_from_this(),
                     handler = std::move(handler),
                     remaining](SIMCONNECT_RECV_ENUMERATE_SIMOBJECT_AND_LIVERY_LIST const& data
                    ) constexpr mutable {
                       if (*remaining == std::numeric_limits<std::size_t>::max()) {
                          *remaining = data.dwOutOf;
                       }
                       if (*remaining == 0) {
                          reject->Apply<UnknownError>(
                            "Received sim object enumeration with zero total count"
                          );
                          return;
                       }

                       --*remaining;

                       for (std::size_t i = 0; i < data.dwArraySize; ++i) {
                          auto const& livery = data.rgData[i];
                          result.emplace_back(
                            std::string{livery.AircraftTitle}, std::string{livery.LiveryName}
                          );
                       }

                       if (data.dwEntryNumber == (data.dwOutOf - 1)) {
                          assert(*remaining == 0);
                          (*resolve)(std::move(result));
                       }
                    },
                    reject.shared_from_this()
                  );
                  if (SimConnect_EnumerateSimObjectsAndLiveries(*handle, request_id, objectType)
                      != S_OK) {
                     throw UnknownError("Failed to enumerate sim objects and liveries");
                  }

                  co_return;
               }
      ).Finally([this, request_id]() {
         assert(std::this_thread::get_id() == MessageQueue::ThreadId());
         pending_enumerated_simobjects_.erase(request_id);
      });
   });
}

WPromise<bool>
SimConnect::SetDataOnSimObjectImpl(
  DataId                   id,
  SIMCONNECT_OBJECT_ID     objectId,
  DWORD                    flags,
  DWORD                    unitSize,
  size_t                   count,
  std::vector<std::byte>&& data
) {
   assert(data.size() == (unitSize * count));
   return Proxy<bool>(
     [this, id, objectId, flags, unitSize, count, data = std::move(data)] mutable constexpr {
        assert(std::this_thread::get_id() == MessageQueue::ThreadId());

        auto handle = handle_.lock();
        if (!handle) {
           throw Disconnected();
        }

        std::array<SIMCONNECT_DATA_WAYPOINT, 1> empty_wp{};
        void*                                   pdata = data.data();

        if (count == 0) {
           pdata = empty_wp.data();
        }

        auto const result = SimConnect_SetDataOnSimObject(
          *handle,
          static_cast<uint32_t>(id),
          objectId,
          flags,
          static_cast<DWORD>(count),
          static_cast<DWORD>(unitSize),
          pdata
        );
        assert(std::this_thread::get_id() == MessageQueue::ThreadId());

        return Promise<bool>::Resolve(result == S_OK);
     }
   );
}

}  // namespace smc