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
#include <cstdint>
#include <optional>

namespace ws::msg {

struct Color {
   uint8_t red_{};
   uint8_t green_{};
   uint8_t blue_{};
   uint8_t alpha_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"red", &Color::red_},
     js::_{"green", &Color::green_},
     js::_{"blue", &Color::blue_},
     js::_{"alpha", &Color::alpha_},
   };
};

struct LayerSetting {
   bool                  active_{};
   bool                  enabled_{};
   std::optional<double> min_zoom_{};
   std::optional<double> max_zoom_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"active", &LayerSetting::active_},
     js::_{"enabled", &LayerSetting::enabled_},
     js::_{"minZoom", &LayerSetting::min_zoom_},
     js::_{"maxZoom", &LayerSetting::max_zoom_},
   };
};

struct AirportsSetting : LayerSetting {
   bool hard_runway_{};
   bool soft_runway_{};
   bool water_runway_{};
   bool private_{};
   bool helipads_{};

   static constexpr js::Proto PROTOTYPE{js::Extend{
     LayerSetting::PROTOTYPE,

     js::_{"hardRunway", &AirportsSetting::hard_runway_},
     js::_{"softRunway", &AirportsSetting::soft_runway_},
     js::_{"waterRunway", &AirportsSetting::water_runway_},
     js::_{"private", &AirportsSetting::private_},
     js::_{"helipads", &AirportsSetting::helipads_},
   }};
};

struct Settings {
   bool header_{true};

   double server_port_{};

   double      default_speed_{};
   std::string sia_auth_{};
   std::string sia_addr_{};
   std::string sia_azba_addr_{};
   std::string sia_azba_date_addr_{};

   LayerSetting    azba_{};
   LayerSetting    plane_{};
   AirportsSetting airports_{};

   LayerSetting oaci_{};
   LayerSetting germany_{};
   LayerSetting openaipmaps_{};
   LayerSetting openflightmaps_{};
   LayerSetting openflightmaps_base_{};
   LayerSetting us_sectional_{};
   LayerSetting us_ifr_high_{};
   LayerSetting us_ifr_low_{};
   LayerSetting opentopo_{};
   LayerSetting mapforfree_{};
   LayerSetting googlemap_{};
   LayerSetting openstreet_{};

   struct Map {
      struct Text {
         double max_size_{};
         double min_size_{};
         double border_size_{};
         Color  color_{};
         Color  border_color_{};

         static constexpr js::Proto PROTOTYPE{
           js::_{"maxSize", &Text::max_size_},
           js::_{"minSize", &Text::min_size_},
           js::_{"borderSize", &Text::border_size_},
           js::_{"color", &Text::color_},
           js::_{"borderColor", &Text::border_color_},
         };
      };
      Text text_{};

      struct Azba {
         Color  inactive_high_color_{};
         Color  inactive_low_color_{};
         Color  active_high_color_{};
         Color  active_low_color_{};
         double range_{};

         static constexpr js::Proto PROTOTYPE{
           js::_{"inactiveHighColor", &Azba::inactive_high_color_},
           js::_{"inactiveLowColor", &Azba::inactive_low_color_},
           js::_{"activeHighColor", &Azba::active_high_color_},
           js::_{"activeLowColor", &Azba::active_low_color_},
           js::_{"range", &Azba::range_},
         };
      };
      Azba azba_{};

      double marker_size_{};

      static constexpr js::Proto PROTOTYPE{
        js::_{"text", &Map::text_},
        js::_{"azba", &Map::azba_},
        js::_{"markerSize", &Map::marker_size_},
      };
   };

   Map map_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__SETTINGS__", &Settings::header_},

     js::_{"serverPort", &Settings::server_port_},
     js::_{"defaultSpeed", &Settings::default_speed_},
     js::_{"SIAAuth", &Settings::sia_auth_},
     js::_{"SIAAddr", &Settings::sia_addr_},
     js::_{"SIAAZBAAddr", &Settings::sia_azba_addr_},
     js::_{"SIAAZBADateAddr", &Settings::sia_azba_date_addr_},
     js::_{"azba", &Settings::azba_},
     js::_{"plane", &Settings::plane_},
     js::_{"airports", &Settings::airports_},
     js::_{"OACI", &Settings::oaci_},
     js::_{"germany", &Settings::germany_},
     js::_{"openaipmaps", &Settings::openaipmaps_},
     js::_{"openflightmaps", &Settings::openflightmaps_},
     js::_{"openflightmapsBase", &Settings::openflightmaps_base_},
     js::_{"USSectional", &Settings::us_sectional_},
     js::_{"USIFRHigh", &Settings::us_ifr_high_},
     js::_{"USIFRLow", &Settings::us_ifr_low_},
     js::_{"opentopo", &Settings::opentopo_},
     js::_{"mapforfree", &Settings::mapforfree_},
     js::_{"googlemap", &Settings::googlemap_},
     js::_{"openstreet", &Settings::openstreet_},
     js::_{"map", &Settings::map_},
   };
};

struct GetSettings {
   bool header_{true};

   static constexpr js::Proto PROTOTYPE{
     js::_{"__GET_SETTINGS__", &GetSettings::header_},
   };
};
}  // namespace ws::msg
