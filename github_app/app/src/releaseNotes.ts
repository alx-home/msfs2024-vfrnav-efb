import type { Language } from "./content";
import { releaseChanges } from "./content/releases/index";
import { releaseManifest, type ReleaseComponent } from "./content/releases/manifest";

type CategoryKind = "improvements" | "fixes";
export type ReleaseNote = {
  version: string;
  date: string;
  groups: { component: ReleaseComponent; categories: { kind: CategoryKind; items: string[] }[] }[];
};

export function getReleaseNotes(language: Language): ReleaseNote[] {
  const changes = releaseChanges[language];
  return releaseManifest.map((release) => ({
    version: release.version,
    date: release.date,
    groups: release.groups.map((group) => ({
      component: group.component,
      categories: (["improvements", "fixes"] as const).flatMap((kind) => {
        const ids = group[kind];
        return ids?.length ? [{ kind, items: ids.map((id) => changes[id]) }] : [];
      })
    }))
  }));
}

export const releaseTopics = releaseManifest.map((release) => ({ id: `release-${release.version}`, label: release.version }));
