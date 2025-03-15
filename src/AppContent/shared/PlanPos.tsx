import { TypeRecord } from "./Types"


export type PlanePos = {
   date: number,
   lat: number,
   lon: number,
   altitude: number,
   ground: number,
   heading: number,
   verticalSpeed: number,
   windVelocity: number,
   windDirection: number
}

export const PlanePosRecord: TypeRecord<PlanePos> = {
   date: 'number',
   lat: 'number',
   lon: 'number',
   altitude: 'number',
   ground: 'number',
   heading: 'number',
   verticalSpeed: 'number',
   windVelocity: 'number',
   windDirection: 'number'
}

export type PlaneRecord = {
   name: string,
   id: number,
   active: boolean,
   record: PlanePos[],
   touchdown: number
}

export const PlaneRecordRecord: TypeRecord<PlaneRecord> = {
   name: 'string',
   id: 'number',
   active: 'boolean',
   record: [PlanePosRecord],
   touchdown: 'number'
}

export type PlaneRecords = PlaneRecord[];
export const PlaneRecordsRecord: TypeRecord<PlaneRecords> = [PlaneRecordRecord];

export const PlaneRecordsDefault: PlaneRecords = [{
   name: 'undef',
   id: -1,
   active: true,
   record: [
      {
         date: 0,
         lat: 0,
         lon: 0,
         ground: 0,
         altitude: 0,
         heading: 0,
         verticalSpeed: 0,
         windDirection: 0,
         windVelocity: 0
      }
   ],
   touchdown: 0
}];

export type RemoveRecord = {
   __remove_record__: true,
   id: number
}

export type ActiveRecord = {
   __active_record__: true,
   id: number,
   active: boolean
}

export type EditRecord = {
   __edit_record__: true,
   id: number,
   name: string
}

export const RemoveRecordRecord: TypeRecord<RemoveRecord> = {
   __remove_record__: 'boolean',
   id: 'number'
}

export const ActiveRecordRecord: TypeRecord<ActiveRecord> = {
   __active_record__: 'boolean',
   id: 'number',
   active: 'boolean'
}

export const EditRecordRecord: TypeRecord<EditRecord> = {
   __edit_record__: 'boolean',
   id: 'number',
   name: 'string'
}