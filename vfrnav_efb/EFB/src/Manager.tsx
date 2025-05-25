import { AirportRunway, EventBus, FacilityLoader, FacilityRepository, FacilitySearchType, FacilityType, NearestAirportSearchSession, NearestIcaoSearchSessionDataType, UnitType } from "@microsoft/msfs-sdk";
import { AirportFacility, FrequencyType, GetFacilities, GetMetar, Metar } from "@shared/Facilities";
import { FileExist, GetFile, OpenFile } from "@shared/Files";
import { isMessage, MessageType } from "@shared/MessageHandler";
import { EditRecord, GetRecord, PlanePos, PlanePoses, PlaneRecord, PlaneRecords, PlaneRecordsRecord, RemoveRecord } from "@shared/PlanPos";
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

   /* eslint-disable no-unused-vars */
   constructor(private readonly bus: EventBus) {
      this.facilityLoader = new FacilityLoader(FacilityRepository.getRepository(this.bus));
      this.facilityManager.set(0, new FacilityManager(this.facilityLoader));
      setInterval(this.fetchPosition.bind(this), 100);

      this.connectToServer();
   }

   private plane: PlanePos[] = [];
   private flying: boolean = false;
   private readonly subscribers = new Map<number, (_: MessageType) => void>();

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

   private connectToServer() {
      if (this.socketTimeout) {
         clearTimeout(this.socketTimeout);
      }
      this.socketTimeout = undefined;

      if (!this.GetSettings().serverPort) {
         if (this.socket) {
            this.socket.close();
         }
         this.socket = undefined;
         return;
      }

      if (this.socket) {
         this.socket.close();

         // Leave rooms for socket to be correctly closed
         this.socketTimeout = setTimeout(this.connectToServer.bind(this), 1000);
         return;
      }
      this.socket = new WebSocket("ws://localhost:" + this.GetSettings().serverPort);

      const messageHandlers = new Map<number, (_: MessageType) => void>();

      const onClose = () => {
         if (!done.value) {
            done.value = true;

            messageHandlers.forEach((messageHandler, id) => this.unsubscribe(id, messageHandler))
            this.socket = undefined;
            if (this.socketTimeout) {
               clearTimeout(this.socketTimeout)
            }
            this.socketTimeout = setTimeout(this.connectToServer.bind(this), 5000);
         }
      }

      const done = {
         value: false
      };
      this.socket.onmessage = (event) => {
         const data = (JSON.parse(event.data) as {
            id: number,
            content: MessageType
         });

         if (isMessage("__HELLO_WORLD__", data.content)) {
            if (data.id === 1) {
               // EFB Server used to relay message between EFB app (id:0) / server

               const messageHandler = (message: MessageType) => {
                  if (done.value) {
                     console.assert(false)
                     this.unsubscribe(data.id, messageHandler);
                     return;
                  }
                  if (!isMessage("__SETTINGS__", message) && !isMessage("__GET_SETTINGS__", message)) {
                     this.socket?.send(JSON.stringify({
                        id: 0,
                        content: message
                     }))
                  }
               };

               messageHandlers.set(data.id, messageHandler);
               this.subscribe(data.id, messageHandler);
            } else {
               const messageHandler = (message: MessageType) => {
                  if (done.value) {
                     console.assert(false)
                     this.unsubscribe(data.id, messageHandler);
                     return;
                  }
                  if (!isMessage("__SETTINGS__", message) && !isMessage("__GET_SETTINGS__", message)) {
                     this.socket?.send(JSON.stringify({
                        id: data.id,
                        content: message
                     }))
                  }
               };

               messageHandlers.set(data.id, messageHandler);
               this.subscribe(data.id, messageHandler);
            }
         } else if (isMessage("__BYE_BYE__", data.content)) {
            if (data.content.__BYE_BYE__ === "EFB") {
               this.socket?.close();
            } else {
               const handler = messageHandlers.get(data.id);

               if (handler) {
                  this.unsubscribe(data.id, handler)
                  messageHandlers.delete(data.id);
               } else {
                  console.assert(false)
               }
            }
         } else if (isMessage("__SETTINGS__", data.content)) {
            console.assert(false);
            // this.onSharedSettings(data.content);
         } else if (isMessage("__GET_SETTINGS__", data.content)) {
            console.assert(false);
            // this.onGetSettings(messageHandlers.get(data.id) as (_: unknown) => void);
         } else if (isMessage("__GET_RECORDS__", data.content)) {
            this.onGetPlaneRecords(messageHandlers.get(data.id) as (_: unknown) => void);
         } else if (isMessage("__GET_FACILITIES__", data.content)) {
            this.onGetFacilities(data.id, messageHandlers.get(data.id) as (_: unknown) => void, data.content);
         } else if (isMessage("__GET_METAR__", data.content)) {
            this.onGetMetar(messageHandlers.get(data.id) as (_: unknown) => void, data.content);
         } else if (isMessage("__REMOVE_RECORD__", data.content)) {
            this.onRemoveRecord(data.content);
         } else if (isMessage("__EDIT_RECORD__", data.content)) {
            this.onEditRecord(data.content);
         } else if (isMessage("__GET_RECORD__", data.content)) {
            this.onGetRecord(messageHandlers.get(data.id) as (_: unknown) => void, data.content);
         } else if (isMessage("__GET_FILE_RESPONSE__", data.content)
            || isMessage("__OPEN_FILE_RESPONSE__", data.content)
            || isMessage("__FILE_EXISTS_RESPONSE__", data.content)) {
            if (data.id === 0) {
               this.subscribers.get(0)!(data.content);
            } else {
               console.assert(false);
            }
         }
      };

      this.socket.onclose = () => {
         onClose()
      };

      this.socket.onerror = () => {
         onClose();
      }

      this.socket.onopen = () => {
         // console.log('[open] Socket open')

         this.socket?.send(JSON.stringify({
            __HELLO_WORLD__: "EFB"
         }));
      };
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


            this.subscribers.forEach(messageHandler => {
               messageHandler({ __RECORDS__: true, value: this.flights });
            });
         }

         this.plane = []
      }

      this.subscribers.forEach(messageHandler => {
         messageHandler(info);
      });
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

   onGetSettings(messageHandler: (_: SharedSettings) => void) {
      const settings = this.GetSettings()

      if (settings) {
         messageHandler(settings);
      }
   }

   onGetPlaneRecords(messageHandler: (_: PlaneRecords) => void) {
      const flightsStr = GetStoredData("flights") as string;
      messageHandler(fill({ __RECORDS__: true, value: flightsStr === "" ? [] : (JSON.parse(flightsStr) as PlaneRecord[]) }, PlaneRecordsRecord.defaultValues));
   }

   async onGetFacilities(id: number, messageHandler: (_: MessageType) => void, message: GetFacilities) {
      if (this.subscribers.get(id) === messageHandler) {
         const list = await this.getFacilitiesList(id, message.lat, message.lon);
         messageHandler({ __FACILITIES__: true, facilities: [...list.values()] });
      } else {
         console.assert(false);
      }
   }

   async onGetMetar(messageHandler: (_: Metar) => void, message: GetMetar) {
      messageHandler(await this.getMetar(message.icao, message.lat, message.lon));
   }

   onSharedSettings(message: SharedSettings) {
      SetStoredData("settings", JSON.stringify(message));
   }

   onEditRecord({ id, name }: EditRecord) {
      this.flights.find(elem => elem.id === id)!.name = name
      SetStoredData("flights", JSON.stringify(this.flights))

      this.subscribers.forEach(messageHandler => messageHandler({ __RECORDS__: true, value: this.flights }));
   }

   onRemoveRecord({ id }: RemoveRecord) {
      this.flights.splice(this.flights.findIndex(elem => elem.id === id), 1)
      SetStoredData("flights", JSON.stringify(this.flights))
      DeleteStoredData(`record-${id}`)

      this.subscribers.forEach(messageHandler => messageHandler({ __RECORDS__: true, value: this.flights }));
   }

   onGetRecord(messageHandler: (_: PlanePoses) => void, { id }: GetRecord) {
      messageHandler({ __PLANE_POSES__: true, id: id, value: JSON.parse(GetStoredData(`record-${id}`) as string) as PlanePos[] });
   }

   onGetFile(message: GetFile) {
      this.subscribers.get(1)?.(message);
   }

   onOpenFile(message: OpenFile) {
      this.subscribers.get(1)?.(message);
   }

   onFileExists(message: FileExist) {
      this.subscribers.get(1)?.(message);
   }

   subscribe(id: number, messageHandler: (_: MessageType) => void) {
      this.subscribers.set(id, messageHandler);
   }

   unsubscribe(id: number, messageHandler: ((_: MessageType) => void)) {
      if (this.subscribers.get(id) !== messageHandler) {
         console.error(`Unsubscribing: Message hasn't be subscribed`);
      } else {
         this.subscribers.delete(id);
      }
   }

};
