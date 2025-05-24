import { GenRecord } from "./Types";

export type FileExist = {
   __FILE_EXISTS__: true

   id: number,
   path: string
};

export type FileExistResponse = {
   __FILE_EXISTS_RESPONSE__: true

   id: number,
   result: boolean
};

export type OpenFile = {
   __OPEN_FILE__: true

   id: number

   path: string
   filters: {
      name: string,
      value: string[]
   }[]
};

export type OpenFileResponse = {
   __OPEN_FILE_RESPONSE__: true

   id: number,
   path: string
};

export type GetFile = {
   __GET_FILE__: true

   id: number,
   path: string
};

export type GetFileResponse = {
   __GET_FILE_RESPONSE__: true

   id: number,
   data: string
};

export const FileExistRecord = GenRecord<FileExist>({
   "__FILE_EXISTS__": true,

   path: "undef",
   id: -1
}, {});

export const FileExistResponseRecord = GenRecord<FileExistResponse>({
   "__FILE_EXISTS_RESPONSE__": true,

   id: -1,
   result: false,
}, {});

export const OpenFileRecord = GenRecord<OpenFile>({
   "__OPEN_FILE__": true,

   id: -1,

   path: "undef",
   filters: []
}, {
   filters: {
      array: true,
      record: {
         name: "string",
         value: { array: true, record: "string" }
      }
   }
});

export const OpenFileResponseRecord = GenRecord<OpenFileResponse>({
   "__OPEN_FILE_RESPONSE__": true,

   id: -1,
   path: "undef",
}, {});

export const GetFileRecord = GenRecord<GetFile>({
   "__GET_FILE__": true,

   id: -1,
   path: "undef"
}, {});

export const GetFileResponseRecord = GenRecord<GetFileResponse>({
   "__GET_FILE_RESPONSE__": true,

   id: -1,
   data: "undef",
}, {});