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

#include "Frequencies.h"

#include <promise/promise.h>
#include <map>

class Main;

namespace sia {
class Extractor {
public:
   Extractor(Main& main);
   virtual ~Extractor() = default;

   using Frequencies = std::map<std::string, std::vector<Frequency>>;

   WPromise<std::vector<Frequency>> GetFrequencies(std::string const& icao) const;

private:
   Main& main_;

   WPromise<Frequencies> LoadFrequencies() const;
   void SaveFrequencies(Frequencies const& frequencies, std::string const& eaip_cycle) const;
   WPromise<std::string>              RetrieveUrl() const;
   WPromise<std::vector<std::string>> RetrieveIcaos() const;
   WPromise<std::vector<Frequency>>   RetrieveFrequencies(std::string const& icao) const;
   WPromise<void>                     RetrieveHoldingPoint(std::string const& icao) const;

   WPromise<std::string> url_{RetrieveUrl()};
   WPromise<Frequencies> frequencies_{LoadFrequencies()};
};
}  // namespace sia