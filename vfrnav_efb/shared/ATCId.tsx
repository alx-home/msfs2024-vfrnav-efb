import { GenRecord } from './Types';

export type GetATCId = {
   __GET_ATC_ID__: true
};

export type ATCIDResponse = {
   __ATC_ID_RESPONSE__: true,

   value: string
};


export const ATCIDResponseRecord = GenRecord<ATCIDResponse>({
   __ATC_ID_RESPONSE__: true,
   value: ""
}, {});

export const GetATCIdRecord = GenRecord<GetATCId>({
   __GET_ATC_ID__: true
}, {});