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

import { EditRecord, GetPlaneBlob, PlanePos, PlanePosContent, PlaneRecord, PlaneRecordsRecord, RemoveRecord } from "@shared/PlanPos";
import { WasmComm } from "./WasmComm";
import { Manager } from "./Manager";
import { fill } from "@shared/Types";


export class RecordManager {
   private readonly wasm_comm = new WasmComm();

   private promise = Promise.resolve();

   private readonly planePosBlob: PlanePos[] = [];
   private currentRecord: PlaneRecord | undefined = undefined;
   private flighStartDate: number | undefined = undefined;
   private blob_id = this.GetCurrentBlobID();
   private flying: boolean = false;

   private readonly flights: Promise<PlaneRecord[]> = (async () => {
      const flightsStr = GetStoredData("flights");
      if (flightsStr) {
         if (flightsStr === '') {
            DeleteStoredData("flights");
            return []
         }

         const flights = JSON.parse(flightsStr as string);
         if (!Array.isArray(flights)) {
            DeleteStoredData("flights");
            return []
         }
         console.log("Applying cloud error fix for plane records leaks");

         // Fix for cloud error due to plane records leaks on previous versions
         let max = flights.reduce((max, record) => record.id > max ? record.id : max, -1);
         let start = 0;

         // Recursively delete records in batches until all leaked records are deleted
         do {
            for (let id = start; id <= max; ++id) {
               if (GetStoredData(`record-${id}`)) {
                  DeleteStoredData(`record-${id}`);
               }
            }

            start = max + 1;
            max += 100;
         } while ((SearchStoredData("record-") as string[]).length);

         DeleteStoredData("flights");
         console.log("Cloud error fix applied");
      }

      return this.GetFlights();
   })();


   /* eslint-disable no-unused-vars */
   constructor(private readonly manager: Manager) {
      this.manager = manager;

      setInterval(this.fetchPosition.bind(this), 100);
   }

   private encodePayload(key: string, data: string = "") {
      return `${key}:${data}`;
   }

   private decodeBlobPayload(payload: string) {
      const sepIndex = payload.indexOf(":");
      if (sepIndex === -1) {
         console.error(`Received malformed blob payload: ${payload}`);
         return undefined;
      }

      return {
         key: payload.substring(0, sepIndex),
         data: payload.substring(sepIndex + 1)
      };
   }

   private async GetLastSavedBlobID() {
      const result = await this.wasm_comm.callWasm("VFRNAV_GET_LAST_SAVED_BLOB_ID", "")
      return result ? parseInt(result) : 0;
   }

   private async StoreLastSavedBlobID(id: number) {
      await this.wasm_comm.callWasm("VFRNAV_STORE_LAST_SAVED_BLOB_ID", id.toString())
   }

   private async GetCurrentBlobID() {
      const result = await this.wasm_comm.callWasm("VFRNAV_GET_CURRENT_BLOB_ID", "")
      return result ? parseInt(result) : 0;
   }

   private async StoreCurrentBlobID(id: number) {
      await this.wasm_comm.callWasm("VFRNAV_STORE_CURRENT_BLOB_ID", id.toString())
   }

   private async StoreFlights(flights: PlaneRecord[]) {
      await this.wasm_comm.callWasm("VFRNAV_STORE_FLIGHTS", JSON.stringify(flights));
   }

   private async GetFlights(): Promise<PlaneRecord[]> {
      const flights = await this.wasm_comm.callWasm("VFRNAV_GET_FLIGHTS", "");

      if (flights) {
         return JSON.parse(flights);
      }

      return [];
   }

   private async saveBlobToDisk(key: string, data: string) {
      await this.wasm_comm
         .callWasm("VFRNAV_STORE_BLOB", this.encodePayload(key, data))
         .catch(error => {
            console.error(`Cannot save blob to disk with key ${key}`, error);
         });
   }

   private async deleteBlobFromDisk(key: string) {
      await this.wasm_comm
         .callWasm("VFRNAV_DELETE_BLOB", this.encodePayload(key))
         .catch(error => {
            console.error(`Cannot delete blob from disk with key ${key}`, error);
         });
   }

   private async getBlobFromDisk(key: string) {
      return this.wasm_comm
         .callWasm("VFRNAV_GET_BLOB", this.encodePayload(key))
         .then(response => {
            if (response) {
               const payload = this.decodeBlobPayload(response);

               if (payload) {
                  console.assert(payload.key === key);
                  return payload.data;
               }
            }

            console.error(`Received malformed blob response for key ${key}: ${response}`);
            return undefined;
         })
         .catch(error => {
            console.error(`Cannot load blob from disk with key ${key}`, error);
            return undefined;
         });
   }

   private async SaveBlob() {
      let lastDate = 0;
      const buffer = new Float32Array(this.planePosBlob
         .flatMap(pos => {
            const result = [
               (pos.date - lastDate),
               pos.lat,
               pos.lon,
               pos.altitude,
               pos.ground,
               pos.heading,
               pos.verticalSpeed,
               pos.windVelocity,
               pos.windDirection
            ];
            lastDate = pos.date;
            return result;
         }));
      const bytes = new Uint8Array(buffer.buffer);
      let binary = "";
      for (const element of bytes) {
         binary += String.fromCharCode(element);
      }

      let blob_id = await this.blob_id;
      await this.saveBlobToDisk(`blob-${blob_id}`, btoa(binary));
      ++blob_id;
      this.blob_id = Promise.resolve(blob_id);

      await this.StoreCurrentBlobID(blob_id);
      this.currentRecord!.blobs.push(blob_id - 1);
      this.currentRecord!.size += binary.length;
      this.planePosBlob.length = 0;
   }

   public async fetchPosition() {
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

      // Chain position fetches to avoid concurrent fetches in case fetching and saving blobs takes longer than the fetch interval
      this.promise = this.promise.then(async () => {
         this.flying = !SimVar.GetSimVarValue('SIM ON GROUND', 'bool');

         if (this.flying) {
            if (!this.flighStartDate) {
               this.flighStartDate = info.date;
               this.planePosBlob.length = 0;
               this.currentRecord = {
                  name: new Date(info.date).toLocaleString(),
                  id: 0,
                  touchdown: 0,
                  active: false,
                  blobs: [],
                  size: 0
               };
            }

            this.planePosBlob.push(info)

            // Save plane position every 5 minutes to avoid filling up storage with plane positions
            if (this.planePosBlob.length > 3000) {
               await this.SaveBlob();
            }
         } else if (this.flighStartDate) {
            const touchDownSpeed = SimVar.GetSimVarValue('PLANE TOUCHDOWN NORMAL VELOCITY', 'feet per seconds') * 60;
            // Save record if flight lasted more than 5 seconds to avoid saving very short flights due to plane on ground vibrations
            // Also avoid saving records with 0 touchdown speed, as these are likely caused by the simulator just being launched (first on-ground position over sea)
            if ((info.date - this.flighStartDate > 5000) && (touchDownSpeed !== 0)) {
               const flights = await this.flights;

               // Keep only 15 last records to avoid filling up storage with plane records
               if (flights.length === 15) {
                  flights.splice(0, 1);
               }

               console.assert(this.currentRecord);
               if (this.currentRecord) {
                  if (this.planePosBlob.length) {
                     // Save remaining plane positions in a blob
                     await this.SaveBlob();
                  }

                  this.currentRecord.id = flights.length ? (+flights[flights.length - 1].id + 1) : 0;
                  this.currentRecord.touchdown = touchDownSpeed;
                  this.currentRecord.active = false;
                  flights.push(this.currentRecord);

                  console.assert(this.currentRecord.blobs.length);
                  await this.StoreLastSavedBlobID(this.currentRecord.blobs[this.currentRecord.blobs.length - 1]);
               }

               await this.StoreFlights(flights);
               this.manager.broadCastMessage({ __RECORDS__: true, value: flights });
            } else if (this.currentRecord?.blobs.length) {
               const promises: Promise<void>[] = [];
               // Delete blobs created during this flight as they are not valid due to short flight duration, 
               // which is likely caused by plane on ground vibrations
               for (const blobId of this.currentRecord.blobs) {
                  console.assert(false); // This should not happen as blobs should only be created after 5min of flight, 
                  // but just in case, delete blobs of invalid records to avoid filling up storage with invalid blobs
                  promises.push(this.deleteBlobFromDisk(`blob-${blobId}`));
               }
               await Promise.all(promises);

               const blob_id = this.currentRecord.blobs[0];
               this.blob_id = Promise.resolve(blob_id);
               await this.StoreCurrentBlobID(blob_id);
            }

            this.currentRecord = undefined;
            this.planePosBlob.length = 0;
            this.flighStartDate = undefined;
         }

         this.manager.broadCastMessage(info);
      });
   };

   onEditRecord({ id, name }: EditRecord) {
      this.promise = this.promise.then(() => {
         this.flights.then(async flights => {
            flights.find(elem => elem.id === id)!.name = name

            await this.StoreFlights(flights);
            this.manager.broadCastMessage({ __RECORDS__: true, value: flights });
         });
      });
   }

   onRemoveRecord({ id }: RemoveRecord) {
      this.promise = this.promise.then(() => {
         this.flights.then(async flights => {
            const record = flights.splice(flights.findIndex(elem => elem.id === id), 1)[0];
            const promises: Promise<void>[] = [];
            for (const blobId of record.blobs) {
               promises.push(this.deleteBlobFromDisk(`blob-${blobId}`));
            }
            await Promise.all(promises);

            await this.StoreFlights(flights);
            this.manager.broadCastMessage({ __RECORDS__: true, value: flights });
         });
      });
   }

   async onGetPlaneBlob(id: number, { id: blob_id }: GetPlaneBlob) {
      this.promise = this.promise.then(async () => {
         const values: PlanePosContent[] = [];

         const data = atob(await this.getBlobFromDisk(`blob-${blob_id}`) as string);
         if (!data) {
            this.manager.sendMessage(id, { __PLANE_BLOB__: true, id: blob_id, value: [] });
            return;
         }
         const bytes = Uint8Array.from(data, c => c.charCodeAt(0));
         const poses = Array.from(new Float32Array(bytes.buffer));

         let date = 0;
         for (let index = 0; index < poses.length; index += 9) {
            if (index === 0) {
               date = poses[0];
            } else {
               date += poses[index];
            }

            values.push({
               date: date,
               lat: poses[index + 1],
               lon: poses[index + 2],
               altitude: poses[index + 3],
               ground: poses[index + 4],
               heading: poses[index + 5],
               verticalSpeed: poses[index + 6],
               windVelocity: poses[index + 7],
               windDirection: poses[index + 8],
            });
         }

         this.manager.sendMessage(id, { __PLANE_BLOB__: true, id: blob_id, value: values });
      });
   }

   onGetPlaneRecords(id: number) {
      this.promise = this.promise.then(async () => {
         this.flights.then(flights => {
            this.manager.sendMessage(id, fill({ __RECORDS__: true, value: flights }, PlaneRecordsRecord.defaultValues));
         });
      });
   }

   onCleanPlaneRecords() {
      this.promise = this.promise.then(async () => {
         this.flights.then(async flights => {
            const promise: Promise<void>[] = [];
            for (const record of flights) {
               for (const blobId of record.blobs) {
                  promise.push(this.deleteBlobFromDisk(`blob-${blobId}`));
               }
            }
            await Promise.all(promise);

            flights.length = 0;
            await this.StoreFlights(flights);
            this.manager.broadCastMessage({ __RECORDS__: true, value: flights });
         });
      });
   }


};
