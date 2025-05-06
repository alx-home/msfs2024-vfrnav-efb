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

import { GamepadUiView, RequiredProps, TVNode, UiViewProps } from "@alx-home/efb-api";
import { AirportRunway, FacilityLoader, FacilityRepository, FacilitySearchType, FacilityType, FSComponent, UnitType } from '@microsoft/msfs-sdk';
import { MessageHandler } from "@shared/MessageHandler";
import { SharedSettings, SharedSettingsRecord } from "@shared/Settings";
import { AirportFacility, FrequencyType, GetFacilities, GetMetar, Metar } from "@shared/Facilities";
import { ActiveRecord, EditRecord, GetRecord, PlanePos, PlaneRecord, PlaneRecords, PlaneRecordsRecord, RemoveRecord } from "@shared/PlanPos";
import { fill } from "@shared/Types";

interface MainPageProps extends RequiredProps<UiViewProps, "appViewService"> {
  /** The page title */
  title: string;

  /** The page background color */
  color: string;

}

let messageHandler: MessageHandler | undefined = undefined;

export class MainPage extends GamepadUiView<HTMLDivElement, MainPageProps> {
  public readonly tabName = MainPage.name;
  private readonly elementRef = FSComponent.createRef<HTMLIFrameElement>();
  private settings: SharedSettings | undefined;

  private readonly facilityLoader = new FacilityLoader(FacilityRepository.getRepository(this.props.bus!));
  private readonly session = this.facilityLoader.startNearestSearchSession(FacilitySearchType.Airport);
  private readonly _facilitiesList = new Map<string, AirportFacility>();
  private lat: number | undefined;
  private lon: number | undefined;
  private plane: PlanePos[] = [];
  private flying: boolean = false;
  private flights: PlaneRecord[] = (() => {
    const flightsStr = GetStoredData("flights");
    if (flightsStr === '') {
      return []
    }

    let flights = JSON.parse(flightsStr as string);

    if (!Array.isArray(flights)) {
      return []
    }

    return flights;
  })();

  // PlaneRecords = (() => {
  //   const flightsStr = GetStoredData("flights") as string
  //   return fill(flightsStr === "" ? [] : (JSON.parse(flightsStr) as PlaneRecords), PlaneRecordsDefault);
  // })();

  private fetchPosition() {
    const info: PlanePos = {
      __PLANE_POS__: true,

      date: Date.now(),
      lat: SimVar.GetSimVarValue('PLANE LATITUDE', 'degrees'),
      lon: SimVar.GetSimVarValue('PLANE LONGITUDE', 'degrees'),
      altitude: SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet'),
      ground: SimVar.GetSimVarValue('GROUND ALTITUDE', 'feet'),
      heading: SimVar.GetSimVarValue('PLANE HEADING DEGREES MAGNETIC', 'degrees'),
      verticalSpeed: SimVar.GetSimVarValue('VELOCITY BODY Y', 'feet per seconds') * 60,
      windVelocity: SimVar.GetSimVarValue('AMBIENT WIND VELOCITY', 'knots'),
      windDirection: SimVar.GetSimVarValue('AMBIENT WIND DIRECTION', 'degrees'),
    };

    this.flying = !SimVar.GetSimVarValue('SIM ON GROUND', 'bool');

    if (this.flying) {
      if (!this.plane.length || ((info.date - this.plane[this.plane.length - 1].date) >= 500)) {
        this.plane.push(info)
      }
    } else if (this.plane.length) {
      if (info.date - this.plane[0].date > 10000) {
        const touchDownSpeed = SimVar.GetSimVarValue('PLANE TOUCHDOWN NORMAL VELOCITY', 'feet per seconds') * 60;

        if (this.flights.length === 15) {
          this.flights = this.flights.slice(1);
        }

        const record: PlaneRecord = {
          name: new Date(this.plane[0].date).toLocaleString(),
          id: this.flights.length ? (+this.flights[this.flights.length - 1].id + 1) : 0,
          touchdown: touchDownSpeed,
          active: false
        };
        this.flights.push(record);

        SetStoredData(`record-${record.id}`, JSON.stringify(this.plane))
        SetStoredData("flights", JSON.stringify(this.flights))

        messageHandler?.send({ __RECORDS__: true, value: this.flights });
      }

      this.plane = []
    }

    messageHandler?.send(info);
  };

  private positionFetcher: NodeJS.Timeout | undefined;

  async getMetar(ident: string, lat: number, lon: number) {
    const result: Metar = {
      __METAR__: true,
      icao: ident
    };

    return Promise.all([this.facilityLoader.getMetar(ident).then(metar => {
      result.metar = metar?.metarString
      if (metar?.cavok) {
        result.cavok = (result.cavok ?? true) && metar.cavok;
      }
    }), this.facilityLoader.getTaf(ident).then(taf => {
      result.taf = taf?.tafString
      if (taf?.cavok) {
        result.cavok = (result.cavok ?? true) && taf.cavok;
      }
    }), this.facilityLoader.searchTaf(lat, lon).then(taf => {
      result.localTaf = taf?.tafString
    }), this.facilityLoader.searchMetar(lat, lon).then(metar => {
      result.localMetar = metar?.metarString
    })]).catch(e => {
      console.log(e)
    }).then(() => result);
  }

  async getFacilitiesList(lat: number, lon: number): Promise<Map<string, AirportFacility>> {
    if (lat === this.lat && lon === this.lon) {
      return this._facilitiesList;
    }
    this.lat = lat;
    this.lon = lon;

    const distanceMeters = UnitType.NMILE.convertTo(100, UnitType.METER);
    const diff = await this.session.then(session => session.searchNearest(lat, lon, distanceMeters, 500));

    const getDesignation = (runway: AirportRunway) => {
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

    diff.removed.forEach(airport => this._facilitiesList.delete(airport))
    await Promise.all(diff.added.map(async (icao) => {
      const airport = await this.facilityLoader.getFacility(FacilityType.Airport, icao);
      this._facilitiesList.set(icao, {
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
          designation: getDesignation(value),
          length: value.length,
          width: value.width,
          direction: value.direction,
          elevation: value.elevation,
          surface: value.surface,
          latitude: value.latitude,
          longitude: value.longitude,
        }))
      });
    }));

    return this._facilitiesList
  }

  constructor(props: MainPageProps) {
    super(props);
  }

  onGetSettings() {
    const storedSettings = GetStoredData("settings");
    if (storedSettings) {
      this.settings = fill(JSON.parse(storedSettings as string) as SharedSettings, SharedSettingsRecord.defaultValues);
    }

    if (this.settings) {
      messageHandler?.send(this.settings);
    }
  }

  onGetPlaneRecords() {
    const flightsStr = GetStoredData("flights") as string;
    const flights: PlaneRecords = fill({ __RECORDS__: true, value: flightsStr === "" ? [] : (JSON.parse(flightsStr) as PlaneRecord[]) }, PlaneRecordsRecord.defaultValues);
    messageHandler?.send(flights);
  }

  async onGetFacilities(message: GetFacilities) {
    const list = await this.getFacilitiesList(message.lat, message.lon);
    messageHandler?.send({ __FACILITIES__: true, facilities: [...list.values()] });

    this.positionFetcher = setInterval(this.fetchPosition.bind(this), 100);
  }

  async onGetMetar(message: GetMetar) {
    messageHandler?.send(await this.getMetar(message.icao, message.lat, message.lon));
  }

  onSharedSettings(message: SharedSettings) {
    this.settings = message;
    SetStoredData("settings", JSON.stringify(message));
  }

  destroy(): void {
    clearInterval(this.positionFetcher);

    if (messageHandler !== undefined) {
      messageHandler.unsubscribe("__SETTINGS__", this.onSharedSettings)
      messageHandler.unsubscribe("__GET_SETTINGS__", this.onGetSettings)
      messageHandler.unsubscribe("__GET_RECORDS__", this.onGetPlaneRecords)
      messageHandler.unsubscribe("__GET_FACILITIES__", this.onGetFacilities)
      messageHandler.unsubscribe("__GET_METAR__", this.onGetMetar)
      messageHandler.unsubscribe("__EDIT_RECORD__", this.onEditRecord)
      messageHandler.unsubscribe("__ACTIVE_RECORD__", this.onActiveRecord)
      messageHandler.unsubscribe("__REMOVE_RECORD__", this.onRemoveRecord)
      messageHandler.unsubscribe("__GET_RECORD__", this.onGetRecord)
    }

    super.destroy();
  }

  public render(): TVNode<HTMLDivElement> {
    return (
      <div ref={this.gamepadUiViewRef} className="sample-page" style={`height: 100%; --color: ${this.props.color}`}>
        <iframe ref={this.elementRef} title="msfs2024-vfrnav" height="100%" width="100%" src={`${BASE_URL}/efb/index.html`}>
        </iframe>
      </div>
    );
  }

  private onEditRecord({ id, name }: EditRecord) {
    this.flights.find(elem => elem.id === id)!.name = name
    SetStoredData("flights", JSON.stringify(this.flights))
    messageHandler?.send({ __RECORDS__: true, value: this.flights });
  }
  private onActiveRecord({ id, active }: ActiveRecord) {
    this.flights.find(elem => elem.id === id)!.active = active
    SetStoredData("flights", JSON.stringify(this.flights))
    messageHandler?.send({ __RECORDS__: true, value: this.flights });
  }
  private onRemoveRecord({ id }: RemoveRecord) {
    this.flights.splice(this.flights.findIndex(elem => elem.id === id), 1)
    SetStoredData("flights", JSON.stringify(this.flights))
    DeleteStoredData(`record-${id}`)

    messageHandler?.send({ __RECORDS__: true, value: this.flights });
  }
  private onGetRecord({ id }: GetRecord) {
    messageHandler?.send({ __PLANE_POSES__: true, id: id, value: JSON.parse(GetStoredData(`record-${id}`) as string) as PlanePos[] });
  }

  public onAfterRender(): void {
    if (messageHandler === undefined) {
      messageHandler = new MessageHandler(this.elementRef.instance);

      messageHandler.subscribe("__SETTINGS__", this.onSharedSettings.bind(this));
      messageHandler.subscribe("__GET_SETTINGS__", this.onGetSettings.bind(this));
      messageHandler.subscribe("__GET_RECORDS__", this.onGetPlaneRecords.bind(this))
      messageHandler.subscribe("__GET_FACILITIES__", this.onGetFacilities.bind(this));
      messageHandler.subscribe("__GET_METAR__", this.onGetMetar.bind(this))
      messageHandler.subscribe("__EDIT_RECORD__", this.onEditRecord.bind(this))
      messageHandler.subscribe("__ACTIVE_RECORD__", this.onActiveRecord.bind(this))
      messageHandler.subscribe("__REMOVE_RECORD__", this.onRemoveRecord.bind(this))
      messageHandler.subscribe("__GET_RECORD__", this.onGetRecord.bind(this))
    }
  }

}
