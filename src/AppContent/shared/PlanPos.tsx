import { TypeRecord } from "./Types"


export type PlanePos = {
   lat: number,
   lon: number,
   altitude: number,
   heading: number
}

export const PlanePosRecord: TypeRecord<PlanePos> = {
   lat: 'number',
   lon: 'number',
   altitude: 'number',
   heading: 'number'
}
