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

#include "SIAExtractor.h"

#include <Registry/Registry.h>
#include <json/json.h>

#include <filesystem>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>

namespace sia {

Extractor::Extractor() {}

std::string
ExtractEAIP(std::string const& url) {
   const std::string key = "/dvd/";
   auto              pos = url.find(key);
   if (pos == std::string::npos) {
      return {};
   }

   pos += key.size();
   auto end = url.find('/', pos);
   if (end == std::string::npos) {
      return {};
   }

   return url.substr(pos, end - pos);
}

struct FrequenciesFile {
   std::string            airac_cycle_{};
   Extractor::Frequencies frequencies_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"airac_cycle", &FrequenciesFile::airac_cycle_},
     js::_{"frequencies", &FrequenciesFile::frequencies_},
   };
};

Promise<std::vector<Frequency>, false>
Extractor::GetFrequencies(std::string const& icao) const {
   return MakePromise([this, icao] -> Promise<std::vector<Frequency>, false> {
      auto const frequencies = co_await frequencies_;

      auto it = frequencies.find(icao);
      if (it != frequencies.end()) {
         co_return it->second;
      }

      throw std::runtime_error("No frequencies found for ICAO " + icao);
   });
}

void
Extractor::SaveFrequencies(Frequencies const& frequencies, std::string const& eaip_cycle) const {
   auto&      registry = registry::Get();
   auto const path     = *registry.alx_home_->settings_->destination_ + "/Data";

   std::filesystem::create_directories(path);

   std::string const filename = path + "/sia_frequencies.json";

   FrequenciesFile data{
     .airac_cycle_ = eaip_cycle,
     .frequencies_ = frequencies,
   };

   std::ofstream file(filename);
   if (file.is_open()) {
      file << js::Stringify(data);
      file.close();
   } else {
      std::cerr << "Warning: Could not open file " << filename << " for writing." << std::endl;
   }
}

Promise<Extractor::Frequencies, false>
Extractor::LoadFrequencies() const {
   return MakePromise([this] -> Promise<Frequencies, false> {
      try {
         auto const url = co_await RetrieveUrl();

         auto const eaip_cycle = ExtractEAIP(url);
         if (eaip_cycle.empty()) {
            throw std::runtime_error("Failed to extract eAIP cycle from URL: " + url);
         }

         // Load frequencies from disk
         auto&      registry = registry::Get();
         auto const path     = *registry.alx_home_->settings_->destination_ + "/Data";

         std::string const filename = path + "/sia_frequencies.json";

         if (std::filesystem::exists(filename)) {
            std::ifstream file(filename);

            if (file.is_open()) {
               std::string content{
                 (std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>()
               };
               file.close();
               auto const data = js::Parse<FrequenciesFile>(content);

               if (data.airac_cycle_ == eaip_cycle) {
                  co_return data.frequencies_;
               }

            } else {
               std::cerr << "Warning: Could not open file " << filename << " for reading."
                         << std::endl;
            }
         }

         // If AiRAC cycle has changed or file doesn't exist, fetch frequencies from SIA website
         Frequencies frequencies{};

         auto const icaos = co_await RetrieveIcaos(url + "FR-menu-fr-FR.html");

         for (auto const& icao : icaos) {
            try {
               auto const frequency = co_await RetrieveFrequencies(
                 std::format("{}FR-AD-2.{}-fr-FR.html#AD-2.eAIP.{}", url, icao, icao), icao
               );

               frequencies.emplace(icao, std::move(frequency));
            } catch (std::exception const& e) {
               std::cerr << "Failed to retrieve frequencies for " << icao << ": " << e.what()
                         << std::endl;
            }
         }

         SaveFrequencies(frequencies, eaip_cycle);
         co_return frequencies;
      } catch (const std::exception& e) {
         std::cerr << "Error loading frequencies: " << e.what() << std::endl;
         co_return Frequencies{};
      }
   });
}

Promise<std::string, true>
Extractor::RetrieveUrl() const {
   auto [promise, resolve, reject] = promise::Pure<std::string>();

   window_.Dispatch([this, resolve = std::move(resolve), reject = std::move(reject)]() {
      window_.Webview().Navigate("https://www.sia.aviation-civile.gouv.fr/#");
      window_.Webview().WaitNavigationCompleted([this,
                                                 resolve = std::move(resolve),
                                                 reject  = std::move(reject)]() constexpr {
         window_.Webview().Eval(
           R"(document.querySelector('#menusite').firstChild.childNodes[1].childNodes[1].firstChild.href.match('eAIP[^/]*')[0])",
           [resolve = std::move(resolve),
            reject  = std::move(reject)](std::optional<std::string> const& result) {
              if (result.has_value()) {

                 auto const airac = js::Parse<std::string>(*result);

                 if (airac.size() != 16 || airac.substr(0, 5) != "eAIP_") {
                    MakeReject<std::runtime_error>(
                      *reject, "Unexpected AIRAC string format: " + airac
                    );
                    return;
                 }

                 //   eAIP_22_JAN_2026 -> 2026-01-22
                 auto const  day  = airac.substr(5, 2);
                 auto const  mon  = airac.substr(8, 3);
                 auto const  year = airac.substr(12, 4);
                 std::string mon_num =
                   (mon == "JAN"   ? "01"
                    : mon == "FEB" ? "02"
                    : mon == "MAR" ? "03"
                    : mon == "APR" ? "04"
                    : mon == "MAY" ? "05"
                    : mon == "JUN" ? "06"
                    : mon == "JUL" ? "07"
                    : mon == "AUG" ? "08"
                    : mon == "SEP" ? "09"
                    : mon == "OCT" ? "10"
                    : mon == "NOV" ? "11"
                    : mon == "DEC"
                      ? "12"
                      : throw std::runtime_error("Invalid month in AIRAC string: " + mon));

                 (*resolve)(std::format(
                   "https://www.sia.aviation-civile.gouv.fr/media/dvd/{}/FRANCE/AIRAC-{}/"
                   "html/eAIP/",
                   airac,
                   year + "-" + mon_num + "-" + day
                 ));

              } else {
                 MakeReject<std::runtime_error>(
                   *reject, "Failed to retrieve Airac cycle URL from SIA website"
                 );
              }
           }
         );
      });
   });

   return promise;
}

Promise<std::vector<std::string>, true>
Extractor::RetrieveIcaos(std::string const& url) const {
   auto [promise, resolve, reject] = promise::Pure<std::vector<std::string>>();

   window_.Dispatch([this, url, resolve = std::move(resolve), reject = std::move(reject)]() {
      window_.Webview().Navigate(url);
      window_.Webview().WaitNavigationCompleted([this,
                                                 resolve = std::move(resolve),
                                                 reject  = std::move(reject)]() constexpr {
         window_.Webview().Eval(
           R"([...document.body.querySelectorAll("[id*='AD-2.18']").values()].map(e => e.id.split('-')[0]).toSorted())",
           [resolve = std::move(resolve),
            reject  = std::move(reject)](std::optional<std::string> const& result) {
              if (result.has_value()) {
                 (*resolve)(js::Parse<std::vector<std::string>>(*result));

              } else {
                 MakeReject<std::runtime_error>(
                   *reject, "Failed to retrieve ICAO codes from SIA website"
                 );
              }
           }
         );
      });
   });

   return promise;
}

Promise<std::vector<Frequency>, true>
Extractor::RetrieveFrequencies(std::string const& url, std::string const& icao) const {
   auto [promise, resolve, reject] = promise::Pure<std::vector<Frequency>>();

   window_.Dispatch([this, url, icao, resolve = std::move(resolve), reject = std::move(reject)]() {
      window_.Webview().Navigate(url);
      window_.Webview().WaitNavigationCompleted(
        [this, icao, url, resolve = std::move(resolve), reject = std::move(reject)]() constexpr {
           window_.Webview().Eval(
             R"([...document.querySelectorAll('#)" + icao
               + R"(-AD-2\\.18>table>tbody>tr').values()]
                           .filter(e => e.firstElementChild.firstElementChild.outerText !== "D-ATIS")
                           .map(e => [...e.children]
                           .reduce((res, e, i) => i === 1 
                              ? [...res, e.firstElementChild.outerText.substr(0, e.firstElementChild.outerText.length - 5), 
                                         e.lastElementChild.outerText.substr(0, e.lastElementChild.outerText.length - 5).replaceAll('\n', '')]
                              : [...res, i === 2 ? +e.firstElementChild.outerText : e.firstElementChild.outerText], []))
                           .map(e=>({type: e[0], name:{local:e[1], english:e[2]}, frequency:e[3], hor:e[4], comment:e[5]})))",
             [icao,
              resolve = std::move(resolve),
              reject  = std::move(reject)](std::optional<std::string> const& result) {
                if (result.has_value()) {
                   auto const parsed =
                     js::Parse<std::variant<std::vector<Frequency>, js::null>>(*result);
                   if (std::holds_alternative<js::null>(parsed)) {
                      MakeReject<std::runtime_error>(
                        *reject, "Failed to parse frequencies for " + icao + " from SIA website"
                      );
                   } else {
                      (*resolve)(std::move(std::get<std::vector<Frequency>>(parsed)));
                   }
                } else {
                   MakeReject<std::runtime_error>(
                     *reject, "Failed to retrieve Frequencies for " + icao + " from SIA website"
                   );
                }
             }
           );
        }
      );
   });

   return promise;
}

}  // namespace sia