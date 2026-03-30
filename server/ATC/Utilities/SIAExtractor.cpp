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

#include "main.h"
#include "utils/Scoped.h"

#include <Registry/Registry.h>
#include <json/json.h>
#include <openssl/sha.h>
#include <poppler-document.h>
#include <poppler-page.h>
#include <poppler-rectangle.h>

#include <algorithm>
#include <exception>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <regex>
#include <string>
#include <vector>

namespace sia {

Extractor::Extractor(Main& main)
   : main_(main) {}

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

WPromise<std::vector<Frequency>>
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

WPromise<Extractor::Frequencies>
Extractor::LoadFrequencies() const {
   return MakePromise(
            [this] -> Promise<Frequencies, false> {
               auto const url = co_await url_;

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

               // If AiRAC cycle has changed or file doesn't exist, fetch frequencies from SIA
               // website
               Frequencies frequencies{};

               auto const icaos = co_await RetrieveIcaos();

               for (auto const& icao : icaos) {
                  // auto const frequency = co_await RetrieveFrequencies(icao);

                  // frequencies.emplace(icao, std::move(frequency));

                  co_await RetrieveHoldingPoint(icao).Catch([icao](std::exception const& exc) {
                     std::cerr << "Failed to retrieve frequencies for " << icao << ": "
                               << exc.what() << std::endl;
                  });
               }

               SaveFrequencies(frequencies, eaip_cycle);
               co_return frequencies;
            }
   ).Catch([](std::exception const& exc) {
      std::cerr << "Failed to load frequencies: " << exc.what() << std::endl;
      return Frequencies{};
   });
}

WPromise<std::string>
Extractor::RetrieveUrl() const {
   return MakePromise([this]() -> Promise<std::string, false> {
      auto const data = co_await main_.PostHttpRequest(
        "www.sia.aviation-civile.gouv.fr", "443", "/customer/section/load/?sections=custom_menu"
      );

      auto const index = data.find("eAIP_");
      if (index == std::string::npos) {
         throw std::runtime_error("Failed to find AIRAC cycle in SIA homepage");
      }

      auto const url_start =
        data.rfind("https://www.sia.aviation-civile.gouv.fr/media/dvd/", index);
      if (url_start != std::string::npos || data.size() - index < 16) {
         throw std::runtime_error("Unexpected AIRAC url format in SIA homepage");
      }

      auto const airac = data.substr(index, 16);
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
         : mon == "DEC" ? "12"
                        : "");

      if (mon_num.empty()) {
         throw std::runtime_error("Unexpected month format in AIRAC cycle: " + mon);
      }

      co_return std::format(
        "/media/dvd/{}/FRANCE/AIRAC-{}/html/eAIP/", airac, year + "-" + mon_num + "-" + day
      );
   });
}

WPromise<std::vector<std::string>>
Extractor::RetrieveIcaos() const {
   return MakePromise([this]() -> Promise<std::vector<std::string>, false> {
      auto const data = co_await main_.PostHttpRequest(
        "www.sia.aviation-civile.gouv.fr", "443", (co_await url_) + "FR-menu-fr-FR.html"
      );

      auto const icao_start = data.find("AD-2.18");
      if (icao_start == std::string::npos) {
         throw std::runtime_error("Failed to find ICAO codes in SIA menu page");
      }

      std::vector<std::string> icaos{};

      for (size_t pos = icao_start; pos != std::string::npos;
           pos = data.find("/a", pos), pos = data.find("AD-2.18", pos + 1)) {

         auto const icao = data.substr(pos - 5, 4);
         if (std::ranges::all_of(icao, ::isupper)) {
            // Found a valid ICAO code
            icaos.emplace_back(icao);
            continue;
         } else {
            throw std::runtime_error("Unexpected ICAO code format in SIA menu page");
         }
      }

      co_return icaos;
   });
}

WPromise<std::vector<Frequency>>
Extractor::RetrieveFrequencies(std::string const& icao) const {
   return MakePromise([this, icao]() -> Promise<std::vector<Frequency>, false> {
      auto const data = co_await main_.PostHttpRequest(
        "www.sia.aviation-civile.gouv.fr",
        "443",
        std::format("{}FR-AD-2.{}-fr-FR.html#AD-2.eAIP.{}", co_await url_, icao, icao)
      );

      std::vector<Frequency> frequencies{};

      auto index = data.find("AD-2.18");
      if (index == std::string::npos) {
         throw std::runtime_error("Failed to find frequencies table for ICAO " + icao);
      }

      index = data.find("tbody", index);
      if (index == std::string::npos) {
         throw std::runtime_error("Failed to find frequencies table body for ICAO " + icao);
      }

      auto const tbody_end = data.find("/tbody", index);
      if (tbody_end == std::string::npos) {
         throw std::runtime_error("Failed to find frequencies table body end for ICAO " + icao);
      }
      std::string_view tbody{data.data() + index + 5, tbody_end - index - 6};
      index = 0;

      // Arbitrary limit to prevent infinite loop in case of unexpected format
      for (std::size_t limit = 0; limit < 100; ++limit) {
         index = tbody.find("tr", index);
         if (index == std::string::npos) {
            break;
         }
         index += 2;

         auto const trend = tbody.find("/tr", index);
         ScopeExit  _{[&] { index = trend + 2; }};

         Frequency frequency{};

         for (std::size_t i = 0; i < 5; ++i) {
            auto const beg = tbody.find("td", index);
            auto const end = tbody.find("/td", index);
            ScopeExit  _{[&] { index = end + 4; }};

            if (beg == std::string::npos || end == std::string::npos || end < beg) {
               throw std::runtime_error(
                 "Failed to find frequency table cell for ICAO " + icao + " at index "
                 + std::to_string(i)
               );
            }

            std::string_view td_span{tbody.data() + beg + 2, end - beg - 3};

            index = td_span.find("gaixm");
            for (std::size_t j = 0; index != std::string::npos;
                 index         = td_span.find("gaixm", index + 5), ++j) {
               auto       freq_beg = td_span.find(">", index);
               auto const freq_end = td_span.find("</", freq_beg);
               if (freq_beg == std::string::npos || freq_end == std::string::npos
                   || freq_end < freq_beg) {

                  if (i < 3) {
                     throw std::runtime_error(
                       "Failed to find frequency value for ICAO " + icao + " at index "
                       + std::to_string(i)
                     );
                  } else {
                     // Some cells may not have a frequency value, it's not an error
                     continue;
                  }
               }

               auto const elem = td_span.substr(freq_beg + 1, freq_end - freq_beg - 1);

               auto const parsed = std::regex_replace(
                 std::regex_replace(std::string{elem}, std::regex(R"( *<br [^>]+/>\n? *)"), " "),
                 std::regex(R"( +)"),
                 " "
               );

               if (i == 1) {
                  if (j > 1) {
                     throw std::runtime_error(
                       "Unexpected multiple elements in frequency name cell for ICAO " + icao
                     );
                  }

                  if (j == 0) {
                     frequency.name_.local_ = std::regex_replace(
                                                parsed, std::regex(R"(\n *)"), ""
                     )  // Remove newlines and spaces
                                                .substr(0, parsed.size() - 5);  // Remove " (FR)"
                  } else if (j == 1) {
                     frequency.name_.english_ = std::regex_replace(
                                                  parsed, std::regex(R"(\n *)"), ""
                     )  // Remove newlines and spaces
                                                  .substr(0, parsed.size() - 5);  // Remove " (EN)"
                  }
               } else if (i == 2) {
                  if (j > 1) {
                     throw std::runtime_error(
                       "Unexpected multiple elements in frequency cell for ICAO " + icao
                     );
                  } else if (j == 0) {
                     frequency.value_ = std::stod(std::string{parsed});
                  }
               } else {
                  if (j != 0) {
                     if (i == 4) {
                        break;  // Comment cell may have multiple elements, Use only the first
                                // one and ignore the rest
                     }
                     throw std::runtime_error(
                       "Unexpected multiple elements in frequency cell for ICAO " + icao
                     );
                  }

                  if (i == 0) {
                     frequency.type_ = parsed;
                  } else if (i == 3) {
                     frequency.hor_ = parsed;
                  } else if (i == 4) {
                     frequency.comment_ = parsed;
                  }
               }
            }
         }

         frequencies.emplace_back(std::move(frequency));
      }

      co_return frequencies;
   });
}

struct OverPassResponse {
   double      version_;
   std::string generator_;

   struct Osm3s {
      std::string timestamp_osm_base_;
      std::string copyright_;

      static constexpr js::Proto PROTOTYPE{
        js::_{"timestamp_osm_base", &Osm3s::timestamp_osm_base_},
        js::_{"copyright", &Osm3s::copyright_},
      };
   } osm3s_;

   struct Element {
      std::string type_;
      int64_t     id_;
      struct Center {
         double lat_;
         double lon_;

         static constexpr js::Proto PROTOTYPE{
           js::_{"lat", &Center::lat_},
           js::_{"lon", &Center::lon_},
         };
      } center_;
      std::vector<int64_t>               nodes_;
      std::map<std::string, std::string> tags_;

      static constexpr js::Proto PROTOTYPE{
        js::_{"type", &Element::type_},
        js::_{"id", &Element::id_},
        js::_{"center", &Element::center_},
        js::_{"nodes", &Element::nodes_},
        js::_{"tags", &Element::tags_},
      };
   };

   std::vector<Element> elements_;

   static constexpr js::Proto PROTOTYPE{
     js::_{"version", &OverPassResponse::version_},
     js::_{"generator", &OverPassResponse::generator_},
     js::_{"osm3s", &OverPassResponse::osm3s_},
     js::_{"elements", &OverPassResponse::elements_},
   };
};

WPromise<void>
Extractor::RetrieveHoldingPoint(std::string const& icao) const {
   return MakePromise([this, icao]() -> Promise<void, false> {
      auto const response = co_await main_.PostHttpRequest(
        "overpass.kumi.systems",
        "443",
        "/api/interpreter",
        [&](http::request<http::string_body>& req) {
           req.set(http::field::accept, "application/json");
           req.set(http::field::content_type, "application/x-www-form-urlencoded");

           std::string query =
             R"(data=[out:json][timeout:60];(node["aeroway"="aerodrome"]["icao"=")" + icao
             + R"("]; way["aeroway"="aerodrome"]["icao"=")" + icao
             + R"("]; relation["aeroway"="aerodrome"]["icao"=")" + icao + R"("];); out center;)";

           std::cout << "Retrieving holding point data for ICAO " << icao
                     << " with query: " << query << std::endl;
           req.body() = query;
           req.prepare_payload();
        }
      );
      auto const lat_lon = js::Parse<OverPassResponse>(response);

      if (lat_lon.elements_.empty()) {
         throw std::runtime_error("No holding point found for ICAO " + icao);
      }

      auto const holding = co_await main_.PostHttpRequest(
        "overpass.kumi.systems",
        "443",
        "/api/interpreter",
        [&](http::request<http::string_body>& req) {
           req.set(http::field::accept, "application/json");
           req.set(http::field::content_type, "application/x-www-form-urlencoded");

           double lat = lat_lon.elements_[0].center_.lat_;
           double lon = lat_lon.elements_[0].center_.lon_;

           double d = 0.01;  // ~1 km

           double min_lat = lat - d;
           double max_lat = lat + d;
           double min_lon = lon - d;
           double max_lon = lon + d;

           std::string query =
             std::string{R"(data=[out:json][timeout:60];node["aeroway"="holding_position"]()"}
             + std::to_string(min_lat) + "," + std::to_string(min_lon) + ","
             + std::to_string(max_lat) + "," + std::to_string(max_lon) + R"();out;)";

           req.body() = query;
           req.prepare_payload();
        }
      );

      std::cout << "Received holding point data for ICAO " << icao << ": " << holding << std::endl;
   });
}

}  // namespace sia