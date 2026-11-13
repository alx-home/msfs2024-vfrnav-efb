import { translations, detailedGuide, donationText, type Language } from "./content";
import { donationDetails } from "./content/support";
import { efbModes } from "./content/efbModes";
import { installerGuide } from "./content/installer";
import { getUsageGroups } from "./content/usage";
import { workflowTitles } from "./content/workflow";
import { antivirusText } from "./content/antivirus";
import { efbEditing } from "./content/efbEditing";
import { detailTopicIds, tabLabels, usageTopicIds } from "./navigation";

type SearchDocument = { id: string; title: string; section: string; body: string };

export function createSearchDocuments(language: Language): SearchDocument[] {
  const text = translations[language];
  const labels = tabLabels[language];
  const modes = efbModes[language];
  const installer = installerGuide[language];
  const donations = donationText[language];
  const donationNotes = donationDetails[language];

  return [
    { id: "overview", title: text.hero[1], section: labels.overview,
      body: [...text.hero, ...text.route, ...text.workflow, ...workflowTitles[language], ...text.steps,
        ...text.features.slice(0, 2)].join(" ") },
    { id: "install", title: text.install[0], section: labels.install,
      body: [...text.install.slice(1), installer.title, ...installer.features.flat(), installer.connection].join(" ") },
    ...getUsageGroups(language).map((group, index) => ({
      id: usageTopicIds[index], title: group.heading, section: labels.using,
      body: [group.description, ...group.items].join(" ")
    })),
    { id: "efb-modes", title: modes.title, section: labels.using,
      body: [modes.summary, ...modes.twoD, ...modes.panelSteps.flat(), ...modes.threeD, modes.setup, modes.controls,
        efbEditing[language].title, ...efbEditing[language].steps.flat(), efbEditing[language].tip].join(" ") },
    { id: "controls", title: text.controls[0], section: labels.using,
      body: [text.controls[1], ...text.controls[2]].join(" ") },
    { id: "details", title: detailedGuide[language].title, section: labels.details,
      body: detailedGuide[language].intro },
    ...detailedGuide[language].items.map(([title, body], index) => ({
      id: detailTopicIds[index], title, body, section: labels.details
    })),
    { id: "notes", title: text.notes[0], body: text.notes[1], section: labels.notes },
    ...text.notes[2].map(([title, body]) => ({ id: "notes", title, body, section: labels.notes })),
    { id: "antivirus", title: antivirusText[language].title, section: labels.antivirus,
      body: [antivirusText[language].subtitle, antivirusText[language].note, antivirusText[language].hash].join(" ") },
    { id: "support", title: text.support[0], section: labels.support,
      body: [text.support[1], ...text.support[2], donations[0], donations[1], ...donations[2],
        ...donationNotes.badges, ...donationNotes.notes].join(" ") }
  ];
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function searchHelp(documents: readonly SearchDocument[], query: string) {
  const normalizedQuery = normalize(query.trim());
  if (!normalizedQuery) return [];
  const terms = normalizedQuery.split(/\s+/);

  return documents.flatMap((document) => {
    const title = normalize(document.title);
    const body = normalize(document.body);
    const searchable = `${title} ${normalize(document.section)} ${body}`;
    if (!terms.every((term) => searchable.includes(term))) return [];

    const score = terms.filter((term) => title.includes(term)).length * 5
      + (title.includes(normalizedQuery) ? 10 : 0);
    const match = terms.map((term) => body.indexOf(term)).find((index) => index >= 0) ?? 0;
    const start = Math.max(0, match - 60);
    const end = Math.min(document.body.length, start + 180);
    const snippet = `${start ? "..." : ""}${document.body.slice(start, end).trim()}${end < document.body.length ? "..." : ""}`;
    return [{ ...document, score, snippet }];
  }).sort((a, b) => b.score - a.score);
}
