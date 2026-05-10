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

#include <Windows.h>
#include <SimConnect.h>
#include <functional>
#include <memory>
#include <string>
#include <string_view>
#include <tuple>

namespace smc::facility {

template <class CLASS, class T>
using _m = std::tuple<std::string_view, T CLASS::*>;

template <class CLASS, class T>
constexpr auto
make_m(std::string_view name, T CLASS::* member) -> _m<CLASS, T> {
   return {name, member};
}

struct Processor;
using ProcessorReturn = std::tuple<std::shared_ptr<Processor>, std::string>;

struct Processor : std::function<ProcessorReturn(SIMCONNECT_RECV_FACILITY_DATA const&)> {};

template <class SELF>
struct ProcessorImpl {
protected:
   std::shared_ptr<Processor>
   GetProcessor(this SELF& self, std::shared_ptr<Processor> const& parent_processor = nullptr);

private:
   template <class...>
      requires(requires { SELF::MEMBERS; })
   std::string ProcessMembers(this SELF& self, SIMCONNECT_RECV_FACILITY_DATA const& data);

   template <std::size_t INDEX>
      requires(requires { SELF::SECTIONS; })
   std::shared_ptr<Processor>
   MakeSectionProcessor(this SELF& self, std::shared_ptr<Processor> const& parent_processor);
};

}  // namespace smc::facility