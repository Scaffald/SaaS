import type { IPIPChoices, IPIPQuestion } from "./types";
import questions from "./data/en.questions.json";
import choices from "./data/en.choices.json";

export function getChoices(): IPIPChoices {
  return choices as unknown as IPIPChoices;
}

export function getQuestions(): IPIPQuestion[] {
  return questions as unknown as IPIPQuestion[];
}
