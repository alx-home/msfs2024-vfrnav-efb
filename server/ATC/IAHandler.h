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

#include "SIAExtractor.h"

#include "Frequencies.h"

#include <utils/MessageQueue.h>
#include <utils/Poll.h>
#include <json/json.h>
#include <promise/promise.h>

class Main;

namespace ia {

class Handler : private MessageQueue {
public:
   Handler(Main& main);
   ~Handler() override = default;

   WPromise<std::vector<Frequency>> GetFrequency(std::string const& icao);

private:
   // std::size_t pending_requests_{0};

   Main& main_;
   // sia::Extractor sia_extractor_{main_};
};

}  // namespace ia