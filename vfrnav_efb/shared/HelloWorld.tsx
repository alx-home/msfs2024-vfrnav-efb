import { GenRecord } from './Types';

export type HelloWorld = {
   __HELLO_WORLD__: "EFB" | "Web",
};

export const HelloWorldRecord = GenRecord<HelloWorld>({
   __HELLO_WORLD__: "EFB",
}, {})

export type ByeBye = {
   __BYE_BYE__: "EFB" | "Web",
};

export const ByeByeRecord = GenRecord<ByeBye>({
   __BYE_BYE__: "EFB",
}, {})