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

#include "FacilityDataType.h"
#include "utils/Scoped.h"
#include <cassert>
#include <memory>
#include <tuple>
#include <type_traits>

namespace smc::facility {

template <class>
inline constexpr bool ALWAYS_FALSE = false;

template <class SELF>
std::shared_ptr<Processor>
ProcessorImpl<SELF>::GetProcessor(
  this SELF&                        self,
  std::shared_ptr<Processor> const& parent_processor
) {
   return std::make_shared<Processor>(
     [&self,
      parent_processor](SIMCONNECT_RECV_FACILITY_DATA const& data) constexpr -> ProcessorReturn {
        if constexpr (requires { SELF::MEMBERS; }) {
           auto const error = self.ProcessMembers(data);
           if (error.size()) {
              return std::make_tuple(nullptr, "Failed to process facility data: " + error);
           }
        }

        if constexpr (requires { SELF::SECTIONS; }) {
           auto processor = self.template MakeSectionProcessor<0>(parent_processor);
           assert(processor);

           return std::make_tuple(processor, "");
        } else {
           return std::make_tuple(parent_processor, "");
        }
     }
   );
}

template <class SELF>
template <class...>
   requires(requires { SELF::MEMBERS; })
std::string
ProcessorImpl<SELF>::ProcessMembers(this SELF& self, SIMCONNECT_RECV_FACILITY_DATA const& data) {
   std::string error{};

   std::size_t remaining_size =
     data.dwSize + sizeof(data.Data) - sizeof(SIMCONNECT_RECV_FACILITY_DATA);
   auto it = reinterpret_cast<std::byte const*>(&data.Data);
   std::apply(
     [&self, &error, &it, &remaining_size](auto const&... members) constexpr {
        return (
          [&self, &error, &it, &remaining_size](auto const& member) constexpr {
             auto& member_ref = self.*std::get<1>(member);
             if constexpr (
               std::is_arithmetic_v<std::remove_cvref_t<decltype(member_ref)>>
               || std::is_enum_v<std::remove_cvref_t<decltype(member_ref)>>
             ) {
                if (remaining_size < sizeof(member_ref)) {
                   error = "Received data size " + std::to_string(remaining_size)
                           + " is smaller than expected size for facility data member "
                           + std::string{std::get<0>(member)};
                   return false;
                }

                std::copy(it, it + sizeof(member_ref), reinterpret_cast<std::byte*>(&member_ref));
                it += sizeof(member_ref);
                remaining_size -= sizeof(member_ref);

                return true;
             } else if constexpr (requires {
                                     typename std::remove_cvref_t<decltype(member_ref)>::value_type;
                                     std::is_arithmetic_v<typename std::remove_cvref_t<
                                       decltype(member_ref)>::value_type>
                                       || std::is_enum_v<std::remove_cvref_t<decltype(member_ref)>>;
                                     member_ref.size();
                                  }) {
                using value_type = typename std::remove_cvref_t<decltype(member_ref)>::value_type;

                if (remaining_size < member_ref.size() * sizeof(value_type)) {
                   error = "Received data size " + std::to_string(remaining_size)
                           + " is smaller than expected size for facility data member "
                           + std::string{std::get<0>(member)};
                   return false;
                }

                std::copy(
                  it,
                  it + member_ref.size() * sizeof(value_type),
                  reinterpret_cast<std::byte*>(member_ref.data())
                );
                it += member_ref.size() * sizeof(value_type);
                remaining_size -= member_ref.size() * sizeof(value_type);

                return true;
             } else {
                static_assert(
                  ALWAYS_FALSE<decltype(member_ref)>, "Unsupported type for facility data member"
                );
             }
          }(members)
          && ...
        );
     },
     SELF::MEMBERS
   );

   assert(error.size() || (remaining_size == 0));
   return error;
}

template <class SELF>
template <std::size_t INDEX>
   requires(requires { SELF::SECTIONS; })
std::shared_ptr<Processor>
ProcessorImpl<SELF>::MakeSectionProcessor(
  this SELF&                        self,
  std::shared_ptr<Processor> const& parent_processor
) {
   auto const process_ptr = std::make_shared<Processor>();
   *process_ptr           = Processor{
     [&self, parent_processor, self_processor = std::weak_ptr(process_ptr)](
       SIMCONNECT_RECV_FACILITY_DATA const& data
     ) constexpr mutable -> ProcessorReturn {
        using SECTIONS_TYPE = std::remove_cvref_t<decltype(SELF::SECTIONS)>;
        static_assert(INDEX < std::tuple_size_v<SECTIONS_TYPE>);

        auto const self_ptr = self_processor.lock();
        assert(self_ptr && "Section processor should never outlive the facility data processor");

        auto const next_processor = [&self, &parent_processor] constexpr {
           if constexpr (INDEX + 1 >= std::tuple_size_v<SECTIONS_TYPE>) {
              (void)self;

              // No more sections, we are done
              static_assert(INDEX + 1 == std::tuple_size_v<SECTIONS_TYPE>);
              return parent_processor;
           } else {
              // Move to next section
              return self.template MakeSectionProcessor<INDEX + 1>(parent_processor);
           }
        };

        auto const& [section_name, section_member] = std::get<INDEX>(SELF::SECTIONS);
        using SECTION_TYPE = std::remove_cvref_t<decltype(self.*section_member)>;
        if constexpr (requires(SECTION_TYPE& t, typename SECTION_TYPE::value_type v) {
                         t.emplace_back(v);
                         t.back();
                      }) {
           if (!data.IsListItem) {
              return std::make_tuple(
                nullptr, "Received non-list data for list section " + std::string{section_name}
              );
           }
           assert(data.ItemIndex < data.ListSize);

           auto& member = self.*section_member;
           member.emplace_back();
           assert(data.ItemIndex + 1 == member.size());

           auto processor = member.back().GetProcessor(
             (data.ItemIndex + 1 == data.ListSize) ? next_processor() : self_ptr
           );
           assert(processor);

           std::string error{};
           std::tie(processor, error) = (*processor)(data);

           if (error.size()) {
              return std::make_tuple(nullptr, "Failed to process facility data section " + error);
           } else {
              return std::make_tuple(processor, "");
           }
        } else {
           if (data.IsListItem) {
              return std::make_tuple(
                nullptr,
                "Received unexpected list item for non-list section " + std::string{section_name}
              );
           }

           auto processor = (self.*section_member).GetProcessor(next_processor());
           assert(processor);

           std::string error{};
           std::tie(processor, error) = (*processor)(data);

           if (error.size()) {
              return std::make_tuple(nullptr, "Failed to process facility data section " + error);
           } else {
              assert(processor);
              return std::make_tuple(processor, "");
           }
        }
     }
   };

   return process_ptr;
}

}  // namespace smc::facility