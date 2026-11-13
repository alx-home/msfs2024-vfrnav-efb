// Localized page content, kept separate from the React views.

export const languages = ['en', 'fr', 'de', 'es', 'it', 'ja', 'nl', 'pl', 'pt', 'pt-BR', 'ru', 'sv', 'tr', 'zh-CN'] as const;
export type Language = typeof languages[number];
export type LocaleMap<T> = { [K in Language]: T };
type StringList = readonly string[];
type StringPair = readonly [string, string];
export type Translation = {
  title: string; description: string; language: string; navLabel: string;
  nav: readonly [string, string, string, string, string, string];
  hero: readonly [string, string, string, string, string, string];
  route: readonly [string, string, string, string];
  workflow: readonly [string, string];
  steps: StringList; features: StringList;
  install: readonly [string, string, string, string, string];
  using: readonly [string, string, readonly StringPair[]];
  controls: readonly [string, string, StringList];
  notes: readonly [string, string, readonly StringPair[]];
  support: readonly [string, string, readonly [string, string, string, string, string, string], string, string];
  featureItems?: StringList;
};
export type ScreenshotWalkthrough = { title: string; intro: string; items: StringList };
export type DetailedGuide = { title: string; intro: string; items: readonly (readonly [string, string])[] };
export type DonationText = readonly [string, string, readonly [string, string, string]];
export type DonationUrls = readonly [string, string, string];
export type ResourceUrls = readonly [string, string, string, string, string, string];

