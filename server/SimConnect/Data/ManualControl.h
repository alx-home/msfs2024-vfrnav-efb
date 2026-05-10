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

#include "DataType.h"
#include <SimConnect.h>

#include <tuple>

namespace smc {

// Visual-only control surfaces (always sent if changed)
struct ControlSurfaces {
   double elevator_{};       // radians
   double aileron_left_{};   // radians
   double aileron_right_{};  // radians
   double rudder_{};         // radians

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       "ELEVATOR DEFLECTION",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
       &ControlSurfaces::elevator_
     },
     smc::_m{
       "AILERON LEFT DEFLECTION",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
       &ControlSurfaces::aileron_left_
     },
     smc::_m{
       "AILERON RIGHT DEFLECTION",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
       &ControlSurfaces::aileron_right_
     },
     smc::_m{
       "RUDDER DEFLECTION",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
       &ControlSurfaces::rudder_
     }
   )};
};

// Altitude control
struct AltitudeControl {
   double value_{};  // feet

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       "PLANE ALTITUDE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet",
       &AltitudeControl::value_
     }
   )};
};

// Ground Altitude control
struct GroundAltitudeControl {
   double value_{};  // feet

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       "PLANE ALT ABOVE GROUND",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet",
       &GroundAltitudeControl::value_
     }
   )};
};

// Heading control - despite the name, PLANE HEADING DEGREES TRUE uses radians
struct HeadingControl {
   double value_{};  // radians

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       "PLANE HEADING DEGREES TRUE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
       &HeadingControl::value_
     }
   )};
};

// Pitch control - despite the name, PLANE PITCH DEGREES uses radians
struct PitchControl {
   double value_{};  // radians (NED convention: positive = nose DOWN)

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       "PLANE PITCH DEGREES",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
       &PitchControl::value_
     }
   )};
};

// Bank control - despite the name, PLANE BANK DEGREES uses radians
struct BankControl {
   double value_{};  // radians (positive = right wing down)

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       "PLANE BANK DEGREES",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
       &BankControl::value_
     }
   )};
};

// Airspeed control
struct AirspeedControl {
   double value_{};  // knots

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       "AIRSPEED TRUE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "knots",
       &AirspeedControl::value_
     }
   )};
};

// Vertical speed control
struct VSpeedControl {
   double value_{};  // feet per second

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       "VELOCITY BODY Y",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet per second",
       &VSpeedControl::value_
     }
   )};
};

// Ground altitude control
struct GroundAltitude {
   double value_{};  // feet

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       "PLANE ALT ABOVE GROUND",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet",
       &GroundAltitude::value_
     }
   )};
};

// Set On Ground (boolean)
struct SetOnGround {
   bool value_{};

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       "SIM SHOULD SET ON GROUND",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "boolean",
       &SetOnGround::value_
     }
   )};
};

}  // namespace smc
