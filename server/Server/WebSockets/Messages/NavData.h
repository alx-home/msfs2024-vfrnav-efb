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

#include <utility>
#include <vector>

namespace ws::msg {

struct VorProperty {
   std::string ident_{};
   double      freq_{};
   double      obs_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"ident", &VorProperty::ident_},
     js::_{"freq", &VorProperty::freq_},
     js::_{"obs", &VorProperty::obs_},
   };
};

struct WindProperty {
   double direction_{};
   double speed_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"direction", &WindProperty::direction_},
     js::_{"speed", &WindProperty::speed_},
   };
};

struct Deviation {
   double x_{};
   double y_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"x", &Deviation::x_},
     js::_{"y", &Deviation::y_},
   };
};

struct Duration {
   double days_{};
   double hours_{};
   double minutes_{};
   double seconds_{};
   double full_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"days", &Duration::days_},
     js::_{"hours", &Duration::hours_},
     js::_{"minutes", &Duration::minutes_},
     js::_{"seconds", &Duration::seconds_},
     js::_{"full", &Duration::full_},
   };
};

struct NavProperties {
   bool active_{};

   double                             altitude_{};
   VorProperty                        vor_{};
   WindProperty                       wind_{};
   double                             ias_{};
   double                             oat_{};
   double                             dist_{};
   Duration                           dur_{};
   double                             tc_{};
   double                             ch_{};
   double                             mh_{};
   double                             dev_{};
   std::vector<std::array<double, 2>> coords_{};
   std::vector<Deviation>             deviations_{};
   double                             gs_{};
   double                             tas_{};
   double                             ata_{};
   double                             conso_{};
   double                             cur_fuel_{};
   double                             mag_var_{};
   std::string                        remark_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"active", &NavProperties::active_},
     js::_{"altitude", &NavProperties::altitude_},
     js::_{"vor", &NavProperties::vor_},
     js::_{"wind", &NavProperties::wind_},
     js::_{"ias", &NavProperties::ias_},
     js::_{"oat", &NavProperties::oat_},
     js::_{"dist", &NavProperties::dist_},
     js::_{"dur", &NavProperties::dur_},
     js::_{"TC", &NavProperties::tc_},
     js::_{"CH", &NavProperties::ch_},
     js::_{"MH", &NavProperties::mh_},
     js::_{"dev", &NavProperties::dev_},
     js::_{"coords", &NavProperties::coords_},
     js::_{"deviations", &NavProperties::deviations_},
     js::_{"GS", &NavProperties::gs_},
     js::_{"tas", &NavProperties::tas_},
     js::_{"ata", &NavProperties::ata_},
     js::_{"conso", &NavProperties::conso_},
     js::_{"curFuel", &NavProperties::cur_fuel_},
     js::_{"magVar", &NavProperties::mag_var_},
     js::_{"remark", &NavProperties::remark_},
   };
};

struct NavData {
   std::string                        name_{};
   std::string                        short_name_{};
   std::size_t                        order_{};
   std::vector<std::array<double, 2>> coords_{};
   std::vector<NavProperties>         properties_{};
   std::vector<std::string>           waypoints_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"name", &NavData::name_},
     js::_{"shortName", &NavData::short_name_},
     js::_{"order", &NavData::order_},
     js::_{"coords", &NavData::coords_},
     js::_{"properties", &NavData::properties_},
     js::_{"waypoints", &NavData::waypoints_},
   };
};

struct ExportNav {
   bool header_{true};

   std::vector<NavData> data_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__EXPORT_NAV__", &ExportNav::header_},
     js::_{"data", &ExportNav::data_},
   };
};

struct ImportNav {
   bool header_{true};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__IMPORT_NAV__", &ImportNav::header_},
   };
};

}  // namespace ws::msg
