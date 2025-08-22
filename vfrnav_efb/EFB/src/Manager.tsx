import { AirportRunway, EventBus, FacilityLoader, FacilityRepository, FacilitySearchType, FacilityType, NearestAirportSearchSession, NearestIcaoSearchSessionDataType, UnitType } from "@microsoft/msfs-sdk";
import { DefaultDeviationPreset, DeleteDeviationPreset, SetDeviationCurve as DeviationCurve, DeviationPresets, GetDeviationPresets } from "@shared/Deviation";
import { AirportFacility, FrequencyType, GetFacilities, GetICAOS, GetLatLon, GetMetar, Metar } from "@shared/Facilities";
import { FileExist, FileExistResponse, GetFile, GetFileResponse, OpenFile, OpenFileResponse } from "@shared/Files";
import { DefaultFuelPreset, DeleteFuelPreset, SetFuelCurve as FuelCurve, FuelPresets, GetFuelPresets, Tank } from "@shared/Fuel";
import { isMessage, MessageType } from "@shared/MessageHandler";
import { ExportNav } from "@shared/NavData";
import { ExportPdfs } from "@shared/Pdfs";
import { EditRecord, GetRecord, PlanePos, PlaneRecord, PlaneRecordsRecord, RemoveRecord } from "@shared/PlanPos";
import { SharedSettings, SharedSettingsRecord } from "@shared/Settings";
import { fill } from "@shared/Types";

class FacilityManager {
   readonly session: Promise<NearestAirportSearchSession<NearestIcaoSearchSessionDataType.StringV1>>;
   readonly facilitiesList = new Map<string, AirportFacility>();
   lat: number | undefined;
   lon: number | undefined;

   constructor(facilityLoader: FacilityLoader) {
      this.session = facilityLoader.startNearestSearchSession(FacilitySearchType.Airport);
   }
};

export class Manager {
   private readonly facilityLoader: FacilityLoader;
   private readonly facilityManager = new Map<number, FacilityManager>();

   private socket: WebSocket | undefined;
   private socketTimeout: NodeJS.Timeout | undefined;
   private messageHandler: ((_message: MessageType) => void) | undefined = undefined
   private serverMessageHandler: ((_id: number, _message: MessageType) => void) | undefined = undefined

   private readonly fuelPresets = new Map<string, FuelCurve>()
   private defaultFuelPreset: { name: string, date: number } | undefined = undefined
   private fuelPresetsInit = true

   private readonly deviationPresets = new Map<string, DeviationCurve>()
   private defaultDeviationPreset: { name: string, date: number } | undefined = undefined
   private deviationPresetsInit = true

   /* eslint-disable no-unused-vars */
   constructor(private readonly bus: EventBus) {
      this.facilityLoader = new FacilityLoader(FacilityRepository.getRepository(this.bus));
      this.facilityManager.set(0, new FacilityManager(this.facilityLoader));

      this.loadFuelPresets();
      this.loadDefaultFuelPreset();
      this.loadDeviationPresets();
      this.loadDefaultDeviationPreset();

      setInterval(this.fetchPosition.bind(this), 100);

      this.connectToServer();
   }

   private loadFuelPresets() {
      const presetsStr = GetStoredData("fuel-presets");
      if (presetsStr === '') {
         this.fuelPresetsInit = false;
         return
      }

      const presets = JSON.parse(presetsStr as string);

      if (!Array.isArray(presets)) {
         this.fuelPresetsInit = false;
         return
      }

      this.fuelPresets.clear();
      (presets as FuelCurve[]).forEach(preset => {
         this.fuelPresets.set(preset.name, preset)
      });
   }

   private saveFuelPresets() {
      SetStoredData('fuel-presets', JSON.stringify(Array.from(this.fuelPresets.values())
         .filter(elem => elem.curve.length)))
   }

   private loadDefaultFuelPreset() {
      this.defaultFuelPreset = {
         name: GetStoredData("fuel-preset.default") as string,
         date: 0
      };
      if (this.defaultFuelPreset.name === '') {
         this.defaultFuelPreset = undefined
      }
   }

   private saveDefaultFuelPreset() {
      if (this.defaultFuelPreset) {
         SetStoredData('fuel-preset.default', this.defaultFuelPreset.name)
      } else {
         DeleteStoredData('fuel-preset.default')
      }
   }


   private loadDeviationPresets() {
      const presetsStr = GetStoredData("deviation-presets");
      if (presetsStr === '') {
         this.deviationPresetsInit = false;
         return
      }

      const presets = JSON.parse(presetsStr as string);

      if (!Array.isArray(presets)) {
         this.deviationPresetsInit = false;
         return
      }

      this.deviationPresets.clear();
      (presets as DeviationCurve[]).forEach(preset => {
         this.deviationPresets.set(preset.name, preset)
      });
   }

   private saveDeviationPresets() {
      SetStoredData('deviation-presets', JSON.stringify(Array.from(this.deviationPresets.values())
         .filter(elem => elem.curve.length)))
   }

   private loadDefaultDeviationPreset() {
      this.defaultDeviationPreset = {
         name: GetStoredData("deviation-preset.default") as string,
         date: 0
      };
      if (this.defaultDeviationPreset.name === '') {
         this.defaultDeviationPreset = undefined
      }
   }

   private saveDefaultDeviationPreset() {
      if (this.defaultDeviationPreset) {
         SetStoredData('deviation-preset.default', this.defaultDeviationPreset.name)
      } else {
         DeleteStoredData('deviation-preset.default')
      }
   }

   public get isServerConnected() {
      return !!this.serverMessageHandler;
   }

   private plane: PlanePos[] = [];
   private flying: boolean = false;

   private flights: PlaneRecord[] = (() => {
      const flightsStr = GetStoredData("flights");
      if (flightsStr === '') {
         return []
      }

      const flights = JSON.parse(flightsStr as string);

      if (!Array.isArray(flights)) {
         return []
      }

      return flights;
   })();

   openEFB(messageHandler: (_: MessageType) => void) {
      this.messageHandler = messageHandler;
   }

   closeEFB() {
      this.messageHandler = undefined;
   }

   private connectToServer() {
      if (this.socketTimeout) {
         clearTimeout(this.socketTimeout);
      }
      this.socketTimeout = undefined;

      if (this.socket) {
         this.socket.close();

         // Leave rooms for socket to be correctly closed
         this.socketTimeout = setTimeout(this.connectToServer.bind(this), 1000);
         return;
      }

      const serverPort = SimVar.GetSimVarValue('L:VFRNAV_SET_PORT', 'number');

      if (serverPort) {
         this.socket = new WebSocket("ws://localhost:" + serverPort);

         const onClose = () => {
            if (!state.done) {
               state.done = true;
               this.serverMessageHandler = undefined;
               this.messageHandler?.({
                  "__SERVER_STATE__": true,

                  state: false
               });

               this.socket = undefined;
               if (this.socketTimeout) {
                  clearTimeout(this.socketTimeout)
               }
               this.socketTimeout = setTimeout(this.connectToServer.bind(this), 5000);
            }
         }

         const state = {
            done: false
         };

         this.socket.onmessage = (event) => {
            const data = (JSON.parse(event.data) as {
               id: number,
               content: MessageType
            });

            if (isMessage("__HELLO_WORLD__", data.content)) {
               console.assert(data.id === 1);
               // Message sent by the Server

               this.serverMessageHandler = (id: number, message: MessageType) => {
                  this.socket?.send(JSON.stringify({
                     id: id,
                     content: message
                  }))
               };

               this.messageHandler?.({
                  "__SERVER_STATE__": true,

                  state: true
               });

               this.onGetPlaneRecords(1);
            } else if (isMessage("__SETTINGS__", data.content)) {
               console.assert(false);
            } else if (isMessage("__GET_SETTINGS__", data.content)) {
               console.assert(false);
            } else if (isMessage("__GET_FUEL__", data.content)) {
               this.onGetFuel(data.id);
            } else if (isMessage("__GET_RECORDS__", data.content)) {
               this.onGetPlaneRecords(data.id);
            } else if (isMessage("__GET_FACILITIES__", data.content)) {
               this.onGetFacilities(data.id, data.content);
            } else if (isMessage("__GET_ICAOS__", data.content)) {
               this.onGetIcaos(data.id, data.content);
            } else if (isMessage("__GET_LAT_LON__", data.content)) {
               this.onGetLatLon(data.id, data.content);
            } else if (isMessage("__GET_METAR__", data.content)) {
               this.onGetMetar(data.id, data.content);
            } else if (isMessage("__REMOVE_RECORD__", data.content)) {
               this.onRemoveRecord(data.content);
            } else if (isMessage("__EDIT_RECORD__", data.content)) {
               this.onEditRecord(data.content);
            } else if (isMessage("__GET_RECORD__", data.content)) {
               this.onGetRecord(data.id, data.content);
            } else if (isMessage("__EXPORT_NAV__", data.content)) {
               this.onExportNav(data.content);
            } else if (isMessage("__FUEL_PRESETS__", data.content)) {
               this.onFuelPresets(data.id, data.content);
            } else if (isMessage("__GET_FUEL_PRESETS__", data.content)) {
               this.onGetFuelPresets(data.id, data.content);
            } else if (isMessage("__DELETE_FUEL_PRESET__", data.content)) {
               this.onDeleteFuelPreset(data.content);
            } else if (isMessage("__FUEL_CURVE__", data.content)) {
               this.onFuelCurve(data.id, data.content);
            } else if (isMessage("__DEFAULT_FUEL_PRESET__", data.content)) {
               this.onDefaultFuelPreset(data.id, data.content)
            } else if (isMessage("__DEVIATION_PRESETS__", data.content)) {
               this.onDeviationPresets(data.id, data.content);
            } else if (isMessage("__GET_DEVIATION_PRESETS__", data.content)) {
               this.onGetDeviationPresets(data.id, data.content);
            } else if (isMessage("__DELETE_DEVIATION_PRESET__", data.content)) {
               this.onDeleteDeviationPreset(data.content);
            } else if (isMessage("__DEVIATION_CURVE__", data.content)) {
               this.onDeviationCurve(data.id, data.content);
            } else if (isMessage("__DEFAULT_DEVIATION_PRESET__", data.content)) {
               this.onDefaultDeviationPreset(data.id, data.content)
            } else if (isMessage("__EXPORT_PDFS__", data.content)) {
               this.onExportPdfs(data.content);
            } else if (isMessage("__GET_FILE_RESPONSE__", data.content)
               || isMessage("__OPEN_FILE_RESPONSE__", data.content)
               || isMessage("__FILE_EXISTS_RESPONSE__", data.content)) {
               this.onFileResponse(data.content);
            }
         };

         this.socket.onclose = () => {
            onClose()
         };

         this.socket.onerror = () => {
            onClose();
         }

         this.socket.onopen = () => {
            this.socket?.send(JSON.stringify({
               __HELLO_WORLD__: "EFB"
            }));
         };
      } else {
         this.socketTimeout = setTimeout(this.connectToServer.bind(this), 5000);
      }
   }

   private getFuel() {
      const result: Tank[] = [];

      for (let index = 1; ; ++index) {
         const capacity = SimVar.GetSimVarValue(`FUELSYSTEM TANK CAPACITY:${index}`, 'gallons');
         if (capacity === 0) {
            break;
         }

         result[result.length] = {
            capacity: capacity,
            value: SimVar.GetSimVarValue(`FUELSYSTEM TANK TOTAL QUANTITY:${index}`, 'gallons')
         };
      }
      return result
   }

   private broadCastMessage(message: MessageType) {
      this.messageHandler?.(message);
      this.serverMessageHandler?.(1, message);
   }

   private sendMessage(id: number, message: MessageType) {
      if (id == 0) {
         this.messageHandler?.(message);
      } else {
         this.serverMessageHandler?.(id, message);
      }
   }

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

            this.broadCastMessage({ __RECORDS__: true, value: this.flights });
         }

         this.plane = []
      }

      this.broadCastMessage(info);
   };

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

   async getIcaos(name: string): Promise<string[]> {
      const result = [...new Set((await this.facilityLoader.searchByIdent(FacilitySearchType.Airport, name.toUpperCase(), 10)).map(value => value.substring(7)))];
      result.sort((a, b) => a.localeCompare(b));
      return result.map(value => value.replace(' ', ''));
   }

   async getLatLon(name: string): Promise<{ lat: number, lon: number }> {
      const result = await this.facilityLoader.getFacility(FacilityType.Airport, ('A      ' + name).padEnd(12, ' '));
      return { lat: result.lat, lon: result.lon };
   }

   async getFacilitiesList(id: number, lat: number, lon: number): Promise<Map<string, AirportFacility>> {
      let manager = this.facilityManager.get(id);
      if (!manager) {
         manager = new FacilityManager(this.facilityLoader);
         this.facilityManager.set(id, manager);
      }

      if (lat === manager.lat && lon === manager.lon) {
         return manager.facilitiesList;
      }
      manager.lat = lat;
      manager.lon = lon;

      const distanceMeters = UnitType.NMILE.convertTo(100, UnitType.METER);
      const diff = await manager.session.then(session => session.searchNearest(lat, lon, distanceMeters, 500));

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

      diff.removed.forEach(airport => manager.facilitiesList.delete(airport))
      await Promise.all(diff.added.map(async (icao) => {
         const airport = await this.facilityLoader.getFacility(FacilityType.Airport, icao);
         manager.facilitiesList.set(icao, {
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

      return manager.facilitiesList
   }

   GetSettings() {
      const storedSettings = GetStoredData("settings");
      if (storedSettings) {
         return fill(JSON.parse(storedSettings as string) as SharedSettings, SharedSettingsRecord.defaultValues);
      }

      return SharedSettingsRecord.defaultValues;
   }

   onGetSettings(id: number) {
      const settings = this.GetSettings()

      if (settings) {
         this.sendMessage(id, settings);
      }
   }

   onGetFuel(id: number) {
      this.sendMessage(id, {
         __FUEL__: true,

         tanks: this.getFuel()
      });
   }

   onGetServerState(id: number) {
      this.sendMessage(id, { __SERVER_STATE__: true, state: !!this.serverMessageHandler })
   }

   onGetPlaneRecords(id: number) {
      const flightsStr = GetStoredData("flights") as string;
      this.sendMessage(id, fill({ __RECORDS__: true, value: flightsStr === "" ? [] : (JSON.parse(flightsStr) as PlaneRecord[]) }, PlaneRecordsRecord.defaultValues));
   }

   async onGetFacilities(id: number, message: GetFacilities) {
      const list = await this.getFacilitiesList(id, message.lat, message.lon);
      this.sendMessage(id, { __FACILITIES__: true, facilities: [...list.values()] });
   }

   async onGetIcaos(id: number, message: GetICAOS) {
      const list = await this.getIcaos(message.icao);
      this.sendMessage(id, { __ICAOS__: true, icaos: [...list.values()] });
   }

   async onGetLatLon(id: number, message: GetLatLon) {
      const result = await this.getLatLon(message.icao);
      this.sendMessage(id, { __LAT_LON__: true, icao: message.icao, ...result });
   }

   async onGetMetar(id: number, message: GetMetar) {
      this.sendMessage(id, await this.getMetar(message.icao, message.lat, message.lon));
   }

   onSharedSettings(message: SharedSettings) {
      SetStoredData("settings", JSON.stringify(message));
   }

   onEditRecord({ id, name }: EditRecord) {
      this.flights.find(elem => elem.id === id)!.name = name
      SetStoredData("flights", JSON.stringify(this.flights))

      // Broadcast
      this.broadCastMessage({ __RECORDS__: true, value: this.flights });
   }

   onRemoveRecord({ id }: RemoveRecord) {
      this.flights.splice(this.flights.findIndex(elem => elem.id === id), 1)
      SetStoredData("flights", JSON.stringify(this.flights))
      DeleteStoredData(`record-${id}`)

      this.broadCastMessage({ __RECORDS__: true, value: this.flights });
   }

   onGetRecord(id: number, { id: record }: GetRecord) {
      this.sendMessage(id, { __PLANE_POSES__: true, id: record, value: JSON.parse(GetStoredData(`record-${record}`) as string) as PlanePos[] });
   }

   onExportNav(message: ExportNav) {
      this.messageHandler?.(message);
   }

   onFuelPresets(id: number, message: FuelPresets) {
      console.assert(id === 1 || id === 0);

      if (id === 0) {
         // From EFB

         if (this.fuelPresetsInit) {
            this.fuelPresetsInit = false

            message.data.forEach(preset => {
               if (preset.remove) {
                  const elem = this.fuelPresets.get(preset.name)
                  if (elem) {
                     this.sendMessage(0, {
                        __FUEL_CURVE__: true,

                        name: elem.name,
                        date: elem.date,
                        curve: elem.curve
                     })
                  }
               } else {
                  const elem = this.fuelPresets.get(preset.name)

                  if (elem) {
                     this.sendMessage(0, {
                        __FUEL_CURVE__: true,

                        name: elem.name,
                        date: elem.date,
                        curve: elem.curve
                     })
                  } else {
                     this.sendMessage(0, {
                        __DELETE_FUEL_PRESET__: true,

                        name: preset.name,
                        date: preset.date,
                     })
                  }
               }
            })

            this.fuelPresets.forEach(preset => {
               const elem = message.data.find(elem => elem.name === preset.name);

               if (!elem) {
                  this.sendMessage(0, {
                     __FUEL_CURVE__: true,

                     name: preset.name,
                     date: preset.date,
                     curve: preset.curve
                  })
               }
            })
         } else {
            this.fuelPresets.clear();
            message.data.forEach(preset => {
               if (preset.remove) {
                  this.fuelPresets.set(preset.name, {
                     __FUEL_CURVE__: true,

                     name: preset.name,
                     date: preset.date,
                     curve: []
                  })
               } else {
                  // Will be updated later on fuel curve message
                  this.sendMessage(0, {
                     __GET_FUEL_CURVE__: true,

                     name: preset.name
                  })
               }
            })

            this.saveFuelPresets()
         }

         this.sendMessage(1, {
            __FUEL_PRESETS__: true,

            data: Array.from(this.fuelPresets.values()).map(preset => ({
               name: preset.name,
               date: preset.date,
               remove: preset.curve.length === 0
            }))
         })

         if (this.defaultFuelPreset) {
            this.sendMessage(0, {
               __DEFAULT_FUEL_PRESET__: true,

               ...this.defaultFuelPreset
            })
         }
      } else {
         console.assert(false)
      }
   }

   onGetFuelPresets(id: number, message: GetFuelPresets) {
      console.assert(id === 1);
      this.sendMessage(0, message)
   }

   onDeleteFuelPreset(message: DeleteFuelPreset) {
      // From Server

      const preset = this.fuelPresets.get(message.name)

      if (preset) {
         if (preset.date < message.date) {
            this.fuelPresets.delete(message.name)
            this.saveFuelPresets();

            this.sendMessage(0, message)
         } else {
            this.sendMessage(1, {
               __FUEL_PRESETS__: true,

               data: Array.from(this.fuelPresets.values()).map(elem => ({
                  name: elem.name,
                  date: elem.date,
                  remove: elem.curve.length === 0
               }))
            })
         }
      }
   }

   onDefaultFuelPreset(id: number, message: DefaultFuelPreset) {
      if (message.date > (this.defaultFuelPreset?.date ?? (message.date - 1))) {
         this.defaultFuelPreset = { name: message.name, date: message.date };
         this.saveDefaultFuelPreset();

         if (id === 0) {
            this.sendMessage(1, message)
         } else {
            console.assert(id === 1)
            this.sendMessage(0, message)
         }
      } else if (message.date < this.defaultFuelPreset!.date) {
         console.assert(id === 1)
         this.sendMessage(1, {
            __DEFAULT_FUEL_PRESET__: true,

            name: this.defaultFuelPreset!.name,
            date: this.defaultFuelPreset!.date
         })
      }
   }

   onFuelCurve(id: number, message: FuelCurve) {
      if (id === 0) {
         // From EFB

         this.fuelPresets.set(message.name, {
            __FUEL_CURVE__: true,

            name: message.name,
            date: message.date,
            curve: message.curve
         })

         this.saveFuelPresets();
         this.sendMessage(1, message)
      } else {
         // From Server

         console.assert(id === 1);

         const preset = this.fuelPresets.get(message.name);
         if (preset) {
            if (preset.date < message.date) {
               preset.date = message.date;
               preset.curve = message.curve;

               this.saveFuelPresets();
               this.sendMessage(0, message)
            } else {
               this.sendMessage(1, {
                  __FUEL_PRESETS__: true,

                  data: Array.from(this.fuelPresets.values()).map(elem => ({
                     name: elem.name,
                     date: elem.date,
                     remove: elem.curve.length === 0
                  }))
               })

               if (this.defaultFuelPreset) {
                  this.sendMessage(1, {
                     __DEFAULT_FUEL_PRESET__: true,

                     ...this.defaultFuelPreset
                  })
               }
            }
         } else {
            this.fuelPresets.set(message.name, {
               __FUEL_CURVE__: true,

               name: message.name,
               date: message.date,
               curve: message.curve
            });

            this.saveFuelPresets();
            this.sendMessage(0, message)
         }
      }
   }





   onDeviationPresets(id: number, message: DeviationPresets) {
      console.assert(id === 1 || id === 0);

      if (id === 0) {
         // From EFB

         if (this.deviationPresetsInit) {
            this.deviationPresetsInit = false

            message.data.forEach(preset => {
               if (preset.remove) {
                  const elem = this.deviationPresets.get(preset.name)
                  if (elem) {
                     this.sendMessage(0, {
                        __DEVIATION_CURVE__: true,

                        name: elem.name,
                        date: elem.date,
                        curve: elem.curve
                     })
                  }
               } else {
                  const elem = this.deviationPresets.get(preset.name)

                  if (elem) {
                     this.sendMessage(0, {
                        __DEVIATION_CURVE__: true,

                        name: elem.name,
                        date: elem.date,
                        curve: elem.curve
                     })
                  } else {
                     this.sendMessage(0, {
                        __DELETE_DEVIATION_PRESET__: true,

                        name: preset.name,
                        date: preset.date,
                     })
                  }
               }
            })

            this.deviationPresets.forEach(preset => {
               const elem = message.data.find(elem => elem.name === preset.name);

               if (!elem) {
                  this.sendMessage(0, {
                     __DEVIATION_CURVE__: true,

                     name: preset.name,
                     date: preset.date,
                     curve: preset.curve
                  })
               }
            })
         } else {
            this.deviationPresets.clear();
            message.data.forEach(preset => {
               if (preset.remove) {
                  this.deviationPresets.set(preset.name, {
                     __DEVIATION_CURVE__: true,

                     name: preset.name,
                     date: preset.date,
                     curve: []
                  })
               } else {
                  // Will be updated later on deviation curve message
                  this.sendMessage(0, {
                     __GET_DEVIATION_CURVE__: true,

                     name: preset.name
                  })
               }
            })

            this.saveDeviationPresets()
         }

         this.sendMessage(1, {
            __DEVIATION_PRESETS__: true,

            data: Array.from(this.deviationPresets.values()).map(preset => ({
               name: preset.name,
               date: preset.date,
               remove: preset.curve.length === 0
            }))
         })

         if (this.defaultDeviationPreset) {
            this.sendMessage(0, {
               __DEFAULT_DEVIATION_PRESET__: true,

               ...this.defaultDeviationPreset
            })
         }
      } else {
         console.assert(false)
      }
   }

   onGetDeviationPresets(id: number, message: GetDeviationPresets) {
      console.assert(id === 1);
      this.sendMessage(0, message)
   }

   onDeleteDeviationPreset(message: DeleteDeviationPreset) {
      // From Server

      const preset = this.deviationPresets.get(message.name)

      if (preset) {
         if (preset.date < message.date) {
            this.deviationPresets.delete(message.name)
            this.saveDeviationPresets();

            this.sendMessage(0, message)
         } else {
            this.sendMessage(1, {
               __DEVIATION_PRESETS__: true,

               data: Array.from(this.deviationPresets.values()).map(elem => ({
                  name: elem.name,
                  date: elem.date,
                  remove: elem.curve.length === 0
               }))
            })
         }
      }
   }

   onDefaultDeviationPreset(id: number, message: DefaultDeviationPreset) {
      if (message.date > (this.defaultDeviationPreset?.date ?? (message.date - 1))) {
         this.defaultDeviationPreset = { name: message.name, date: message.date };
         this.saveDefaultDeviationPreset();

         if (id === 0) {
            this.sendMessage(1, message)
         } else {
            console.assert(id === 1)
            this.sendMessage(0, message)
         }
      } else if (message.date < this.defaultDeviationPreset!.date) {
         console.assert(id === 1)
         this.sendMessage(1, {
            __DEFAULT_DEVIATION_PRESET__: true,

            name: this.defaultDeviationPreset!.name,
            date: this.defaultDeviationPreset!.date
         })
      }
   }

   onDeviationCurve(id: number, message: DeviationCurve) {
      if (id === 0) {
         // From EFB

         this.deviationPresets.set(message.name, {
            __DEVIATION_CURVE__: true,

            name: message.name,
            date: message.date,
            curve: message.curve
         })

         this.saveDeviationPresets();
         this.sendMessage(1, message)
      } else {
         // From Server

         console.assert(id === 1);

         const preset = this.deviationPresets.get(message.name);
         if (preset) {
            if (preset.date < message.date) {
               preset.date = message.date;
               preset.curve = message.curve;

               this.saveDeviationPresets();
               this.sendMessage(0, message)
            } else {
               this.sendMessage(1, {
                  __DEVIATION_PRESETS__: true,

                  data: Array.from(this.deviationPresets.values()).map(elem => ({
                     name: elem.name,
                     date: elem.date,
                     remove: elem.curve.length === 0
                  }))
               })

               if (this.defaultDeviationPreset) {
                  this.sendMessage(1, {
                     __DEFAULT_DEVIATION_PRESET__: true,

                     ...this.defaultDeviationPreset
                  })
               }
            }
         } else {
            this.deviationPresets.set(message.name, {
               __DEVIATION_CURVE__: true,

               name: message.name,
               date: message.date,
               curve: message.curve
            });

            this.saveDeviationPresets();
            this.sendMessage(0, message)
         }
      }
   }

   onExportPdfs(message: ExportPdfs) {
      this.messageHandler?.(message);
   }

   onFileResponse(message: GetFileResponse | FileExistResponse | OpenFileResponse) {
      this.messageHandler?.(message);
   }

   onGetFile(message: GetFile) {
      this.serverMessageHandler?.(1, message);
   }

   onOpenFile(message: OpenFile) {
      this.serverMessageHandler?.(1, message);
   }

   onFileExists(message: FileExist) {
      this.serverMessageHandler?.(1, message);
   }

};
