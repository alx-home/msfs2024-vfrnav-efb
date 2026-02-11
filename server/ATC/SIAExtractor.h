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

#include "Window/template/Window.h"
#include "Frequencies.h"

#include <promise/promise.h>

namespace sia {
class Extractor {
public:
   Extractor();
   virtual ~Extractor() = default;

   using Frequencies = std::map<std::string, std::vector<Frequency>>;

   Promise<std::vector<Frequency>, false> GetFrequencies(std::string const& icao) const;

private:
   Promise<Frequencies, false> LoadFrequencies() const;
   void SaveFrequencies(Frequencies const& frequencies, std::string const& eaip_cycle) const;
   Promise<std::string, true>              RetrieveUrl() const;
   Promise<std::vector<std::string>, true> RetrieveIcaos(std::string const& url) const;
   Promise<std::vector<Frequency>, true>
   RetrieveFrequencies(std::string const& url, std::string const& icao) const;

   // Must be declared before frequencies_
   Window<WIN::PROCESSING> window_{};

   Promise<Frequencies, false> frequencies_{LoadFrequencies()};
};
}  // namespace sia