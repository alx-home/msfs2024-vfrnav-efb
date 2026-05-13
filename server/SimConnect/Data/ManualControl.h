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
       &ControlSurfaces::elevator_,
       "ELEVATOR DEFLECTION",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
     },
     smc::_m{
       &ControlSurfaces::aileron_left_,
       "AILERON LEFT DEFLECTION",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
     },
     smc::_m{
       &ControlSurfaces::aileron_right_,
       "AILERON RIGHT DEFLECTION",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
     },
     smc::_m{
       &ControlSurfaces::rudder_,
       "RUDDER DEFLECTION",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
     }
   )};
};

// Altitude control
struct AltitudeControl {
   double value_{};  // feet

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       &AltitudeControl::value_,
       "PLANE ALTITUDE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet",
     }
   )};
};

// Ground Altitude control
struct GroundAltitudeControl {
   double value_{};  // feet

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       &GroundAltitudeControl::value_,
       "PLANE ALT ABOVE GROUND",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet",
     }
   )};
};

// Heading control - despite the name, PLANE HEADING DEGREES TRUE uses radians
struct HeadingControl {
   double value_{};  // radians

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       &HeadingControl::value_,
       "PLANE HEADING DEGREES TRUE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
     }
   )};
};

// Pitch control - despite the name, PLANE PITCH DEGREES uses radians
struct PitchControl {
   double value_{};  // radians (NED convention: positive = nose DOWN)

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       &PitchControl::value_,
       "PLANE PITCH DEGREES",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
     }
   )};
};

// Bank control - despite the name, PLANE BANK DEGREES uses radians
struct BankControl {
   double value_{};  // radians (positive = right wing down)

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       &BankControl::value_,
       "PLANE BANK DEGREES",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians",
     }
   )};
};

// Airspeed control
struct AirspeedControl {
   double value_{};  // knots

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       &AirspeedControl::value_,
       "AIRSPEED TRUE",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "knots",
     }
   )};
};

// Speed control
struct SpeedControl {
   double vertical_{};      // feet/second
   double longitudinal_{};  // feet/second
   double lateral_{};       // feet/second

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       &SpeedControl::vertical_,
       "VELOCITY BODY Y",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet/second",
     },
     smc::_m{
       &SpeedControl::longitudinal_,
       "VELOCITY BODY Z",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet/second",
     },
     smc::_m{
       &SpeedControl::lateral_,
       "VELOCITY BODY X",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet/second",
     }
   )};
};

// VSpeed control
struct VSpeedControl {
   double value_{};  // feet/second

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       &VSpeedControl::value_,
       "VELOCITY BODY Y",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet/second",
     }
   )};
};

// Rotation control
struct RotationControl {
   double vertical_{};      // radian/second
   double longitudinal_{};  // radian/second
   double lateral_{};       // radian/second

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       &RotationControl::vertical_,
       "ROTATION VELOCITY BODY Y",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians per second",
     },
     smc::_m{
       &RotationControl::longitudinal_,
       "ROTATION VELOCITY BODY Z",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians per second",
     },
     smc::_m{
       &RotationControl::lateral_,
       "ROTATION VELOCITY BODY X",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "radians per second",
     }
   )};
};

// Ground altitude control
struct GroundAltitude {
   double value_{};  // feet

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       &GroundAltitude::value_,
       "PLANE ALT ABOVE GROUND",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "feet",
     }
   )};
};

// Set On Ground (boolean)
struct SetOnGround {
   int32_t value_{};

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       &SetOnGround::value_,
       "SIM SHOULD SET ON GROUND",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "bool",
     }
   )};
};

struct WaypointIndex {
   int32_t value_{};

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       &WaypointIndex::value_,
       "AI CURRENT WAYPOINT",
       smc::_t<SIMCONNECT_DATATYPE_INT32>{},
       "number",
     }
   )};
};

struct AIHeading {
   double value_{};

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       &AIHeading::value_,
       "AI DESIRED HEADING",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "degrees",
     }
   )};
};

struct AISpeed {
   double value_{};

   static constexpr std::tuple MEMBERS{std::make_tuple(
     smc::_m{
       &AISpeed::value_,
       "AI DESIRED SPEED",
       smc::_t<SIMCONNECT_DATATYPE_FLOAT64>{},
       "knots",
     }
   )};
};

}  // namespace smc
