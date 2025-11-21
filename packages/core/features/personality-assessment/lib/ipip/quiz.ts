import choices from './data/en.choices.json'
import questions from './data/en.questions.json'
import type { IPIPChoices, IPIPQuestion } from './types'

export function getChoices(): IPIPChoices {
  return choices as unknown as IPIPChoices
}

export function getQuestions(): IPIPQuestion[] {
  return questions as unknown as IPIPQuestion[]
}
