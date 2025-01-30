
declare const BASE_URL: string;

declare module "*.svg";
declare module "*.sass";

declare function OnDataStorageReady(): void;
// eslint-disable-next-line no-var
declare var datastorage: unknown;
declare function GetDataStorage(): unknown;
declare function GetStoredData(_key: unknown): unknown;
declare function SearchStoredData(_key: unknown): unknown;
declare function SetStoredData(_key: unknown, _data: unknown): unknown;
declare function DeleteStoredData(_key: unknown): unknown;
