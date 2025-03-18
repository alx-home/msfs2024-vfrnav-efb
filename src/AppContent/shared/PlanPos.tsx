import { TypeRecord } from './Types';


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

export type PlanePoses = { value: PlanePos[] };

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

export const PlanePosesRecord: TypeRecord<PlanePoses> = {
   value: [
      PlanePosRecord
   ]
}

export type OldPlaneRecord = {
   name: string,
   id: number,
   active: boolean,
   record: PlanePos[],
   touchdown: number
}
export const OldPlaneRecordRecord: TypeRecord<OldPlaneRecord> = {
   name: 'string',
   id: 'number',
   active: 'boolean',
   record: [PlanePosRecord],
   touchdown: 'number'
}
export type OldPlaneRecords = OldPlaneRecord[];
export const OldPlaneRecordsRecord: TypeRecord<OldPlaneRecords> = [OldPlaneRecordRecord];

export type PlaneRecord = {
   name: string,
   id: number,
   active: boolean,
   touchdown: number
}

export const PlaneRecordRecord: TypeRecord<PlaneRecord> = {
   name: 'string',
   id: 'number',
   active: 'boolean',
   touchdown: 'number'
}

export type PlaneRecords = { value: PlaneRecord[] };
export const PlaneRecordsRecord: TypeRecord<PlaneRecords> = { value: [PlaneRecordRecord] };
export const PlaneRecordsDefault: PlaneRecords = {
   value: [{
      name: 'undef',
      id: -1,
      active: true,
      // record: [
      //    {
      //       date: 0,
      //       lat: 0,
      //       lon: 0,
      //       ground: 0,
      //       altitude: 0,
      //       heading: 0,
      //       verticalSpeed: 0,
      //       windDirection: 0,
      //       windVelocity: 0
      //    }
      // ],
      touchdown: 0
   }]
};

export type RemoveRecord = {
   id: number
}

export type GetRecord = {
   id: number
}

export type ActiveRecord = {
   id: number,
   active: boolean
}

export type EditRecord = {
   id: number,
   name: string
}

export const GetRecordRecord: TypeRecord<GetRecord> = {
   id: 'number'
}

export const RemoveRecordRecord: TypeRecord<RemoveRecord> = {
   id: 'number'
}

export const ActiveRecordRecord: TypeRecord<ActiveRecord> = {
   id: 'number',
   active: 'boolean'
}

export const EditRecordRecord: TypeRecord<EditRecord> = {
   id: 'number',
   name: 'string'
}