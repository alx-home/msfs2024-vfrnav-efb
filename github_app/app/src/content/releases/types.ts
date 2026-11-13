import type en from "./en";

export type ChangeId = keyof typeof en;
export type ChangeTranslations = Record<ChangeId, string>;
