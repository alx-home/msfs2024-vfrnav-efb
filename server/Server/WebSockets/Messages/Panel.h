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

#include <json/json.h>

namespace ws::msg {

struct SetPanelSize {
   bool header_{true};

   bool   enabled_{};
   double x_{};
   double y_{};
   double width_{};
   double height_{};
   double border_scale_{};
   double dpi_scale_{};
   double menu_dpi_scale_{};
   bool   caption_bar_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__SET_PANEL_SIZE__", &SetPanelSize::header_},

     js::_{"enabled", &SetPanelSize::enabled_},
     js::_{"x", &SetPanelSize::x_},
     js::_{"y", &SetPanelSize::y_},
     js::_{"width", &SetPanelSize::width_},
     js::_{"height", &SetPanelSize::height_},
     js::_{"borderScale", &SetPanelSize::border_scale_},
     js::_{"dpiScale", &SetPanelSize::dpi_scale_},
     js::_{"menuDpiScale", &SetPanelSize::menu_dpi_scale_},
     js::_{"captionBar", &SetPanelSize::caption_bar_},
   };
};

struct GetPanelSize {
   bool header_{true};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_PANEL_SIZE__", &GetPanelSize::header_},
   };
};

}  // namespace ws::msg
