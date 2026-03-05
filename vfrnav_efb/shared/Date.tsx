import { GenRecord } from "./Types";

export type GetDate = {
   __GET_DATE__: true
};

export const GetDateRecord = GenRecord<GetDate>({
   __GET_DATE__: true
}, {});

export type DateResponse = {
   __DATE_RESPONSE__: true,

   date: number,
   timezone: number
};

export const DateResponseRecord = GenRecord<DateResponse>({
   __DATE_RESPONSE__: true,

   date: 0,
   timezone: 0
}, {})