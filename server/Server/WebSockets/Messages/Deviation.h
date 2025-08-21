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
#include <vector>

namespace ws::msg::dev {
struct Preset {
   std::string name_{};
   std::size_t date_{};
   bool        remove_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"name", &Preset::name_},
     js::_{"date", &Preset::date_},
     js::_{"remove", &Preset::remove_},
   };
};

struct Presets {
   bool header_{true};

   std::vector<Preset> data_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__DEVIATION_PRESETS__", &Presets::header_},

     js::_{"data", &Presets::data_},
   };
};

struct DeletePreset {
   bool header_{true};

   std::string name_{};
   std::size_t date_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__DELETE_DEVIATION_PRESET__", &DeletePreset::header_},

     js::_{"name", &DeletePreset::name_},
     js::_{"date", &DeletePreset::date_},
   };
};

struct GetPresets {
   bool header_{true};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_DEVIATION_PRESETS__", &GetPresets::header_},
   };
};

struct Curve {
   bool header_{true};

   std::string                         name_{};
   std::size_t                         date_{};
   std::vector<std::array<int16_t, 2>> curve_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__DEVIATION_CURVE__", &Curve::header_},

     js::_{"name", &Curve::name_},
     js::_{"date", &Curve::date_},
     js::_{"curve", &Curve::curve_},
   };
};

struct GetCurve {
   bool header_{true};

   std::string name_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_DEVIATION_CURVE__", &GetCurve::header_},

     js::_{"name", &GetCurve::name_},
   };
};

struct DefaultPreset {
   bool header_{true};

   std::string name_{};
   std::size_t date_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__DEFAULT_DEVIATION_PRESET__", &DefaultPreset::header_},

     js::_{"name", &DefaultPreset::name_},
     js::_{"date", &DefaultPreset::date_},
   };
};

}  // namespace ws::msg::dev
