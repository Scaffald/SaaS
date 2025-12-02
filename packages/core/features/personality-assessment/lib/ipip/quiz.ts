import choices from './data/en.choices.json.ts'
import questions from './data/en.questions.json.ts'
import type { IPIPChoices, IPIPQuestion } from './types.ts'

export function getChoices(): IPIPChoices {
  return choices as unknown as IPIPChoices
}

export function getQuestions(): IPIPQuestion[] {
  return questions as unknown as IPIPQuestion[]
}
