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

namespace smc::facility {

template <class SELF>
std::shared_ptr<Processor>
ProcessorImpl<SELF>::GetProcessor(this SELF& self) {
   return std::make_shared<Processor>(
     [&self](SIMCONNECT_RECV_FACILITY_DATA const& data) constexpr -> ProcessorReturn {
        if constexpr (requires { SELF::MEMBERS; }) {
           auto const error = self.ProcessMembers(data);
           if (error.size()) {
              return std::make_tuple(nullptr, "Failed to process facility data: " + error);
           }
        }

        if constexpr (requires { SELF::SECTIONS; }) {
           auto processor = self.GetSectionsProcessor();
           assert(processor);

           return std::make_tuple(processor, "");
        }

        return std::make_tuple(nullptr, "");
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
template <class...>
   requires(requires { SELF::SECTIONS; })
std::shared_ptr<Processor>
ProcessorImpl<SELF>::GetSectionsProcessor(this SELF& self) {
   auto process_ptr = std::make_shared<Processor>();
   *process_ptr     = self.template MakeSectionProcessor<0>(process_ptr);

   return process_ptr;
}

template <class SELF>
template <std::size_t INDEX>
   requires(requires { SELF::SECTIONS; })
Processor
ProcessorImpl<SELF>::MakeSectionProcessor(
  this SELF&                        self,
  std::shared_ptr<Processor> const& process_ptr
) {
   return Processor(
     [&self, process_ptr = process_ptr, section_processor = std::shared_ptr<Processor>{}](
       SIMCONNECT_RECV_FACILITY_DATA const& data
     ) constexpr mutable -> ProcessorReturn {
        using SECTIONS_TYPE = std::remove_cvref_t<decltype(SELF::SECTIONS)>;
        static_assert(INDEX < std::tuple_size_v<SECTIONS_TYPE>);

        bool      end = true;
        ScopeExit _{[&end, &process_ptr]() constexpr {
           if (end) {
              process_ptr.reset();
           }
        }};

        std::shared_ptr<Processor> next_processor = process_ptr;

        auto const& [section_name, section_member] = std::get<INDEX>(SELF::SECTIONS);
        using SECTION_TYPE = std::remove_cvref_t<decltype(self.*section_member)>;
        if constexpr (requires(SECTION_TYPE& t, typename SECTION_TYPE::value_type v) {
                         t.emplace_back(v);
                         t.back();
                      }) {
           if (!section_processor) {
              if (!data.IsListItem) {
                 return std::make_tuple(
                   nullptr, "Received data for section " + std::string{section_name}
                 );
              }

              (self.*section_member).emplace_back();
              assert(data.ItemIndex + 1 == (self.*section_member).size());

              section_processor = (self.*section_member).back().GetProcessor();
           }
           assert(section_processor);

           std::string error{};
           std::tie(section_processor, error) = (*section_processor)(data);

           if (error.size()) {
              return std::make_tuple(nullptr, "Failed to process facility data section " + error);
           } else if (!section_processor) {
              // End of element, check if we have more sections to receive

              if (data.ItemIndex + 1 >= data.ListSize) {
                 // End of section, move to next one

                 if constexpr (INDEX + 1 >= std::tuple_size_v<SECTIONS_TYPE>) {
                    // No more sections, we are done
                    static_assert(INDEX + 1 == std::tuple_size_v<SECTIONS_TYPE>);
                    return std::make_tuple(nullptr, "");
                 } else {
                    // Move to next section
                    next_processor  = std::make_shared<Processor>();
                    *next_processor = self.template GetSectionProcessor<INDEX + 1>(next_processor);
                 }
              }
           }
        } else {
           if (data.IsListItem) {
              return std::make_tuple(
                nullptr,
                "Received unexpected list item for non-list section " + std::string{section_name}
              );
           }

           if (!section_processor) {
              section_processor = (self.*section_member).GetProcessor();
           }
           assert(section_processor);

           std::string error{};
           std::tie(section_processor, error) = (*section_processor)(data);

           if (error.size()) {
              return std::make_tuple(nullptr, "Failed to process facility data section " + error);
           } else if (!section_processor) {
              // End of section, move to next one

              if constexpr (INDEX + 1 >= std::tuple_size_v<SECTIONS_TYPE>) {
                 // No more sections, we are done
                 static_assert(INDEX + 1 == std::tuple_size_v<SECTIONS_TYPE>);
                 return std::make_tuple(nullptr, "");
              } else {
                 // Move to next section
                 next_processor  = std::make_shared<Processor>();
                 *next_processor = self.template MakeSectionProcessor<INDEX + 1>(next_processor);
              }
           }
        }

        end = false;
        return std::make_tuple(next_processor, "");
     }
   );
}

}  // namespace smc::facility