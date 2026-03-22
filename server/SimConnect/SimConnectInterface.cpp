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

#include "ServerPort.h"

#include <chrono>
#include <cstdint>
#include <functional>
#include <iostream>
#include <memory>
#include <SimConnect.h>
#include <stdexcept>
#include <string_view>
#include <synchapi.h>
#include <thread>
#include <utils/MessageQueue.h>
#include <utils/Scoped.h>
#include <winbase.h>
#include <Windows.h>
#include <winspool.h>
#include <winuser.h>

WPromise<bool>
SimConnect::SetServerPort(uint32_t port) {
   return MakePromise(
            [this, port](
              Resolve<bool> const& resolve, Reject const& reject
            ) mutable -> Promise<bool, true> {
               server_port_ = port;
               if (sent_port_ == server_port_) {
                  resolve(true);
                  co_return;
               }

               auto handle = handle_.lock();

               if (!handle) {
                  std::cout << "SimConnect: Not connected to simulator, server port will be set on "
                               "next connection"
                            << std::endl;
                  resolve(true);
                  co_return;
               }

               auto server_port = static_cast<double>(server_port_);

               MessageQueue::Dispatch(
                 [reject = reject.shared_from_this()]() constexpr {
                    MakeReject<std::runtime_error>(
                      *reject, "Timed out while creating simulated object"
                    );
                 },
                 5s
               );

               std::cout << "SimConnect: Setting server port to " << server_port_ << std::endl;
               if (E_FAIL
                   == SimConnect_SetDataOnSimObject(
                     *handle,
                     static_cast<uint32_t>(DataId::SET_PORT),
                     SIMCONNECT_OBJECT_ID_USER,
                     0,
                     0,
                     sizeof(server_port),
                     &server_port
                   )) {
                  MakeReject<std::runtime_error>(
                    reject,
                    "SimConnect: Failed to set server port to " + std::to_string(server_port_)
                  );
                  co_return;
               } else {
                  auto const& data = co_await RequestDataOnSimObject<DataId::SET_PORT, ServerPort>(
                    SIMCONNECT_PERIOD_ONCE, SIMCONNECT_OBJECT_ID_USER, handle
                  );

                  auto const port = data.dw_data_.value_;
                  sent_port_      = port;

                  if (port == server_port_) {
                     std::cout << "SimConnect: Server port " << port
                               << " set successfully in simulator" << std::endl;
                     resolve(true);
                     co_return;
                  } else {
                     MakeReject<std::runtime_error>(
                       reject,
                       "Failed to set server port in simulator, got " + std::to_string(port)
                         + " expected " + std::to_string(server_port_)
                     );
                     co_return;
                  }
               }
            }
   ).Catch([this](std::exception const& e) -> Promise<bool> {
      std::cerr << "SimConnect: Failed to set server port: " << e.what() << std::endl;

      // Retry setting the port after some delay, in case the failure is due to a temporary issue
      // with the connection to the simulator
      co_await dispatch_(5s);
      assert(std::this_thread::get_id() == MessageQueue::ThreadId());

      co_return co_await SetServerPort(server_port_);
   });
}
