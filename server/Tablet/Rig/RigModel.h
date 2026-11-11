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

#pragma once

#include <boost/json.hpp>
#include <vector>

namespace tablet {

/** Builds procedural geometry independently of authored behavior templates. */
class RigModel {
public:
   /** Generated glTF document and its little-endian binary buffer. */
   struct Data {
      boost::json::object model_{};
      std::vector<char>   bytes_{};
   };

   /** @brief Build the ordered transform hierarchy, animations, and editing controls.
    *
    * @return Generated model and binary buffer. */
   static Data Build();
};

}  // namespace tablet
