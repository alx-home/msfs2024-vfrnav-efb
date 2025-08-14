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

namespace ws::msg {

struct GetFuel {
   bool header_{true};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_FUEL__", &GetFuel::header_},
   };
};

struct Tank {
   std::size_t capacity_{};
   std::size_t value_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"capacity", &Tank::capacity_},
     js::_{"value", &Tank::value_},
   };
};

struct Fuel {
   bool header_{true};

   std::vector<Tank> tanks_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__FUEL__", &Fuel::header_},

     js::_{"tanks", &Fuel::tanks_},
   };
};

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

struct FuelPresets {
   bool header_{true};

   std::vector<Preset> data_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__FUEL_PRESETS__", &FuelPresets::header_},

     js::_{"data", &FuelPresets::data_},
   };
};

struct DeleteFuelPreset {
   bool header_{true};

   std::string name_{};
   std::size_t date_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__DELETE_FUEL_PRESET__", &DeleteFuelPreset::header_},

     js::_{"name", &DeleteFuelPreset::name_},
     js::_{"date", &DeleteFuelPreset::date_},
   };
};

struct GetFuelPresets {
   bool header_{true};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_FUEL_PRESETS__", &GetFuelPresets::header_},
   };
};

struct FuelPoint {
   int16_t     temp_{};
   std::size_t alt_{};
   float       conso_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"temp", &FuelPoint::temp_},
     js::_{"alt", &FuelPoint::alt_},
     js::_{"conso", &FuelPoint::conso_},
   };
};

struct Curve {
   std::size_t                         thrust_;
   std::vector<std::vector<FuelPoint>> points_;

   static constexpr js::Proto PROTOTYPE{
     js::_{"thrust", &Curve::thrust_},
     js::_{"points", &Curve::points_},
   };
};

struct FuelCurve {
   bool header_{true};

   std::string        name_{};
   std::size_t        date_{};
   std::vector<Curve> curve_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__FUEL_CURVE__", &FuelCurve::header_},

     js::_{"name", &FuelCurve::name_},
     js::_{"date", &FuelCurve::date_},
     js::_{"curve", &FuelCurve::curve_},
   };
};

struct GetFuelCurve {
   bool header_{true};

   std::string name_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_FUEL_CURVE__", &GetFuelCurve::header_},

     js::_{"name", &GetFuelCurve::name_},
   };
};

}  // namespace ws::msg
