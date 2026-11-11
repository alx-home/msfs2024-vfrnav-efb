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

#include "main.h"

#include <shellapi.h>
#include <cstdint>
#include <stdexcept>

template <WIN WINDOW>
Promise<>
Window<WINDOW>::OpenDonationLink(std::string url) {
   if (
     url != "https://www.paypal.com/donate/?hosted_button_id=UFLZE3KQB78Z4"
     && url != "https://buymeacoffee.com/alex.home"
     && url != "https://liberapay.com/alex-home/donate"
   ) {
      throw std::runtime_error("Invalid donation link.");
   }

   auto result{reinterpret_cast<std::intptr_t>(
     ShellExecuteA(nullptr, "open", url.c_str(), nullptr, nullptr, SW_SHOWNORMAL)
   )};

   if (result <= 32) {
      throw std::runtime_error(
        "Cannot open the donation link in your default browser (Windows error "
        + std::to_string(result) + ")."
      );
   }

   co_return;
}

template <WIN WINDOW>
Promise<>
Window<WINDOW>::HideTaskbar() {
   co_return main_.CloseTaskbar();
}

template <WIN WINDOW>
Promise<>
Window<WINDOW>::ShowTaskbar() {
   co_return main_.OpenTaskbar();
}

template <WIN WINDOW>
Promise<>
Window<WINDOW>::HideToolTip() {
   co_return main_.CloseToolTip();
}

template <WIN WINDOW>
Promise<>
Window<WINDOW>::OpenEFB() {
   co_return main_.OpenEFB();
}

template <WIN WINDOW>
Promise<>
Window<WINDOW>::OpenWebEFB() {
   co_return main_.OpenWebEFB();
}

template <WIN WINDOW>
Promise<>
Window<WINDOW>::ShowToolTip() {
   co_return main_.OpenToolTip();
}