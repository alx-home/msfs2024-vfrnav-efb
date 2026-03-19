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

import { AirportRunway, FacilityLoader, FacilitySearchType, FacilityType, NearestAirportSearchSession, NearestIcaoSearchSessionDataType, UnitType } from "@microsoft/msfs-sdk";
import { AirportFacility, FrequencyType } from "@shared/Facilities";


export class FacilityManager {
   private readonly session: Promise<NearestAirportSearchSession<NearestIcaoSearchSessionDataType.StringV1>>;
   private facilitiesList = Promise.resolve(new Set<string>());
   private lat: number | undefined;
   private lon: number | undefined;

   constructor(private readonly facilityLoader: FacilityLoader) {
      this.session = facilityLoader.startNearestSearchSession(FacilitySearchType.Airport);
   }

   private static getDesignation(runway: AirportRunway): string {
      const runways = runway.designation.split('-');
      let result = runways[0];

      const addDesignation = (code: RunwayDesignator) => {
         switch (code) {
            case RunwayDesignator.RUNWAY_DESIGNATOR_LEFT:
               result += "L";
               break;

            case RunwayDesignator.RUNWAY_DESIGNATOR_RIGHT:
               result += "R";
               break;

            case RunwayDesignator.RUNWAY_DESIGNATOR_CENTER:
               result += "C";
               break;

            case RunwayDesignator.RUNWAY_DESIGNATOR_A:
               result += "A";
               break;

            case RunwayDesignator.RUNWAY_DESIGNATOR_B:
               result += "B";
               break;

            case RunwayDesignator.RUNWAY_DESIGNATOR_WATER:
               result += "W";
               break;
         }
      };

      addDesignation(runway.designatorCharPrimary)
      result += '-' + runways[1]
      addDesignation(runway.designatorCharSecondary)

      return result;
   }

   public async getFacility(icao: string): Promise<AirportFacility> {
      const airport = await this.facilityLoader.getFacility(FacilityType.Airport, icao);

      return {
         icao: airport.icaoStruct.ident,
         lat: airport.lat,
         lon: airport.lon,
         towered: airport.towered,
         airportClass: airport.airportClass,
         airspaceType: airport.airspaceType,
         bestApproach: airport.bestApproach,
         fuel1: airport.fuel1,
         fuel2: airport.fuel2,
         airportPrivateType: airport.airportPrivateType,
         transitionAlt: airport.transitionAlt,
         transitionLevel: airport.transitionLevel,

         frequencies: airport.frequencies.map(value => ({
            name: value.name,
            icao: value.icaoStruct.ident,
            value: value.freqMHz,
            type: value.type as number as FrequencyType,
         })),
         runways: airport.runways.map(value => ({
            designation: FacilityManager.getDesignation(value),
            length: value.length,
            width: value.width,
            direction: value.direction,
            elevation: value.elevation,
            surface: value.surface,
            latitude: value.latitude,
            longitude: value.longitude,
         }))
      };
   }

   public async getFacilitiesList(lat: number, lon: number) {
      this.facilitiesList = this.facilitiesList.then(async (facilitiesList) => {
         if (lat === this.lat && lon === this.lon) {
            return facilitiesList;
         }

         this.lat = lat;
         this.lon = lon;

         const distanceMeters = UnitType.NMILE.convertTo(100, UnitType.METER);
         const diff = await this.session.then(session => session.searchNearest(lat, lon, distanceMeters, 500));

         diff.removed.forEach(airport => facilitiesList.delete(airport));
         diff.added.forEach(icao => facilitiesList.add(icao));

         return facilitiesList;
      });

      return this.facilitiesList;
   }
};