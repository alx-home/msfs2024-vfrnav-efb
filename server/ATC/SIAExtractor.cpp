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

#include <json/json.h>
#include <promise/promise.h>

#include <functional>
#include <iostream>
#include <string>
#include <vector>

namespace sia {
Extractor::Extractor() {
   MakePromise([this] -> Promise<void> {
      auto const url   = co_await RetrieveUrl();
      auto const icaos = co_await RetrieveIcaos(url);

      for (auto const& icao : icaos) {
         std::cout << "Retrieved ICAO code: " << icao << std::endl;
      }
   })
     .Catch([](std::exception const& e) {
        std::cerr << "SIAExtractor initialization failed: " << e.what() << std::endl;
     })
     .Detach();
}

Promise<std::string, true>
Extractor::RetrieveUrl() const {
   auto [promise, resolve, reject] = promise::Pure<std::string>();

   window_.Dispatch([this, resolve = std::move(resolve), reject = std::move(reject)]() {
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
                   "html/eAIP/FR-menu-fr-FR.html",
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

      window_.Webview().Navigate("https://www.sia.aviation-civile.gouv.fr/#");
      // https://www.sia.aviation-civile.gouv.fr/media/dvd/eAIP_22_JAN_2026/FRANCE/AIRAC-2026-01-22/html/eAIP/FR-AD-2.LFLG-fr-FR.html#AD-2.eAIP.LFLG
   });

   return promise;
}

Promise<std::vector<std::string>, true>
Extractor::RetrieveIcaos(std::string const& url) const {
   auto [promise, resolve, reject] = promise::Pure<std::vector<std::string>>();

   window_.Dispatch([this, url, resolve = std::move(resolve), reject = std::move(reject)]() {
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

      window_.Webview().Navigate(url);
      // "https://www.sia.aviation-civile.gouv.fr/media/dvd/eAIP_22_JAN_2026/FRANCE/AIRAC-2026-01-22/html/eAIP/FR-menu-fr-FR.html"
      // https://www.sia.aviation-civile.gouv.fr/media/dvd/eAIP_22_JAN_2026/FRANCE/AIRAC-2026-01-22/html/eAIP/FR-AD-2.LFLG-fr-FR.html#AD-2.eAIP.LFLG
   });

   return promise;
}

}  // namespace sia