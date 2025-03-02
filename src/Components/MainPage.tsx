import { GamepadUiView, RequiredProps, TVNode, UiViewProps } from "@alx-home/efb-api";
import { AirportRunway, FacilityLoader, FacilityRepository, FacilitySearchType, FacilityType, FSComponent, UnitType } from '@microsoft/msfs-sdk';
import { MessageHandler } from "@shared/MessageHandler";
import { SharedSettings } from "@shared/Settings";
import { AirportFacility, FrequencyType, GetFacilities, GetMetar, Metar } from "@shared/Facilities";

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

  async getMetar(ident: string, lat: number, lon: number) {
    const result: Metar = {
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
      this.settings = JSON.parse(storedSettings as string) as SharedSettings;
    }

    if (this.settings) {
      messageHandler?.send(this.settings);
    }
  }

  async onGetFacilities(message: GetFacilities) {
    const list = await this.getFacilitiesList(message.lat, message.lon);
    messageHandler?.send({ facilities: [...list.values()] });
  }

  async onGetMetar(message: GetMetar) {
    messageHandler?.send(await this.getMetar(message.icao, message.lat, message.lon));
  }

  onSharedSettings(message: SharedSettings) {
    this.settings = message;
    SetStoredData("settings", JSON.stringify(message));
  }

  destroy(): void {
    if (messageHandler !== undefined) {
      messageHandler.unsubscribe("SharedSettings", this.onSharedSettings)
      messageHandler.unsubscribe("GetSettings", this.onGetSettings)
      messageHandler.unsubscribe("GetFacilities", this.onGetFacilities)
      messageHandler.unsubscribe("GetMetar", this.onGetMetar)
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

  public onAfterRender(): void {
    if (messageHandler === undefined) {
      messageHandler = new MessageHandler(this.elementRef.instance);

      messageHandler.subscribe("SharedSettings", this.onSharedSettings.bind(this));
      messageHandler.subscribe("GetSettings", this.onGetSettings.bind(this));
      messageHandler.subscribe("GetFacilities", this.onGetFacilities.bind(this));
      messageHandler.subscribe("GetMetar", this.onGetMetar.bind(this))
    }
  }

}
