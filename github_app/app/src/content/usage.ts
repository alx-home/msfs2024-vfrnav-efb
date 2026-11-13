import { screenshotWalkthrough } from "./screenshots";
import { translations } from "./translations";
import type { Language } from "./types";

const screenshotTopicIndices = [
  [0, 1, 2],
  [3, 4, 5, 6, 7],
  [11, 12, 13, 14, 15],
  [8, 9, 10, 16, 17],
  [18, 19, 20],
  [21]
] as const;

export function getUsageGroups(language: Language) {
  const topics = translations[language].using[2];
  const descriptions = screenshotWalkthrough[language].items;
  const expectedCount = screenshotTopicIndices.reduce((total, indices) => total + indices.length, 0);

  if (topics.length !== screenshotTopicIndices.length || descriptions.length !== expectedCount) {
    throw new Error("Screenshot walkthrough content does not match the topic groups.");
  }

  return topics.map(([heading, description], index) => {
    const indices = screenshotTopicIndices[index];
    if (!indices) throw new Error(`Missing screenshot group for topic ${index + 1}.`);

    const items = indices.map((itemIndex) => {
      const item = descriptions[itemIndex];
      if (!item) throw new Error(`Missing screenshot description ${itemIndex + 1}.`);
      return item;
    });
    return { heading, description, items };
  });
}
